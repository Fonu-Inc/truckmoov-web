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

interface CallRequest {
  action: 'initiate_call' | 'get_call_status' | 'end_call' | 'play_ivr' | 'transfer_call' | 'start_recording' | 'stop_recording' | 'get_recording' | 'charge_call';
  phoneNumber?: string;
  callId?: string;
  ivrPromptId?: string;
  transferTo?: string;
  language?: string;
  message?: string;
  enableRecording?: boolean;
  tenantId?: string;
  durationMinutes?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!FONU_API_KEY || !FONU_API_SECRET) {
      throw new Error('Fonu API credentials not configured');
    }

    const request: CallRequest = await req.json();
    console.log('Fonu Voice Request:', request);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let result;

    switch (request.action) {
      case 'initiate_call':
        result = await initiateCall(request.phoneNumber!, request.tenantId, request.language, request.message, request.enableRecording, supabase);
        break;
      case 'get_call_status':
        result = await getCallStatus(request.callId!);
        break;
      case 'end_call':
        result = await endCall(request.callId!);
        break;
      case 'play_ivr':
        result = await playIVRPrompt(request.callId!, request.ivrPromptId!, request.language);
        break;
      case 'transfer_call':
        result = await transferCall(request.callId!, request.transferTo!);
        break;
      case 'start_recording':
        result = await startRecording(request.callId!);
        break;
      case 'stop_recording':
        result = await stopRecording(request.callId!);
        break;
      case 'get_recording':
        result = await getRecording(request.callId!);
        break;
      case 'charge_call':
        result = await chargeCallDuration(request.tenantId!, request.durationMinutes!, request.callId!, supabase);
        break;
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    console.log('Fonu Voice Response:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fonu Voice Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkWalletBalance(supabase: any, tenantId: string) {
  const { data, error } = await supabase.rpc('get_wallet_balance', {
    p_tenant_id: tenantId
  });

  if (error) {
    console.error('Wallet balance check error:', error);
    return { balance: 0, credit_enabled: false, credit_limit: 0 };
  }

  return data;
}

async function chargeCallDuration(tenantId: string, durationMinutes: number, callId: string, supabase: any) {
  // Pre-action credit limit check for postpaid tenants
  const creditCheck = await checkCreditLimit(supabase, tenantId);
  if (!creditCheck.allowed) {
    return { success: false, error: creditCheck.reason, credit_limit_exceeded: true };
  }

  const { data, error } = await supabase.rpc('deduct_wallet_balance', {
    p_tenant_id: tenantId,
    p_communication_type: 'call',
    p_quantity: durationMinutes,
    p_reference_id: callId,
    p_description: `Voice call - ${durationMinutes} minute(s)`
  });

  if (error) {
    console.error('Call charge error:', error);
    return { success: false, error: error.message };
  }

  // Check if balance is below threshold and trigger alert
  if (data?.success && data?.balance_after !== undefined) {
    await checkAndTriggerLowBalanceAlert(supabase, tenantId, data.balance_after);
  }

  // Record usage for postpaid tenants
  await recordUsageIfPostpaid(supabase, tenantId, 'call', durationMinutes, {
    call_id: callId,
  });

  return data;
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

async function initiateCall(phoneNumber: string, tenantId: string | undefined, language?: string, message?: string, enableRecording?: boolean, supabase?: any) {
  const formattedNumber = formatNigerianNumber(phoneNumber);
  const tenant = tenantId || 'default';
  
  console.log('Initiating call to:', formattedNumber);
  console.log('Using Fonu base URL:', FONU_BASE_URL);

  // Check wallet balance before initiating call (at least 1 minute worth)
  if (supabase) {
    const walletInfo = await checkWalletBalance(supabase, tenant);
    
    // Get call rate
    const { data: rateData } = await supabase
      .from('communication_rates')
      .select('rate_ngn')
      .eq('communication_type', 'call')
      .eq('is_active', true)
      .single();
    
    const callRate = rateData?.rate_ngn || 22;
    
    if (walletInfo.balance < callRate && !walletInfo.credit_enabled) {
      return {
        success: false,
        error: 'Insufficient wallet balance to initiate call',
        wallet_error: true,
        balance: walletInfo.balance,
        required: callRate
      };
    }
  }
  
  try {
    const response = await fetch(`${FONU_BASE_URL}/calls`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedNumber,
        from: Deno.env.get('FONU_CALLER_ID') || '+234800000000',
        answer_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/fonu-webhook`,
        language: language || 'en',
        tts_message: message,
        record: enableRecording ?? true,
        record_format: 'mp3',
        metadata: { tenant_id: tenant }
      }),
    });

    const responseText = await response.text();
    console.log('Fonu API Response Status:', response.status);
    console.log('Fonu API Response:', responseText);

    if (!response.ok) {
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        console.error('Fonu API Gateway Error - service may be unavailable');
        return {
          success: false,
          error: 'Voice service temporarily unavailable. Please try again later or use SMS/WhatsApp instead.',
          status: response.status,
          simulated: true,
          call_id: `sim_${Date.now()}`,
          message: 'Call simulated - Fonu API currently unavailable'
        };
      }
      throw new Error(`Failed to initiate call: ${response.status} - ${responseText}`);
    }

    try {
      const result = JSON.parse(responseText);
      return { ...result, tenant_id: tenant };
    } catch {
      return { success: true, raw: responseText, tenant_id: tenant };
    }
  } catch (error) {
    console.error('Call initiation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      simulated: true,
      call_id: `sim_${Date.now()}`,
      message: 'Call could not be initiated - API unavailable'
    };
  }
}

async function startRecording(callId: string) {
  const response = await fetch(`${FONU_BASE_URL}/calls/${callId}/recording`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      format: 'mp3',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start recording: ${response.status}`);
  }

  return await response.json();
}

async function stopRecording(callId: string) {
  const response = await fetch(`${FONU_BASE_URL}/calls/${callId}/recording`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to stop recording: ${response.status}`);
  }

  return await response.json();
}

async function getRecording(callId: string) {
  const response = await fetch(`${FONU_BASE_URL}/calls/${callId}/recording`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get recording: ${response.status}`);
  }

  return await response.json();
}

async function getCallStatus(callId: string) {
  const response = await fetch(`${FONU_BASE_URL}/calls/${callId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get call status: ${response.status}`);
  }

  return await response.json();
}

async function endCall(callId: string) {
  const response = await fetch(`${FONU_BASE_URL}/calls/${callId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to end call: ${response.status}`);
  }

  return { success: true, callId };
}

async function playIVRPrompt(callId: string, promptId: string, language?: string) {
  const ivrPrompts = getIVRPrompts(language || 'en');
  const prompt = ivrPrompts[promptId];

  if (!prompt) {
    throw new Error(`Unknown IVR prompt: ${promptId}`);
  }

  const response = await fetch(`${FONU_BASE_URL}/calls/${callId}/speak`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: prompt,
      language: language || 'en',
      voice: getVoiceForLanguage(language || 'en'),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to play IVR prompt: ${response.status}`);
  }

  return await response.json();
}

async function transferCall(callId: string, transferTo: string) {
  const formattedNumber = formatNigerianNumber(transferTo);

  const response = await fetch(`${FONU_BASE_URL}/calls/${callId}/transfer`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      destination: formattedNumber,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to transfer call: ${response.status}`);
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

function getVoiceForLanguage(language: string): string {
  const voices: Record<string, string> = {
    'en': 'en-NG-Female',
    'ha': 'ha-NG-Female',
    'yo': 'yo-NG-Female',
    'ig': 'ig-NG-Female',
    'pcm': 'en-NG-Female',
  };
  return voices[language] || 'en-NG-Female';
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
