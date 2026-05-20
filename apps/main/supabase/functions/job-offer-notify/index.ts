import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Job Offer Notification Edge Function
 * 
 * Sends job offers to Owner-Operators via multi-channel cascade:
 * 1. WhatsApp (primary) with interactive buttons
 * 2. SMS fallback with keyword reply (ACCEPT / DECLINE)
 * 3. Voice call fallback (IVR)
 * 
 * Also checks active job limits before sending.
 */

interface NotifyRequest {
  offer_id: string;
  tenant_id: string;
  // Optional: override channels
  channels?: ('whatsapp' | 'sms' | 'voice')[];
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

    const request: NotifyRequest = await req.json();
    const { offer_id, tenant_id } = request;
    const channels = request.channels || ['whatsapp', 'sms'];

    // 1. Fetch offer with job and org details
    const { data: offer, error: offerErr } = await supabase
      .from('job_offers')
      .select(`
        *,
        jobs!job_offers_job_id_fkey (
          id, reference, pickup_address, delivery_address,
          cargo_type, cargo_weight_kg, amount_ngn, deadline
        ),
        target_org:organizations!job_offers_target_org_id_fkey (
          id, name, organization_type, metadata
        )
      `)
      .eq('id', offer_id)
      .single();

    if (offerErr || !offer) {
      return new Response(JSON.stringify({ success: false, error: 'Offer not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Check active job limit for Owner-Operator
    const targetOrg = offer.target_org as any;
    if (targetOrg?.organization_type === 'OWNER_OPERATOR') {
      const maxJobs = (targetOrg.metadata as any)?.max_active_jobs ?? 1;
      const { data: limitCheck } = await supabase.rpc('check_owner_operator_active_job_limit', {
        p_org_id: offer.target_org_id,
        p_max_active_jobs: maxJobs,
      });

      if (limitCheck && !limitCheck.eligible) {
        // Mark offer as cannot deliver — org is busy
        await supabase
          .from('job_offer_delivery_log')
          .insert({
            offer_id,
            channel: 'system',
            status: 'failed',
            error_message: limitCheck.reason,
          });

        return new Response(JSON.stringify({
          success: false,
          error: 'ACTIVE_JOB_LIMIT',
          reason: limitCheck.reason,
          active_jobs: limitCheck.active_jobs,
          max_active_jobs: limitCheck.max_active_jobs,
        }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 3. Find contact info — get drivers linked to this org
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id, name, phone, communication_preference')
      .eq('owning_org_id', offer.target_org_id)
      .eq('status', 'available')
      .limit(1);

    const contactDriver = drivers?.[0];
    const contactPhone = contactDriver?.phone || null;

    if (!contactPhone) {
      await logDelivery(supabase, offer_id, 'system', 'failed', null, 'No available driver with phone number found');
      return new Response(JSON.stringify({ success: false, error: 'No contact available' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const job = offer.jobs as any;
    const deliveryResults: any[] = [];
    let primaryDelivered = false;

    // 4. Channel cascade: WhatsApp → SMS → Voice
    for (const channel of channels) {
      if (primaryDelivered) break;

      try {
        let result;
        switch (channel) {
          case 'whatsapp':
            result = await sendWhatsAppOffer(supabase, tenant_id, contactPhone, offer, job, contactDriver);
            break;
          case 'sms':
            result = await sendSMSOffer(supabase, tenant_id, contactPhone, offer, job, contactDriver);
            break;
          case 'voice':
            result = await sendVoiceOffer(supabase, tenant_id, contactPhone, offer, job);
            break;
        }

        await logDelivery(supabase, offer_id, channel, result?.success ? 'sent' : 'failed', result?.messageId, result?.error);

        if (result?.success) {
          primaryDelivered = true;
          // Update offer with channel used
          await supabase
            .from('job_offers')
            .update({ offer_channel: channel, offer_message_id: result.messageId })
            .eq('id', offer_id);
        }

        deliveryResults.push({ channel, ...result });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        await logDelivery(supabase, offer_id, channel, 'failed', null, errMsg);
        deliveryResults.push({ channel, success: false, error: errMsg });
      }
    }

    // 5. Dispatch webhook event
    try {
      await supabase.from('webhook_events').insert({
        tenant_id,
        event_type: 'job_offer.sent',
        payload: {
          offer_id,
          job_id: job?.id,
          target_org_id: offer.target_org_id,
          channels_attempted: deliveryResults.map(r => r.channel),
          delivered: primaryDelivered,
        },
      });
    } catch (_) {
      // Non-critical
    }

    return new Response(JSON.stringify({
      success: primaryDelivered,
      offer_id,
      delivery_results: deliveryResults,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[job-offer-notify] Error:', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============ CHANNEL HANDLERS ============

async function sendWhatsAppOffer(
  supabase: any, tenantId: string, phone: string,
  offer: any, job: any, driver: any
) {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantId,
        toPhone: phone,
        messageType: 'TEXT',
        textContent: formatOfferMessage(offer, job),
        driverId: driver?.id,
        driverName: driver?.name,
        enableSmsFallback: false,
      }),
    });

    const data = await res.json();
    return { success: data.success !== false, messageId: data.messageId, error: data.error };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function sendSMSOffer(
  supabase: any, tenantId: string, phone: string,
  offer: any, job: any, driver: any
) {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const smsText = `Job Offer: ${job?.reference || 'N/A'}\n` +
      `Route: ${(job?.pickup_address || '').split(',')[0]} → ${(job?.delivery_address || '').split(',')[0]}\n` +
      `Rate: ₦${Number(offer.offered_rate_ngn || 0).toLocaleString()}\n` +
      `Reply ACCEPT or DECLINE`;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/fonu-sms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send_sms',
        phoneNumber: phone,
        message: smsText,
        driverId: driver?.id,
        driverName: driver?.name,
        tenantId,
      }),
    });

    const data = await res.json();
    return { success: data.success !== false, messageId: data.messageId, error: data.error };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function sendVoiceOffer(
  supabase: any, tenantId: string, phone: string,
  offer: any, job: any
) {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/fonu-voice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'make_call',
        phoneNumber: phone,
        tenantId,
        metadata: {
          type: 'job_offer',
          offer_id: offer.id,
          job_reference: job?.reference,
        },
      }),
    });

    const data = await res.json();
    return { success: data.success !== false, messageId: data.callId, error: data.error };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ============ HELPERS ============

function formatOfferMessage(offer: any, job: any): string {
  const pickup = (job?.pickup_address || 'TBD').split(',')[0];
  const delivery = (job?.delivery_address || 'TBD').split(',')[0];
  const rate = Number(offer.offered_rate_ngn || 0).toLocaleString();
  const cargo = job?.cargo_type || 'General';
  const weight = job?.cargo_weight_kg ? `${job.cargo_weight_kg}kg` : '';

  return `🚛 *New Job Offer*\n\n` +
    `📋 Ref: ${job?.reference || 'N/A'}\n` +
    `📍 ${pickup} → ${delivery}\n` +
    `📦 ${cargo} ${weight}\n` +
    `💰 Rate: ₦${rate}\n\n` +
    `Reply *ACCEPT* or *DECLINE*`;
}

async function logDelivery(
  supabase: any, offerId: string, channel: string,
  status: string, messageId?: string | null, error?: string | null
) {
  await supabase.from('job_offer_delivery_log').insert({
    offer_id: offerId,
    channel,
    status,
    external_message_id: messageId || null,
    error_message: error || null,
  });
}
