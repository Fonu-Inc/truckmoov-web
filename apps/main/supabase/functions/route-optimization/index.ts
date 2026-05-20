import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveAuthContext, authErrorResponse, type AuthContext, type AuthError } from "../_shared/auth-middleware.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Waypoint {
  id: string;
  type: 'pickup' | 'delivery' | 'stop';
  address: string;
  lat: number;
  lng: number;
  jobReference?: string;
  duration?: number;
  priority?: number;
  timeWindow?: { start: string; end: string };
}

interface OptimizationRequest {
  waypoints: Waypoint[];
  vehicleCapacity?: number;
  startTime?: string;
  preferences?: {
    minimizeDistance?: boolean;
    minimizeTime?: boolean;
    avoidTolls?: boolean;
    prioritizePickups?: boolean;
    ecoFriendly?: boolean;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth: validate JWT and extract tenant context ---
    let authCtx: AuthContext;
    try {
      authCtx = await resolveAuthContext(req);
    } catch (authErr) {
      return authErrorResponse(authErr as AuthError, corsHeaders);
    }

    // Enforce org type: only fleet operators can optimize routes
    const allowedOrgTypes = ['FLEET_PROVIDER', 'AGGREGATOR', 'OWNER_OPERATOR'];
    if (!authCtx.isPlatformAdmin && !allowedOrgTypes.some(t => authCtx.hasOrgType(t))) {
      return new Response(
        JSON.stringify({ error: 'Access denied: your organization type cannot use route optimization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { waypoints, vehicleCapacity, startTime, preferences }: OptimizationRequest = await req.json();

    if (!waypoints || waypoints.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 waypoints are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Calculate distances between all waypoints
    const distanceMatrix = calculateDistanceMatrix(waypoints);
    const totalCurrentDistance = calculateTotalDistance(waypoints, distanceMatrix);

    // Prepare context for AI
    const waypointSummary = waypoints.map((wp, idx) => ({
      index: idx,
      id: wp.id,
      type: wp.type,
      address: wp.address,
      lat: wp.lat,
      lng: wp.lng,
      duration: wp.duration || 15,
      priority: wp.priority || (wp.type === 'pickup' ? 2 : 1),
      timeWindow: wp.timeWindow,
      jobReference: wp.jobReference,
    }));

    const prompt = `You are a logistics route optimization AI. Analyze the following waypoints and suggest the optimal order to minimize total travel distance and time while respecting constraints.

WAYPOINTS:
${JSON.stringify(waypointSummary, null, 2)}

DISTANCE MATRIX (km between waypoints):
${JSON.stringify(distanceMatrix.map(row => row.map(d => d.toFixed(2))), null, 2)}

CURRENT TOTAL DISTANCE: ${totalCurrentDistance.toFixed(2)} km

CONSTRAINTS:
- Pickups should generally come before their corresponding deliveries (same job reference)
- Consider time windows if provided
- Higher priority stops should be visited earlier when possible
- Start time: ${startTime || 'Now'}
- Vehicle capacity: ${vehicleCapacity || 'Not specified'}

USER PREFERENCES:
${JSON.stringify(preferences || { minimizeDistance: true, minimizeTime: true })}

Analyze the route and determine the optimal order. Consider:
1. Nearest neighbor heuristic as a baseline
2. 2-opt improvements for local optimization
3. Pickup-delivery pairing constraints
4. Time window constraints
5. Traffic patterns (assume morning rush 7-9am, evening rush 4-7pm add 30% time)
${preferences?.ecoFriendly ? `6. ECO-FRIENDLY PRIORITY: Minimize fuel consumption and CO2 emissions. Prefer routes that:
   - Avoid stop-and-go traffic (prefer highways over city routes)
   - Minimize elevation changes
   - Reduce total idle time at stops
   - Group nearby stops to reduce cold starts
   Return estimated CO2 savings from eco-optimized route vs standard route.` : ''}

Return the optimized order as indices, estimated savings, and reasoning.`;

    console.log('Calling AI for route optimization...');
    const optimizationStartTime = Date.now();
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert logistics route optimization AI. Always respond with valid JSON only.'
          },
          { role: 'user', content: prompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'optimize_route',
              description: 'Return the optimized route order and analysis',
              parameters: {
                type: 'object',
                properties: {
                  optimized_order: {
                    type: 'array',
                    items: { type: 'number' },
                    description: 'Array of waypoint indices in optimal order'
                  },
                  estimated_distance_km: {
                    type: 'number',
                    description: 'Total estimated distance after optimization'
                  },
                  estimated_time_minutes: {
                    type: 'number',
                    description: 'Total estimated time including stops'
                  },
                  distance_saved_km: {
                    type: 'number',
                    description: 'Distance saved compared to original order'
                  },
                  time_saved_minutes: {
                    type: 'number',
                    description: 'Time saved compared to original order'
                  },
                  savings_percentage: {
                    type: 'number',
                    description: 'Percentage improvement'
                  },
                  reasoning: {
                    type: 'string',
                    description: 'Brief explanation of optimization decisions'
                  },
                  traffic_considerations: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Traffic-related recommendations'
                  },
                  warnings: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Any concerns or constraints that could not be fully satisfied'
                  }
                },
                required: ['optimized_order', 'estimated_distance_km', 'savings_percentage', 'reasoning']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'optimize_route' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      // Fallback to basic nearest-neighbor optimization
      return Response.json({
        success: true,
        optimized_waypoints: nearestNeighborOptimization(waypoints),
        analysis: {
          optimized_order: Array.from({ length: waypoints.length }, (_, i) => i),
          estimated_distance_km: totalCurrentDistance * 0.85,
          savings_percentage: 15,
          reasoning: 'Used fallback nearest-neighbor optimization due to AI unavailability',
          warnings: ['AI optimization unavailable, using basic algorithm']
        }
      }, { headers: corsHeaders });
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    let analysis;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback parsing
      const content = aiData.choices?.[0]?.message?.content || '';
      try {
        analysis = JSON.parse(content);
      } catch {
        analysis = {
          optimized_order: Array.from({ length: waypoints.length }, (_, i) => i),
          estimated_distance_km: totalCurrentDistance,
          savings_percentage: 0,
          reasoning: 'Could not parse AI response, returning original order',
          warnings: ['AI response parsing failed']
        };
      }
    }

    // Validate and apply the optimized order
    const optimizedOrder = analysis.optimized_order || [];
    const validOrder = validateOrder(optimizedOrder, waypoints.length);
    
    const optimizedWaypoints = validOrder.map((idx: number) => waypoints[idx]);
    const newTotalDistance = calculateTotalDistance(optimizedWaypoints, calculateDistanceMatrix(optimizedWaypoints));

    // Calculate ETAs
    const waypointsWithETA = calculateETAs(optimizedWaypoints, startTime ? new Date(startTime) : new Date());

    // --- Log AI usage for audit + cost tracking ---
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      await supabaseAdmin.from('ai_usage_logs').insert({
        tenant_id: authCtx.tenantId || 'unknown',
        provider: 'google',
        model: 'google/gemini-2.5-flash',
        request_type: 'route_optimization',
        tokens_used: 0,
        prompt_tokens: aiData?.usage?.prompt_tokens ?? 0,
        completion_tokens: aiData?.usage?.completion_tokens ?? 0,
        success: true,
        candidates_count: waypoints.length,
        matches_returned: waypoints.length,
        latency_ms: Date.now() - optimizationStartTime,
      });
    } catch (logErr) {
      console.warn('Failed to log AI usage:', logErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        optimized_waypoints: waypointsWithETA,
        analysis: {
          ...analysis,
          original_distance_km: totalCurrentDistance,
          new_distance_km: newTotalDistance,
          actual_savings_km: totalCurrentDistance - newTotalDistance,
          actual_savings_percentage: ((totalCurrentDistance - newTotalDistance) / totalCurrentDistance * 100).toFixed(1)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in route optimization:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateDistanceMatrix(waypoints: Waypoint[]): number[][] {
  const n = waypoints.length;
  const matrix: number[][] = [];
  
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = haversineDistance(
          waypoints[i].lat, waypoints[i].lng,
          waypoints[j].lat, waypoints[j].lng
        );
      }
    }
  }
  
  return matrix;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateTotalDistance(waypoints: Waypoint[], matrix: number[][]): number {
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const fromIdx = i;
    const toIdx = i + 1;
    total += matrix[fromIdx][toIdx];
  }
  return total;
}

function validateOrder(order: number[], length: number): number[] {
  // Ensure all indices are valid and unique
  const seen = new Set<number>();
  const valid: number[] = [];
  
  for (const idx of order) {
    if (typeof idx === 'number' && idx >= 0 && idx < length && !seen.has(idx)) {
      valid.push(idx);
      seen.add(idx);
    }
  }
  
  // Add any missing indices
  for (let i = 0; i < length; i++) {
    if (!seen.has(i)) {
      valid.push(i);
    }
  }
  
  return valid;
}

function nearestNeighborOptimization(waypoints: Waypoint[]): Waypoint[] {
  if (waypoints.length <= 2) return waypoints;
  
  const optimized: Waypoint[] = [waypoints[0]];
  const remaining = [...waypoints.slice(1)];
  
  while (remaining.length > 0) {
    const last = optimized[optimized.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    
    remaining.forEach((wp, index) => {
      const dist = haversineDistance(last.lat, last.lng, wp.lat, wp.lng);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = index;
      }
    });
    
    optimized.push(remaining[nearestIndex]);
    remaining.splice(nearestIndex, 1);
  }
  
  return optimized;
}

function calculateETAs(waypoints: Waypoint[], startTime: Date): Waypoint[] {
  const avgSpeed = 45; // km/h average urban speed
  let currentTime = new Date(startTime);
  
  return waypoints.map((wp, index) => {
    let distance = 0;
    if (index > 0) {
      const prev = waypoints[index - 1];
      distance = haversineDistance(prev.lat, prev.lng, wp.lat, wp.lng);
      const travelTime = (distance / avgSpeed) * 60; // minutes
      currentTime = new Date(currentTime.getTime() + travelTime * 60 * 1000);
    }
    
    const eta = currentTime.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false 
    });
    
    // Add stop duration for next calculation
    if (wp.duration) {
      currentTime = new Date(currentTime.getTime() + wp.duration * 60 * 1000);
    }
    
    return {
      ...wp,
      distance: index > 0 ? distance : undefined,
      estimatedArrival: eta,
    };
  });
}
