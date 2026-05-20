import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { recordUsageIfPostpaid, checkCreditLimit } from "../_shared/usage-recorder.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FONU_API_KEY = Deno.env.get('FONU_API_KEY');
const FONU_API_SECRET = Deno.env.get('FONU_API_SECRET');
const FONU_BASE_URL = 'https://api.fonu.com/v1';

interface SMSRequest {
  action: 'send_sms' | 'get_sms_status' | 'send_whatsapp';
  phoneNumber: string;
  message: string;
  messageId?: string;
  driverId?: string;
  driverName?: string;
  senderId?: string;
  senderName?: string;
  tenantId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!FONU_API_KEY || !FONU_API_SECRET) {
      throw new Error('Fonu API credentials not configured');
    }

    const request: SMSRequest = await req.json();
    console.log('Fonu SMS Request:', request);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let result;

    switch (request.action) {
      case 'send_sms':
        result = await sendSMS(request, supabase);
        break;
      case 'send_whatsapp':
        result = await sendWhatsApp(request, supabase);
        break;
      case 'get_sms_status':
        result = await getSMSStatus(request.messageId!);
        break;
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    console.log('Fonu SMS Response:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fonu SMS Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkAndDeductWallet(supabase: any, tenantId: string, communicationType: string, quantity: number, referenceId?: string) {
  const { data, error } = await supabase.rpc('deduct_wallet_balance', {
    p_tenant_id: tenantId,
    p_communication_type: communicationType,
    p_quantity: quantity,
    p_reference_id: referenceId,
    p_description: `${communicationType.toUpperCase()} message sent`
  });

  if (error) {
    console.error('Wallet deduction error:', error);
    return { success: false, error: error.message };
  }

  // Check if balance is below threshold and trigger alert
  if (data?.success && data?.balance_after !== undefined) {
    await checkAndTriggerLowBalanceAlert(supabase, tenantId, data.balance_after);
  }

  // Check if spending threshold was crossed and trigger spending limit alert
  if (data?.success) {
    await checkAndTriggerSpendingAlert(supabase, tenantId, data);
  }

  return data;
}

async function checkAndTriggerSpendingAlert(supabase: any, tenantId: string, walletResult: any) {
  try {
    const crossed80 = walletResult.crossed_80_threshold;
    const crossed100 = walletResult.crossed_100_threshold;
    const alertEmail = walletResult.alert_email;

    if (!crossed80 && !crossed100) {
      return;
    }

    if (!alertEmail) {
      console.log(`Spending threshold crossed for tenant ${tenantId} but no alert email configured`);
      return;
    }

    // Get tenant name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('tenant_id', tenantId)
      .limit(1)
      .maybeSingle();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (crossed80) {
      console.log(`Triggering 80% spending alert for tenant ${tenantId}`);
      await fetch(`${supabaseUrl}/functions/v1/spending-limit-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          email: alertEmail,
          tenantId,
          tenantName: profile?.full_name,
          thresholdType: '80',
          currentSpending: walletResult.current_month_spending,
          spendingLimit: walletResult.spending_limit,
        }),
      });
    }

    if (crossed100) {
      console.log(`Triggering 100% spending alert for tenant ${tenantId}`);
      await fetch(`${supabaseUrl}/functions/v1/spending-limit-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          email: alertEmail,
          tenantId,
          tenantName: profile?.full_name,
          thresholdType: '100',
          currentSpending: walletResult.current_month_spending,
          spendingLimit: walletResult.spending_limit,
        }),
      });
    }
  } catch (err) {
    console.error('Failed to trigger spending alert:', err);
  }
}

async function checkAndTriggerLowBalanceAlert(supabase: any, tenantId: string, currentBalance: number) {
  try {
    // Get wallet threshold
    const { data: wallet } = await supabase
      .from('tenant_wallets')
      .select('low_balance_threshold_ngn')
      .eq('tenant_id', tenantId)
      .single();

    const threshold = wallet?.low_balance_threshold_ngn || 1000;

    // Only trigger if below threshold
    if (currentBalance > threshold) {
      return;
    }

    // Get tenant info for notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, phone')
      .eq('tenant_id', tenantId)
      .limit(1)
      .single();

    // Call budget-alert function for low balance
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    await fetch(`${supabaseUrl}/functions/v1/budget-alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        alertType: 'low_balance',
        tenant_id: tenantId,
        tenant_name: profile?.full_name,
        tenant_email: profile?.email,
        tenant_phone: profile?.phone,
        balance: currentBalance,
        threshold: threshold,
      }),
    });

    console.log(`Low balance alert triggered for tenant ${tenantId}`);
  } catch (err) {
    console.error('Failed to trigger low balance alert:', err);
  }
}

async function sendSMS(request: SMSRequest, supabase: any) {
  const formattedNumber = formatNigerianNumber(request.phoneNumber);
  const tenantId = request.tenantId || 'default';

  // Pre-action credit limit check for postpaid tenants
  const creditCheck = await checkCreditLimit(supabase, tenantId);
  if (!creditCheck.allowed) {
    return { success: false, error: creditCheck.reason, credit_limit_exceeded: true };
  }
  
  // Check wallet balance before sending
  const walletResult = await checkAndDeductWallet(supabase, tenantId, 'sms', 1);
  
  if (!walletResult.success) {
    console.error('Wallet check failed:', walletResult.error);
    return {
      success: false,
      error: walletResult.error || 'Insufficient wallet balance',
      wallet_error: true,
      balance: walletResult.balance,
      required: walletResult.required
    };
  }

  // Log message to database
  const { data: messageRecord, error: insertError } = await supabase
    .from('driver_messages')
    .insert({
      tenant_id: tenantId,
      driver_id: request.driverId || 'unknown',
      driver_name: request.driverName,
      driver_phone: request.phoneNumber,
      message_type: 'sms',
      direction: 'outbound',
      content: request.message,
      status: 'pending',
      sender_id: request.senderId,
      sender_name: request.senderName,
      metadata: { wallet_charged: walletResult.amount_charged }
    })
    .select()
    .single();

  if (insertError) {
    console.error('Failed to log message:', insertError);
  }

  try {
    const response = await fetch(`${FONU_BASE_URL}/sms`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedNumber,
        from: Deno.env.get('FONU_SENDER_ID') || 'FleetPro',
        message: request.message,
      }),
    });

    const responseText = await response.text();
    console.log('Fonu SMS API Response Status:', response.status);
    console.log('Fonu SMS API Response:', responseText);

    if (!response.ok) {
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        console.error('Fonu SMS API Gateway Error - service may be unavailable');
        
        if (messageRecord) {
          await supabase
            .from('driver_messages')
            .update({ status: 'pending', error_message: 'SMS service temporarily unavailable' })
            .eq('id', messageRecord.id);
        }
        
        return {
          success: false,
          error: 'SMS service temporarily unavailable. Message saved and will be retried.',
          status: response.status,
          dbMessageId: messageRecord?.id,
          queued: true,
          wallet_charged: walletResult.amount_charged
        };
      }
      
      if (messageRecord) {
        await supabase
          .from('driver_messages')
          .update({ status: 'failed', error_message: responseText })
          .eq('id', messageRecord.id);
      }
      
      throw new Error(`Failed to send SMS: ${response.status}`);
    }

    const result = await response.json();
    
    if (messageRecord) {
      await supabase
        .from('driver_messages')
        .update({ 
          status: 'sent', 
          external_id: result.message_id || result.id 
        })
        .eq('id', messageRecord.id);
    }

    // Record usage for postpaid tenants
    await recordUsageIfPostpaid(supabase, tenantId, 'sms', 1, {
      message_id: result.message_id || result.id,
      db_message_id: messageRecord?.id,
    });

    return { 
      success: true, 
      messageId: result.message_id || result.id,
      dbMessageId: messageRecord?.id,
      wallet_charged: walletResult.amount_charged,
      wallet_balance: walletResult.balance_after
    };
  } catch (error) {
    if (messageRecord) {
      await supabase
        .from('driver_messages')
        .update({ 
          status: 'failed', 
          error_message: error instanceof Error ? error.message : 'Unknown error' 
        })
        .eq('id', messageRecord.id);
    }
    throw error;
  }
}

async function sendWhatsApp(request: SMSRequest, supabase: any) {
  const formattedNumber = formatNigerianNumber(request.phoneNumber);
  const tenantId = request.tenantId || 'default';

  // Pre-action credit limit check for postpaid tenants
  const creditCheck = await checkCreditLimit(supabase, tenantId);
  if (!creditCheck.allowed) {
    return { success: false, error: creditCheck.reason, credit_limit_exceeded: true };
  }
  
  // Check wallet balance before sending
  const walletResult = await checkAndDeductWallet(supabase, tenantId, 'whatsapp', 1);
  
  if (!walletResult.success) {
    console.error('Wallet check failed:', walletResult.error);
    return {
      success: false,
      error: walletResult.error || 'Insufficient wallet balance',
      wallet_error: true,
      balance: walletResult.balance,
      required: walletResult.required
    };
  }

  // Log message to database
  const { data: messageRecord, error: insertError } = await supabase
    .from('driver_messages')
    .insert({
      tenant_id: tenantId,
      driver_id: request.driverId || 'unknown',
      driver_name: request.driverName,
      driver_phone: request.phoneNumber,
      message_type: 'whatsapp',
      direction: 'outbound',
      content: request.message,
      status: 'pending',
      sender_id: request.senderId,
      sender_name: request.senderName,
      metadata: { wallet_charged: walletResult.amount_charged }
    })
    .select()
    .single();

  if (insertError) {
    console.error('Failed to log message:', insertError);
  }

  try {
    const response = await fetch(`${FONU_BASE_URL}/whatsapp`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedNumber,
        message: request.message,
        type: 'text',
      }),
    });

    const responseText = await response.text();
    console.log('Fonu WhatsApp API Response Status:', response.status);
    console.log('Fonu WhatsApp API Response:', responseText);

    if (!response.ok) {
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        console.error('Fonu WhatsApp API Gateway Error - service may be unavailable');
        
        if (messageRecord) {
          await supabase
            .from('driver_messages')
            .update({ status: 'pending', error_message: 'WhatsApp service temporarily unavailable' })
            .eq('id', messageRecord.id);
        }
        
        return {
          success: false,
          error: 'WhatsApp service temporarily unavailable. Message saved and will be retried.',
          status: response.status,
          dbMessageId: messageRecord?.id,
          queued: true,
          wallet_charged: walletResult.amount_charged
        };
      }
      
      if (messageRecord) {
        await supabase
          .from('driver_messages')
          .update({ status: 'failed', error_message: responseText })
          .eq('id', messageRecord.id);
      }
      
      throw new Error(`Failed to send WhatsApp: ${response.status}`);
    }

    const result = await response.json();
    
    if (messageRecord) {
      await supabase
        .from('driver_messages')
        .update({ 
          status: 'sent', 
          external_id: result.message_id || result.id 
        })
        .eq('id', messageRecord.id);
    }

    // Record usage for postpaid tenants
    await recordUsageIfPostpaid(supabase, tenantId, 'whatsapp', 1, {
      message_id: result.message_id || result.id,
      db_message_id: messageRecord?.id,
    });

    return { 
      success: true, 
      messageId: result.message_id || result.id,
      dbMessageId: messageRecord?.id,
      wallet_charged: walletResult.amount_charged,
      wallet_balance: walletResult.balance_after
    };
  } catch (error) {
    if (messageRecord) {
      await supabase
        .from('driver_messages')
        .update({ 
          status: 'failed', 
          error_message: error instanceof Error ? error.message : 'Unknown error' 
        })
        .eq('id', messageRecord.id);
    }
    throw error;
  }
}

async function getSMSStatus(messageId: string) {
  const response = await fetch(`${FONU_BASE_URL}/sms/${messageId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get SMS status: ${response.status}`);
  }

  return await response.json();
}

function formatNigerianNumber(phoneNumber: string): string {
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '+234' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('+')) {
    cleaned = '+234' + cleaned;
  }
  
  return cleaned;
}
