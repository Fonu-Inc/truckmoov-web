import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Telconix Meta Tech Provider configuration
const TELCONIX_SOLUTION_ID = Deno.env.get('TELCONIX_SOLUTION_ID') || 'TELCONIX_WHATSAPP_SOLUTION';
const META_CONFIG_ID = Deno.env.get('META_CONFIG_ID') || '';

interface ConnectStartRequest {
  action: 'start' | 'callback' | 'disconnect' | 'set_default' | 'get_status';
  tenantId: string;
  userId?: string;
  userName?: string;
  // For callback
  code?: string;
  state?: string;
  // For manual/SuperAdmin assisted
  wabaId?: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  tokenReferenceId?: string;
  businessId?: string;
  connectionMethod?: 'EMBEDDED_SIGNUP' | 'SUPERADMIN_ASSISTED';
  // For set_default / disconnect
  accountId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const request: ConnectStartRequest = await req.json();
    console.log('[WhatsApp Connect] Request:', request.action, request.tenantId);

    switch (request.action) {
      case 'start':
        return await handleStartConnect(supabase, request);
      case 'callback':
        return await handleCallback(supabase, request);
      case 'disconnect':
        return await handleDisconnect(supabase, request);
      case 'set_default':
        return await handleSetDefault(supabase, request);
      case 'get_status':
        return await handleGetStatus(supabase, request);
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WhatsApp Connect] Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============== START EMBEDDED SIGNUP ==============
async function handleStartConnect(supabase: any, request: ConnectStartRequest) {
  const { tenantId, userId, userName, connectionMethod } = request;

  // Generate CSRF state token
  const stateToken = crypto.randomUUID();
  const stateExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  // Check for existing pending connection
  const { data: existingAccount } = await supabase
    .from('tenant_whatsapp_accounts')
    .select('id, status')
    .eq('tenant_id', tenantId)
    .eq('status', 'PENDING')
    .maybeSingle();

  let accountId: string;

  if (existingAccount) {
    // Update existing pending account
    await supabase
      .from('tenant_whatsapp_accounts')
      .update({
        oauth_state: stateToken,
        oauth_state_expires_at: stateExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingAccount.id);
    accountId = existingAccount.id;
  } else {
    // Create new pending account
    const { data: newAccount, error: insertError } = await supabase
      .from('tenant_whatsapp_accounts')
      .insert({
        tenant_id: tenantId,
        status: 'PENDING',
        connection_method: connectionMethod || 'EMBEDDED_SIGNUP',
        oauth_state: stateToken,
        oauth_state_expires_at: stateExpiry.toISOString(),
        created_by: userId,
        is_default_sender: true, // First account is default
      })
      .select()
      .single();

    if (insertError) {
      console.error('[WhatsApp Connect] Insert error:', insertError);
      throw new Error('Failed to create WhatsApp account record');
    }
    accountId = newAccount.id;
  }

  // Log audit event
  await logSecurityEvent(supabase, {
    eventType: 'whatsapp_connect_started',
    severity: 'info',
    description: `WhatsApp Business connection initiated for tenant`,
    tenantId,
    userId,
    userName,
    metadata: { accountId, connectionMethod: connectionMethod || 'EMBEDDED_SIGNUP' },
  });

  // Build Embedded Signup URL
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const callbackUrl = `${supabaseUrl}/functions/v1/whatsapp-callback`;
  
  // Meta Embedded Signup URL format
  const embeddedSignupUrl = buildEmbeddedSignupUrl(callbackUrl, stateToken);

  return new Response(JSON.stringify({
    success: true,
    accountId,
    state: stateToken,
    embeddedSignupUrl,
    expiresAt: stateExpiry.toISOString(),
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildEmbeddedSignupUrl(callbackUrl: string, state: string): string {
  // Meta WhatsApp Business Embedded Signup URL
  // In production, this would use actual Telconix solution credentials
  const params = new URLSearchParams({
    // solution_id: TELCONIX_SOLUTION_ID,
    redirect_uri: callbackUrl,
    state: state,
    // config_id: META_CONFIG_ID,
  });
  
  return `https://business.facebook.com/wa/manage/signup?${params.toString()}`;
}

// ============== OAUTH CALLBACK ==============
async function handleCallback(supabase: any, request: ConnectStartRequest) {
  const { code, state, tenantId } = request;

  if (!state) {
    throw new Error('Missing state parameter');
  }

  // Validate state token
  const { data: account, error: findError } = await supabase
    .from('tenant_whatsapp_accounts')
    .select('*')
    .eq('oauth_state', state)
    .eq('status', 'PENDING')
    .maybeSingle();

  if (findError || !account) {
    throw new Error('Invalid or expired state token');
  }

  // Check state expiry
  if (new Date(account.oauth_state_expires_at) < new Date()) {
    await supabase
      .from('tenant_whatsapp_accounts')
      .update({ status: 'NOT_CONNECTED', oauth_state: null })
      .eq('id', account.id);
    throw new Error('State token expired');
  }

  // In production, exchange code for access token via Meta Graph API
  // For now, we simulate the token exchange and WABA details retrieval
  const wabaDetails = await exchangeCodeForWaba(code);

  // Update account with WABA details
  const { error: updateError } = await supabase
    .from('tenant_whatsapp_accounts')
    .update({
      status: 'CONNECTED',
      waba_id: wabaDetails.wabaId,
      phone_number_id: wabaDetails.phoneNumberId,
      business_id: wabaDetails.businessId,
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
    console.error('[WhatsApp Connect] Update error:', updateError);
    throw new Error('Failed to update WhatsApp account');
  }

  // Log audit event
  await logSecurityEvent(supabase, {
    eventType: 'whatsapp_connected',
    severity: 'info',
    description: `WhatsApp Business account connected successfully`,
    tenantId: account.tenant_id,
    metadata: {
      accountId: account.id,
      wabaId: wabaDetails.wabaId,
      phoneNumberId: wabaDetails.phoneNumberId,
    },
  });

  return new Response(JSON.stringify({
    success: true,
    accountId: account.id,
    wabaId: wabaDetails.wabaId,
    displayPhoneNumber: wabaDetails.displayPhoneNumber,
    verifiedName: wabaDetails.verifiedName,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function exchangeCodeForWaba(code?: string) {
  // In production, this would:
  // 1. Exchange authorization code for access token via Meta OAuth
  // 2. Call Meta Graph API to get WABA details
  // 3. Store token securely and return reference
  
  // Simulated response for development
  const phoneNumber = `+234${Math.floor(800000000 + Math.random() * 100000000)}`;
  return {
    wabaId: `WABA_${Date.now()}`,
    phoneNumberId: `PN_${Date.now()}`,
    businessId: `BIZ_${Date.now()}`,
    displayPhoneNumber: phoneNumber.slice(0, 7) + '****' + phoneNumber.slice(-3),
    verifiedName: 'FleetPro Fleet',
    tokenReferenceId: `TOKEN_REF_${Date.now()}`,
  };
}

// ============== DISCONNECT ==============
async function handleDisconnect(supabase: any, request: ConnectStartRequest) {
  const { tenantId, accountId, userId, userName } = request;

  const { data: account, error: findError } = await supabase
    .from('tenant_whatsapp_accounts')
    .select('*')
    .eq('id', accountId)
    .eq('tenant_id', tenantId)
    .single();

  if (findError || !account) {
    throw new Error('WhatsApp account not found');
  }

  // Update status to disabled
  await supabase
    .from('tenant_whatsapp_accounts')
    .update({
      status: 'DISABLED',
      disconnected_at: new Date().toISOString(),
      is_default_sender: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId);

  // Log audit event
  await logSecurityEvent(supabase, {
    eventType: 'whatsapp_disconnected',
    severity: 'warning',
    description: `WhatsApp Business account disconnected`,
    tenantId,
    userId,
    userName,
    metadata: { accountId, wabaId: account.waba_id },
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============== SET DEFAULT SENDER ==============
async function handleSetDefault(supabase: any, request: ConnectStartRequest) {
  const { tenantId, accountId, userId, userName } = request;

  // The database trigger will handle unsetting other defaults
  const { error } = await supabase
    .from('tenant_whatsapp_accounts')
    .update({
      is_default_sender: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)
    .eq('tenant_id', tenantId);

  if (error) {
    throw new Error('Failed to set default sender');
  }

  // Log audit event
  await logSecurityEvent(supabase, {
    eventType: 'whatsapp_default_changed',
    severity: 'info',
    description: `WhatsApp default sender changed`,
    tenantId,
    userId,
    userName,
    metadata: { accountId },
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============== GET STATUS ==============
async function handleGetStatus(supabase: any, request: ConnectStartRequest) {
  const { tenantId } = request;

  const { data: accounts, error } = await supabase
    .from('tenant_whatsapp_accounts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('is_default_sender', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch WhatsApp accounts');
  }

  // Get tenant KYC status
  const { data: tenant } = await supabase
    .from('tenants')
    .select('status')
    .eq('id', tenantId)
    .maybeSingle();

  const canSend = tenant?.status === 'active';

  return new Response(JSON.stringify({
    success: true,
    accounts: accounts || [],
    canSend,
    tenantStatus: tenant?.status || 'unknown',
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============== HELPER: LOG SECURITY EVENT ==============
async function logSecurityEvent(supabase: any, event: {
  eventType: string;
  severity: string;
  description: string;
  tenantId?: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await supabase.from('security_audit_logs').insert({
      event_type: event.eventType,
      severity: event.severity,
      description: event.description,
      tenant_id: event.tenantId,
      user_id: event.userId,
      user_name: event.userName,
      metadata: event.metadata || {},
    });
  } catch (err) {
    console.error('[WhatsApp Connect] Failed to log security event:', err);
  }
}
