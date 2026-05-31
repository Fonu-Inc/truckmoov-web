import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Meta WhatsApp Business Platform Webhook Handler
 * 
 * Receives:
 * - Inbound messages from customers/drivers
 * - Delivery status updates (sent, delivered, read, failed)
 * - Account status notifications
 * 
 * Security:
 * - X-Hub-Signature-256 HMAC verification
 * - Idempotency via webhook_events table
 * - Tenant routing via phone_number_id → tenant mapping
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
};

const META_WEBHOOK_VERIFY_TOKEN = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN') || 'fleetpro_whatsapp_verify';
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
    // Handle webhook verification (GET request from Meta)
    if (req.method === 'GET') {
      return handleVerification(req);
    }

    // Handle webhook events (POST request)
    if (req.method === 'POST') {
      return await handleWebhookEvent(req, supabase);
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    // Always return 200 to prevent Meta from retrying
    return new Response(JSON.stringify({ received: true, error: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============== WEBHOOK VERIFICATION ==============
function handleVerification(req: Request): Response {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  console.log('[WhatsApp Webhook] Verification request:', { mode, token: token?.slice(0, 5) + '...' });

  if (mode === 'subscribe' && token === META_WEBHOOK_VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verification successful');
    return new Response(challenge, { status: 200 });
  }

  console.error('[WhatsApp Webhook] Verification failed');
  return new Response('Forbidden', { status: 403 });
}

// ============== WEBHOOK EVENT HANDLING ==============
async function handleWebhookEvent(req: Request, supabase: any): Promise<Response> {
  const rawBody = await req.text();
  
  // Validate signature
  const isValid = await validateSignature(req, rawBody);
  if (!isValid) {
    console.error('[WhatsApp Webhook] Invalid signature');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const webhookData = JSON.parse(rawBody);
  console.log('[WhatsApp Webhook] Received:', JSON.stringify(webhookData).slice(0, 500));

  // Process each entry
  const entries = webhookData.entry || [];
  
  for (const entry of entries) {
    const changes = entry.changes || [];
    
    for (const change of changes) {
      if (change.field === 'messages') {
        const value = change.value;
        const phoneNumberId = value.metadata?.phone_number_id;
        
        // Process incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            await processInboundMessage(supabase, message, value.metadata, value.contacts);
          }
        }
        
        // Process delivery statuses
        if (value.statuses) {
          for (const status of value.statuses) {
            await processStatusUpdate(supabase, status, phoneNumberId);
          }
        }
      }
    }
  }

  // Always return 200 to acknowledge receipt
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============== SIGNATURE VALIDATION ==============
async function validateSignature(req: Request, body: string): Promise<boolean> {
  const signature = req.headers.get('x-hub-signature-256');
  
  // Skip validation if no secret configured (development mode)
  if (!META_APP_SECRET) {
    console.warn('[WhatsApp Webhook] No META_APP_SECRET configured - skipping signature validation');
    return true;
  }

  if (!signature) {
    console.error('[WhatsApp Webhook] Missing x-hub-signature-256 header');
    return false;
  }

  try {
    // Extract the signature value (format: "sha256=xxxxx")
    const expectedSig = signature.replace('sha256=', '');

    // Compute HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(META_APP_SECRET);
    const messageData = encoder.encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const computedSig = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Timing-safe comparison
    if (computedSig.length !== expectedSig.length) {
      return false;
    }

    let valid = true;
    for (let i = 0; i < computedSig.length; i++) {
      if (computedSig[i] !== expectedSig[i]) {
        valid = false;
      }
    }

    return valid;
  } catch (err) {
    console.error('[WhatsApp Webhook] Signature validation error:', err);
    return false;
  }
}

// ============== PROCESS INBOUND MESSAGE ==============
async function processInboundMessage(
  supabase: any,
  message: any,
  metadata: any,
  contacts: any[]
): Promise<void> {
  const messageId = message.id;
  const phoneNumberId = metadata?.phone_number_id;
  const fromPhone = message.from;

  console.log('[WhatsApp Webhook] Processing inbound:', { messageId, phoneNumberId, fromPhone });

  // Check idempotency
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('provider', 'META_WHATSAPP')
    .eq('event_id', messageId)
    .maybeSingle();

  if (existingEvent) {
    console.log('[WhatsApp Webhook] Duplicate event, skipping:', messageId);
    return;
  }

  // Route to tenant via phone_number_id
  const { data: account } = await supabase
    .from('tenant_whatsapp_accounts')
    .select('id, tenant_id')
    .eq('phone_number_id', phoneNumberId)
    .eq('status', 'CONNECTED')
    .maybeSingle();

  if (!account) {
    console.error('[WhatsApp Webhook] No tenant found for phone_number_id:', phoneNumberId);
    // Still record the event for debugging
    await recordWebhookEvent(supabase, messageId, 'message.inbound', null, phoneNumberId, 'FAILED', 'No tenant mapping');
    return;
  }

  // Record webhook event
  await recordWebhookEvent(supabase, messageId, 'message.inbound', account.tenant_id, phoneNumberId, 'RECEIVED');

  // Extract message content
  let content = '';
  let messageType: 'TEXT' | 'MEDIA' | 'INTERACTIVE' = 'TEXT';
  let mediaUrl = '';
  let mediaType = '';

  if (message.type === 'text') {
    content = message.text?.body || '';
  } else if (message.type === 'image' || message.type === 'video' || message.type === 'document' || message.type === 'audio') {
    messageType = 'MEDIA';
    mediaType = message.type;
    content = message[message.type]?.caption || `[${message.type}]`;
    // Media URL would need to be fetched via Media API
  } else if (message.type === 'interactive') {
    messageType = 'INTERACTIVE';
    content = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '[Interactive]';
  }

  // Get contact info
  const contact = contacts?.find((c: any) => c.wa_id === fromPhone);
  const contactName = contact?.profile?.name;

  // Find driver by phone
  const normalizedPhone = fromPhone.replace(/[\s\-\(\)]/g, '');
  const phoneSuffix = normalizedPhone.slice(-10);
  
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, name, owning_org_id')
    .eq('tenant_id', account.tenant_id)
    .ilike('phone', `%${phoneSuffix}%`)
    .maybeSingle();

  // ── STOP keyword: opt-out registration (highest priority) ──
  if (isStopKeyword(content)) {
    await registerOptOut(supabase, account.tenant_id, fromPhone, driver?.id ?? null, messageId);
    // Continue processing so the message is still recorded for audit, but skip offer logic.
  } else {
    // ── Job offer keyword detection (ACCEPT / DECLINE / YES / NO) ──
    const keyword = extractOfferKeyword(content);
    if (keyword && driver?.owning_org_id) {
      await processJobOfferResponse(supabase, driver, keyword, 'whatsapp', account.tenant_id);
    }
  }

  // Touch the 24h customer-initiated session window (any inbound resets it)
  await supabase.rpc('touch_whatsapp_session', {
    p_tenant_id: account.tenant_id,
    p_phone: fromPhone,
    p_message_id: messageId,
  });

  // Generate conversation ID for threading
  const conversationId = `${account.tenant_id}_${fromPhone}`;

  // Insert into whatsapp_inbound_messages (dedicated inbound table)
  await supabase.from('whatsapp_inbound_messages').insert({
    tenant_id: account.tenant_id,
    org_id: driver?.owning_org_id || null,
    from_phone: fromPhone,
    to_phone: metadata.display_phone_number || phoneNumberId,
    message_type: message.type === 'text' ? 'TEXT' : message.type === 'image' ? 'IMAGE' : message.type === 'document' ? 'DOCUMENT' : message.type === 'video' ? 'VIDEO' : 'AUDIO',
    text_body: message.type === 'text' ? content : null,
    media_url: mediaUrl || null,
    media_mime: message[message.type]?.mime_type || null,
    received_at: new Date(parseInt(message.timestamp) * 1000).toISOString(),
    raw_payload: message,
  });

  // Insert message record (existing general table)
  const { error: insertError } = await supabase
    .from('whatsapp_messages')
    .insert({
      tenant_id: account.tenant_id,
      direction: 'INBOUND',
      sender_account_id: account.id,
      to_phone: metadata.display_phone_number || phoneNumberId,
      from_phone: maskPhoneNumber(fromPhone),
      message_type: messageType,
      content: content,
      media_url: mediaUrl,
      media_type: mediaType,
      provider_message_id: messageId,
      status: 'DELIVERED',
      conversation_id: conversationId,
      driver_id: driver?.id,
      driver_name: contactName || driver?.name,
      delivered_at: new Date(parseInt(message.timestamp) * 1000).toISOString(),
    });

  if (insertError) {
    console.error('[WhatsApp Webhook] Failed to insert message:', insertError);
    await updateWebhookEventStatus(supabase, messageId, 'FAILED', insertError.message);
    return;
  }

  // Also insert into driver_messages for unified inbox
  if (driver) {
    await supabase.from('driver_messages').insert({
      tenant_id: account.tenant_id,
      driver_id: driver.id,
      driver_name: driver.name,
      driver_phone: fromPhone,
      message_type: 'whatsapp',
      direction: 'inbound',
      content: content,
      status: 'received',
      external_id: messageId,
    });
  }

  // ── AUTO-CREATE WAYBILL FROM IMAGE MESSAGES ──
  if (messageType === 'MEDIA' && (mediaType === 'image' || mediaType === 'document')) {
    await createWaybillFromWhatsApp(supabase, account.tenant_id, message, fromPhone, contactName || driver?.name, driver?.owning_org_id);
  }

  // ── ALSO STORE AS POD IF DRIVER HAS AN ACTIVE JOB ──
  if (messageType === 'MEDIA' && mediaType === 'image' && driver?.id) {
    await ingestPodFromWhatsApp(supabase, account.tenant_id, driver.id, message);
  }

  // Mark event as processed
  await updateWebhookEventStatus(supabase, messageId, 'PROCESSED');
  
  console.log('[WhatsApp Webhook] Inbound message processed:', messageId);
}

// ============== PROCESS STATUS UPDATE ==============
async function processStatusUpdate(
  supabase: any,
  status: any,
  phoneNumberId: string
): Promise<void> {
  const messageId = status.id;
  const statusType = status.status; // sent, delivered, read, failed
  const recipientId = status.recipient_id;
  const timestamp = status.timestamp;

  console.log('[WhatsApp Webhook] Processing status:', { messageId, statusType });

  // Check idempotency
  const eventId = `${messageId}_${statusType}`;
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('provider', 'META_WHATSAPP')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existingEvent) {
    console.log('[WhatsApp Webhook] Duplicate status event, skipping:', eventId);
    return;
  }

  // Record webhook event
  await recordWebhookEvent(supabase, eventId, `message.${statusType}`, null, phoneNumberId, 'RECEIVED');

  // Map Meta status to our enum
  const statusMap: Record<string, string> = {
    'sent': 'SENT',
    'delivered': 'DELIVERED',
    'read': 'READ',
    'failed': 'FAILED',
  };

  const newStatus = statusMap[statusType] || 'SENT';
  const timestampDate = new Date(parseInt(timestamp) * 1000).toISOString();

  // Update message status
  const updateData: Record<string, any> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (statusType === 'sent') {
    updateData.sent_at = timestampDate;
  } else if (statusType === 'delivered') {
    updateData.delivered_at = timestampDate;
  } else if (statusType === 'read') {
    updateData.read_at = timestampDate;
  } else if (statusType === 'failed') {
    updateData.failed_at = timestampDate;
    updateData.error_code = status.errors?.[0]?.code;
    updateData.error_message = status.errors?.[0]?.message || status.errors?.[0]?.title;
  }

  const { error: updateError } = await supabase
    .from('whatsapp_messages')
    .update(updateData)
    .eq('provider_message_id', messageId);

  if (updateError) {
    console.error('[WhatsApp Webhook] Failed to update message status:', updateError);
    await updateWebhookEventStatus(supabase, eventId, 'FAILED', updateError.message);
    return;
  }

  // Also update driver_messages if exists
  await supabase
    .from('driver_messages')
    .update({ status: statusType })
    .eq('external_id', messageId);

  // Mark event as processed
  await updateWebhookEventStatus(supabase, eventId, 'PROCESSED');

  console.log('[WhatsApp Webhook] Status updated:', messageId, statusType);
}

// ============== HELPER FUNCTIONS ==============
async function recordWebhookEvent(
  supabase: any,
  eventId: string,
  eventType: string,
  tenantId: string | null,
  phoneNumberId: string,
  status: 'RECEIVED' | 'PROCESSED' | 'FAILED',
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('webhook_events').insert({
      provider: 'META_WHATSAPP',
      event_id: eventId,
      event_type: eventType,
      tenant_id: tenantId,
      phone_number_id: phoneNumberId,
      status: status,
      error_message: errorMessage,
      processed_at: status === 'PROCESSED' ? new Date().toISOString() : null,
    });
  } catch (err) {
    console.error('[WhatsApp Webhook] Failed to record event:', err);
  }
}

async function updateWebhookEventStatus(
  supabase: any,
  eventId: string,
  status: 'PROCESSED' | 'FAILED',
  errorMessage?: string
): Promise<void> {
  try {
    await supabase
      .from('webhook_events')
      .update({
        status: status,
        processed_at: status === 'PROCESSED' ? new Date().toISOString() : null,
        error_message: errorMessage,
        retry_count: status === 'FAILED' ? supabase.sql`retry_count + 1` : undefined,
      })
      .eq('provider', 'META_WHATSAPP')
      .eq('event_id', eventId);
  } catch (err) {
    console.error('[WhatsApp Webhook] Failed to update event status:', err);
  }
}

function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  return phone.slice(0, 4) + '****' + phone.slice(-3);
}

// ============== JOB OFFER KEYWORD HANDLING ==============

function extractOfferKeyword(content: string): 'ACCEPT' | 'DECLINE' | null {
  const normalized = content.trim().toUpperCase();
  // ACCEPT synonyms: ACCEPT, YES, Y, OK
  if (/^(ACCEPT|YES|Y|OK)\b/.test(normalized)) return 'ACCEPT';
  // DECLINE synonyms: DECLINE, NO, N, REJECT
  if (/^(DECLINE|NO|N|REJECT)\b/.test(normalized)) return 'DECLINE';
  return null;
}

function isStopKeyword(content: string): boolean {
  const normalized = content.trim().toUpperCase();
  // Standard WhatsApp/SMS opt-out keywords (Meta-recommended)
  return /^(STOP|UNSUBSCRIBE|CANCEL|END|QUIT|OPTOUT|OPT-OUT)\b/.test(normalized);
}

async function registerOptOut(
  supabase: any,
  tenantId: string,
  phone: string,
  driverId: string | null,
  messageId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('whatsapp_opt_outs')
      .upsert(
        {
          tenant_id: tenantId,
          phone,
          driver_id: driverId,
          reason: 'STOP_KEYWORD',
          source_message_id: messageId,
          opted_out_at: new Date().toISOString(),
          reactivated_at: null,
        },
        { onConflict: 'tenant_id,phone' }
      );
    if (error) {
      console.error('[OptOut] Failed to register opt-out:', error);
    } else {
      console.log(`[OptOut] Registered ${phone} for tenant ${tenantId}`);
    }
  } catch (err) {
    console.error('[OptOut] Error:', err);
  }
}

async function processJobOfferResponse(
  supabase: any, driver: any, keyword: 'ACCEPT' | 'DECLINE',
  channel: 'whatsapp', tenantId: string
): Promise<void> {
  console.log(`[OfferResponse] Processing ${keyword} from driver ${driver.id} via ${channel}`);

  // Find the most recent pending offer for this org
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

  // Log the response
  await supabase.from('job_offer_delivery_log').insert({
    offer_id: offer.id,
    channel,
    status: 'response_received',
    response_keyword: keyword,
  });

  const newOfferStatus = keyword === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';

  const { error: offerUpdateErr } = await supabase
    .from('job_offers')
    .update({
      status: newOfferStatus,
      responded_at: new Date().toISOString(),
    })
    .eq('id', offer.id);

  if (offerUpdateErr) {
    console.error('[OfferResponse] Failed to update offer:', offerUpdateErr);
    return;
  }

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

  // Dispatch webhook event
  try {
    await supabase.from('webhook_events').insert({
      tenant_id: tenantId,
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

// ============== WAYBILL AUTO-INTAKE FROM WHATSAPP ==============

async function createWaybillFromWhatsApp(
  supabase: any,
  tenantId: string,
  message: any,
  fromPhone: string,
  driverName: string | null,
  orgId: string | null
): Promise<void> {
  try {
    const mediaId = message[message.type]?.id;
    const mimeType = message[message.type]?.mime_type || 'image/jpeg';
    const caption = message[message.type]?.caption || '';

    console.log('[Waybill Intake] Creating waybill from WhatsApp image:', { mediaId, fromPhone });

    // Download media from Meta Graph API
    let imageStoragePath: string | null = null;
    let imageUrl: string | null = null;

    if (mediaId) {
      const META_ACCESS_TOKEN = Deno.env.get('META_WHATSAPP_ACCESS_TOKEN') || Deno.env.get('TELCONIX_API_KEY');
      
      if (META_ACCESS_TOKEN) {
        // Step 1: Get media URL from Meta
        const mediaInfoRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
          headers: { 'Authorization': `Bearer ${META_ACCESS_TOKEN}` },
        });

        if (mediaInfoRes.ok) {
          const mediaInfo = await mediaInfoRes.json();
          const mediaDownloadUrl = mediaInfo.url;

          // Step 2: Download the actual media file
          const mediaRes = await fetch(mediaDownloadUrl, {
            headers: { 'Authorization': `Bearer ${META_ACCESS_TOKEN}` },
          });

          if (mediaRes.ok) {
            const mediaBlob = await mediaRes.blob();
            const ext = mimeType.includes('png') ? 'png' : mimeType.includes('pdf') ? 'pdf' : 'jpg';
            const fileName = `${tenantId}/${Date.now()}_${mediaId}.${ext}`;

            // Step 3: Upload to waybill-images bucket
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('waybill-images')
              .upload(fileName, mediaBlob, {
                contentType: mimeType,
                upsert: false,
              });

            if (uploadErr) {
              console.error('[Waybill Intake] Storage upload failed:', uploadErr);
            } else {
              imageStoragePath = uploadData.path;
              // Get signed URL for preview (valid for 7 days)
              const { data: signedData } = await supabase.storage
                .from('waybill-images')
                .createSignedUrl(uploadData.path, 604800); // 7 days
              imageUrl = signedData?.signedUrl || null;
            }
          }
        }
      } else {
        console.warn('[Waybill Intake] No META_WHATSAPP_ACCESS_TOKEN configured - cannot download media');
      }
    }

    // Create waybill record
    const { data: waybill, error: wbErr } = await supabase
      .from('waybill_records')
      .insert({
        tenant_id: tenantId,
        org_id: orgId,
        source_type: 'whatsapp',
        source_message_id: message.id,
        source_phone: fromPhone,
        driver_name: driverName,
        image_url: imageUrl,
        image_storage_path: imageStoragePath,
        status: 'received',
      })
      .select('id')
      .single();

    if (wbErr) {
      console.error('[Waybill Intake] Failed to create waybill record:', wbErr);
      return;
    }

    console.log('[Waybill Intake] Waybill created:', waybill.id, 'from', fromPhone);

    // If we have the image, auto-trigger extraction
    if (imageUrl || imageStoragePath) {
      try {
        const extractBody = {
          action: 'extract_waybill',
          waybillId: waybill.id,
          imageUrl: imageUrl,
          tenantId: tenantId,
        };

        // Call extract-waybill function internally
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        
        const extractRes = await fetch(`${supabaseUrl}/functions/v1/extract-waybill`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify(extractBody),
        });

        if (extractRes.ok) {
          const extractResult = await extractRes.json();
          console.log('[Waybill Intake] Auto-extraction result:', extractResult.success ? 'SUCCESS' : 'FAILED');
        }
      } catch (extractErr) {
        console.error('[Waybill Intake] Auto-extraction failed:', extractErr);
        // Non-critical - waybill is still created for manual extraction
      }
    }

    // Audit log
    await supabase.from('waybill_audit_log').insert({
      tenant_id: tenantId,
      entity_type: 'waybill',
      entity_id: waybill.id,
      action: 'whatsapp_intake',
      metadata: { source_phone: fromPhone, has_media: !!mediaId, caption },
    });

  } catch (err) {
    console.error('[Waybill Intake] Error:', err);
  }
}

// ============== POD MEDIA INGESTION ==============
async function ingestPodFromWhatsApp(
  supabase: any,
  tenantId: string,
  driverId: string,
  message: any
): Promise<void> {
  try {
    // Find the driver's most recent active job
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('driver_id', driverId)
      .in('status', ['in_transit', 'arrived_dropoff', 'assigned'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!job) return; // No active job → not a POD

    const mediaId = message.image?.id;
    const mimeType = message.image?.mime_type || 'image/jpeg';
    const caption = message.image?.caption || '';
    if (!mediaId) return;

    const META_TOKEN = Deno.env.get('META_WHATSAPP_ACCESS_TOKEN') || Deno.env.get('TELCONIX_API_KEY');
    let storagePath: string | null = null;
    let signedUrl: string | null = null;

    if (META_TOKEN) {
      const infoRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
        headers: { Authorization: `Bearer ${META_TOKEN}` },
      });
      if (infoRes.ok) {
        const info = await infoRes.json();
        const dlRes = await fetch(info.url, { headers: { Authorization: `Bearer ${META_TOKEN}` } });
        if (dlRes.ok) {
          const blob = await dlRes.blob();
          const ext = mimeType.includes('png') ? 'png' : 'jpg';
          const fileName = `${tenantId}/${job.id}/${Date.now()}_${mediaId}.${ext}`;
          const { data: up, error: upErr } = await supabase.storage
            .from('pod-media')
            .upload(fileName, blob, { contentType: mimeType, upsert: false });
          if (!upErr) {
            storagePath = up.path;
            const { data: signed } = await supabase.storage
              .from('pod-media')
              .createSignedUrl(up.path, 604800); // 7 days
            signedUrl = signed?.signedUrl || null;
          }
        }
      }
    }

    await supabase.from('job_pod_media').insert({
      job_id: job.id,
      tenant_id: tenantId,
      driver_id: driverId,
      source: 'whatsapp',
      source_message_id: message.id,
      storage_path: storagePath,
      signed_url: signedUrl,
      mime_type: mimeType,
      caption,
    });

    console.log(`[POD] Ingested photo for job ${job.id} from driver ${driverId}`);
  } catch (err) {
    console.error('[POD] Error:', err);
  }
}
