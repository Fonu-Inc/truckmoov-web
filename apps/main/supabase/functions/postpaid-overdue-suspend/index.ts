import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Daily job: marks postpaid invoices overdue and suspends services on
 * tenants whose invoice has been overdue past the grace period.
 *
 * Defaults:
 *  - Grace period before suspension: 3 days past due_date
 *  - Sets credit_limits.is_suspended = true (record_usage_event blocks new usage)
 */
const GRACE_DAYS = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date().toISOString().slice(0, 10);
    const suspendCutoff = new Date();
    suspendCutoff.setDate(suspendCutoff.getDate() - GRACE_DAYS);
    const suspendCutoffStr = suspendCutoff.toISOString().slice(0, 10);

    // 1. Mark past-due invoices as overdue (status='generated' & due_date<today & balance>0)
    const { data: nowOverdue, error: overdueErr } = await supabase
      .from("postpaid_invoices")
      .update({ status: "overdue" })
      .eq("status", "generated")
      .lt("due_date", today)
      .gt("invoice_balance_ngn", 0)
      .select("id, tenant_id, invoice_number");

    if (overdueErr) throw overdueErr;

    // 2. Find tenants with at least one invoice overdue past the grace cutoff -> suspend
    const { data: toSuspend, error: suspendQErr } = await supabase
      .from("postpaid_invoices")
      .select("tenant_id, invoice_number, due_date")
      .in("status", ["overdue", "generated"])
      .lt("due_date", suspendCutoffStr)
      .gt("invoice_balance_ngn", 0);

    if (suspendQErr) throw suspendQErr;

    const tenantIds = Array.from(new Set((toSuspend ?? []).map((r) => r.tenant_id)));
    let suspendedCount = 0;

    for (const tenantId of tenantIds) {
      const { error: upErr } = await supabase
        .from("credit_limits")
        .update({
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          notes: `Auto-suspended: invoice overdue >${GRACE_DAYS} days`,
        })
        .eq("tenant_id", tenantId)
        .eq("is_suspended", false);

      if (!upErr) {
        suspendedCount++;
        await supabase.from("notifications").insert({
          tenant_id: tenantId,
          type: "postpaid_suspended",
          title: "Services suspended — overdue invoice",
          message: `Your postpaid services have been suspended because an invoice is more than ${GRACE_DAYS} days overdue. Pay the outstanding balance to restore services.`,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        marked_overdue: nowOverdue?.length ?? 0,
        tenants_suspended: suspendedCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("postpaid-overdue-suspend error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
