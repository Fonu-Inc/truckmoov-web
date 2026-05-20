import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * WhatsApp Embedded Signup Callback Handler
 * 
 * This endpoint receives the OAuth callback from Meta after a user
 * completes the WhatsApp Business Embedded Signup flow.
 * 
 * Flow:
 * 1. User starts Embedded Signup from tenant UI
 * 2. User completes flow on Meta side
 * 3. Meta redirects to this callback with code + state
 * 4. We validate state, exchange code, store WABA details
 * 5. Redirect user back to tenant UI with success/error
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Meta Graph API configuration
const META_GRAPH_API = 'https://graph.facebook.com/v18.0';
const META_APP_ID = Deno.env.get('META_APP_ID');
const META_APP_SECRET = Deno.env.get('META_APP_SECRET');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const url = new URL(req.url);
    
    // Extract query parameters from GET request (OAuth redirect)
    // or body from POST request (manual callback)
    let code: string | null = null;
    let state: string | null = null;
    let error: string | null = null;
    let errorDescription: string | null = null;

    if (req.method === 'GET') {
      code = url.searchParams.get('code');
      state = url.searchParams.get('state');
      error = url.searchParams.get('error');
      errorDescription = url.searchParams.get('error_description');
    } else if (req.method === 'POST') {
      const body = await req.json();
      code = body.code;
      state = body.state;
    }

    console.log('[WhatsApp Callback] Received callback:', { 
      hasCode: !!code, 
      hasState: !!state,
      error,
    });

    // Handle error from Meta
    if (error) {
      console.error('[WhatsApp Callback] Meta returned error:', error, errorDescription);
      return redirectToApp(false, `OAuth error: ${errorDescription || error}`);
    }

    // Validate required parameters
    if (!state) {
      return redirectToApp(false, 'Missing state parameter');
    }

    // Find pending account by state token
    const { data: account, error: findError } = await supabase
      .from('tenant_whatsapp_accounts')
      .select('*')
      .eq('oauth_state', state)
      .eq('status', 'PENDING')
      .maybeSingle();

    if (findError || !account) {
      console.error('[WhatsApp Callback] Account not found for state:', state);
      return redirectToApp(false, 'Invalid or expired state token');
    }

    // Check state expiry
    if (new Date(account.oauth_state_expires_at) < new Date()) {
      await supabase
        .from('tenant_whatsapp_accounts')
        .update({ status: 'NOT_CONNECTED', oauth_state: null })
        .eq('id', account.id);
      return redirectToApp(false, 'State token expired. Please try again.');
    }

    // Exchange authorization code for access token
    let wabaDetails;
    if (code && META_APP_ID && META_APP_SECRET) {
      wabaDetails = await exchangeCodeForToken(code, account);
    } else {
      // Development mode - simulate successful connection
      console.log('[WhatsApp Callback] Development mode - simulating connection');
      wabaDetails = simulateWabaDetails();
    }

    // Update account with WABA details
    const { error: updateError } = await supabase
      .from('tenant_whatsapp_accounts')
      .update({
        status: 'CONNECTED',
        waba_id: wabaDetails.wabaId,
        phone_number_id: wabaDetails.phoneNumberId,
        business_id: wabaDetails.businessId,
        business_portfolio_id: wabaDetails.businessPortfolioId,
        display_phone_number: wabaDetails.displayPhoneNumber,
        verified_name: wabaDetails.verifiedName,
        token_reference_id: wabaDetails.tokenReferenceId,
        quality_rating: 'GREEN',
        messaging_limit_tier: 'TIER_1K',
        connected_at: new Date().toISOString(),
        oauth_state: null,
        oauth_state_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', account.id);

    if (updateError) {
      console.error('[WhatsApp Callback] Update error:', updateError);
      return redirectToApp(false, 'Failed to save connection details');
    }

    // Log security event
    await supabase.from('security_audit_logs').insert({
      event_type: 'whatsapp_connected',
      severity: 'info',
      description: 'WhatsApp Business account connected via Embedded Signup',
      tenant_id: account.tenant_id,
      metadata: {
        accountId: account.id,
        wabaId: wabaDetails.wabaId,
        phoneNumberId: wabaDetails.phoneNumberId,
        connectionMethod: 'EMBEDDED_SIGNUP',
      },
    });

    console.log('[WhatsApp Callback] Successfully connected:', account.id);
    return redirectToApp(true);

  } catch (err) {
    console.error('[WhatsApp Callback] Unexpected error:', err);
    return redirectToApp(false, 'An unexpected error occurred');
  }
});

async function exchangeCodeForToken(code: string, account: any): Promise<{
  wabaId: string;
  phoneNumberId: string;
  businessId?: string;
  businessPortfolioId?: string;
  displayPhoneNumber: string;
  verifiedName?: string;
  tokenReferenceId: string;
}> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const redirectUri = `${supabaseUrl}/functions/v1/whatsapp-callback`;

  // Exchange code for access token
  const tokenResponse = await fetch(`${META_GRAPH_API}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: META_APP_ID!,
      client_secret: META_APP_SECRET!,
      redirect_uri: redirectUri,
      code: code,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('[WhatsApp Callback] Token exchange failed:', errorText);
    throw new Error('Failed to exchange authorization code');
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Get shared WABA details from the code exchange
  // The exact API calls depend on Telconix's integration
  // This is a simplified version
  
  // Get business info
  const debugResponse = await fetch(`${META_GRAPH_API}/debug_token?input_token=${accessToken}&access_token=${META_APP_ID}|${META_APP_SECRET}`);
  const debugData = await debugResponse.json();

  // For Embedded Signup, we'd get WABA ID from the signup response
  // Store token reference (in production, store in vault)
  const tokenReferenceId = `TOKEN_${account.id}_${Date.now()}`;

  // In production, call:
  // GET /v18.0/me/businesses to get business_id
  // GET /v18.0/{business_id}/owned_whatsapp_business_accounts to get WABA
  // GET /v18.0/{waba_id}/phone_numbers to get phone numbers

  return {
    wabaId: debugData.data?.granular_scopes?.[0]?.target_id || `WABA_${Date.now()}`,
    phoneNumberId: `PN_${Date.now()}`,
    businessId: debugData.data?.app_id,
    displayPhoneNumber: '+234 80X XXX XXXX',
    verifiedName: 'Business Name',
    tokenReferenceId,
  };
}

function simulateWabaDetails() {
  const phoneNumber = `+234${Math.floor(800000000 + Math.random() * 100000000)}`;
  return {
    wabaId: `WABA_${Date.now()}`,
    phoneNumberId: `PN_${Date.now()}`,
    businessId: `BIZ_${Date.now()}`,
    businessPortfolioId: `BP_${Date.now()}`,
    displayPhoneNumber: phoneNumber.slice(0, 7) + '****' + phoneNumber.slice(-3),
    verifiedName: 'FleetPro Fleet Services',
    tokenReferenceId: `TOKEN_REF_${Date.now()}`,
  };
}

function redirectToApp(success: boolean, errorMessage?: string): Response {
  // Get the app URL from environment or use default
  const appUrl = Deno.env.get('APP_URL') || 'https://truckmoov.ng';
  
  const params = new URLSearchParams();
  if (success) {
    params.set('whatsapp_connected', 'true');
  } else {
    params.set('whatsapp_error', errorMessage || 'Connection failed');
  }

  const redirectUrl = `${appUrl}/admin/settings?${params.toString()}`;

  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl,
    },
  });
}
