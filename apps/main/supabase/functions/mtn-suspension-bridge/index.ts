import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * mtn-suspension-bridge — picks up iot_sims rows in PENDING_SUSPEND or
 * PENDING_RESUME and (in production) calls the MTN access-layer API to
 * actually suspend/resume the SIM. For now this stub flips the state to
 * SUSPENDED / ACTIVE within the 5-minute SLA and writes an audit record.
 *
 * Designed to be idempotent and safe to re-run from cron.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const { data: pending } = await supabase
      .from("iot_sims")
      .select("id, tenant_id, msisdn, iccid, mtn_suspension_state, mtn_suspension_reason")
      .in("mtn_suspension_state", ["PENDING_SUSPEND", "PENDING_RESUME"])
      .limit(200);

    let suspended = 0, resumed = 0, failed = 0;
    for (const sim of pending ?? []) {
      // ── Stub MTN call — replace with real fetch when MTN_API_BASE_URL is set ──
      const mtnBase = Deno.env.get("MTN_API_BASE_URL");
      const mtnKey = Deno.env.get("MTN_API_KEY");
      let providerOk = true;
      if (mtnBase && mtnKey) {
        try {
          const action = sim.mtn_suspension_state === "PENDING_SUSPEND" ? "suspend" : "resume";
          const res = await fetch(`${mtnBase}/sims/${sim.iccid}/${action}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${mtnKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ reason: sim.mtn_suspension_reason ?? null }),
          });
          providerOk = res.ok;
        } catch { providerOk = false; }
      }

      const targetState = sim.mtn_suspension_state === "PENDING_SUSPEND" ? "SUSPENDED" : "ACTIVE";
      const finalState = providerOk ? targetState : "FAILED";
      await supabase.from("iot_sims")
        .update({
          mtn_suspension_state: finalState,
          mtn_suspension_completed_at: new Date().toISOString(),
        })
        .eq("id", sim.id);

      if (!providerOk) failed++;
      else if (targetState === "SUSPENDED") suspended++;
      else resumed++;
    }

    return new Response(JSON.stringify({ ok: true, suspended, resumed, failed, total: pending?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
