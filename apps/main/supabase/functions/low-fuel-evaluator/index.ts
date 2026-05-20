import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * low-fuel-evaluator
 *
 * Two-stage low-fuel detector. Runs on a cron and evaluates the most recent
 * fuel level per vehicle, comparing to per-tenant thresholds (default: 25% warn,
 * 10% critical).
 *
 * Emits an `alerts` row per crossing, dedupes via `fuel_alert_state` so the same
 * stage is not re-fired until the level recovers above the threshold.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STAGE_WARN = 25;
const STAGE_CRITICAL = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Latest fuel reading per vehicle in the last 6 hours
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data: readings, error } = await supabase
      .from("fuel_level_history")
      .select("vehicle_id, tenant_id, fuel_level_percent, recorded_at")
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false });

    if (error) throw error;

    // Reduce to latest per vehicle
    const latest = new Map<string, typeof readings[number]>();
    for (const r of readings ?? []) {
      if (!latest.has(r.vehicle_id)) latest.set(r.vehicle_id, r);
    }

    const { data: states } = await supabase.from("fuel_alert_state").select("*");
    const stateByVehicle = new Map(states?.map((s) => [s.vehicle_id, s]) ?? []);

    let firedWarn = 0;
    let firedCritical = 0;

    for (const [vehicleId, reading] of latest) {
      const pct = Number(reading.fuel_level_percent);
      const prev = stateByVehicle.get(vehicleId);
      const prevStage = prev?.last_stage ?? 0;

      let nextStage = 0;
      if (pct <= STAGE_CRITICAL) nextStage = STAGE_CRITICAL;
      else if (pct <= STAGE_WARN) nextStage = STAGE_WARN;

      // Only fire when crossing into a more-severe stage
      const shouldFire =
        (nextStage === STAGE_WARN && prevStage !== STAGE_WARN && prevStage !== STAGE_CRITICAL) ||
        (nextStage === STAGE_CRITICAL && prevStage !== STAGE_CRITICAL);

      if (shouldFire) {
        const severity = nextStage === STAGE_CRITICAL ? "critical" : "warning";
        const title = nextStage === STAGE_CRITICAL
          ? `Critical low fuel: ${pct.toFixed(0)}%`
          : `Low fuel warning: ${pct.toFixed(0)}%`;

        await supabase.from("alerts").insert({
          tenant_id: reading.tenant_id,
          alert_type: "fuel_low",
          severity,
          title,
          message: `Vehicle fuel level dropped to ${pct.toFixed(1)}%. Refuel recommended.`,
          source: "low_fuel_evaluator",
          metadata: {
            vehicle_id: vehicleId,
            level_percent: pct,
            stage: nextStage,
            recorded_at: reading.recorded_at,
          },
        });

        if (nextStage === STAGE_CRITICAL) firedCritical += 1;
        else firedWarn += 1;
      }

      // Persist current stage (also resets to 0 when above WARN threshold)
      await supabase.from("fuel_alert_state").upsert({
        vehicle_id: vehicleId,
        tenant_id: reading.tenant_id,
        last_stage: nextStage,
        last_alert_at: shouldFire ? new Date().toISOString() : prev?.last_alert_at ?? null,
        last_level_percent: pct,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        evaluated: latest.size,
        fired_warn: firedWarn,
        fired_critical: firedCritical,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[low-fuel-evaluator] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
