import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SAGE_AUTH_URL = "https://www.sageone.com/oauth2/auth/central";
const SAGE_TOKEN_URL = "https://oauth.accounting.sage.com/token";
const SAGE_API_URL = "https://api.accounting.sage.com/v3.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sageClientId = Deno.env.get("SAGE_CLIENT_ID");
    const sageClientSecret = Deno.env.get("SAGE_CLIENT_SECRET");

    if (!sageClientId || !sageClientSecret) {
      return new Response(
        JSON.stringify({ error: "Sage credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Handle OAuth callback
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state"); // tenant_id
      
      if (!code || !state) {
        return new Response(
          JSON.stringify({ error: "Missing authorization code or state" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Exchange code for tokens
      const tokenResponse = await fetch(SAGE_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: sageClientId,
          client_secret: sageClientSecret,
          code,
          redirect_uri: `${supabaseUrl}/functions/v1/sage-oauth?action=callback`,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error("Token exchange failed:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to exchange authorization code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokens = await tokenResponse.json();

      // Get company info from Sage
      const companyResponse = await fetch(`${SAGE_API_URL}/business`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      let companyName = null;
      let companyId = null;
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        companyName = companyData.name;
        companyId = companyData.id;
      }

      // Store tokens in database
      const { error: upsertError } = await supabase
        .from("tenant_accounting_integrations")
        .upsert({
          tenant_id: state,
          provider: "sage",
          status: "connected",
          access_token_encrypted: tokens.access_token, // In production, encrypt this
          refresh_token_encrypted: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          company_id: companyId,
          company_name: companyName,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "tenant_id,provider",
        });

      if (upsertError) {
        console.error("Failed to store tokens:", upsertError);
        return new Response(
          JSON.stringify({ error: "Failed to store integration" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Redirect back to the app
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", ".lovable.app")}/admin/settings?tab=integrations&sage=connected`,
        },
      });
    }

    // Handle authorization request
    if (action === "authorize") {
      const { tenantId } = await req.json();
      
      if (!tenantId) {
        return new Response(
          JSON.stringify({ error: "Missing tenant ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const redirectUri = `${supabaseUrl}/functions/v1/sage-oauth?action=callback`;
      const authUrl = new URL(SAGE_AUTH_URL);
      authUrl.searchParams.set("client_id", sageClientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "full_access");
      authUrl.searchParams.set("state", tenantId);

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle token refresh
    if (action === "refresh") {
      const { tenantId } = await req.json();

      const { data: integration, error: fetchError } = await supabase
        .from("tenant_accounting_integrations")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("provider", "sage")
        .single();

      if (fetchError || !integration?.refresh_token_encrypted) {
        return new Response(
          JSON.stringify({ error: "No integration found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenResponse = await fetch(SAGE_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: sageClientId,
          client_secret: sageClientSecret,
          refresh_token: integration.refresh_token_encrypted,
        }),
      });

      if (!tokenResponse.ok) {
        await supabase
          .from("tenant_accounting_integrations")
          .update({ status: "error", sync_error: "Token refresh failed" })
          .eq("id", integration.id);

        return new Response(
          JSON.stringify({ error: "Failed to refresh token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokens = await tokenResponse.json();

      await supabase
        .from("tenant_accounting_integrations")
        .update({
          access_token_encrypted: tokens.access_token,
          refresh_token_encrypted: tokens.refresh_token || integration.refresh_token_encrypted,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          sync_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", integration.id);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle disconnect
    if (action === "disconnect") {
      const { tenantId } = await req.json();

      const { error: updateError } = await supabase
        .from("tenant_accounting_integrations")
        .update({
          status: "disconnected",
          access_token_encrypted: null,
          refresh_token_encrypted: null,
          disconnected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenantId)
        .eq("provider", "sage");

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to disconnect" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Sage OAuth error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
