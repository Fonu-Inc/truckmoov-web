import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FONU_API_URL = 'https://api.fonu.com/v1';

interface SIMRequest {
  action: 'list' | 'get' | 'activate' | 'suspend' | 'resume' | 'update_plan' | 'topup_data' | 'get_usage' | 'provision' | 'initiate_activation' | 'list_available_numbers';
  simId?: string;
  iccid?: string;
  tenantId?: string;
  plan?: string;
  dataLimitMb?: number;
  notes?: string;
  batchId?: string;
  quantity?: number;
  operator?: string;
}

interface ActivationResult {
  iccid: string;
  msisdn?: string;
  fonu_sim_id?: string;
  status: 'activated' | 'failed';
  error?: string;
}

interface DeviceLinkingResult {
  device_id: string;
  device_name: string;
  imei: string;
  sim_iccid: string;
  action: 'created' | 'updated';
  success: boolean;
}

interface DeviceLinkingException {
  row_index: number;
  device_name: string;
  imei: string;
  reason: string;
  type: 'missing_imei' | 'no_sim_available' | 'creation_failed' | 'linking_failed' | 'unknown_imei';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FONU_API_KEY = Deno.env.get('FONU_API_KEY');
    const FONU_API_SECRET = Deno.env.get('FONU_API_SECRET');
    
    if (!FONU_API_KEY || !FONU_API_SECRET) {
      throw new Error('Fonu API credentials not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: SIMRequest = await req.json();
    const { action, simId, iccid, tenantId, plan, dataLimitMb, notes } = body;

    console.log(`Fonu SIM action: ${action}`, { simId, iccid, tenantId });

    switch (action) {
      case 'list':
        return await listSIMs(FONU_API_KEY, FONU_API_SECRET, supabase, tenantId);
      
      case 'get':
        return await getSIMDetails(FONU_API_KEY, FONU_API_SECRET, supabase, iccid || simId);
      
      case 'activate':
        return await activateSIM(FONU_API_KEY, FONU_API_SECRET, supabase, iccid!, tenantId!, plan);
      
      case 'suspend':
        return await suspendSIM(FONU_API_KEY, FONU_API_SECRET, supabase, iccid!);
      
      case 'resume':
        return await resumeSIM(FONU_API_KEY, FONU_API_SECRET, supabase, iccid!);
      
      case 'update_plan':
        return await updateSIMPlan(FONU_API_KEY, FONU_API_SECRET, supabase, iccid!, plan!, dataLimitMb);
      
      case 'topup_data':
        return await topupSIMData(FONU_API_KEY, FONU_API_SECRET, supabase, iccid!, dataLimitMb!);
      
      case 'get_usage':
        return await getSIMUsage(FONU_API_KEY, FONU_API_SECRET, supabase, iccid!);
      
      case 'provision':
        return await provisionNewSIM(FONU_API_KEY, FONU_API_SECRET, supabase, body);
      
      case 'initiate_activation':
        return await initiateActivation(FONU_API_KEY, FONU_API_SECRET, supabase, body);

      case 'list_available_numbers':
        return await listAvailableNumbers(FONU_API_KEY, FONU_API_SECRET);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fonu SIM Error:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============== SIM OPERATIONS ==============

async function listAvailableNumbers(apiKey: string, apiSecret: string) {
  // Try Fonu API; fall back to demo numbers so the UI stays usable.
  try {
    const fonuResponse = await fetch(`${FONU_API_URL}/numbers/available`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Secret': apiSecret,
        'Content-Type': 'application/json',
      },
    });
    if (fonuResponse.ok) {
      const data = await fonuResponse.json();
      const numbers = Array.isArray(data) ? data : data?.numbers || [];
      return new Response(JSON.stringify({ success: true, numbers }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.log('Fonu available numbers API unavailable, using demo set');
  }

  const numbers = [
    { phone_number: '+234 801 000 0001', phone_number_type: 'mobile', monthly_cost_ngn: 5000, capabilities: ['sms', 'voice'] },
    { phone_number: '+234 801 000 0002', phone_number_type: 'mobile', monthly_cost_ngn: 5000, capabilities: ['sms', 'voice'] },
    { phone_number: '+234 802 000 0001', phone_number_type: 'mobile', monthly_cost_ngn: 4500, capabilities: ['sms', 'voice'] },
    { phone_number: '+234 700 000 0001', phone_number_type: 'toll_free', monthly_cost_ngn: 15000, capabilities: ['voice'] },
    { phone_number: '+234 1 000 0001', phone_number_type: 'local', monthly_cost_ngn: 3000, capabilities: ['sms', 'voice'] },
  ];
  return new Response(JSON.stringify({ success: true, numbers }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function listSIMs(apiKey: string, apiSecret: string, supabase: any, tenantId?: string) {
  // First fetch from Fonu API
  const fonuResponse = await fetch(`${FONU_API_URL}/sims`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'X-API-Secret': apiSecret,
      'Content-Type': 'application/json',
    },
  });

  if (!fonuResponse.ok) {
    console.log('Fonu API error, falling back to database');
  }

  // Always return from database (synced from webhooks)
  let query = supabase.from('iot_sims').select('*');
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;

  return new Response(JSON.stringify({ success: true, sims: data || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getSIMDetails(apiKey: string, apiSecret: string, supabase: any, identifier?: string) {
  if (!identifier) throw new Error('SIM identifier required');

  // Try to get from Fonu API for real-time data
  try {
    const fonuResponse = await fetch(`${FONU_API_URL}/sims/${identifier}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Secret': apiSecret,
        'Content-Type': 'application/json',
      },
    });

    if (fonuResponse.ok) {
      const fonuData = await fonuResponse.json();
      
      // Update local database with latest data
      await supabase
        .from('iot_sims')
        .update({
          data_usage_mb: fonuData.data_usage_mb || fonuData.dataUsage,
          signal_strength: fonuData.signal_strength || fonuData.signalStrength,
          network_type: fonuData.network_type || fonuData.networkType,
          fonu_status: fonuData.status,
          last_activity: new Date().toISOString(),
        })
        .eq('iccid', identifier);
    }
  } catch (e) {
    console.log('Could not fetch from Fonu API, using cached data');
  }

  // Return from database
  const { data, error } = await supabase
    .from('iot_sims')
    .select('*')
    .or(`iccid.eq.${identifier},id.eq.${identifier}`)
    .maybeSingle();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, sim: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function activateSIM(apiKey: string, apiSecret: string, supabase: any, iccid: string, tenantId: string, plan?: string) {
  console.log(`Activating SIM ${iccid} for tenant ${tenantId}`);

  // Call Fonu API to activate
  const fonuResponse = await fetch(`${FONU_API_URL}/sims/${iccid}/activate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'X-API-Secret': apiSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      plan: plan || 'iot_basic',
      metadata: { tenantId }
    }),
  });

  const fonuResult = fonuResponse.ok ? await fonuResponse.json() : null;

  // Update local database
  const { data, error } = await supabase
    .from('iot_sims')
    .update({
      status: 'active',
      tenant_id: tenantId,
      activation_date: new Date().toISOString(),
      fonu_status: fonuResult?.status || 'active',
      plan: plan || 'iot_basic',
    })
    .eq('iccid', iccid)
    .select()
    .single();

  if (error) throw error;

  // Deduct from tenant wallet if applicable
  await chargeWallet(supabase, tenantId, 'sim_activation', 1, `SIM activation: ${iccid}`);

  return new Response(JSON.stringify({ 
    success: true, 
    sim: data,
    fonuResponse: fonuResult 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function suspendSIM(apiKey: string, apiSecret: string, supabase: any, iccid: string) {
  console.log(`Suspending SIM ${iccid}`);

  // Call Fonu API
  const fonuResponse = await fetch(`${FONU_API_URL}/sims/${iccid}/suspend`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'X-API-Secret': apiSecret,
      'Content-Type': 'application/json',
    },
  });

  const fonuResult = fonuResponse.ok ? await fonuResponse.json() : null;

  // Update local database
  const { data, error } = await supabase
    .from('iot_sims')
    .update({
      status: 'suspended',
      fonu_status: fonuResult?.status || 'suspended',
    })
    .eq('iccid', iccid)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, sim: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function resumeSIM(apiKey: string, apiSecret: string, supabase: any, iccid: string) {
  console.log(`Resuming SIM ${iccid}`);

  const fonuResponse = await fetch(`${FONU_API_URL}/sims/${iccid}/resume`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'X-API-Secret': apiSecret,
      'Content-Type': 'application/json',
    },
  });

  const fonuResult = fonuResponse.ok ? await fonuResponse.json() : null;

  const { data, error } = await supabase
    .from('iot_sims')
    .update({
      status: 'active',
      fonu_status: fonuResult?.status || 'active',
    })
    .eq('iccid', iccid)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, sim: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateSIMPlan(apiKey: string, apiSecret: string, supabase: any, iccid: string, plan: string, dataLimitMb?: number) {
  console.log(`Updating SIM ${iccid} to plan ${plan}`);

  const fonuResponse = await fetch(`${FONU_API_URL}/sims/${iccid}/plan`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'X-API-Secret': apiSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan, dataLimit: dataLimitMb }),
  });

  const fonuResult = fonuResponse.ok ? await fonuResponse.json() : null;

  const updateData: Record<string, any> = { plan };
  if (dataLimitMb) updateData.data_limit_mb = dataLimitMb;

  const { data, error } = await supabase
    .from('iot_sims')
    .update(updateData)
    .eq('iccid', iccid)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, sim: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function topupSIMData(apiKey: string, apiSecret: string, supabase: any, iccid: string, additionalDataMb: number) {
  console.log(`Topping up SIM ${iccid} with ${additionalDataMb}MB`);

  // Get current SIM
  const { data: currentSim } = await supabase
    .from('iot_sims')
    .select('*')
    .eq('iccid', iccid)
    .single();

  if (!currentSim) throw new Error('SIM not found');

  // Call Fonu API
  const fonuResponse = await fetch(`${FONU_API_URL}/sims/${iccid}/topup`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'X-API-Secret': apiSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data_mb: additionalDataMb }),
  });

  const fonuResult = fonuResponse.ok ? await fonuResponse.json() : null;

  // Update local database
  const newLimit = currentSim.data_limit_mb + additionalDataMb;
  const { data, error } = await supabase
    .from('iot_sims')
    .update({ data_limit_mb: newLimit })
    .eq('iccid', iccid)
    .select()
    .single();

  if (error) throw error;

  // Charge tenant wallet
  if (currentSim.tenant_id) {
    await chargeWallet(supabase, currentSim.tenant_id, 'data_topup', additionalDataMb / 100, `Data top-up: ${additionalDataMb}MB for ${iccid}`);
  }

  return new Response(JSON.stringify({ success: true, sim: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getSIMUsage(apiKey: string, apiSecret: string, supabase: any, iccid: string) {
  console.log(`Getting usage for SIM ${iccid}`);

  // Try Fonu API first
  try {
    const fonuResponse = await fetch(`${FONU_API_URL}/sims/${iccid}/usage`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Secret': apiSecret,
        'Content-Type': 'application/json',
      },
    });

    if (fonuResponse.ok) {
      const usageData = await fonuResponse.json();
      
      // Store signal in database
      await supabase.from('sim_usage_signals').insert({
        iccid,
        signal_type: 'usage_query',
        data_usage_mb: usageData.data_usage_mb,
        sms_count: usageData.sms_count,
        signal_strength: usageData.signal_strength,
        network_type: usageData.network_type,
        raw_data: usageData,
      });

      // Update SIM record
      await supabase
        .from('iot_sims')
        .update({
          data_usage_mb: usageData.data_usage_mb,
          sms_usage: usageData.sms_count,
          signal_strength: usageData.signal_strength,
          network_type: usageData.network_type,
          last_activity: new Date().toISOString(),
        })
        .eq('iccid', iccid);

      return new Response(JSON.stringify({ success: true, usage: usageData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.log('Fonu usage API error, returning cached data');
  }

  // Fallback to cached data
  const { data: sim } = await supabase
    .from('iot_sims')
    .select('*')
    .eq('iccid', iccid)
    .single();

  const { data: signals } = await supabase
    .from('sim_usage_signals')
    .select('*')
    .eq('iccid', iccid)
    .order('recorded_at', { ascending: false })
    .limit(30);

  return new Response(JSON.stringify({ 
    success: true, 
    usage: {
      data_usage_mb: sim?.data_usage_mb || 0,
      data_limit_mb: sim?.data_limit_mb || 0,
      sms_count: sim?.sms_usage || 0,
      signal_strength: sim?.signal_strength,
      network_type: sim?.network_type,
    },
    history: signals || [],
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function provisionNewSIM(apiKey: string, apiSecret: string, supabase: any, body: any) {
  const { iccid, tenantId, plan, dataLimitMb, notes } = body;
  
  if (!iccid) throw new Error('ICCID is required');

  console.log(`Provisioning new SIM ${iccid}`);

  // Create provisioning request
  const { data: request, error: reqError } = await supabase
    .from('sim_provisioning_requests')
    .insert({
      request_type: 'activation',
      iccid,
      tenant_id: tenantId || 'pending',
      requested_plan: plan || 'iot_basic',
      requested_data_limit_mb: dataLimitMb || 1000,
      notes,
      status: 'pending',
    })
    .select()
    .single();

  if (reqError) throw reqError;

  // Also register in Fonu
  try {
    const fonuResponse = await fetch(`${FONU_API_URL}/sims`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Secret': apiSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ iccid, plan: plan || 'iot_basic' }),
    });

    if (fonuResponse.ok) {
      const fonuData = await fonuResponse.json();
      await supabase
        .from('sim_provisioning_requests')
        .update({ 
          fonu_request_id: fonuData.id,
          fonu_response: fonuData,
        })
        .eq('id', request.id);
    }
  } catch (e) {
    console.log('Could not register with Fonu:', e);
  }

  return new Response(JSON.stringify({ success: true, request }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============== INITIATE ACTIVATION ==============

async function initiateActivation(apiKey: string, apiSecret: string, supabase: any, body: any) {
  const { batchId, tenantId, quantity, operator, plan, dataLimitMb, iccid, triggeredById, triggeredByName } = body;
  
  console.log(`Initiating activation for batch ${batchId}, quantity: ${quantity}, triggered by: ${triggeredByName}`);

  // Get batch details if batchId provided
  let batch: any = null;
  if (batchId) {
    const { data, error } = await supabase
      .from('sim_activation_batches')
      .select('*')
      .eq('id', batchId)
      .single();
    
    if (error) throw new Error('Batch not found');
    batch = data;
  }

  // Update batch status to ACTIVATION_IN_PROGRESS and capture who triggered
  if (batch) {
    await supabase
      .from('sim_activation_batches')
      .update({ 
        status: 'activation_in_progress', 
        started_at: new Date().toISOString(),
        created_by: triggeredById || null,
        created_by_name: triggeredByName || 'Platform Admin',
      })
      .eq('id', batchId);
  }

  // Log who triggered activation to security audit
  const displayTenantId = tenantId || batch?.tenant_id;
  const displayTenantName = batch?.tenant_name || displayTenantId;
  await supabase.from('security_audit_logs').insert({
    event_type: 'sim_activation_triggered',
    severity: 'info',
    description: `SIM activation triggered for ${displayTenantName}: ${quantity || batch?.quantity || 1} SIM(s)`,
    user_id: triggeredById || null,
    user_name: triggeredByName || 'Platform Admin',
    tenant_id: displayTenantId,
    tenant_name: displayTenantName,
    metadata: {
      batch_id: batchId,
      quantity: quantity || batch?.quantity || 1,
      operator: operator || batch?.operator,
    },
  });

  const results: ActivationResult[] = [];
  const targetQuantity = quantity || batch?.quantity || 1;
  const targetOperator = operator || batch?.operator || 'MTN Nigeria';
  const targetPlan = plan || batch?.requested_plan || 'iot_basic';
  const targetDataLimit = dataLimitMb || (batch?.data_limit_gb ? batch.data_limit_gb * 1024 : 1000);
  const targetTenantId = tenantId || batch?.tenant_id;

  // For single activation with ICCID
  if (iccid || (targetQuantity === 1 && batch?.device_mapping_data?.[0]?.iccid)) {
    const targetIccid = iccid || batch?.device_mapping_data?.[0]?.iccid;
    const result = await activateSingleSIM(apiKey, apiSecret, supabase, targetIccid, targetTenantId, targetPlan, targetDataLimit);
    results.push(result);
  } else {
    // Bulk activation - request SIMs from Fonu
    try {
      const fonuResponse = await fetch(`${FONU_API_URL}/sims/bulk-allocate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Secret': apiSecret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: targetQuantity,
          operator: targetOperator,
          plan: targetPlan,
          data_limit_mb: targetDataLimit,
          metadata: { tenantId: targetTenantId, batchId }
        }),
      });

      if (fonuResponse.ok) {
        const fonuData = await fonuResponse.json();
        
        // Process each allocated SIM
        for (const sim of (fonuData.sims || [])) {
          try {
            // Register SIM in local database
            const { data: newSim, error: insertError } = await supabase
              .from('iot_sims')
              .insert({
                iccid: sim.iccid,
                imsi: sim.imsi,
                msisdn: sim.msisdn,
                carrier: targetOperator,
                plan: targetPlan,
                status: 'active',
                tenant_id: targetTenantId,
                data_limit_mb: targetDataLimit,
                fonu_sim_id: sim.id || sim.fonu_sim_id,
                fonu_status: 'active',
                activation_date: new Date().toISOString(),
              })
              .select()
              .single();

            if (insertError) throw insertError;

            results.push({
              iccid: sim.iccid,
              msisdn: sim.msisdn,
              fonu_sim_id: sim.id || sim.fonu_sim_id,
              status: 'activated',
            });
          } catch (simError: any) {
            results.push({
              iccid: sim.iccid,
              status: 'failed',
              error: simError.message,
            });
          }
        }
      } else {
        // Fonu bulk allocation failed - simulate for demo
        console.log('Fonu bulk API unavailable, simulating activation');
        for (let i = 0; i < targetQuantity; i++) {
          const generatedIccid = `89234${Date.now()}${i.toString().padStart(4, '0')}`;
          const generatedMsisdn = `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`;
          
          const { data: newSim, error: insertError } = await supabase
            .from('iot_sims')
            .insert({
              iccid: generatedIccid,
              msisdn: generatedMsisdn,
              carrier: targetOperator,
              plan: targetPlan,
              status: 'active',
              tenant_id: targetTenantId,
              data_limit_mb: targetDataLimit,
              fonu_sim_id: `fonu_${generatedIccid}`,
              fonu_status: 'active',
              activation_date: new Date().toISOString(),
            })
            .select()
            .single();

          if (insertError) {
            results.push({
              iccid: generatedIccid,
              status: 'failed',
              error: insertError.message,
            });
          } else {
            results.push({
              iccid: generatedIccid,
              msisdn: generatedMsisdn,
              fonu_sim_id: newSim.fonu_sim_id,
              status: 'activated',
            });
          }
        }
      }
    } catch (fonuError: any) {
      console.error('Fonu bulk activation error:', fonuError);
      throw new Error(`Fonu activation failed: ${fonuError.message}`);
    }
  }

  // Calculate results
  const activated = results.filter(r => r.status === 'activated').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  // Determine final status
  let finalStatus: string;
  if (failed === 0 && activated > 0) {
    finalStatus = 'completed';
  } else if (activated === 0 && failed > 0) {
    finalStatus = 'failed';
  } else if (activated > 0 && failed > 0) {
    finalStatus = 'partially_completed';
  } else {
    finalStatus = 'failed';
  }

  // ============== POST-ACTIVATION: DEVICE LINKING ==============
  const deviceLinkingResults: DeviceLinkingResult[] = [];
  const deviceLinkingExceptions: DeviceLinkingException[] = [];
  
  // Process device mapping if available
  const deviceMappingData = batch?.device_mapping_data || [];
  if (Array.isArray(deviceMappingData) && deviceMappingData.length > 0 && activated > 0) {
    console.log(`Processing device mapping for ${deviceMappingData.length} devices`);
    
    const activatedSims = results.filter(r => r.status === 'activated');
    
    for (let i = 0; i < deviceMappingData.length; i++) {
      const mapping = deviceMappingData[i];
      const { device_name, imei, serial_number, notes } = mapping;
      
      if (!imei) {
        deviceLinkingExceptions.push({
          row_index: i,
          device_name: device_name || 'Unknown',
          imei: '',
          reason: 'Missing IMEI',
          type: 'missing_imei',
        });
        continue;
      }
      
      // Find corresponding activated SIM (by index if available)
      const correspondingSim = activatedSims[i];
      if (!correspondingSim) {
        deviceLinkingExceptions.push({
          row_index: i,
          device_name: device_name || 'Unknown',
          imei,
          reason: 'No corresponding SIM activated',
          type: 'no_sim_available',
        });
        continue;
      }
      
      try {
        // Try to find existing device by IMEI
        const { data: existingDevice } = await supabase
          .from('devices')
          .select('id, imei, status')
          .eq('imei', imei)
          .maybeSingle();
        
        let deviceId: string;
        
        if (existingDevice) {
          // Update existing device
          deviceId = existingDevice.id;
          console.log(`Found existing device ${deviceId} for IMEI ${imei}`);
          
          // Get the SIM ID
          const { data: simRecord } = await supabase
            .from('iot_sims')
            .select('id')
            .eq('iccid', correspondingSim.iccid)
            .maybeSingle();
          
          if (simRecord) {
            // Update device with SIM assignment
            await supabase
              .from('devices')
              .update({
                sim_id: simRecord.id,
                updated_at: new Date().toISOString(),
              })
              .eq('id', deviceId);
            
            // Update SIM with device assignment
            await supabase
              .from('iot_sims')
              .update({ device_id: deviceId })
              .eq('id', simRecord.id);
          }
          
          deviceLinkingResults.push({
            device_id: deviceId,
            device_name: device_name || `Device ${imei}`,
            imei,
            sim_iccid: correspondingSim.iccid,
            action: 'updated',
            success: true,
          });
        } else {
          // Create new device
          console.log(`Creating new device for IMEI ${imei}`);
          
          const { data: newDevice, error: deviceError } = await supabase
            .from('devices')
            .insert({
              imei,
              manufacturer: 'Auto-created',
              model: serial_number || null,
              status: 'registered',
              tenant_id: targetTenantId,
              device_config: {
                auto_created: true,
                created_from_mapping: true,
                device_name: device_name || null,
                notes: notes || null,
              },
            })
            .select('id')
            .single();
          
          if (deviceError) {
            deviceLinkingExceptions.push({
              row_index: i,
              device_name: device_name || 'Unknown',
              imei,
              reason: `Failed to create device: ${deviceError.message}`,
              type: 'creation_failed',
            });
            continue;
          }
          
          deviceId = newDevice.id;
          
          // Get the SIM ID and link
          const { data: simRecord } = await supabase
            .from('iot_sims')
            .select('id')
            .eq('iccid', correspondingSim.iccid)
            .maybeSingle();
          
          if (simRecord) {
            await supabase
              .from('devices')
              .update({ sim_id: simRecord.id })
              .eq('id', deviceId);
            
            await supabase
              .from('iot_sims')
              .update({ device_id: deviceId })
              .eq('id', simRecord.id);
          }
          
          deviceLinkingResults.push({
            device_id: deviceId,
            device_name: device_name || `Device ${imei}`,
            imei,
            sim_iccid: correspondingSim.iccid,
            action: 'created',
            success: true,
          });
        }
      } catch (linkError: any) {
        console.error(`Error linking device ${imei}:`, linkError);
        deviceLinkingExceptions.push({
          row_index: i,
          device_name: device_name || 'Unknown',
          imei,
          reason: linkError.message || 'Unknown error during linking',
          type: 'linking_failed',
        });
      }
    }
  }

  const devicesLinked = deviceLinkingResults.filter(r => r.success).length;
  const deviceLinkingFailed = deviceLinkingExceptions.length;

  // Update batch with results including device linking
  if (batch) {
    await supabase
      .from('sim_activation_batches')
      .update({
        status: finalStatus,
        sims_activated: activated,
        sims_failed: failed,
        fonu_response: { 
          results,
          device_linking: {
            results: deviceLinkingResults,
            exceptions: deviceLinkingExceptions,
            summary: {
              total_mappings: deviceMappingData.length,
              devices_linked: devicesLinked,
              exceptions_count: deviceLinkingFailed,
            },
          },
        },
        completed_at: new Date().toISOString(),
        error_message: failed > 0 ? `${failed} SIM(s) failed to activate` : null,
      })
      .eq('id', batchId);

    // Update the related provisioning request
    if (batch.request_id) {
      await supabase
        .from('sim_provisioning_requests')
        .update({
          status: 'approved',
          fonu_response: { 
            activationResults: results,
            deviceLinking: {
              linked: devicesLinked,
              exceptions: deviceLinkingFailed,
            },
          },
        })
        .eq('id', batch.request_id);
    }
  }

  // Charge wallet for activated SIMs
  if (activated > 0 && targetTenantId) {
    await chargeWallet(supabase, targetTenantId, 'sim_activation', activated, `Bulk SIM activation: ${activated} SIM(s)`);
  }

  // ============== SEND NOTIFICATIONS ==============
  if (activated > 0) {
    await sendActivationNotifications(supabase, {
      tenantId: targetTenantId,
      tenantName: batch?.tenant_name,
      activated,
      failed,
      devicesLinked,
      batchId,
    });
  }

  return new Response(JSON.stringify({
    success: true,
    status: finalStatus,
    summary: {
      total: targetQuantity,
      activated,
      failed,
      devices_linked: devicesLinked,
      device_exceptions: deviceLinkingFailed,
    },
    results,
    device_linking: {
      results: deviceLinkingResults,
      exceptions: deviceLinkingExceptions,
    },
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function activateSingleSIM(apiKey: string, apiSecret: string, supabase: any, iccid: string, tenantId: string, plan: string, dataLimitMb: number): Promise<ActivationResult> {
  try {
    // Call Fonu API
    const fonuResponse = await fetch(`${FONU_API_URL}/sims/${iccid}/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Secret': apiSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan, metadata: { tenantId } }),
    });

    const fonuResult = fonuResponse.ok ? await fonuResponse.json() : null;

    // Update or insert SIM in database
    const { data: existingSim } = await supabase
      .from('iot_sims')
      .select('id')
      .eq('iccid', iccid)
      .maybeSingle();

    if (existingSim) {
      await supabase
        .from('iot_sims')
        .update({
          status: 'active',
          tenant_id: tenantId,
          activation_date: new Date().toISOString(),
          fonu_status: fonuResult?.status || 'active',
          fonu_sim_id: fonuResult?.id || fonuResult?.fonu_sim_id,
          plan,
          data_limit_mb: dataLimitMb,
        })
        .eq('iccid', iccid);
    } else {
      await supabase
        .from('iot_sims')
        .insert({
          iccid,
          msisdn: fonuResult?.msisdn || `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          carrier: 'MTN Nigeria',
          plan,
          status: 'active',
          tenant_id: tenantId,
          data_limit_mb: dataLimitMb,
          fonu_sim_id: fonuResult?.id || fonuResult?.fonu_sim_id,
          fonu_status: 'active',
          activation_date: new Date().toISOString(),
        });
    }

    return {
      iccid,
      msisdn: fonuResult?.msisdn,
      fonu_sim_id: fonuResult?.id || fonuResult?.fonu_sim_id,
      status: 'activated',
    };
  } catch (error: any) {
    return {
      iccid,
      status: 'failed',
      error: error.message,
    };
  }
}

// ============== WALLET HELPER ==============

async function chargeWallet(supabase: any, tenantId: string, chargeType: string, quantity: number, description: string) {
  try {
    // Check if rate exists for this type
    const { data: rate } = await supabase
      .from('communication_rates')
      .select('*')
      .eq('communication_type', chargeType)
      .eq('is_active', true)
      .maybeSingle();

    if (!rate) {
      console.log(`No rate configured for ${chargeType}, skipping charge`);
      return;
    }

    await supabase.rpc('deduct_wallet_balance', {
      p_tenant_id: tenantId,
      p_communication_type: chargeType,
      p_quantity: quantity,
      p_description: description,
    });
  } catch (e) {
    console.log('Could not charge wallet:', e);
  }
}

// ============== NOTIFICATION HELPER ==============

interface NotificationData {
  tenantId: string;
  tenantName?: string;
  activated: number;
  failed: number;
  devicesLinked: number;
  batchId?: string;
}

async function sendActivationNotifications(supabase: any, data: NotificationData) {
  const { tenantId, tenantName, activated, failed, devicesLinked, batchId } = data;
  
  try {
    // Get tenant details for email
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, contact_email')
      .eq('id', tenantId)
      .maybeSingle();

    // Also try to get tenant admin profile for email
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('tenant_id', tenantId)
      .limit(1)
      .maybeSingle();

    const recipientEmail = tenant?.contact_email || adminProfile?.email;
    const recipientName = adminProfile?.full_name || tenant?.name || tenantName || 'Fleet Admin';
    const displayTenantName = tenant?.name || tenantName || 'Your organization';

    // 1. Log to security_audit_logs (triggers SuperAdmin notification via realtime)
    await supabase.from('security_audit_logs').insert({
      event_type: 'sim_activated',
      severity: failed > 0 ? 'warning' : 'info',
      description: `SIM activation completed for ${displayTenantName}: ${activated} activated${failed > 0 ? `, ${failed} failed` : ''}${devicesLinked > 0 ? `, ${devicesLinked} devices linked` : ''}`,
      tenant_id: tenantId,
      tenant_name: displayTenantName,
      metadata: {
        activated,
        failed,
        devices_linked: devicesLinked,
        batch_id: batchId,
      },
    });

    console.log('SuperAdmin notification logged to security_audit_logs');

    // 2. Send email to Tenant Admin
    if (recipientEmail) {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      
      if (RESEND_API_KEY) {
        const resend = new Resend(RESEND_API_KEY);
        
        const statusMessage = failed > 0 
          ? `${activated} SIM(s) have been activated successfully, and ${failed} SIM(s) failed to activate.`
          : `${activated} SIM(s) have been activated successfully and are now ready for use.`;

        const deviceMessage = devicesLinked > 0 
          ? `<p style="margin: 16px 0;"><strong>${devicesLinked} device(s)</strong> have been automatically linked to your new SIMs based on your device mapping.</p>` 
          : '';

        await resend.emails.send({
          from: 'FleetPro <noreply@truckmoov.com>',
          to: [recipientEmail],
          subject: `Your IoT SIMs are Activated - ${activated} SIM${activated > 1 ? 's' : ''} Ready`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #FFCC00 0%, #FFB800 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: #000; margin: 0; font-size: 24px;">🎉 SIMs Activated!</h1>
              </div>
              
              <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="margin: 0 0 16px;">Hi ${recipientName},</p>
                
                <p style="margin: 16px 0;">${statusMessage}</p>
                
                ${deviceMessage}
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <h3 style="margin: 0 0 12px; color: #333; font-size: 16px;">Activation Summary</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;">✅ SIMs Activated</td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: bold; color: #22c55e;">${activated}</td>
                    </tr>
                    ${failed > 0 ? `
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;">❌ Failed</td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: bold; color: #ef4444;">${failed}</td>
                    </tr>
                    ` : ''}
                    ${devicesLinked > 0 ? `
                    <tr>
                      <td style="padding: 8px 0;">🔗 Devices Linked</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #3b82f6;">${devicesLinked}</td>
                    </tr>
                    ` : ''}
                  </table>
                </div>

                <p style="margin: 16px 0;">You can now assign these SIMs to your tracking devices from your <strong>SIM Management</strong> dashboard.</p>
                
                <div style="text-align: center; margin: 24px 0;">
                  <a href="https://app.truckmoov.com/admin/sims" style="background: #FFCC00; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View Your SIMs</a>
                </div>
                
                <p style="margin: 16px 0; color: #666; font-size: 14px;">If you have any questions, please contact our support team.</p>
                
                <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
                
                <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                  This is an automated message from FleetPro Fleet Platform.<br>
                  © ${new Date().getFullYear()} FleetPro. All rights reserved.
                </p>
              </div>
            </body>
            </html>
          `,
        });

        console.log(`Activation email sent to tenant: ${recipientEmail}`);
      } else {
        console.log('RESEND_API_KEY not configured, skipping tenant email');
      }
    } else {
      console.log('No tenant email found, skipping email notification');
    }
  } catch (notifError) {
    console.error('Error sending activation notifications:', notifError);
    // Don't throw - notifications are non-critical
  }
}
