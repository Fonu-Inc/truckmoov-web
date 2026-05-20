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

    const { tenant_id, org_id, event_type, quantity, metadata } = await req.json();

    if (!tenant_id || !event_type) {
      return new Response(
        JSON.stringify({ error: "tenant_id and event_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up current rate for event_type
    const { data: rate } = await supabase
      .from("communication_rates")
      .select("rate_ngn")
      .eq("communication_type", event_type)
      .eq("is_active", true)
      .single();

    const unitRate = rate?.rate_ngn || 0;
    const qty = quantity || 1;

    // Call the DB function that handles postpaid logic
    const { data, error } = await supabase.rpc("record_usage_event", {
      p_tenant_id: tenant_id,
      p_org_id: org_id || null,
      p_event_type: event_type,
      p_quantity: qty,
      p_unit_rate_ngn: unitRate,
      p_metadata: metadata || null,
    });

    if (error) {
      console.error("record_usage_event error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, result: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("record-usage error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
