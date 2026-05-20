import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * invoice-finance-reminders — daily cron.
 *
 * For each unpaid invoice (postpaid_invoices + waybill_invoices), evaluates
 * three reminder stages and queues an email + WhatsApp message via Resend +
 * the WhatsApp send-message function. Each stage is logged once in
 * invoice_finance_reminders for de-duplication.
 *
 *   stage = 't_minus_7'   when due_date is exactly 7 days away
 *   stage = 'due_today'   when due_date == today
 *   stage = 'suspension'  when invoice is overdue past grace and suspension fires
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number?: string | null;
  due_date?: string | null;
  total_ngn?: number | string | null;
  status?: string | null;
}

const SUSPENSION_GRACE_DAYS = 14;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    const tMinus7Str = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);
    const suspendCutoff = new Date(today.getTime() - SUSPENSION_GRACE_DAYS * 86400000).toISOString().slice(0, 10);

    const buckets: { kind: "subscription" | "waybill"; rows: Invoice[] }[] = [];
    for (const [kind, table] of [["subscription", "postpaid_invoices"], ["waybill", "waybill_invoices"]] as const) {
      const { data } = await supabase
        .from(table)
        .select("id, tenant_id, invoice_number, due_date, total_ngn, status")
        .in("status", ["pending", "open", "sent", "overdue", "unpaid"])
        .not("due_date", "is", null);
      buckets.push({ kind: kind as "subscription" | "waybill", rows: (data ?? []) as Invoice[] });
    }

    let queued = 0;
    for (const bucket of buckets) {
      for (const inv of bucket.rows) {
        const due = inv.due_date!;
        let stage: "t_minus_7" | "due_today" | "suspension" | null = null;
        if (due === tMinus7Str) stage = "t_minus_7";
        else if (due === todayStr) stage = "due_today";
        else if (due <= suspendCutoff) stage = "suspension";
        if (!stage) continue;

        // Idempotency check
        const { data: existing } = await supabase
          .from("invoice_finance_reminders")
          .select("id")
          .eq("invoice_id", inv.id)
          .eq("invoice_kind", bucket.kind)
          .eq("stage", stage)
          .maybeSingle();
        if (existing) continue;

        // Resolve finance officer email
        const { data: cfg } = await supabase
          .from("tenant_invoice_config")
          .select("company_email, company_phone")
          .eq("tenant_id", inv.tenant_id)
          .maybeSingle();
        const recipient = cfg?.company_email ?? null;
        const phone = cfg?.company_phone ?? null;

        const subject =
          stage === "t_minus_7" ? `Invoice ${inv.invoice_number} due in 7 days`
          : stage === "due_today" ? `Invoice ${inv.invoice_number} is due today`
          : `Service suspension notice — invoice ${inv.invoice_number} overdue`;

        const message = `Invoice ${inv.invoice_number} for ₦${Number(inv.total_ngn ?? 0).toLocaleString()} ${
          stage === "suspension" ? "is overdue beyond the grace period; service may be suspended." : `is due ${due}.`
        }`;

        // Email via send-invoice-email or generic send (best-effort)
        if (recipient) {
          await supabase.functions.invoke("send-invoice-email", {
            body: { invoice_id: inv.id, kind: bucket.kind, recipient, subject, body: message },
          }).catch(() => {});
          await supabase.from("invoice_finance_reminders").insert({
            invoice_id: inv.id, invoice_kind: bucket.kind, tenant_id: inv.tenant_id,
            stage, channel: "email", sent_at: new Date().toISOString(), recipient, status: "SENT",
          });
          queued++;
        }
        // WhatsApp (best-effort)
        if (phone) {
          await supabase.functions.invoke("retry-messages", {
            body: { tenant_id: inv.tenant_id, channel: "whatsapp", to: phone, message },
          }).catch(() => {});
          await supabase.from("invoice_finance_reminders").insert({
            invoice_id: inv.id, invoice_kind: bucket.kind, tenant_id: inv.tenant_id,
            stage, channel: "whatsapp", sent_at: new Date().toISOString(), recipient: phone, status: "SENT",
          });
          queued++;
        }

        // Trigger MTN suspension when stage hits
        if (stage === "suspension") {
          await supabase.from("iot_sims")
            .update({ mtn_suspension_state: "PENDING_SUSPEND", mtn_suspension_requested_at: new Date().toISOString(), mtn_suspension_reason: `Overdue invoice ${inv.invoice_number}` })
            .eq("tenant_id", inv.tenant_id)
            .eq("mtn_suspension_state", "ACTIVE");
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, queued }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
