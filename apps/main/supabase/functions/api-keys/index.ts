import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "tm_"; // FleetPro prefix
  for (let i = 0; i < 45; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Extract token for explicit validation (required when verify_jwt = false)
  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const serviceSupabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Validate user - CRITICAL: pass token explicitly when verify_jwt = false
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    console.error("Auth error:", userError?.message);
    return new Response(
      JSON.stringify({ error: "Unauthorized", details: userError?.message }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = user.id;

  // Get user profile and tenant
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id, full_name")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile?.tenant_id) {
    return new Response(
      JSON.stringify({ error: "User profile not found" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const tenantId = profile.tenant_id;
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const keyId = pathParts[1];

  try {
    if (req.method === "GET") {
      // List API keys
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, key_prefix, scopes, status, rate_limit_per_minute, rate_limit_per_day, expires_at, last_used_at, created_at, created_by")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { name, scopes, expires_at, rate_limit_per_minute, rate_limit_per_day } = body;

      if (!name || !scopes || !Array.isArray(scopes) || scopes.length === 0) {
        return new Response(
          JSON.stringify({ error: "Name and scopes are required" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Generate new API key
      const apiKey = generateApiKey();
      const keyPrefix = apiKey.substring(0, 8);
      const keyHash = await hashKey(apiKey);

      const { data, error } = await serviceSupabase
        .from("api_keys")
        .insert({
          tenant_id: tenantId,
          name,
          key_prefix: keyPrefix,
          key_hash: keyHash,
          scopes,
          status: "active",
          rate_limit_per_minute: rate_limit_per_minute || 60,
          rate_limit_per_day: rate_limit_per_day || 10000,
          expires_at: expires_at || null,
          created_by: profile.full_name || userId,
        })
        .select("id, name, key_prefix, scopes, status, created_at")
        .single();

      if (error) throw error;

      // Log audit event
      await serviceSupabase.rpc("log_integration_audit", {
        p_tenant_id: tenantId,
        p_actor_id: userId,
        p_actor_name: profile.full_name,
        p_action: "api_key.created",
        p_resource_type: "api_key",
        p_resource_id: data.id,
        p_changes: { name, scopes },
      });

      // Return the full key only on creation (never stored or shown again)
      return new Response(
        JSON.stringify({
          data: {
            ...data,
            api_key: apiKey, // Only returned once!
          },
          message: "API key created. Save this key now - it won't be shown again!",
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "DELETE" && keyId) {
      // Revoke API key
      const { data, error } = await serviceSupabase
        .from("api_keys")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString(),
          revoked_by: profile.full_name || userId,
        })
        .eq("id", keyId)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      await serviceSupabase.rpc("log_integration_audit", {
        p_tenant_id: tenantId,
        p_actor_id: userId,
        p_actor_name: profile.full_name,
        p_action: "api_key.revoked",
        p_resource_type: "api_key",
        p_resource_id: keyId,
      });

      return new Response(
        JSON.stringify({ success: true, message: "API key revoked" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("API keys error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
