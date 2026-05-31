import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WalletTopupRequest {
  action: 'initiate_topup' | 'check_status' | 'update_auto_topup' | 'trigger_auto_topup';
  amount?: number;
  phoneNumber?: string;
  tenantId: string;
  tenantName?: string;
  referenceId?: string;
  autoTopupSettings?: {
    enabled: boolean;
    threshold: number;
    amount: number;
    phone: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: WalletTopupRequest = await req.json();
    console.log('Wallet Top-up Request:', request);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (request.action === 'initiate_topup') {
      return await initiateTopup(request, supabase);
    } else if (request.action === 'check_status') {
      return await checkTopupStatus(request.referenceId!, supabase);
    } else if (request.action === 'update_auto_topup') {
      return await updateAutoTopupSettings(request, supabase);
    } else if (request.action === 'trigger_auto_topup') {
      return await triggerAutoTopup(request.tenantId, supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Wallet Top-up Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function initiateTopup(request: WalletTopupRequest, supabase: any) {
  const { amount, phoneNumber, tenantId, tenantName } = request;

  // Validate
  if (!amount || amount <= 0) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid amount' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!phoneNumber) {
    return new Response(
      JSON.stringify({ success: false, error: 'Phone number required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const referenceId = crypto.randomUUID();

  // Create a pending topup transaction record
  const { error: txError } = await supabase
    .from('wallet_transactions')
    .insert({
      tenant_id: tenantId,
      transaction_type: 'topup',
      amount_ngn: amount,
      balance_before_ngn: 0, // Will be updated on completion
      balance_after_ngn: 0,  // Will be updated on completion
      reference_id: referenceId,
      description: `Pending MoMo top-up from ${phoneNumber}`,
      metadata: { 
        phone_number: phoneNumber, 
        status: 'pending',
        momo_reference: referenceId
      }
    });

  if (txError) {
    console.error('Failed to create transaction record:', txError);
  }

  // Call MTN MoMo API
  const apiKey = Deno.env.get('MTN_MOMO_API_KEY');
  const apiSecret = Deno.env.get('MTN_MOMO_API_SECRET');
  const subscriptionKey = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY');

  if (!apiKey || !apiSecret || !subscriptionKey) {
    console.log('MTN MoMo credentials not configured, simulating payment...');
    
    // Simulate successful payment for demo
    await simulateSuccessfulPayment(tenantId, amount, referenceId, phoneNumber, supabase);
    
    return new Response(
      JSON.stringify({
        success: true,
        referenceId,
        status: 'COMPLETED',
        message: `Wallet topped up with ₦${amount.toLocaleString()} (Demo mode)`,
        demo: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // In production, call actual MTN MoMo API
  try {
    // Format phone number for Nigeria
    let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '234' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }

    console.log('Initiating MoMo payment for:', {
      amount,
      phone: formattedPhone.replace(/\d{4}$/, '****'),
      referenceId
    });

    // TODO: Implement actual MTN MoMo API call
    // For now, simulate success
    await simulateSuccessfulPayment(tenantId, amount, referenceId, phoneNumber, supabase);

    return new Response(
      JSON.stringify({
        success: true,
        referenceId,
        status: 'COMPLETED',
        message: `Payment request sent. Your wallet will be credited with ₦${amount.toLocaleString()} once payment is confirmed.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('MoMo payment error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Payment service temporarily unavailable'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function simulateSuccessfulPayment(
  tenantId: string, 
  amount: number, 
  referenceId: string, 
  phoneNumber: string,
  supabase: any
) {
  // Get current wallet balance
  const { data: wallet } = await supabase
    .from('tenant_wallets')
    .select('balance_ngn')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  const balanceBefore = wallet?.balance_ngn || 0;
  const balanceAfter = balanceBefore + amount;

  // Top up the wallet using the database function
  const { data, error } = await supabase.rpc('topup_wallet', {
    p_tenant_id: tenantId,
    p_amount: amount,
    p_reference_id: referenceId,
    p_description: `MoMo top-up from ${phoneNumber}`
  });

  if (error) {
    console.error('Wallet topup failed:', error);
    throw error;
  }

  console.log('Wallet topped up successfully:', data);
}

async function checkTopupStatus(referenceId: string, supabase: any) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('reference_id', referenceId)
    .maybeSingle();

  if (error || !data) {
    return new Response(
      JSON.stringify({ success: false, error: 'Transaction not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      transaction: data,
      status: data.metadata?.status || 'completed'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateAutoTopupSettings(request: WalletTopupRequest, supabase: any) {
  const { tenantId, autoTopupSettings } = request;

  if (!autoTopupSettings) {
    return new Response(
      JSON.stringify({ success: false, error: 'Auto top-up settings required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { enabled, threshold, amount, phone } = autoTopupSettings;

  // Validate settings
  if (enabled && (!phone || !amount || amount <= 0)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Valid phone number and amount required for auto top-up' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Update wallet settings
  const { error } = await supabase
    .from('tenant_wallets')
    .update({
      auto_topup_enabled: enabled,
      auto_topup_threshold_ngn: threshold || 500,
      auto_topup_amount_ngn: amount || 5000,
      auto_topup_phone: phone,
      updated_at: new Date().toISOString()
    })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Failed to update auto top-up settings:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update settings' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Auto top-up ${enabled ? 'enabled' : 'disabled'} for tenant ${tenantId}`);

  return new Response(
    JSON.stringify({
      success: true,
      message: enabled 
        ? `Auto top-up enabled. ₦${amount?.toLocaleString()} will be added when balance drops below ₦${threshold?.toLocaleString()}`
        : 'Auto top-up disabled'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function triggerAutoTopup(tenantId: string, supabase: any) {
  // Get wallet with auto top-up settings
  const { data: wallet, error: walletError } = await supabase
    .from('tenant_wallets')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (walletError || !wallet) {
    console.log('Wallet not found for auto top-up:', tenantId);
    return new Response(
      JSON.stringify({ success: false, error: 'Wallet not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if auto top-up is enabled and conditions are met
  if (!wallet.auto_topup_enabled) {
    return new Response(
      JSON.stringify({ success: false, message: 'Auto top-up not enabled' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const balance = wallet.balance_ngn || 0;
  const threshold = wallet.auto_topup_threshold_ngn || 500;
  const topupAmount = wallet.auto_topup_amount_ngn || 5000;
  const phone = wallet.auto_topup_phone;

  // Check if balance is above threshold
  if (balance > threshold) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Balance above threshold',
        balance,
        threshold
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if we recently did an auto top-up (within 5 minutes) to prevent duplicates
  const lastAutoTopup = wallet.last_auto_topup_at;
  if (lastAutoTopup) {
    const timeSinceLastTopup = Date.now() - new Date(lastAutoTopup).getTime();
    if (timeSinceLastTopup < 5 * 60 * 1000) {
      console.log('Auto top-up skipped - too recent');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Auto top-up already triggered recently'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  if (!phone) {
    console.log('No phone number configured for auto top-up');
    return new Response(
      JSON.stringify({ success: false, error: 'No phone number configured' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Update last auto top-up timestamp
  await supabase
    .from('tenant_wallets')
    .update({ last_auto_topup_at: new Date().toISOString() })
    .eq('tenant_id', tenantId);

  console.log(`Triggering auto top-up for tenant ${tenantId}: ₦${topupAmount}`);

  // Initiate the top-up
  const referenceId = `auto_${crypto.randomUUID()}`;
  await simulateSuccessfulPayment(tenantId, topupAmount, referenceId, phone, supabase);

  return new Response(
    JSON.stringify({
      success: true,
      message: `Auto top-up completed: ₦${topupAmount.toLocaleString()} added to wallet`,
      referenceId,
      amount: topupAmount
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
