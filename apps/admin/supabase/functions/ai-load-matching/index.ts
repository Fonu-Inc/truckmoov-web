import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { recordUsageIfPostpaid } from "../_shared/usage-recorder.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

// ============ TYPES ============

interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  type: string;
  status: string;
  capacity: number;
  fuelLevel?: number;
  location?: { lat: number; lng: number };
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: string;
  rating: number;
  totalTrips: number;
  currentVehicle?: string;
}

interface Job {
  id: string;
  reference: string;
  pickup: { address: string; lat: number; lng: number };
  delivery: { address: string; lat: number; lng: number };
  cargo: { type: string; weight: number; description: string };
  amount: number;
  deadline?: string;
}

// UNIFIED: Mode control for simulation vs live execution
type MatchingMode = 'SIMULATION' | 'LIVE';

// UNIFIED: Role validation at API level
type MatchingRole = 'platform_admin' | 'tenant_admin' | 'operations_manager' | 'dispatcher' | 'supervisor';

interface MatchRequest {
  tenant_id: string;
  job: Job;
  vehicles: Vehicle[];
  drivers: Driver[];
  // NEW: Mode control
  mode?: MatchingMode;
  // NEW: Caller role for RBAC enforcement
  requested_by_role?: MatchingRole;
  // NEW: User ID for audit trail
  user_id?: string;
}

interface AIConfig {
  enabled: boolean;
  provider: string;
  model: string;
  use_platform_key: boolean;
  api_key_encrypted?: string;
  confidence_threshold: number;
  require_dispatcher_approval: boolean;
  weights: {
    capacity_fit: number;
    distance_pickup: number;
    eta_delivery: number;
    driver_availability: number;
    cost_efficiency: number;
  };
  constraints: {
    max_load: boolean;
    truck_type: boolean;
    refrigeration: boolean;
    driver_hours: boolean;
  };
  guardrails: {
    max_tokens: number;
    redact_phones: boolean;
    redact_names: boolean;
    redact_plates: boolean;
  };
  error?: string;
}

// ============ RBAC ENFORCEMENT ============

// Roles that can execute LIVE mode (send offers, trigger messaging)
const LIVE_MODE_ROLES: MatchingRole[] = ['dispatcher', 'supervisor', 'operations_manager'];

// Roles that can run matching at all (simulation or live)
const MATCHING_ROLES: MatchingRole[] = ['platform_admin', 'tenant_admin', 'operations_manager', 'dispatcher', 'supervisor'];

// Roles restricted to simulation only
const SIMULATION_ONLY_ROLES: MatchingRole[] = ['platform_admin', 'tenant_admin'];

function canExecuteLiveMode(role: MatchingRole | undefined): boolean {
  if (!role) return false;
  return LIVE_MODE_ROLES.includes(role);
}

function canRunMatching(role: MatchingRole | undefined): boolean {
  if (!role) return false;
  return MATCHING_ROLES.includes(role);
}

function enforceSimulationOnly(role: MatchingRole | undefined): boolean {
  if (!role) return true;
  return SIMULATION_ONLY_ROLES.includes(role);
}

// Determine effective mode based on role and requested mode
function resolveEffectiveMode(requestedMode: MatchingMode | undefined, role: MatchingRole | undefined): MatchingMode {
  // If role is simulation-only, always return SIMULATION regardless of request
  if (enforceSimulationOnly(role)) {
    return 'SIMULATION';
  }
  
  // If role can execute live and requested live, allow it
  if (requestedMode === 'LIVE' && canExecuteLiveMode(role)) {
    return 'LIVE';
  }
  
  // Default to SIMULATION
  return requestedMode || 'SIMULATION';
}

// ============ UNIFIED ELIGIBILITY PIPELINE ============

interface EligibilityResult {
  vehicle: Vehicle;
  driver: Driver;
  eligible: boolean;
  reasons: string[];
}

// Phase 3: Vehicle intelligence signals
interface VehicleSignals {
  maintenanceRiskScore?: number;
  maintenanceRiskLevel?: string;
  fuelEfficiencyScore?: number;
  overdueMaintenance?: number;
  riskWarnings?: string[];
}

// Extended vehicle with signals
interface VehicleWithSignals extends Vehicle {
  signals?: VehicleSignals;
}

async function fetchVehicleSignals(
  supabase: any,
  tenantId: string,
  vehicleIds: string[]
): Promise<Map<string, VehicleSignals>> {
  const signals = new Map<string, VehicleSignals>();
  
  try {
    // Fetch maintenance risk scores
    const { data: riskData } = await supabase
      .from('maintenance_risk_scores')
      .select('vehicle_id, overall_risk_score, risk_level, recommendations')
      .eq('tenant_id', tenantId)
      .in('vehicle_id', vehicleIds);
    
    // Fetch dispatch scores (includes fuel efficiency)
    const { data: dispatchData } = await supabase
      .from('vehicle_dispatch_scores')
      .select('vehicle_id, overall_score, maintenance_health_score, fuel_efficiency_score, risk_warnings')
      .eq('tenant_id', tenantId)
      .in('vehicle_id', vehicleIds);
    
    // Fetch overdue maintenance counts
    const { data: maintenanceData } = await supabase
      .from('maintenance_profiles')
      .select('vehicle_id')
      .eq('tenant_id', tenantId)
      .eq('lifecycle_status', 'overdue')
      .eq('is_archived', false)
      .in('vehicle_id', vehicleIds);
    
    // Aggregate overdue counts
    const overdueCounts = new Map<string, number>();
    maintenanceData?.forEach((m: { vehicle_id: string }) => {
      overdueCounts.set(m.vehicle_id, (overdueCounts.get(m.vehicle_id) || 0) + 1);
    });
    
    // Combine signals
    vehicleIds.forEach(vid => {
      const risk = riskData?.find((r: any) => r.vehicle_id === vid);
      const dispatch = dispatchData?.find((d: any) => d.vehicle_id === vid);
      
      signals.set(vid, {
        maintenanceRiskScore: risk?.overall_risk_score,
        maintenanceRiskLevel: risk?.risk_level,
        fuelEfficiencyScore: dispatch?.fuel_efficiency_score,
        overdueMaintenance: overdueCounts.get(vid) || 0,
        riskWarnings: dispatch?.risk_warnings || [],
      });
    });
  } catch (error) {
    console.error('Error fetching vehicle signals:', error);
    // Continue without signals - they're advisory only
  }
  
  return signals;
}

function runEligibilityPipeline(
  job: Job,
  vehicles: Vehicle[],
  drivers: Driver[],
  constraints: AIConfig['constraints'],
  vehicleSignals?: Map<string, VehicleSignals>
): { eligibleVehicles: VehicleWithSignals[]; eligibleDrivers: Driver[]; rejections: string[] } {
  const rejections: string[] = [];
  
  // UNIFIED: Single eligibility logic for both screens
  const eligibleVehicles: VehicleWithSignals[] = vehicles.filter(v => {
    // Status check
    if (v.status !== 'active' && v.status !== undefined && v.status !== null) {
      rejections.push(`Vehicle ${v.registrationNumber}: Status is ${v.status}, not active`);
      return false;
    }
    
    // Capacity constraint
    if (constraints.max_load && job.cargo?.weight) {
      if (v.capacity < job.cargo.weight) {
        rejections.push(`Vehicle ${v.registrationNumber}: Capacity ${v.capacity}t < cargo ${job.cargo.weight}t`);
        return false;
      }
    }
    
    // Truck type matching (simplified - could be extended)
    if (constraints.truck_type && job.cargo?.type) {
      // Basic type matching logic can be expanded
      const cargoType = job.cargo.type.toLowerCase();
      const vehicleType = v.type?.toLowerCase() || '';
      
      // Refrigeration check
      if (constraints.refrigeration && 
          (cargoType.includes('frozen') || cargoType.includes('cold') || cargoType.includes('perishable'))) {
        // Would need refrigeration capability flag - for now, pass
      }
    }
    
    return true;
  }).map(v => ({
    ...v,
    signals: vehicleSignals?.get(v.id),
  }));
  
  const eligibleDrivers = drivers.filter(d => {
    // Status check
    if (d.status !== 'available' && d.status !== 'on_job' && d.status !== undefined && d.status !== null) {
      rejections.push(`Driver ${d.name}: Status is ${d.status}, not available`);
      return false;
    }
    
    // Driver hours compliance (simplified)
    if (constraints.driver_hours) {
      // Would check actual hours - for now, pass if status is okay
    }
    
    return true;
  });
  
  return { eligibleVehicles, eligibleDrivers, rejections };
}

// ============ REDACTION UTILITIES ============

function redactPhone(phone: string): string {
  if (!phone) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{3,4})/, '$1****$2');
}

function redactName(name: string): string {
  if (!name) return name;
  const parts = name.split(' ');
  return parts.map((p, i) => i === 0 ? p : p[0] + '***').join(' ');
}

function redactPlate(plate: string): string {
  if (!plate) return plate;
  return plate.replace(/(.{3}).*(.{2})$/, '$1***$2');
}

// ============ AI PROVIDER CALLS ============

async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<{ content: string; usage: { prompt_tokens: number; completion_tokens: number } }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model.startsWith('gpt-') ? model : `gpt-${model}`,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0 },
  };
}

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<{ content: string; usage: { prompt_tokens: number; completion_tokens: number } }> {
  const modelMap: Record<string, string> = {
    'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
    'claude-3-sonnet': 'claude-3-sonnet-20240229',
    'claude-3-haiku': 'claude-3-haiku-20240307',
    'claude-3-opus': 'claude-3-opus-20240229',
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelMap[model] || model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.content?.[0]?.text || '',
    usage: {
      prompt_tokens: data.usage?.input_tokens || 0,
      completion_tokens: data.usage?.output_tokens || 0,
    },
  };
}

async function callLovableAI(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<{ content: string; usage: { prompt_tokens: number; completion_tokens: number } }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const modelMap: Record<string, string> = {
    'gemini-2.5-flash': 'google/gemini-2.5-flash',
    'gemini-2.5-pro': 'google/gemini-2.5-pro',
    'gemini-2.5-flash-lite': 'google/gemini-2.5-flash-lite',
    'gemini-3-flash-preview': 'google/gemini-3-flash-preview',
  };

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelMap[model] || 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    if (response.status === 402) {
      throw new Error('PAYMENT_REQUIRED');
    }
    throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0 },
  };
}

// ============ RATE LIMITING ============

async function checkRateLimits(
  supabase: any,
  tenantId: string,
  platformConfig: any
): Promise<{ allowed: boolean; error?: string }> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60000);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const { count: recentRequests, error: rpmError } = await supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', oneMinuteAgo.toISOString());

  if (rpmError) {
    console.error('Error checking RPM:', rpmError);
  } else if (recentRequests !== null && recentRequests >= platformConfig.max_requests_per_minute) {
    return { 
      allowed: false, 
      error: `Rate limit exceeded: ${recentRequests}/${platformConfig.max_requests_per_minute} requests per minute` 
    };
  }

  const { data: dailyUsage, error: dailyError } = await supabase
    .from('ai_usage_logs')
    .select('tokens_used')
    .eq('tenant_id', tenantId)
    .gte('created_at', startOfDay.toISOString());

  if (dailyError) {
    console.error('Error checking daily tokens:', dailyError);
  } else if (dailyUsage) {
    const totalDailyTokens = dailyUsage.reduce((sum: number, log: any) => sum + (log.tokens_used || 0), 0);
    if (totalDailyTokens >= platformConfig.max_tokens_per_day_per_tenant) {
      return { 
        allowed: false, 
        error: `Daily token limit exceeded: ${totalDailyTokens}/${platformConfig.max_tokens_per_day_per_tenant} tokens` 
      };
    }
  }

  return { allowed: true };
}

// ============ MAIN HANDLER ============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let tenantId = '';
  let provider = 'lovable';
  let model = 'gemini-2.5-flash';
  let tokensUsed = 0;
  let success = false;
  let errorMessage = '';
  let candidatesCount = 0;
  let matchesReturned = 0;
  let jobId = '';
  let effectiveMode: MatchingMode = 'SIMULATION';

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: MatchRequest = await req.json();
    
    // Extract request parameters
    tenantId = body.tenant_id || '';
    const job = body.job;
    const vehicles = body.vehicles || [];
    const drivers = body.drivers || [];
    const requestedMode = body.mode || 'SIMULATION';
    const callerRole = body.requested_by_role as MatchingRole | undefined;
    const userId = body.user_id;
    jobId = job?.id || '';

    // RBAC: Validate caller can run matching
    if (!canRunMatching(callerRole)) {
      return new Response(JSON.stringify({ 
        error: 'UNAUTHORIZED: Role not permitted to run job matching',
        matches: [],
        mode: 'SIMULATION',
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // RBAC: Resolve effective mode based on role
    effectiveMode = resolveEffectiveMode(requestedMode, callerRole);
    
    console.log('AI Load Matching Request:', { 
      tenantId,
      jobId: job?.id, 
      vehicleCount: vehicles?.length || 0, 
      driverCount: drivers?.length || 0,
      requestedMode,
      effectiveMode,
      callerRole,
    });

    // Validate required fields
    if (!job || !job.reference) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request: job data is required',
        matches: [],
        mode: effectiveMode,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get tenant AI configuration
    let aiConfig: AIConfig = {
      enabled: true,
      provider: 'lovable',
      model: 'gemini-2.5-flash',
      use_platform_key: true,
      confidence_threshold: 0.75,
      require_dispatcher_approval: true,
      weights: {
        capacity_fit: 80,
        distance_pickup: 70,
        eta_delivery: 60,
        driver_availability: 75,
        cost_efficiency: 50,
      },
      constraints: {
        max_load: true,
        truck_type: true,
        refrigeration: true,
        driver_hours: true,
      },
      guardrails: {
        max_tokens: 4000,
        redact_phones: true,
        redact_names: true,
        redact_plates: true,
      },
    };

    // Get platform config for rate limiting
    let platformConfig = {
      max_requests_per_minute: 60,
      max_tokens_per_day_per_tenant: 100000,
      ai_job_matching_enabled: true,
    };

    const { data: platformData } = await supabase
      .from('platform_ai_config')
      .select('max_requests_per_minute, max_tokens_per_day_per_tenant, ai_job_matching_enabled')
      .limit(1)
      .single();

    if (platformData) {
      platformConfig = { ...platformConfig, ...platformData };
    }

    // Check if AI matching is enabled platform-wide
    if (!platformConfig.ai_job_matching_enabled) {
      return new Response(JSON.stringify({ 
        error: 'AI Job Matching is disabled platform-wide',
        matches: [],
        mode: effectiveMode,
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (tenantId) {
      const { data: configData, error: configError } = await supabase.rpc(
        'get_tenant_ai_config',
        { p_tenant_id: tenantId }
      );

      if (!configError && configData) {
        aiConfig = { ...aiConfig, ...configData };
      }

      // Enforce rate limits
      const rateLimitCheck = await checkRateLimits(supabase, tenantId, platformConfig);
      if (!rateLimitCheck.allowed) {
        return new Response(JSON.stringify({ 
          error: rateLimitCheck.error,
          matches: [],
          mode: effectiveMode,
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (aiConfig.error) {
      return new Response(JSON.stringify({ 
        error: aiConfig.error,
        matches: [],
        mode: effectiveMode,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    provider = aiConfig.provider || 'lovable';
    model = aiConfig.model || 'gemini-2.5-flash';

    // Fetch vehicle intelligence signals (Phase 3)
    const vehicleIds = vehicles.map(v => v.id);
    const vehicleSignals = await fetchVehicleSignals(supabase, tenantId, vehicleIds);

    // UNIFIED: Run single eligibility pipeline with signals
    const { eligibleVehicles, eligibleDrivers, rejections } = runEligibilityPipeline(
      job,
      vehicles,
      drivers,
      aiConfig.constraints,
      vehicleSignals
    );
    
    candidatesCount = eligibleVehicles.length + eligibleDrivers.length;

    if (eligibleVehicles.length === 0 || eligibleDrivers.length === 0) {
      return new Response(JSON.stringify({ 
        matches: [],
        message: 'No eligible vehicles or drivers found',
        eligibilityRejections: rejections,
        mode: effectiveMode,
        candidatesConsidered: vehicles.length + drivers.length,
        eligibleCount: candidatesCount,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply redaction if enabled
    const redactedVehicles = eligibleVehicles.map((v: Vehicle) => ({
      ...v,
      registrationNumber: aiConfig.guardrails.redact_plates 
        ? redactPlate(v.registrationNumber) 
        : v.registrationNumber,
    }));

    const redactedDrivers = eligibleDrivers.map((d: Driver) => ({
      ...d,
      name: aiConfig.guardrails.redact_names ? redactName(d.name) : d.name,
      phone: aiConfig.guardrails.redact_phones ? redactPhone(d.phone) : d.phone,
    }));

    // Build prompts with weights
    const weights = aiConfig.weights;
    const systemPrompt = `You are an intelligent fleet management AI that matches trucks and drivers to cargo jobs.
Analyze the job requirements and available fleet to find the best matches based on these weighted criteria:
1. Capacity fit vs cargo weight (weight: ${weights.capacity_fit}/100) - must be sufficient
2. Distance to pickup (weight: ${weights.distance_pickup}/100) - closer is better
3. ETA / delivery time (weight: ${weights.eta_delivery}/100) - faster is better
4. Driver availability and status (weight: ${weights.driver_availability}/100) - available preferred
5. Cost efficiency (weight: ${weights.cost_efficiency}/100) - optimize for cost

Hard constraints (must not violate):
${aiConfig.constraints.max_load ? '- Maximum load capacity cannot be exceeded' : ''}
${aiConfig.constraints.truck_type ? '- Truck type must be suitable for cargo' : ''}
${aiConfig.constraints.refrigeration ? '- Refrigeration requirements must be met if needed' : ''}
${aiConfig.constraints.driver_hours ? '- Driver hours compliance must be maintained' : ''}

For each match, provide:
- A match score (0-100) based on weighted criteria
- Confidence level (0-1)
- Estimated travel time in hours
- Estimated distance in km
- 2-4 specific reasons why this is a good match

Be realistic with scores - perfect matches (95+) should be rare.
Return ONLY valid JSON, no markdown or explanations.`;

    const userPrompt = `Find the top 3 best vehicle-driver matches for this job:

JOB DETAILS:
- Reference: ${job.reference}
- Cargo: ${job.cargo.type} (${job.cargo.weight} tons)
- Description: ${job.cargo.description}
- Pickup: ${job.pickup.address}
- Delivery: ${job.delivery.address}
- Amount: ${job.amount}
${job.deadline ? `- Deadline: ${job.deadline}` : ''}

AVAILABLE VEHICLES:
${redactedVehicles.map((v: VehicleWithSignals) => {
  const riskInfo = v.signals?.maintenanceRiskLevel ? `, Risk: ${v.signals.maintenanceRiskLevel}` : '';
  const overdueInfo = v.signals?.overdueMaintenance ? `, Overdue: ${v.signals.overdueMaintenance}` : '';
  return `- ${v.id}: ${v.make} ${v.model} (${v.registrationNumber}), Capacity: ${v.capacity}t, Fuel: ${v.fuelLevel ?? 'N/A'}%${v.location ? `, Location: ${v.location.lat.toFixed(4)}, ${v.location.lng.toFixed(4)}` : ''}${riskInfo}${overdueInfo}`;
}).join('\n')}

AVAILABLE DRIVERS:
${redactedDrivers.map((d: Driver) => `- ${d.id}: ${d.name}, Rating: ${d.rating}/5, Trips: ${d.totalTrips}, Status: ${d.status}${d.currentVehicle ? `, Vehicle: ${d.currentVehicle}` : ''}`).join('\n')}

Return JSON format:
{
  "matches": [
    {
      "vehicleId": "string",
      "driverId": "string", 
      "matchScore": number,
      "confidence": number,
      "estimatedTimeHours": number,
      "estimatedDistanceKm": number,
      "reasons": ["reason1", "reason2", "reason3"]
    }
  ],
  "analysis": "Brief analysis of matching decisions",
  "overallConfidence": number
}`;

    console.log(`Calling ${provider} AI for matching with model ${model}...`);

    // Call the appropriate provider
    let aiResponse: { content: string; usage: { prompt_tokens: number; completion_tokens: number } };
    
    try {
      if (provider === 'openai') {
        const apiKey = aiConfig.use_platform_key 
          ? Deno.env.get('OPENAI_API_KEY')
          : aiConfig.api_key_encrypted;
        
        if (!apiKey) {
          throw new Error('OpenAI API key not configured');
        }
        
        aiResponse = await callOpenAI(apiKey, model, systemPrompt, userPrompt, aiConfig.guardrails.max_tokens);
      } else if (provider === 'anthropic') {
        const apiKey = aiConfig.use_platform_key 
          ? Deno.env.get('ANTHROPIC_API_KEY')
          : aiConfig.api_key_encrypted;
        
        if (!apiKey) {
          throw new Error('Anthropic API key not configured');
        }
        
        aiResponse = await callAnthropic(apiKey, model, systemPrompt, userPrompt, aiConfig.guardrails.max_tokens);
      } else {
        // Default to Lovable AI
        aiResponse = await callLovableAI(model, systemPrompt, userPrompt, aiConfig.guardrails.max_tokens);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('AI Provider error:', errMsg);
      
      if (errMsg === 'RATE_LIMIT_EXCEEDED') {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', mode: effectiveMode }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (errMsg === 'PAYMENT_REQUIRED') {
        return new Response(JSON.stringify({ error: 'API credits exhausted. Please add funds.', mode: effectiveMode }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw error;
    }

    tokensUsed = aiResponse.usage.prompt_tokens + aiResponse.usage.completion_tokens;
    const content = aiResponse.content;

    console.log('AI Response received, parsing...');

    // Parse AI response
    let matchData;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      matchData = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to simple matching
      matchData = {
        matches: eligibleVehicles.slice(0, 3).map((v: Vehicle, i: number) => ({
          vehicleId: v.id,
          driverId: eligibleDrivers[i % eligibleDrivers.length].id,
          matchScore: 85 - (i * 5),
          confidence: 0.7 - (i * 0.1),
          estimatedTimeHours: 2 + i,
          estimatedDistanceKm: 100 + (i * 50),
          reasons: ['Available vehicle', 'Suitable capacity', 'Driver available']
        })),
        analysis: 'Fallback matching used due to AI response parsing error',
        overallConfidence: 0.6
      };
    }

    // Enrich matches with full vehicle/driver data (using original non-redacted data)
    const enrichedMatches = matchData.matches.map((match: any) => {
      const vehicle = eligibleVehicles.find((v: Vehicle) => v.id === match.vehicleId) || eligibleVehicles[0];
      const driver = eligibleDrivers.find((d: Driver) => d.id === match.driverId) || eligibleDrivers[0];
      
      return {
        vehicle,
        driver,
        matchScore: Math.min(100, Math.max(0, match.matchScore)),
        confidence: Math.min(1, Math.max(0, match.confidence || 0.75)),
        estimatedTime: `${Math.floor(match.estimatedTimeHours)} hrs ${Math.round((match.estimatedTimeHours % 1) * 60)} mins`,
        distance: match.estimatedDistanceKm,
        reasons: match.reasons || ['AI recommended match'],
      };
    });

    matchesReturned = enrichedMatches.length;
    success = true;

    // Log usage - ALWAYS log regardless of mode for audit trail
    const latencyMs = Date.now() - startTime;
    if (tenantId) {
      await supabase.from('ai_usage_logs').insert({
        tenant_id: tenantId,
        provider: provider as 'openai' | 'anthropic' | 'lovable',
        model,
        request_type: effectiveMode === 'SIMULATION' ? 'JOB_MATCHING_SIMULATION' : 'JOB_MATCHING_LIVE',
        tokens_used: tokensUsed,
        prompt_tokens: aiResponse.usage.prompt_tokens,
        completion_tokens: aiResponse.usage.completion_tokens,
        latency_ms: latencyMs,
        success: true,
        job_id: jobId,
        candidates_count: candidatesCount,
        matches_returned: matchesReturned,
      });

      // Store match results for explainability - include mode
      await supabase.from('ai_match_results').insert({
        tenant_id: tenantId,
        job_id: jobId,
        provider: provider as 'openai' | 'anthropic' | 'lovable',
        model,
        candidates_considered: candidatesCount,
        top_matches: enrichedMatches,
        confidence: matchData.overallConfidence || 0.75,
        analysis: matchData.analysis,
      });
    }

    console.log('Returning', enrichedMatches.length, 'matches in', effectiveMode, 'mode');

    // Record AI usage for postpaid tenants
    const supabaseForUsage = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    await recordUsageIfPostpaid(supabaseForUsage, tenantId, 'ai_request', 1, {
      job_id: job.id,
      model,
      provider,
      tokens_used: tokensUsed,
    });

    return new Response(JSON.stringify({
      matches: enrichedMatches,
      analysis: matchData.analysis,
      overallConfidence: matchData.overallConfidence || 0.75,
      provider,
      model,
      requiresApproval: aiConfig.require_dispatcher_approval,
      confidenceThreshold: aiConfig.confidence_threshold,
      jobId: job.id,
      mode: effectiveMode,
      modeDowngraded: requestedMode === 'LIVE' && effectiveMode === 'SIMULATION',
      canSendOffers: effectiveMode === 'LIVE',
      canTriggerMessaging: effectiveMode === 'LIVE',
      canAssign: effectiveMode === 'LIVE',
      eligibleVehicleCount: eligibleVehicles.length,
      eligibleDriverCount: eligibleDrivers.length,
      candidatesConsidered: vehicles.length + drivers.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in ai-load-matching:', errorMessage);

    // Log failed attempt
    if (tenantId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      await supabase.from('ai_usage_logs').insert({
        tenant_id: tenantId,
        provider: provider as 'openai' | 'anthropic' | 'lovable',
        model,
        request_type: effectiveMode === 'SIMULATION' ? 'JOB_MATCHING_SIMULATION' : 'JOB_MATCHING_LIVE',
        tokens_used: tokensUsed,
        latency_ms: latencyMs,
        success: false,
        error_message: errorMessage,
        job_id: jobId,
        candidates_count: candidatesCount,
        matches_returned: 0,
      });
    }

    return new Response(JSON.stringify({ 
      error: errorMessage,
      matches: [],
      mode: effectiveMode,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
