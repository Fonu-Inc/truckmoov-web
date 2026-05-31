import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-fonu-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FONU_API_SECRET = Deno.env.get('FONU_API_SECRET');

// Validate webhook signature from Fonu
async function validateSignature(req: Request, body: string): Promise<boolean> {
  const signature = req.headers.get('x-fonu-signature');
  
  // If no signature header, skip validation (for backwards compatibility)
  if (!signature) {
    console.warn('[Webhook] No x-fonu-signature header present - allowing request');
    return true;
  }

  if (!FONU_API_SECRET) {
    console.warn('[Webhook] FONU_API_SECRET not configured - skipping signature validation');
    return true;
  }

  try {
    // HMAC-SHA256 signature validation
    const encoder = new TextEncoder();
    const keyData = encoder.encode(FONU_API_SECRET);
    const messageData = encoder.encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Timing-safe comparison
    if (computedSignature.length !== signature.length) {
      console.error('[Webhook] Signature length mismatch');
      return false;
    }

    let valid = true;
    for (let i = 0; i < computedSignature.length; i++) {
      if (computedSignature[i] !== signature[i]) {
        valid = false;
      }
    }

    if (!valid) {
      console.error('[Webhook] Invalid signature');
    }

    return valid;
  } catch (err) {
    console.error('[Webhook] Signature validation error:', err);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    
    // Validate webhook signature
    const isValid = await validateSignature(req, rawBody);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const webhookData = JSON.parse(rawBody);
    console.log('Fonu Webhook received:', JSON.stringify(webhookData));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const eventType = webhookData.event || webhookData.type;

    // Handle message delivery events (SMS/WhatsApp)
    if (eventType?.includes('message') || eventType?.includes('sms') || eventType?.includes('whatsapp')) {
      return await handleMessageEvent(supabase, webhookData);
    }

    // Handle call events (IVR)
    if (eventType?.includes('call') || eventType?.includes('dtmf')) {
      return await handleCallEvent(supabase, webhookData);
    }

    // Handle SIM/IoT events
    if (eventType?.includes('sim') || eventType?.includes('iot') || eventType?.includes('data_usage')) {
      return await handleSIMEvent(supabase, webhookData);
    }

    console.log('Unknown webhook event type:', eventType);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fonu Webhook Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============== MESSAGE EVENT HANDLERS ==============

async function handleMessageEvent(supabase: any, webhookData: any) {
  const { event, message_id, phone_number, status, timestamp, content, from, error_message } = webhookData;
  
  console.log(`Processing message event: ${event}`);

  switch (event) {
    case 'message.sent':
    case 'sms.sent':
    case 'whatsapp.sent':
      await handleMessageSent(supabase, message_id, phone_number, timestamp);
      break;

    case 'message.delivered':
    case 'sms.delivered':
    case 'whatsapp.delivered':
      await handleMessageDelivered(supabase, message_id, phone_number, timestamp);
      break;

    case 'message.read':
    case 'whatsapp.read':
      await handleMessageRead(supabase, message_id, phone_number, timestamp);
      break;

    case 'message.failed':
    case 'sms.failed':
    case 'whatsapp.failed':
      await handleMessageFailed(supabase, message_id, phone_number, error_message);
      break;

    case 'message.inbound':
    case 'sms.inbound':
    case 'whatsapp.inbound':
      await handleInboundMessage(supabase, from || phone_number, content, timestamp);
      break;

    default:
      console.log('Unhandled message event:', event);
  }

  return new Response(
    JSON.stringify({ success: true, event }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleMessageSent(supabase: any, messageId: string, phone: string | undefined, timestamp: string | undefined) {
  console.log(`Message sent: ${messageId} to ${phone}`);
  
  if (!messageId) return;

  // Update broadcast recipient
  const { error } = await supabase
    .from('broadcast_recipients')
    .update({
      status: 'sent',
      sent_at: timestamp || new Date().toISOString(),
    })
    .eq('external_message_id', messageId);

  if (error) console.error('Error updating sent status:', error);

  // Also update driver_messages table
  await supabase
    .from('driver_messages')
    .update({ status: 'sent' })
    .eq('external_id', messageId);
}

async function handleMessageDelivered(supabase: any, messageId: string, phone: string | undefined, timestamp: string | undefined) {
  console.log(`Message delivered: ${messageId} to ${phone}`);
  
  if (!messageId) return;

  // Find and update broadcast recipient
  const { data: recipients } = await supabase
    .from('broadcast_recipients')
    .select('id, broadcast_id, status')
    .eq('external_message_id', messageId);

  if (recipients && recipients.length > 0) {
    for (const recipient of recipients) {
      const wasDelivered = ['delivered', 'read', 'replied'].includes(recipient.status);
      
      await supabase
        .from('broadcast_recipients')
        .update({
          status: 'delivered',
          delivered_at: timestamp || new Date().toISOString(),
        })
        .eq('id', recipient.id);

      // Increment delivered count if not already counted
      if (!wasDelivered) {
        const { error } = await supabase.rpc('increment_broadcast_delivered', { 
          broadcast_uuid: recipient.broadcast_id 
        });
        if (error) console.error('Error incrementing delivered count:', error);
      }
    }
  }

  // Update driver_messages table
  await supabase
    .from('driver_messages')
    .update({ status: 'delivered' })
    .eq('external_id', messageId);
}

async function handleMessageRead(supabase: any, messageId: string, phone: string | undefined, timestamp: string | undefined) {
  console.log(`Message read: ${messageId} by ${phone}`);
  
  if (!messageId) return;

  // Find and update broadcast recipient
  const { data: recipients } = await supabase
    .from('broadcast_recipients')
    .select('id, broadcast_id, status')
    .eq('external_message_id', messageId);

  if (recipients && recipients.length > 0) {
    for (const recipient of recipients) {
      const wasRead = ['read', 'replied'].includes(recipient.status);
      
      await supabase
        .from('broadcast_recipients')
        .update({
          status: 'read',
          read_at: timestamp || new Date().toISOString(),
        })
        .eq('id', recipient.id);

      // Increment read count if not already counted
      if (!wasRead) {
        const { error } = await supabase.rpc('increment_broadcast_read', { 
          broadcast_uuid: recipient.broadcast_id 
        });
        if (error) console.error('Error incrementing read count:', error);
      }
    }
  }

  // Update driver_messages table
  await supabase
    .from('driver_messages')
    .update({ status: 'read' })
    .eq('external_id', messageId);
}

async function handleMessageFailed(supabase: any, messageId: string, phone: string | undefined, errorMessage: string | undefined) {
  console.log(`Message failed: ${messageId} - ${errorMessage}`);
  
  if (!messageId) return;

  await supabase
    .from('broadcast_recipients')
    .update({
      status: 'failed',
      error_message: errorMessage || 'Delivery failed',
    })
    .eq('external_message_id', messageId);

  await supabase
    .from('driver_messages')
    .update({ status: 'failed', error_message: errorMessage })
    .eq('external_id', messageId);
}

async function handleInboundMessage(supabase: any, from: string | undefined, content: string | undefined, timestamp: string | undefined) {
  console.log(`Inbound message from ${from}: ${content}`);
  
  if (!from || !content) {
    console.log('Missing from or content in inbound message');
    return;
  }

  // Normalize phone number
  const normalizedPhone = from.replace(/[\s\-\(\)]/g, '');
  const phoneSuffix = normalizedPhone.slice(-10);

  // ── Job offer keyword detection ──
  const keyword = extractOfferKeyword(content);
  if (keyword) {
    await processJobOfferResponse(supabase, phoneSuffix, keyword, 'sms', timestamp);
  }

  // Find recent broadcast recipients with this phone
  const { data: recipients } = await supabase
    .from('broadcast_recipients')
    .select('id, broadcast_id, driver_id, driver_name, status')
    .ilike('driver_phone', `%${phoneSuffix}%`)
    .in('status', ['sent', 'delivered', 'read'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (recipients && recipients.length > 0) {
    const recipient = recipients[0];
    const wasReplied = recipient.status === 'replied';
    
    await supabase
      .from('broadcast_recipients')
      .update({
        status: 'replied',
        replied_at: timestamp || new Date().toISOString(),
        reply_content: content,
      })
      .eq('id', recipient.id);

    if (!wasReplied) {
      await supabase.rpc('increment_broadcast_replied', { 
        broadcast_uuid: recipient.broadcast_id 
      });
    }
  }

  // Log as inbound driver message
  const { data: existingDriver } = await supabase
    .from('driver_messages')
    .select('driver_id, driver_name, tenant_id')
    .ilike('driver_phone', `%${phoneSuffix}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingDriver) {
    await supabase
      .from('driver_messages')
      .insert({
        tenant_id: existingDriver.tenant_id,
        driver_id: existingDriver.driver_id,
        driver_name: existingDriver.driver_name,
        driver_phone: from,
        content: content,
        direction: 'inbound',
        message_type: 'sms',
        status: 'received',
      });
  }
}

// ============== JOB OFFER KEYWORD HANDLING ==============

function extractOfferKeyword(content: string): 'ACCEPT' | 'DECLINE' | null {
  const normalized = content.trim().toUpperCase();
  if (/^ACCEPT\b/.test(normalized)) return 'ACCEPT';
  if (/^DECLINE\b/.test(normalized)) return 'DECLINE';
  return null;
}

async function processJobOfferResponse(
  supabase: any, phoneSuffix: string, keyword: 'ACCEPT' | 'DECLINE',
  channel: 'sms' | 'whatsapp', timestamp?: string | null
): Promise<void> {
  console.log(`[OfferResponse] Processing ${keyword} from ...${phoneSuffix} via ${channel}`);

  // 1. Find the driver by phone suffix
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, name, owning_org_id, tenant_id')
    .ilike('phone', `%${phoneSuffix}%`)
    .limit(1)
    .maybeSingle();

  if (!driver?.owning_org_id) {
    console.log('[OfferResponse] No org-linked driver found for phone suffix:', phoneSuffix);
    return;
  }

  // 2. Find the most recent pending offer for this org
  const { data: offer } = await supabase
    .from('job_offers')
    .select('id, job_id, status, target_org_id, offered_rate_ngn')
    .eq('target_org_id', driver.owning_org_id)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!offer) {
    console.log('[OfferResponse] No pending offer for org:', driver.owning_org_id);
    return;
  }

  // 3. Log the response in delivery log
  await supabase.from('job_offer_delivery_log').insert({
    offer_id: offer.id,
    channel,
    status: 'response_received',
    response_keyword: keyword,
  });

  const newOfferStatus = keyword === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';

  // 4. Update job_offers status
  const { error: offerUpdateErr } = await supabase
    .from('job_offers')
    .update({
      status: newOfferStatus,
      responded_at: timestamp || new Date().toISOString(),
    })
    .eq('id', offer.id);

  if (offerUpdateErr) {
    console.error('[OfferResponse] Failed to update offer:', offerUpdateErr);
    return;
  }

  // 5. If accepted, assign job to the org
  if (keyword === 'ACCEPT') {
    const { error: jobUpdateErr } = await supabase
      .from('jobs')
      .update({
        executing_org_id: offer.target_org_id,
        status: 'assigned',
        rate_ngn: offer.offered_rate_ngn,
        updated_at: new Date().toISOString(),
      })
      .eq('id', offer.job_id);

    if (jobUpdateErr) {
      console.error('[OfferResponse] Failed to assign job:', jobUpdateErr);
    } else {
      console.log(`[OfferResponse] Job ${offer.job_id} assigned to org ${offer.target_org_id}`);
    }
  }

  // 6. Dispatch webhook event
  try {
    await supabase.from('webhook_events').insert({
      tenant_id: driver.tenant_id,
      event_type: `job_offer.${keyword.toLowerCase()}`,
      payload: {
        offer_id: offer.id,
        job_id: offer.job_id,
        target_org_id: offer.target_org_id,
        response_channel: channel,
      },
    });
  } catch (_) { /* non-critical */ }

  console.log(`[OfferResponse] Offer ${offer.id} → ${newOfferStatus}`);
}

// ============== CALL EVENT HANDLERS (IVR) ==============

async function handleCallEvent(supabase: any, webhookData: any) {
  const tenantId = webhookData.metadata?.tenant_id || 'default';

  // Log the call event
  try {
    await supabase.from('driver_call_logs').insert({
      external_call_id: webhookData.call_id,
      driver_phone: webhookData.from || webhookData.to || 'unknown',
      call_type: webhookData.direction || 'inbound',
      status: webhookData.status || 'initiated',
      tenant_id: tenantId,
      metadata: webhookData,
    });
  } catch (e) {
    console.log('Could not log call event:', e);
  }

  // Handle different call events
  switch (webhookData.event) {
    case 'call.answered':
      return generateIVRResponse('welcome', webhookData.language || 'en');
    
    case 'dtmf.received':
      return handleDTMFInput(webhookData.dtmf, webhookData.current_menu, webhookData.language);
    
    case 'call.completed':
      console.log('Call completed:', webhookData.call_id);
      // Auto-charge for completed call
      await chargeCompletedCall(supabase, webhookData);
      break;
    
    case 'call.failed':
      console.log('Call failed:', webhookData.call_id, webhookData.reason);
      break;
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Auto-charge wallet for completed calls
async function chargeCompletedCall(supabase: any, webhookData: any) {
  const callId = webhookData.call_id;
  const durationSeconds = webhookData.duration || webhookData.duration_seconds || 0;
  const tenantId = webhookData.metadata?.tenant_id;

  if (!tenantId || tenantId === 'default') {
    console.log('[Webhook] No tenant_id in call metadata - skipping charge');
    return;
  }

  if (durationSeconds <= 0) {
    console.log('[Webhook] Call duration is 0 - no charge');
    return;
  }

  // Round up to nearest minute
  const durationMinutes = Math.ceil(durationSeconds / 60);

  console.log(`[Webhook] Charging call ${callId}: ${durationMinutes} min for tenant ${tenantId}`);

  try {
    const { data, error } = await supabase.rpc('deduct_wallet_balance', {
      p_tenant_id: tenantId,
      p_communication_type: 'call',
      p_quantity: durationMinutes,
      p_reference_id: callId,
      p_description: `Voice call - ${durationMinutes} minute(s)`
    });

    if (error) {
      console.error('[Webhook] Call charge error:', error);
      return;
    }

    console.log('[Webhook] Call charged successfully:', data);

    // Trigger low balance alert if needed
    if (data?.success && data?.balance_after !== undefined) {
      await checkAndTriggerLowBalanceAlert(supabase, tenantId, data.balance_after);
    }
  } catch (err) {
    console.error('[Webhook] Failed to charge call:', err);
  }
}

async function checkAndTriggerLowBalanceAlert(supabase: any, tenantId: string, currentBalance: number) {
  try {
    const { data: wallet } = await supabase
      .from('tenant_wallets')
      .select('low_balance_threshold_ngn')
      .eq('tenant_id', tenantId)
      .single();

    const threshold = wallet?.low_balance_threshold_ngn || 1000;

    if (currentBalance > threshold) {
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, phone')
      .eq('tenant_id', tenantId)
      .limit(1)
      .single();

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

    console.log(`[Webhook] Low balance alert triggered for tenant ${tenantId}`);
  } catch (err) {
    console.error('[Webhook] Failed to trigger low balance alert:', err);
  }
}

function generateIVRResponse(promptId: string, language: string) {
  const prompts = getIVRPrompts(language);
  const prompt = prompts[promptId] || prompts['welcome'];

  const ncco = [
    {
      action: 'talk',
      text: prompt,
      language: getLanguageCode(language),
      style: 0,
    },
    {
      action: 'input',
      type: ['dtmf'],
      dtmf: {
        maxDigits: 1,
        timeOut: 10,
      },
      eventUrl: [`${Deno.env.get('SUPABASE_URL')}/functions/v1/fonu-webhook`],
    },
  ];

  return new Response(JSON.stringify(ncco), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function handleDTMFInput(digit: string, currentMenu: string, language: string) {
  if (!currentMenu || currentMenu === 'main') {
    switch (digit) {
      case '1':
        return generateIVRResponse('job_updates', language);
      case '2':
        return generateIVRResponse('payment', language);
      case '3':
        return generateIVRResponse('vehicle', language);
      case '0':
        return generateIVRResponse('agent', language);
      default:
        return generateIVRResponse('welcome', language);
    }
  }

  return generateIVRResponse('goodbye', language);
}

function getLanguageCode(language: string): string {
  const codes: Record<string, string> = {
    'en': 'en-NG',
    'ha': 'ha-NG',
    'yo': 'yo-NG',
    'ig': 'ig-NG',
    'pcm': 'en-NG',
  };
  return codes[language] || 'en-NG';
}

// ============== SIM EVENT HANDLERS ==============

async function handleSIMEvent(supabase: any, webhookData: any) {
  const { event, iccid, msisdn, data_usage_mb, sms_count, signal_strength, network_type, latitude, longitude } = webhookData;
  
  console.log(`Processing SIM event: ${event} for ICCID: ${iccid}`);

  // Store usage signal
  if (iccid) {
    await supabase.from('sim_usage_signals').insert({
      iccid,
      signal_type: event || 'webhook',
      data_usage_mb: data_usage_mb || null,
      sms_count: sms_count || null,
      signal_strength: signal_strength || null,
      network_type: network_type || null,
      latitude: latitude || null,
      longitude: longitude || null,
      raw_data: webhookData,
      recorded_at: new Date().toISOString(),
    });

    // Update SIM record with latest data
    const updateData: Record<string, any> = {
      last_activity: new Date().toISOString(),
    };
    
    if (data_usage_mb !== undefined) updateData.data_usage_mb = data_usage_mb;
    if (signal_strength !== undefined) updateData.signal_strength = signal_strength;
    if (network_type) updateData.network_type = network_type;

    await supabase
      .from('iot_sims')
      .update(updateData)
      .eq('iccid', iccid);
  }

  // Handle specific events
  switch (event) {
    case 'sim.activated':
      await supabase
        .from('iot_sims')
        .update({ status: 'active', fonu_status: 'active', activation_date: new Date().toISOString() })
        .eq('iccid', iccid);
      break;
    
    case 'sim.suspended':
      await supabase
        .from('iot_sims')
        .update({ status: 'suspended', fonu_status: 'suspended' })
        .eq('iccid', iccid);
      break;
    
    case 'sim.data_limit_reached':
      console.log(`Data limit reached for SIM ${iccid}`);
      // Could trigger notification here
      break;
    
    case 'sim.roaming_started':
      await supabase
        .from('iot_sims')
        .update({ roaming: true })
        .eq('iccid', iccid);
      break;
    
    case 'sim.roaming_ended':
      await supabase
        .from('iot_sims')
        .update({ roaming: false })
        .eq('iccid', iccid);
      break;
  }

  return new Response(JSON.stringify({ success: true, event }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getIVRPrompts(language: string): Record<string, string> {
  const prompts: Record<string, Record<string, string>> = {
    'en': {
      'welcome': 'Welcome to FleetPro driver support. Press 1 for job updates, 2 for payment issues, 3 for vehicle problems, or 0 to speak with an agent.',
      'job_updates': 'For job updates, press 1 to hear your current assignment, or 2 to report a delivery issue.',
      'payment': 'For payment inquiries, press 1 to check your balance, or 2 to report a payment problem.',
      'vehicle': 'For vehicle issues, press 1 to report a breakdown, or 2 for maintenance scheduling.',
      'agent': 'Please hold while we connect you to the next available agent.',
      'goodbye': 'Thank you for calling FleetPro. Have a safe journey!',
    },
    'ha': {
      'welcome': 'Barka da zuwa FleetPro taimakon direba. Danna 1 don sabuntawar aiki, 2 don matsalolin biya, 3 don matsalolin mota, ko 0 don magana da wakili.',
      'job_updates': 'Don sabuntawar aiki, danna 1 don jin aikin ku na yanzu, ko 2 don rahoton matsalar isarwa.',
      'payment': 'Don tambayoyin biya, danna 1 don duba ma\'aunin ku, ko 2 don rahoton matsalar biya.',
      'vehicle': 'Don matsalolin mota, danna 1 don rahoton lalacewa, ko 2 don tsara gyarawa.',
      'agent': 'Da fatan za a jira yayin da muke haɗa ku da wakilin da yake.',
      'goodbye': 'Mun gode da kiran FleetPro. Allah ya kiyaye!',
    },
    'yo': {
      'welcome': 'Kaabo si FleetPro atilẹyin awakọ. Tẹ 1 fun imudojuiwọn iṣẹ, 2 fun awọn ọrọ isanwo, 3 fun awọn iṣoro ọkọ, tabi 0 lati ba aṣoju sọrọ.',
      'job_updates': 'Fun imudojuiwọn iṣẹ, tẹ 1 lati gbọ iṣẹ rẹ lọwọlọwọ, tabi 2 lati jabo iṣoro ifijiṣẹ.',
      'payment': 'Fun awọn ibeere isanwo, tẹ 1 lati ṣayẹwo iwọntunwọnsi rẹ, tabi 2 lati jabo iṣoro isanwo.',
      'vehicle': 'Fun awọn iṣoro ọkọ, tẹ 1 lati jabo ipalara, tabi 2 fun eto itọju.',
      'agent': 'Jọwọ duro nigba ti a n so ọ pọ mọ aṣoju ti o wa.',
      'goodbye': 'O ṣeun fun pipe FleetPro. Irin ajo ailewu!',
    },
    'ig': {
      'welcome': 'Nnọọ na FleetPro nkwado ndị ọkwọ ụgbọ ala. Pịa 1 maka mmelite ọrụ, 2 maka nsogbu ịkwụ ụgwọ, 3 maka nsogbu ụgbọ ala, ma ọ bụ 0 ịgwa onye nnọchị anya.',
      'job_updates': 'Maka mmelite ọrụ, pịa 1 ịnụ ọrụ gị ugbu a, ma ọ bụ 2 ịkọ nsogbu nnyefe.',
      'payment': 'Maka ajụjụ ịkwụ ụgwọ, pịa 1 ịlele ego gị, ma ọ bụ 2 ịkọ nsogbu ịkwụ ụgwọ.',
      'vehicle': 'Maka nsogbu ụgbọ ala, pịa 1 ịkọ mbibi, ma ọ bụ 2 maka nhazi nlekọta.',
      'agent': 'Biko chere ka anyị jikọọ gị na onye nnọchị anya dị.',
      'goodbye': 'Daalụ maka ịkpọ FleetPro. Njem udo!',
    },
    'pcm': {
      'welcome': 'Welcome to FleetPro driver support. Press 1 for job updates, 2 for money wahala, 3 for motor problem, or 0 to yarn with agent.',
      'job_updates': 'For job updates, press 1 to hear your current work, or 2 to report delivery wahala.',
      'payment': 'For money matter, press 1 to check your balance, or 2 to report money problem.',
      'vehicle': 'For motor wahala, press 1 to report breakdown, or 2 for maintenance.',
      'agent': 'Abeg hold on make we connect you to agent wey dey available.',
      'goodbye': 'Thank you for calling FleetPro. Safe journey!',
    },
  };
  
  return prompts[language] || prompts['en'];
}
