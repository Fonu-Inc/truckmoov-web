import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FONU_API_KEY = Deno.env.get('FONU_API_KEY');
const FONU_API_SECRET = Deno.env.get('FONU_API_SECRET');
const FONU_BASE_URL = 'https://api.fonu.com/v1';

interface JobNotificationRequest {
  action: 'notify_new_job' | 'notify_job_update' | 'notify_urgent' | 'handle_response' | 'get_notification_status' | 'send_sms_fallback' | 'handle_call_status';
  driverPhone: string;
  driverName?: string;
  jobId?: string;
  tenantId?: string;
  jobDetails?: {
    pickup: string;
    dropoff: string;
    cargo: string;
    amount: number;
    deadline?: string;
    distance?: string;
  };
  language?: string;
  notificationId?: string;
  dtmfInput?: string;
  callId?: string;
  callStatus?: string;
  callDuration?: number;
  enableSmsFallback?: boolean;
}

interface NotificationResult {
  success: boolean;
  notificationId?: string;
  callId?: string;
  smsId?: string;
  status?: string;
  driverResponse?: 'accepted' | 'rejected' | 'pending' | 'no_answer';
  smsSent?: boolean;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!FONU_API_KEY || !FONU_API_SECRET) {
      throw new Error('Fonu API credentials not configured');
    }

    const request: JobNotificationRequest = await req.json();
    console.log('Driver IVR Notification Request:', request);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let result: NotificationResult;

    switch (request.action) {
      case 'notify_new_job':
        result = await notifyNewJob(request, supabase);
        break;
      case 'notify_job_update':
        result = await notifyJobUpdate(request, supabase);
        break;
      case 'notify_urgent':
        result = await notifyUrgent(request, supabase);
        break;
      case 'handle_response':
        result = await handleDriverResponse(request, supabase);
        break;
      case 'handle_call_status':
        result = await handleCallStatusUpdate(request, supabase);
        break;
      case 'send_sms_fallback':
        result = await sendSmsFallback(request, supabase);
        break;
      case 'get_notification_status':
        result = await getNotificationStatus(request.notificationId!, supabase);
        break;
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    console.log('Driver IVR Notification Response:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Driver IVR Notification Error:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function logIVRCall(
  supabase: any,
  data: {
    tenantId: string;
    driverPhone: string;
    driverName?: string;
    jobId?: string;
    callType: string;
    callStatus: string;
    driverResponse?: string;
    fonuCallId?: string;
    attemptNumber?: number;
    callDurationSeconds?: number;
    jobDetails?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }
): Promise<string | null> {
  try {
    const { data: inserted, error } = await supabase
      .from('driver_ivr_calls')
      .insert({
        tenant_id: data.tenantId || 'default',
        driver_phone: data.driverPhone,
        driver_name: data.driverName,
        job_id: data.jobId,
        call_type: data.callType,
        call_status: data.callStatus,
        driver_response: data.driverResponse,
        fonu_call_id: data.fonuCallId,
        attempt_number: data.attemptNumber || 1,
        call_duration_seconds: data.callDurationSeconds,
        job_details: data.jobDetails || {},
        metadata: data.metadata || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log IVR call:', error);
      return null;
    }
    return inserted?.id;
  } catch (err) {
    console.error('Error logging IVR call:', err);
    return null;
  }
}

async function updateIVRCall(
  supabase: any,
  fonuCallId: string,
  updates: {
    callStatus?: string;
    driverResponse?: string;
    callDurationSeconds?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const updateData: Record<string, unknown> = {};
    if (updates.callStatus) updateData.call_status = updates.callStatus;
    if (updates.driverResponse) {
      updateData.driver_response = updates.driverResponse;
      updateData.response_received_at = new Date().toISOString();
    }
    if (updates.callDurationSeconds) updateData.call_duration_seconds = updates.callDurationSeconds;
    if (updates.metadata) updateData.metadata = updates.metadata;

    const { error } = await supabase
      .from('driver_ivr_calls')
      .update(updateData)
      .eq('fonu_call_id', fonuCallId);

    if (error) {
      console.error('Failed to update IVR call:', error);
    }
  } catch (err) {
    console.error('Error updating IVR call:', err);
  }
}

async function sendSms(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; smsId?: string; error?: string }> {
  try {
    const response = await fetch(`${FONU_BASE_URL}/sms`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        from: Deno.env.get('FONU_SENDER_ID') || 'FleetPro',
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fonu SMS API Error:', errorText);
      return { success: false, error: `SMS failed: ${response.status}` };
    }

    const smsData = await response.json();
    console.log('SMS sent successfully:', smsData);
    return { success: true, smsId: smsData.message_id || smsData.id };
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendSmsFallback(request: JobNotificationRequest, supabase: any): Promise<NotificationResult> {
  const { driverPhone, driverName, jobId, jobDetails, language = 'en', tenantId } = request;
  
  const formattedNumber = formatNigerianNumber(driverPhone);
  const message = generateSmsMessage(driverName, jobDetails, jobId, language);
  
  const smsResult = await sendSms(formattedNumber, message);
  
  // Log SMS fallback
  await logIVRCall(supabase, {
    tenantId: tenantId || 'default',
    driverPhone: formattedNumber,
    driverName,
    jobId,
    callType: 'sms_fallback',
    callStatus: smsResult.success ? 'sent' : 'failed',
    fonuCallId: smsResult.smsId,
    jobDetails: jobDetails as Record<string, unknown>,
    metadata: { sms_fallback: true, original_call_unanswered: true },
  });

  return {
    success: smsResult.success,
    smsId: smsResult.smsId,
    status: smsResult.success ? 'sms_sent' : 'sms_failed',
    smsSent: smsResult.success,
    error: smsResult.error,
  };
}

async function handleCallStatusUpdate(request: JobNotificationRequest, supabase: any): Promise<NotificationResult> {
  const { callId, callStatus, callDuration, driverPhone, driverName, jobId, jobDetails, language, tenantId, enableSmsFallback } = request;
  
  if (!callId || !callStatus) {
    throw new Error('Call ID and status are required');
  }

  // Update the call record
  await updateIVRCall(supabase, callId, {
    callStatus,
    callDurationSeconds: callDuration,
    driverResponse: callStatus === 'no_answer' ? 'no_answer' : undefined,
  });

  // If call was unanswered and SMS fallback is enabled, send SMS
  if ((callStatus === 'no_answer' || callStatus === 'busy' || callStatus === 'failed') && enableSmsFallback !== false) {
    console.log(`Call ${callId} was ${callStatus}, sending SMS fallback...`);
    
    const formattedNumber = formatNigerianNumber(driverPhone);
    const message = generateSmsMessage(driverName, jobDetails, jobId, language || 'en');
    
    const smsResult = await sendSms(formattedNumber, message);
    
    // Log the SMS fallback
    await logIVRCall(supabase, {
      tenantId: tenantId || 'default',
      driverPhone: formattedNumber,
      driverName,
      jobId,
      callType: 'sms_fallback',
      callStatus: smsResult.success ? 'sent' : 'failed',
      fonuCallId: smsResult.smsId,
      jobDetails: jobDetails as Record<string, unknown>,
      metadata: { 
        sms_fallback: true, 
        original_call_id: callId,
        original_call_status: callStatus,
      },
    });

    return {
      success: true,
      callId,
      status: callStatus,
      driverResponse: 'no_answer',
      smsSent: smsResult.success,
      smsId: smsResult.smsId,
    };
  }

  return {
    success: true,
    callId,
    status: callStatus,
  };
}

async function notifyNewJob(request: JobNotificationRequest, supabase: any): Promise<NotificationResult> {
  const { driverPhone, driverName, jobId, jobDetails, language = 'en', tenantId, enableSmsFallback = true } = request;
  
  if (!driverPhone || !jobDetails) {
    throw new Error('Driver phone and job details are required');
  }

  const formattedNumber = formatNigerianNumber(driverPhone);
  const message = generateJobNotificationMessage(driverName, jobDetails, language);
  
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const callbackParams = new URLSearchParams({
      notificationId,
      jobId: jobId || '',
      driverPhone: formattedNumber,
      driverName: driverName || '',
      tenantId: tenantId || 'default',
      enableSmsFallback: String(enableSmsFallback),
    });

    const response = await fetch(`${FONU_BASE_URL}/calls`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedNumber,
        from: Deno.env.get('FONU_CALLER_ID') || '+234800000000',
        answer_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/driver-ivr-notification?webhook=true&${callbackParams.toString()}`,
        language: language,
        tts_message: message,
        record: true,
        record_format: 'mp3',
        machine_detection: 'Enable',
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/fonu-webhook`,
        status_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/driver-ivr-notification?action=handle_call_status&${callbackParams.toString()}`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fonu API Error:', errorText);
      
      // Log failed call and try SMS fallback
      await logIVRCall(supabase, {
        tenantId: tenantId || 'default',
        driverPhone: formattedNumber,
        driverName,
        jobId,
        callType: 'new_job',
        callStatus: 'failed',
        jobDetails: jobDetails as Record<string, unknown>,
      });

      // Send SMS fallback on call failure
      if (enableSmsFallback) {
        console.log('IVR call failed, sending SMS fallback...');
        const smsMessage = generateSmsMessage(driverName, jobDetails, jobId, language);
        const smsResult = await sendSms(formattedNumber, smsMessage);
        
        await logIVRCall(supabase, {
          tenantId: tenantId || 'default',
          driverPhone: formattedNumber,
          driverName,
          jobId,
          callType: 'sms_fallback',
          callStatus: smsResult.success ? 'sent' : 'failed',
          fonuCallId: smsResult.smsId,
          jobDetails: jobDetails as Record<string, unknown>,
          metadata: { sms_fallback: true, call_failed: true },
        });

        return {
          success: smsResult.success,
          notificationId,
          status: 'call_failed_sms_sent',
          smsSent: smsResult.success,
          smsId: smsResult.smsId,
        };
      }
      
      throw new Error(`Failed to initiate call: ${response.status}`);
    }

    const callData = await response.json();
    
    // Log successful call initiation
    await logIVRCall(supabase, {
      tenantId: tenantId || 'default',
      driverPhone: formattedNumber,
      driverName,
      jobId,
      callType: 'new_job',
      callStatus: 'initiated',
      fonuCallId: callData.call_id,
      jobDetails: jobDetails as Record<string, unknown>,
      metadata: { sms_fallback_enabled: enableSmsFallback },
    });
    
    console.log('Job notification call initiated:', { notificationId, callId: callData.call_id, jobId });

    return {
      success: true,
      notificationId,
      callId: callData.call_id,
      status: 'initiated',
      driverResponse: 'pending',
    };
  } catch (error) {
    console.error('Failed to notify driver:', error);
    throw error;
  }
}

async function notifyJobUpdate(request: JobNotificationRequest, supabase: any): Promise<NotificationResult> {
  const { driverPhone, driverName, jobDetails, language = 'en', tenantId, jobId, enableSmsFallback = true } = request;
  
  const formattedNumber = formatNigerianNumber(driverPhone);
  const message = generateUpdateMessage(driverName, jobDetails!, language);
  const notificationId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const response = await fetch(`${FONU_BASE_URL}/calls`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: formattedNumber,
      from: Deno.env.get('FONU_CALLER_ID') || '+234800000000',
      tts_message: message,
      language: language,
    }),
  });

  if (!response.ok) {
    await logIVRCall(supabase, {
      tenantId: tenantId || 'default',
      driverPhone: formattedNumber,
      driverName,
      jobId,
      callType: 'update',
      callStatus: 'failed',
      jobDetails: jobDetails as Record<string, unknown>,
    });

    // SMS fallback for failed update calls
    if (enableSmsFallback) {
      const smsMessage = generateUpdateSmsMessage(driverName, jobDetails, language);
      const smsResult = await sendSms(formattedNumber, smsMessage);
      
      return {
        success: smsResult.success,
        notificationId,
        status: 'call_failed_sms_sent',
        smsSent: smsResult.success,
        smsId: smsResult.smsId,
      };
    }

    throw new Error(`Failed to notify: ${response.status}`);
  }

  const callData = await response.json();

  await logIVRCall(supabase, {
    tenantId: tenantId || 'default',
    driverPhone: formattedNumber,
    driverName,
    jobId,
    callType: 'update',
    callStatus: 'initiated',
    fonuCallId: callData.call_id,
    jobDetails: jobDetails as Record<string, unknown>,
  });

  return {
    success: true,
    notificationId,
    callId: callData.call_id,
    status: 'sent',
  };
}

async function notifyUrgent(request: JobNotificationRequest, supabase: any): Promise<NotificationResult> {
  const { driverPhone, driverName, jobDetails, language = 'en', tenantId, jobId, enableSmsFallback = true } = request;
  
  const formattedNumber = formatNigerianNumber(driverPhone);
  const message = generateUrgentMessage(driverName, jobDetails!, language);
  const notificationId = `urgent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const callbackParams = new URLSearchParams({
        notificationId,
        urgent: 'true',
        jobId: jobId || '',
        driverPhone: formattedNumber,
        tenantId: tenantId || 'default',
        enableSmsFallback: String(enableSmsFallback),
      });

      const response = await fetch(`${FONU_BASE_URL}/calls`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formattedNumber,
          from: Deno.env.get('FONU_CALLER_ID') || '+234800000000',
          answer_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/driver-ivr-notification?webhook=true&${callbackParams.toString()}`,
          tts_message: message,
          language: language,
          record: true,
          ringing_timeout: 45,
          status_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/driver-ivr-notification?action=handle_call_status&${callbackParams.toString()}`,
        }),
      });

      if (response.ok) {
        const callData = await response.json();
        
        await logIVRCall(supabase, {
          tenantId: tenantId || 'default',
          driverPhone: formattedNumber,
          driverName,
          jobId,
          callType: 'urgent',
          callStatus: 'initiated',
          fonuCallId: callData.call_id,
          attemptNumber: attempt,
          jobDetails: jobDetails as Record<string, unknown>,
          metadata: { sms_fallback_enabled: enableSmsFallback },
        });
        
        return {
          success: true,
          notificationId,
          callId: callData.call_id,
          status: 'urgent_sent',
          driverResponse: 'pending',
        };
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.log(`Urgent notification attempt ${attempt} failed, retrying...`);
      
      await logIVRCall(supabase, {
        tenantId: tenantId || 'default',
        driverPhone: formattedNumber,
        driverName,
        jobId,
        callType: 'urgent',
        callStatus: attempt < maxAttempts ? 'retrying' : 'failed',
        attemptNumber: attempt,
        jobDetails: jobDetails as Record<string, unknown>,
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // All call attempts failed, send SMS fallback
  if (enableSmsFallback) {
    console.log('All urgent call attempts failed, sending SMS fallback...');
    const smsMessage = generateUrgentSmsMessage(driverName, jobDetails, jobId, language);
    const smsResult = await sendSms(formattedNumber, smsMessage);
    
    await logIVRCall(supabase, {
      tenantId: tenantId || 'default',
      driverPhone: formattedNumber,
      driverName,
      jobId,
      callType: 'sms_fallback',
      callStatus: smsResult.success ? 'sent' : 'failed',
      fonuCallId: smsResult.smsId,
      jobDetails: jobDetails as Record<string, unknown>,
      metadata: { sms_fallback: true, urgent: true, all_calls_failed: true },
    });

    return {
      success: smsResult.success,
      notificationId,
      status: 'calls_failed_sms_sent',
      smsSent: smsResult.success,
      smsId: smsResult.smsId,
    };
  }

  throw lastError || new Error('Failed to send urgent notification');
}

async function handleDriverResponse(request: JobNotificationRequest, supabase: any): Promise<NotificationResult> {
  const { notificationId, dtmfInput, jobId, callId, callStatus, callDuration } = request;
  
  if (!notificationId || !dtmfInput) {
    throw new Error('Notification ID and DTMF input required');
  }

  let driverResponse: 'accepted' | 'rejected' | 'pending' = 'pending';
  
  switch (dtmfInput) {
    case '1':
      driverResponse = 'accepted';
      break;
    case '2':
      driverResponse = 'rejected';
      break;
    default:
      driverResponse = 'pending';
  }

  if (callId) {
    await updateIVRCall(supabase, callId, {
      callStatus: callStatus || 'answered',
      driverResponse,
      callDurationSeconds: callDuration,
    });
  }

  console.log(`Driver response for ${notificationId}: ${driverResponse} (DTMF: ${dtmfInput})`);

  return {
    success: true,
    notificationId,
    driverResponse,
    status: `response_${driverResponse}`,
  };
}

async function getNotificationStatus(notificationId: string, supabase: any): Promise<NotificationResult> {
  try {
    const { data, error } = await supabase
      .from('driver_ivr_calls')
      .select('*')
      .or(`fonu_call_id.eq.${notificationId},job_id.eq.${notificationId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        success: true,
        notificationId,
        status: 'not_found',
        driverResponse: 'pending',
      };
    }

    return {
      success: true,
      notificationId,
      status: data.call_status,
      driverResponse: data.driver_response || 'pending',
      smsSent: data.metadata?.sms_fallback || false,
    };
  } catch (err) {
    console.error('Error getting notification status:', err);
    return {
      success: true,
      notificationId,
      status: 'error',
      driverResponse: 'pending',
    };
  }
}

// SMS Message Generators
function generateSmsMessage(
  driverName: string | undefined,
  jobDetails: JobNotificationRequest['jobDetails'],
  jobId: string | undefined,
  language: string
): string {
  const messages: Record<string, string> = {
    'en': `FleetPro Job ${jobId || ''}: ${driverName || 'Driver'}, new job from ${jobDetails?.pickup} to ${jobDetails?.dropoff}. Cargo: ${jobDetails?.cargo}. Pay: ₦${jobDetails?.amount}. Reply YES to accept or NO to reject.`,
    'ha': `Aikin FleetPro ${jobId || ''}: ${driverName || 'Direban'}, sabon aiki daga ${jobDetails?.pickup} zuwa ${jobDetails?.dropoff}. Kaya: ${jobDetails?.cargo}. Biya: ₦${jobDetails?.amount}. Amsa EH don karba ko A'A don ki.`,
    'yo': `Iṣẹ FleetPro ${jobId || ''}: ${driverName || 'Awakọ'}, iṣẹ tuntun lati ${jobDetails?.pickup} si ${jobDetails?.dropoff}. Ẹru: ${jobDetails?.cargo}. Owo: ₦${jobDetails?.amount}. Dahun BẸẸNI lati gba tabi RARA lati kọ.`,
    'ig': `Ọrụ FleetPro ${jobId || ''}: ${driverName || 'Onye ọkwọ'}, ọrụ ọhụrụ site na ${jobDetails?.pickup} gaa ${jobDetails?.dropoff}. Ngwongwo: ${jobDetails?.cargo}. Ụgwọ: ₦${jobDetails?.amount}. Zaa EE ịnakwere ma ọ bụ MBA ịjụ.`,
    'pcm': `FleetPro Job ${jobId || ''}: ${driverName || 'Driver'}, new work from ${jobDetails?.pickup} go ${jobDetails?.dropoff}. Cargo: ${jobDetails?.cargo}. Money: ₦${jobDetails?.amount}. Reply YES to collect or NO to reject.`,
  };
  return messages[language] || messages['en'];
}

function generateUpdateSmsMessage(
  driverName: string | undefined,
  jobDetails: JobNotificationRequest['jobDetails'],
  language: string
): string {
  const messages: Record<string, string> = {
    'en': `FleetPro Update: ${driverName || 'Driver'}, your job to ${jobDetails?.dropoff} has been updated. Check WhatsApp for details.`,
    'ha': `Sabuntawa FleetPro: ${driverName || 'Direban'}, an sabunta aikin ku zuwa ${jobDetails?.dropoff}. Duba WhatsApp don bayanai.`,
    'yo': `Imudojuiwọn FleetPro: ${driverName || 'Awakọ'}, a ti ṣe imudojuiwọn iṣẹ rẹ si ${jobDetails?.dropoff}. Wo WhatsApp fun alaye.`,
    'ig': `Mmelite FleetPro: ${driverName || 'Onye ọkwọ'}, emelitela ọrụ gị na ${jobDetails?.dropoff}. Lee WhatsApp maka nkọwa.`,
    'pcm': `FleetPro Update: ${driverName || 'Driver'}, dem don update your job to ${jobDetails?.dropoff}. Check WhatsApp for gist.`,
  };
  return messages[language] || messages['en'];
}

function generateUrgentSmsMessage(
  driverName: string | undefined,
  jobDetails: JobNotificationRequest['jobDetails'],
  jobId: string | undefined,
  language: string
): string {
  const messages: Record<string, string> = {
    'en': `🚨 URGENT FleetPro ${jobId || ''}: ${driverName || 'Driver'}, HIGH PRIORITY job from ${jobDetails?.pickup} to ${jobDetails?.dropoff}. Pay: ₦${jobDetails?.amount}. Reply YES NOW to accept!`,
    'ha': `🚨 GAGGAWA FleetPro ${jobId || ''}: ${driverName || 'Direban'}, aiki MAI FIFIKO daga ${jobDetails?.pickup} zuwa ${jobDetails?.dropoff}. Biya: ₦${jobDetails?.amount}. Amsa EH YANZU don karba!`,
    'yo': `🚨 ÌKÍKANJÚ FleetPro ${jobId || ''}: ${driverName || 'Awakọ'}, iṣẹ PATAKI lati ${jobDetails?.pickup} si ${jobDetails?.dropoff}. Owo: ₦${jobDetails?.amount}. Dahun BẸẸNI BAYI lati gba!`,
    'ig': `🚨 NGWA NGWA FleetPro ${jobId || ''}: ${driverName || 'Onye ọkwọ'}, ọrụ DỊ ELU site na ${jobDetails?.pickup} gaa ${jobDetails?.dropoff}. Ụgwọ: ₦${jobDetails?.amount}. Zaa EE UGBU A ịnakwere!`,
    'pcm': `🚨 URGENT FleetPro ${jobId || ''}: ${driverName || 'Driver'}, HIGH PRIORITY job from ${jobDetails?.pickup} go ${jobDetails?.dropoff}. Money: ₦${jobDetails?.amount}. Reply YES NOW to collect!`,
  };
  return messages[language] || messages['en'];
}

// IVR Message Generators
function generateJobNotificationMessage(
  driverName: string | undefined,
  jobDetails: JobNotificationRequest['jobDetails'],
  language: string
): string {
  const messages: Record<string, string> = {
    'en': `Hello ${driverName || 'Driver'}. You have a new job offer from FleetPro. 
      Pickup from ${jobDetails?.pickup}. 
      Delivery to ${jobDetails?.dropoff}. 
      Cargo type: ${jobDetails?.cargo}. 
      Payment: ${jobDetails?.amount} Naira.
      ${jobDetails?.deadline ? `Deadline: ${jobDetails.deadline}.` : ''}
      Press 1 to accept this job. Press 2 to reject. Press 3 to hear again.`,
    
    'ha': `Sannu ${driverName || 'Direban'}. Kuna da sabon tayin aiki daga FleetPro.
      Dauka daga ${jobDetails?.pickup}.
      Kai zuwa ${jobDetails?.dropoff}.
      Nau'in kaya: ${jobDetails?.cargo}.
      Biya: Naira ${jobDetails?.amount}.
      Danna 1 don karɓar wannan aikin. Danna 2 don ƙi. Danna 3 don sake ji.`,
    
    'yo': `Pẹlẹ o ${driverName || 'Awakọ'}. O ni ipese iṣẹ tuntun lati FleetPro.
      Gbe lati ${jobDetails?.pickup}.
      Fi si ${jobDetails?.dropoff}.
      Iru ẹru: ${jobDetails?.cargo}.
      Owo: Naira ${jobDetails?.amount}.
      Tẹ 1 lati gba iṣẹ yii. Tẹ 2 lati kọ. Tẹ 3 lati gbọ lẹẹkansi.`,
    
    'ig': `Ndewo ${driverName || 'Onye ọkwọ'}. Ị nwere ọrụ ọhụrụ sitere na FleetPro.
      Nweta site na ${jobDetails?.pickup}.
      Bugara ${jobDetails?.dropoff}.
      Ụdị ngwongwo: ${jobDetails?.cargo}.
      Ụgwọ: Naira ${jobDetails?.amount}.
      Pịa 1 ịnakwere ọrụ a. Pịa 2 ịjụ. Pịa 3 ịnụ ọzọ.`,
    
    'pcm': `How far ${driverName || 'Driver'}. You get new job offer from FleetPro.
      Pick up for ${jobDetails?.pickup}.
      Drop for ${jobDetails?.dropoff}.
      Kain cargo: ${jobDetails?.cargo}.
      Money: ${jobDetails?.amount} Naira.
      Press 1 to collect this job. Press 2 to no gree. Press 3 to hear am again.`,
  };
  
  return messages[language] || messages['en'];
}

function generateUpdateMessage(
  driverName: string | undefined,
  jobDetails: JobNotificationRequest['jobDetails'],
  language: string
): string {
  const messages: Record<string, string> = {
    'en': `Hello ${driverName || 'Driver'}. This is an update for your current job.
      Your delivery to ${jobDetails?.dropoff} has been updated.
      Please check your WhatsApp for full details. Safe journey!`,
    'ha': `Sannu ${driverName || 'Direban'}. Wannan shine sabuntawar aikin ku na yanzu.
      An sabunta isarwar ku zuwa ${jobDetails?.dropoff}.
      Da fatan za a duba WhatsApp ɗin ku don cikakkun bayanai. Allah ya kiyaye!`,
    'yo': `Pẹlẹ o ${driverName || 'Awakọ'}. Eyi ni imudojuiwọn fun iṣẹ rẹ lọwọlọwọ.
      Ti ṣe imudojuiwọn ifijiṣẹ rẹ si ${jobDetails?.dropoff}.
      Jọwọ ṣayẹwo WhatsApp rẹ fun awọn alaye ni kikun. Irin ajo ailewu!`,
    'ig': `Ndewo ${driverName || 'Onye ọkwọ'}. Nke a bụ mmelite maka ọrụ gị ugbu a.
      Emelitela nnyefe gị na ${jobDetails?.dropoff}.
      Biko lelee WhatsApp gị maka nkọwa zuru ezu. Njem udo!`,
    'pcm': `How far ${driverName || 'Driver'}. Na update for your current job be this.
      Dem don update your delivery to ${jobDetails?.dropoff}.
      Abeg check your WhatsApp for full gist. Safe journey!`,
  };
  
  return messages[language] || messages['en'];
}

function generateUrgentMessage(
  driverName: string | undefined,
  jobDetails: JobNotificationRequest['jobDetails'],
  language: string
): string {
  const messages: Record<string, string> = {
    'en': `URGENT! ${driverName || 'Driver'}, this is an urgent job notification from FleetPro.
      High priority pickup from ${jobDetails?.pickup} to ${jobDetails?.dropoff}.
      Payment: ${jobDetails?.amount} Naira.
      This job requires immediate response!
      Press 1 now to accept. Press 2 to decline.`,
    'ha': `GAGGAWA! ${driverName || 'Direban'}, wannan sanarwar aiki ne mai gaggawa daga FleetPro.
      Dauka mai fifiko daga ${jobDetails?.pickup} zuwa ${jobDetails?.dropoff}.
      Biya: Naira ${jobDetails?.amount}.
      Wannan aikin yana buƙatar amsa nan take!
      Danna 1 yanzu don karɓa. Danna 2 don ƙi.`,
    'yo': `ÌKÍKANJÚ! ${driverName || 'Awakọ'}, eyi ni iwifunni iṣẹ ìkíkanjú lati FleetPro.
      Gbigbe pataki lati ${jobDetails?.pickup} si ${jobDetails?.dropoff}.
      Owo: Naira ${jobDetails?.amount}.
      Iṣẹ yii nilo idahun lẹsẹkẹsẹ!
      Tẹ 1 ni bayi lati gba. Tẹ 2 lati kọ.`,
    'ig': `NGWA NGWA! ${driverName || 'Onye ọkwọ'}, nke a bụ ọkwa ọrụ ngwa ngwa sitere na FleetPro.
      Nweta dị elu sitere na ${jobDetails?.pickup} gaa ${jobDetails?.dropoff}.
      Ụgwọ: Naira ${jobDetails?.amount}.
      Ọrụ a chọrọ nzaghachi ozugbo!
      Pịa 1 ugbu a ịnakwere. Pịa 2 ịjụ.`,
    'pcm': `URGENT! ${driverName || 'Driver'}, na urgent job notification from FleetPro be this.
      High priority pickup from ${jobDetails?.pickup} go ${jobDetails?.dropoff}.
      Money: ${jobDetails?.amount} Naira.
      This job need quick quick response!
      Press 1 now to collect. Press 2 to reject.`,
  };
  
  return messages[language] || messages['en'];
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