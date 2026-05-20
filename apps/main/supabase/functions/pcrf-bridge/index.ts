import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * pcrf-bridge — placeholder for MTN PCRF bundle activation API.
 *
 * Accepts a top-up request, simulates provisioning (or in production, calls
 * the MTN PCRF endpoint), then writes the resulting allocation + flips the
 * top-up record to SUCCESS / FAILED.
 *
 * Body: { topup_id: string }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { topup_id } = await req.json();
    if (!topup_id) {
      return new Response(JSON.stringify({ error: "topup_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: topup, error: tErr } = await supabase
      .from("data_bundle_topups")
      .select("*")
      .eq("id", topup_id)
      .single();
    if (tErr || !topup) throw new Error("Top-up not found");

    const { data: bundle, error: bErr } = await supabase
      .from("data_bundles_catalog")
      .select("*")
      .eq("code", topup.bundle_code)
      .single();
    if (bErr || !bundle) throw new Error("Bundle not in catalog");

    // ── In production this is where MTN PCRF API would be called ──
    // const pcrfRes = await fetch(`${PCRF_URL}/v1/bundles/activate`, { ... });
    // For now we simulate success.
    const provisioningOk = true;
    const providerRef = `PCRF_${crypto.randomUUID().slice(0, 8)}`;

    if (!provisioningOk) {
      await supabase.from("data_bundle_topups").update({
        status: "FAILED",
        error_message: "PCRF provisioning failed",
        completed_at: new Date().toISOString(),
      }).eq("id", topup_id);
      return new Response(JSON.stringify({ success: false, error: "Provisioning failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create allocation
    const expires = new Date(Date.now() + bundle.validity_days * 24 * 60 * 60 * 1000);
    const { data: alloc, error: allocErr } = await supabase
      .from("data_bundle_allocations")
      .insert({
        tenant_id: topup.tenant_id,
        org_id: topup.org_id,
        sim_id: topup.sim_id,
        msisdn: topup.msisdn,
        bundle_code: topup.bundle_code,
        data_mb_total: bundle.data_mb,
        expires_at: expires.toISOString(),
      })
      .select()
      .single();
    if (allocErr) throw allocErr;

    await supabase.from("data_bundle_topups").update({
      status: "SUCCESS",
      provider_reference: providerRef,
      completed_at: new Date().toISOString(),
    }).eq("id", topup_id);

    return new Response(
      JSON.stringify({ success: true, allocation_id: alloc.id, provider_reference: providerRef }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[pcrf-bridge] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
