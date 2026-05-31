import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const targetPeriod = body.billing_period || getPreviousBillingPeriod();

    // Find all postpaid tenants
    const { data: postpaidTenants, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, billing_model, billing_cycle_day")
      .eq("billing_model", "postpaid")
      .eq("status", "active");

    if (tenantError) throw tenantError;

    const results: any[] = [];

    for (const tenant of postpaidTenants || []) {
      try {
        // Aggregate unsettled usage for this tenant and period
        const { data: usageRows, error: usageError } = await supabase
          .from("usage_ledger")
          .select("event_type, quantity, unit_rate_ngn, amount_ngn")
          .eq("tenant_id", tenant.id)
          .eq("billing_period", targetPeriod)
          .eq("settled", false);

        if (usageError) throw usageError;
        if (!usageRows || usageRows.length === 0) {
          results.push({ tenant_id: tenant.id, status: "no_usage" });
          continue;
        }

        // Build line items grouped by event_type
        const grouped: Record<string, { quantity: number; amount: number; rate: number }> = {};
        let totalUsage = 0;

        for (const row of usageRows) {
          if (!grouped[row.event_type]) {
            grouped[row.event_type] = { quantity: 0, amount: 0, rate: Number(row.unit_rate_ngn) };
          }
          grouped[row.event_type].quantity += Number(row.quantity);
          grouped[row.event_type].amount += Number(row.amount_ngn);
          totalUsage += Number(row.amount_ngn);
        }

        const lineItems = Object.entries(grouped).map(([type, data]) => ({
          event_type: type,
          quantity: data.quantity,
          unit_rate_ngn: data.rate,
          total_ngn: data.amount,
        }));

        // Try to deduct from wallet first
        let walletDeducted = 0;
        const { data: wallet } = await supabase
          .from("tenant_wallets")
          .select("balance_ngn")
          .eq("tenant_id", tenant.id)
          .single();

        const walletBalance = Number(wallet?.balance_ngn ?? 0);
        if (walletBalance > 0) {
          walletDeducted = Math.min(walletBalance, totalUsage);
          if (walletDeducted > 0) {
            await supabase
              .from("tenant_wallets")
              .update({ balance_ngn: walletBalance - walletDeducted })
              .eq("tenant_id", tenant.id);

            // Record wallet transaction
            await supabase.from("wallet_transactions").insert({
              tenant_id: tenant.id,
              type: "debit",
              amount: walletDeducted,
              description: `Postpaid billing - ${targetPeriod}`,
              reference: `postpaid-${targetPeriod}`,
            });
          }
        }

        const invoiceBalance = totalUsage - walletDeducted;
        const invoiceNumber = `PP-${tenant.id.substring(0, 6).toUpperCase()}-${targetPeriod}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14); // 14 days payment terms

        // Create postpaid invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from("postpaid_invoices")
          .insert({
            tenant_id: tenant.id,
            invoice_number: invoiceNumber,
            billing_period: targetPeriod,
            total_usage_ngn: totalUsage,
            wallet_deducted_ngn: walletDeducted,
            invoice_balance_ngn: invoiceBalance,
            status: invoiceBalance <= 0 ? "paid" : "generated",
            line_items: lineItems,
            due_date: dueDate.toISOString().split("T")[0],
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Mark usage as settled
        await supabase
          .from("usage_ledger")
          .update({
            settled: true,
            settled_at: new Date().toISOString(),
            postpaid_invoice_id: invoice.id,
          })
          .eq("tenant_id", tenant.id)
          .eq("billing_period", targetPeriod)
          .eq("settled", false);

        // Reset credit limit current usage
        await supabase
          .from("credit_limits")
          .update({ current_usage_ngn: 0 })
          .eq("tenant_id", tenant.id);

        // Send notification to tenant about generated invoice
        if (invoiceBalance > 0) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("tenant_id", tenant.id)
              .limit(1)
              .maybeSingle();

            if (profile?.email) {
              // Insert a notification record
              await supabase.from("notifications").insert({
                tenant_id: tenant.id,
                type: "postpaid_invoice",
                title: `Postpaid Invoice Generated - ${targetPeriod}`,
                message: `Your postpaid invoice for ${targetPeriod} has been generated. Total usage: ₦${totalUsage.toLocaleString()}, Wallet deducted: ₦${walletDeducted.toLocaleString()}, Amount due: ₦${invoiceBalance.toLocaleString()}. Payment is due within 14 days.`,
                metadata: { invoice_id: invoice.id, invoice_number: invoiceNumber },
              }).then(() => {
                console.log(`Invoice notification sent for tenant ${tenant.id}`);
              }).catch((err: Error) => {
                console.error(`Failed to create invoice notification for tenant ${tenant.id}:`, err);
              });
            }
          } catch (notifyErr) {
            console.error(`Notification error for tenant ${tenant.id}:`, notifyErr);
          }
        }

        results.push({
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          status: "invoiced",
          total_usage: totalUsage,
          wallet_deducted: walletDeducted,
          invoice_balance: invoiceBalance,
          invoice_id: invoice.id,
        });
      } catch (err) {
        console.error(`Error processing tenant ${tenant.id}:`, err);
        results.push({ tenant_id: tenant.id, status: "error", error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("postpaid-billing-cycle error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getPreviousBillingPeriod(): string {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}
