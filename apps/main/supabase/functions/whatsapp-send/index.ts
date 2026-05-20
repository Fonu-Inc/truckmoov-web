import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { recordUsageIfPostpaid, checkCreditLimit } from "../_shared/usage-recorder.ts";

/**
 * WhatsApp Send API
 * 
 * Sends WhatsApp messages using tenant-scoped sender profiles.
 * Supports template messages and session window text messages.
 * 
 * Features:
 * - Tenant-scoped sender routing
 * - KYC/KYB gate enforcement
 * - Wallet deduction
 * - Message logging with delivery tracking
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FONU_API_KEY = Deno.env.get('FONU_API_KEY');
const FONU_API_SECRET = Deno.env.get('FONU_API_SECRET');
const FONU_BASE_URL = 'https://api.fonu.com/v1';

interface SendRequest {
  tenantId: string;
  toPhone: string;
  messageType: 'TEMPLATE' | 'TEXT';
  // For template messages
  templateName?: string;
  templateLanguage?: string;
  templateVariables?: Record<string, string>;
  // For text messages (within 24h session window)
  textContent?: string;
  // Optional
  senderAccountId?: string; // Override default sender
  driverId?: string;
  driverName?: string;
  senderUserId?: string;
  senderUserName?: string;
  // SMS fallback
  enableSmsFallback?: boolean;
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

    const request: SendRequest = await req.json();
    console.log('[WhatsApp Send] Request:', {
      tenantId: request.tenantId,
      toPhone: request.toPhone?.slice(0, 7) + '****',
      messageType: request.messageType,
    });

    // 1. Check if tenant can send (KYC/KYB gate)
    const { data: canSendResult } = await supabase.rpc('can_tenant_send_whatsapp', {
      p_tenant_id: request.tenantId,
    });

    if (!canSendResult?.can_send) {
      console.error('[WhatsApp Send] Tenant cannot send:', canSendResult);
      return new Response(JSON.stringify({
        success: false,
        error: canSendResult?.error || 'TENANT_NOT_APPROVED',
        message: getTenantErrorMessage(canSendResult?.error),
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1b. Credit limit check for postpaid tenants
    const creditCheck = await checkCreditLimit(supabase, request.tenantId);
    if (!creditCheck.allowed) {
      return new Response(JSON.stringify({
        success: false,
        error: 'CREDIT_LIMIT_EXCEEDED',
        message: creditCheck.reason,
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Get sender account
    let senderAccount;
    if (request.senderAccountId) {
      // Use specified sender
      const { data, error } = await supabase
        .from('tenant_whatsapp_accounts')
        .select('*')
        .eq('id', request.senderAccountId)
        .eq('tenant_id', request.tenantId)
        .eq('status', 'CONNECTED')
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({
          success: false,
          error: 'SENDER_NOT_FOUND',
          message: 'Specified WhatsApp sender not found or not connected',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      senderAccount = data;
    } else {
      // Use default sender
      const { data, error } = await supabase
        .from('tenant_whatsapp_accounts')
        .select('*')
        .eq('tenant_id', request.tenantId)
        .eq('is_default_sender', true)
        .eq('status', 'CONNECTED')
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({
          success: false,
          error: 'NO_WHATSAPP_SENDER',
          message: 'No WhatsApp sender configured. Please connect a WhatsApp Business account.',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      senderAccount = data;
    }

    // 3. Validate template if template message
    if (request.messageType === 'TEMPLATE' && request.templateName) {
      const { data: template } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('tenant_id', request.tenantId)
        .eq('name', request.templateName)
        .eq('status', 'APPROVED')
        .maybeSingle();

      // If template not found locally, allow sending (template might be approved on Meta side)
      if (!template) {
        console.log('[WhatsApp Send] Template not in local registry, proceeding with send');
      }
    }

    // 4. Check and deduct wallet balance
    const walletResult = await deductWallet(supabase, request.tenantId);
    if (!walletResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'INSUFFICIENT_BALANCE',
        message: walletResult.error || 'Insufficient wallet balance',
        balance: walletResult.balance,
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Format phone number
    const formattedPhone = formatPhoneNumber(request.toPhone);
    const maskedToPhone = maskPhoneNumber(formattedPhone);

    // 5b. Opt-out gate — block outbound to numbers that replied STOP
    const { data: optedOut } = await supabase.rpc('is_whatsapp_opted_out', {
      p_tenant_id: request.tenantId,
      p_phone: formattedPhone,
    });
    if (optedOut === true) {
      return new Response(JSON.stringify({
        success: false,
        error: 'RECIPIENT_OPTED_OUT',
        message: 'This recipient has opted out of WhatsApp messages (replied STOP).',
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5c. 24h session gate — non-template (free-form) outbound requires an active customer-initiated window.
    if (!request.templateName) {
      const { data: hasSession } = await supabase.rpc('has_active_whatsapp_session', {
        p_tenant_id: request.tenantId,
        p_phone: formattedPhone,
      });
      if (hasSession !== true) {
        return new Response(JSON.stringify({
          success: false,
          error: 'NO_ACTIVE_SESSION',
          message: 'Free-form messages require an active 24h customer-initiated session. Send a template message instead.',
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 6. Create message record
    const conversationId = `${request.tenantId}_${formattedPhone}`;
    const { data: messageRecord, error: insertError } = await supabase
      .from('whatsapp_messages')
      .insert({
        tenant_id: request.tenantId,
        direction: 'OUTBOUND',
        sender_account_id: senderAccount.id,
        to_phone: maskedToPhone,
        from_phone: senderAccount.display_phone_number,
        message_type: request.messageType,
        template_name: request.templateName,
        template_language: request.templateLanguage || 'en',
        template_variables: request.templateVariables,
        content: request.textContent,
        status: 'QUEUED',
        conversation_id: conversationId,
        driver_id: request.driverId,
        driver_name: request.driverName,
        sender_user_id: request.senderUserId,
        sender_user_name: request.senderUserName,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[WhatsApp Send] Insert error:', insertError);
      throw new Error('Failed to create message record');
    }

    // 7. Send via Fonu or Meta directly
    let sendResult;
    try {
      sendResult = await sendViaFonu(formattedPhone, request, senderAccount);
    } catch (sendError) {
      // Update message status to failed
      await supabase
        .from('whatsapp_messages')
        .update({
          status: 'FAILED',
          failed_at: new Date().toISOString(),
          error_message: sendError instanceof Error ? sendError.message : 'Send failed',
        })
        .eq('id', messageRecord.id);

      // Check if SMS fallback is enabled
      if (request.enableSmsFallback) {
        console.log('[WhatsApp Send] WhatsApp failed, attempting SMS fallback');
        try {
          // Get tenant communication config for fallback settings
          const { data: configData } = await supabase.rpc('get_tenant_communication_config', {
            p_tenant_id: request.tenantId,
          });

          const config = configData && typeof configData === 'object' ? configData as Record<string, unknown> : null;
          const fallbackEnabled = config?.whatsapp_fallback_to_sms ?? false;

          if (fallbackEnabled) {
            // Trigger SMS via fonu-sms edge function
            const smsMessage = request.textContent || `[Template: ${request.templateName}]`;
            
            // Invoke the SMS function
            const smsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/fonu-sms`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              },
              body: JSON.stringify({
                action: 'send_sms',
                phoneNumber: request.toPhone,
                message: smsMessage,
                driverId: request.driverId,
                driverName: request.driverName,
                senderName: request.senderUserName,
                tenantId: request.tenantId,
              }),
            });

            if (smsResponse.ok) {
              console.log('[WhatsApp Send] SMS fallback sent successfully');
              return new Response(JSON.stringify({
                success: true,
                fallbackUsed: 'sms',
                messageId: messageRecord.id,
                message: 'WhatsApp failed, SMS sent as fallback',
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        } catch (fallbackError) {
          console.error('[WhatsApp Send] SMS fallback also failed:', fallbackError);
        }
      }

      throw sendError;
    }

    // 8. Update message with provider ID
    await supabase
      .from('whatsapp_messages')
      .update({
        status: 'SENT',
        provider_message_id: sendResult.messageId,
        sent_at: new Date().toISOString(),
      })
      .eq('id', messageRecord.id);

    // 9. Also log to driver_messages for unified inbox
    if (request.driverId) {
      await supabase.from('driver_messages').insert({
        tenant_id: request.tenantId,
        driver_id: request.driverId,
        driver_name: request.driverName,
        driver_phone: request.toPhone,
        message_type: 'whatsapp',
        direction: 'outbound',
        content: request.textContent || `[Template: ${request.templateName}]`,
        status: 'sent',
        external_id: sendResult.messageId,
        sender_id: request.senderUserId,
        sender_name: request.senderUserName,
      });
    }

    // 10. Record usage for postpaid tenants
    await recordUsageIfPostpaid(supabase, request.tenantId, 'whatsapp', 1, {
      message_id: messageRecord.id,
      provider_message_id: sendResult.messageId,
    });

    return new Response(JSON.stringify({
      success: true,
      messageId: messageRecord.id,
      providerMessageId: sendResult.messageId,
      status: 'SENT',
      walletCharged: walletResult.amount_charged,
      walletBalance: walletResult.balance_after,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WhatsApp Send] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'SEND_FAILED',
      message: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============== SEND VIA FONU ==============
async function sendViaFonu(
  toPhone: string,
  request: SendRequest,
  senderAccount: any
): Promise<{ messageId: string }> {
  if (!FONU_API_KEY || !FONU_API_SECRET) {
    throw new Error('Fonu API credentials not configured');
  }

  const payload: any = {
    to: toPhone,
    type: request.messageType === 'TEMPLATE' ? 'template' : 'text',
  };

  if (request.messageType === 'TEMPLATE') {
    payload.template = {
      name: request.templateName,
      language: {
        code: request.templateLanguage || 'en',
      },
      components: request.templateVariables ? [
        {
          type: 'body',
          parameters: Object.values(request.templateVariables).map(v => ({
            type: 'text',
            text: v,
          })),
        },
      ] : [],
    };
  } else {
    payload.text = {
      body: request.textContent,
    };
  }

  // Include sender's phone_number_id for routing
  payload.messaging_product = 'whatsapp';
  payload.phone_number_id = senderAccount.phone_number_id;

  console.log('[WhatsApp Send] Sending via Fonu:', { to: toPhone.slice(0, 7) + '****', type: payload.type });

  const response = await fetch(`${FONU_BASE_URL}/whatsapp`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  console.log('[WhatsApp Send] Fonu response:', response.status, responseText.slice(0, 200));

  if (!response.ok) {
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new Error('WhatsApp service temporarily unavailable');
    }
    throw new Error(`Failed to send WhatsApp: ${response.status}`);
  }

  const result = JSON.parse(responseText);
  return {
    messageId: result.messages?.[0]?.id || result.message_id || result.id || `MSG_${Date.now()}`,
  };
}

// ============== WALLET DEDUCTION ==============
async function deductWallet(supabase: any, tenantId: string) {
  const { data, error } = await supabase.rpc('deduct_wallet_balance', {
    p_tenant_id: tenantId,
    p_communication_type: 'whatsapp',
    p_quantity: 1,
    p_description: 'WhatsApp message sent',
  });

  if (error) {
    console.error('[WhatsApp Send] Wallet deduction error:', error);
    return { success: false, error: error.message };
  }

  return data;
}

// ============== HELPER FUNCTIONS ==============
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '+234' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('+')) {
    cleaned = '+234' + cleaned;
  }
  
  return cleaned;
}

function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  return phone.slice(0, 4) + '****' + phone.slice(-3);
}

function getTenantErrorMessage(error?: string): string {
  switch (error) {
    case 'TENANT_NOT_FOUND':
      return 'Tenant account not found';
    case 'TENANT_NOT_APPROVED':
      return 'Your business verification (KYC) must be approved before sending WhatsApp messages';
    case 'NO_WHATSAPP_SENDER':
      return 'No WhatsApp Business account connected. Please connect one in Settings.';
    default:
      return 'Unable to send WhatsApp message';
  }
}
