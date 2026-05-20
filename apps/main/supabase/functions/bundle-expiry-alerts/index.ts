import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * bundle-expiry-alerts — runs on cron, scans data_bundle_allocations for
 * bundles expiring in ≤7 days or ≤1 day, marks them via expiry_alert_*_sent_at
 * and queues notification rows. Idempotent: skips rows already alerted.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const now = new Date();
    const in1d = new Date(now.getTime() + 1 * 86400000).toISOString();
    const in7d = new Date(now.getTime() + 7 * 86400000).toISOString();

    // 7-day alerts (not yet flagged)
    const { data: sevenDay = [] } = await supabase
      .from("data_bundle_allocations")
      .select("id, tenant_id, msisdn, bundle_code, expires_at")
      .eq("status", "ACTIVE")
      .is("expiry_alert_7d_sent_at", null)
      .gt("expires_at", now.toISOString())
      .lte("expires_at", in7d);

    // 1-day alerts
    const { data: oneDay = [] } = await supabase
      .from("data_bundle_allocations")
      .select("id, tenant_id, msisdn, bundle_code, expires_at")
      .eq("status", "ACTIVE")
      .is("expiry_alert_1d_sent_at", null)
      .gt("expires_at", now.toISOString())
      .lte("expires_at", in1d);

    let processed = 0;
    for (const a of sevenDay ?? []) {
      await supabase
        .from("data_bundle_allocations")
        .update({ expiry_alert_7d_sent_at: now.toISOString() })
        .eq("id", a.id);
      // notification queue (best-effort; ignore if table missing)
      await supabase.from("notifications").insert({
        tenant_id: a.tenant_id,
        category: "bundle_expiry",
        severity: "warning",
        title: "Data bundle expiring in 7 days",
        message: `Bundle ${a.bundle_code} on ${a.msisdn} expires ${new Date(a.expires_at).toLocaleDateString()}.`,
      }).then(() => {}, () => {});
      processed++;
    }

    for (const a of oneDay ?? []) {
      await supabase
        .from("data_bundle_allocations")
        .update({ expiry_alert_1d_sent_at: now.toISOString() })
        .eq("id", a.id);
      await supabase.from("notifications").insert({
        tenant_id: a.tenant_id,
        category: "bundle_expiry",
        severity: "critical",
        title: "Data bundle expiring tomorrow",
        message: `Bundle ${a.bundle_code} on ${a.msisdn} expires ${new Date(a.expires_at).toLocaleDateString()}. Renew now.`,
      }).then(() => {}, () => {});
      processed++;
    }

    return new Response(
      JSON.stringify({ ok: true, processed, seven_day: sevenDay?.length ?? 0, one_day: oneDay?.length ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
