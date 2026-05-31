import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveAuthContext, authErrorResponse, type AuthContext, type AuthError } from "../_shared/auth-middleware.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default CO2 emission factors (kg CO2 per litre of fuel)
const FUEL_CO2_FACTORS: Record<string, number> = {
  diesel: 2.68,
  petrol: 2.31,
  cng: 2.75, // per kg
  lpg: 1.51,
  electric: 0,
  hybrid_diesel: 2.68,
  hybrid_petrol: 2.31,
};

// Default CO2 per km by vehicle/fuel type (kg)
const DISTANCE_CO2_FACTORS: Record<string, number> = {
  diesel: 0.27,
  petrol: 0.23,
  cng: 0.20,
  lpg: 0.21,
  electric: 0.0, // grid emission handled separately
  hybrid_diesel: 0.18,
  hybrid_petrol: 0.15,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let authCtx: AuthContext;
    try {
      authCtx = await resolveAuthContext(req);
    } catch (authErr) {
      return authErrorResponse(authErr as AuthError, corsHeaders);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { action } = body;

    // ── Calculate emissions for a trip/distance ──
    if (action === 'calculate') {
      const { vehicle_id, distance_km, fuel_consumed_litres, driver_id, job_id, trip_date } = body;

      if (!vehicle_id || !distance_km) {
        return Response.json({ error: 'vehicle_id and distance_km are required' }, {
          status: 400, headers: corsHeaders
        });
      }

      // Get vehicle emission profile
      const { data: profile } = await supabaseAdmin
        .from('vehicle_emission_profiles')
        .select('*')
        .eq('vehicle_id', vehicle_id)
        .eq('tenant_id', authCtx.tenantId)
        .maybeSingle();

      let co2_emitted_kg: number;
      let calculation_method: 'fuel_based' | 'distance_based';

      if (fuel_consumed_litres && fuel_consumed_litres > 0) {
        // Fuel-based calculation (more accurate)
        const factor = profile?.co2_factor_kg_per_litre
          || FUEL_CO2_FACTORS[profile?.fuel_type || 'diesel'];
        co2_emitted_kg = fuel_consumed_litres * factor;
        calculation_method = 'fuel_based';
      } else {
        // Distance-based fallback
        const factor = profile?.co2_factor_kg_per_km
          || DISTANCE_CO2_FACTORS[profile?.fuel_type || 'diesel'];
        co2_emitted_kg = distance_km * factor;
        calculation_method = 'distance_based';
      }

      // Zero emission vehicles
      if (profile?.is_zero_emission) {
        co2_emitted_kg = 0;
      }

      // Log the emission
      const { data: log, error: logErr } = await supabaseAdmin
        .from('co2_emission_logs')
        .insert({
          tenant_id: authCtx.tenantId,
          vehicle_id,
          driver_id: driver_id || null,
          job_id: job_id || null,
          distance_km,
          fuel_consumed_litres: fuel_consumed_litres || null,
          co2_emitted_kg: Math.round(co2_emitted_kg * 1000) / 1000,
          calculation_method,
          trip_date: trip_date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (logErr) throw logErr;

      return Response.json({
        success: true,
        emission: log,
        breakdown: {
          co2_emitted_kg: Math.round(co2_emitted_kg * 1000) / 1000,
          calculation_method,
          fuel_type: profile?.fuel_type || 'diesel',
          is_zero_emission: profile?.is_zero_emission || false,
        }
      }, { headers: corsHeaders });
    }

    // ── Compute eco-driving score for a driver ──
    if (action === 'compute_eco_score') {
      const { driver_id, period_start, period_end } = body;

      if (!driver_id || !period_start || !period_end) {
        return Response.json({ error: 'driver_id, period_start, period_end required' }, {
          status: 400, headers: corsHeaders
        });
      }

      // Get behavior events for the period
      const { data: events } = await supabaseAdmin
        .from('driver_behavior_events')
        .select('*')
        .eq('driver_id', driver_id)
        .eq('tenant_id', authCtx.tenantId)
        .gte('created_at', period_start)
        .lte('created_at', period_end);

      const totalEvents = events?.length || 0;
      const harshAccel = events?.filter(e => e.event_type === 'harsh_acceleration').length || 0;
      const harshBrake = events?.filter(e => e.event_type === 'harsh_braking').length || 0;
      const overspeeding = events?.filter(e => e.event_type === 'overspeeding').length || 0;
      const idling = events?.filter(e => e.event_type === 'excessive_idling').length || 0;

      // Get CO2 logs for this driver
      const { data: co2Logs } = await supabaseAdmin
        .from('co2_emission_logs')
        .select('*')
        .eq('driver_id', driver_id)
        .eq('tenant_id', authCtx.tenantId)
        .gte('trip_date', period_start)
        .lte('trip_date', period_end);

      const totalDistance = co2Logs?.reduce((sum, l) => sum + Number(l.distance_km), 0) || 0;
      const totalCo2 = co2Logs?.reduce((sum, l) => sum + Number(l.co2_emitted_kg), 0) || 0;
      const totalTrips = co2Logs?.length || 0;

      // Score calculation (100 = perfect eco driving)
      const eventsPerKm = totalDistance > 0 ? totalEvents / totalDistance : 0;
      const idlingScore = Math.max(0, 100 - (idling * 10));
      const accelerationScore = Math.max(0, 100 - (harshAccel * 8) - (harshBrake * 8));
      const speedScore = Math.max(0, 100 - (overspeeding * 12));

      // Fuel efficiency score based on CO2 per km
      const co2PerKm = totalDistance > 0 ? totalCo2 / totalDistance : 0.27;
      const fuelEfficiencyScore = Math.max(0, Math.min(100, (1 - (co2PerKm / 0.35)) * 100));

      const ecoScore = (
        idlingScore * 0.25 +
        accelerationScore * 0.25 +
        speedScore * 0.25 +
        fuelEfficiencyScore * 0.25
      );

      // Estimate CO2 saved vs baseline (0.27 kg/km diesel average)
      const baselineCo2 = totalDistance * 0.27;
      const co2Saved = Math.max(0, baselineCo2 - totalCo2);

      // Upsert the score
      const { data: score, error: scoreErr } = await supabaseAdmin
        .from('eco_driving_scores')
        .upsert({
          tenant_id: authCtx.tenantId,
          driver_id,
          eco_score: Math.round(ecoScore * 100) / 100,
          idling_score: Math.round(idlingScore * 100) / 100,
          acceleration_score: Math.round(accelerationScore * 100) / 100,
          speed_compliance_score: Math.round(speedScore * 100) / 100,
          fuel_efficiency_score: Math.round(fuelEfficiencyScore * 100) / 100,
          co2_saved_kg: Math.round(co2Saved * 1000) / 1000,
          total_trips: totalTrips,
          total_distance_km: Math.round(totalDistance * 100) / 100,
          period_start,
          period_end,
        }, {
          onConflict: 'id',
        })
        .select()
        .single();

      if (scoreErr) throw scoreErr;

      return Response.json({ success: true, score }, { headers: corsHeaders });
    }

    // ── Get fleet sustainability summary ──
    if (action === 'fleet_summary') {
      const { period_start, period_end } = body;

      const start = period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = period_end || new Date().toISOString().split('T')[0];

      // Get all emission logs for the period
      const { data: logs } = await supabaseAdmin
        .from('co2_emission_logs')
        .select('*')
        .eq('tenant_id', authCtx.tenantId)
        .gte('trip_date', start)
        .lte('trip_date', end);

      // Get emission profiles
      const { data: profiles } = await supabaseAdmin
        .from('vehicle_emission_profiles')
        .select('*')
        .eq('tenant_id', authCtx.tenantId);

      const totalCo2 = logs?.reduce((sum, l) => sum + Number(l.co2_emitted_kg), 0) || 0;
      const totalDistance = logs?.reduce((sum, l) => sum + Number(l.distance_km), 0) || 0;
      const totalFuel = logs?.reduce((sum, l) => sum + (Number(l.fuel_consumed_litres) || 0), 0) || 0;

      const evCount = profiles?.filter(p => p.is_zero_emission).length || 0;
      const totalVehicles = profiles?.length || 0;

      // Group by vehicle
      const byVehicle: Record<string, { co2: number; distance: number; trips: number }> = {};
      logs?.forEach(l => {
        if (!byVehicle[l.vehicle_id]) byVehicle[l.vehicle_id] = { co2: 0, distance: 0, trips: 0 };
        byVehicle[l.vehicle_id].co2 += Number(l.co2_emitted_kg);
        byVehicle[l.vehicle_id].distance += Number(l.distance_km);
        byVehicle[l.vehicle_id].trips += 1;
      });

      // Daily trend
      const dailyTrend: Record<string, number> = {};
      logs?.forEach(l => {
        dailyTrend[l.trip_date] = (dailyTrend[l.trip_date] || 0) + Number(l.co2_emitted_kg);
      });

      return Response.json({
        success: true,
        summary: {
          total_co2_kg: Math.round(totalCo2 * 100) / 100,
          total_distance_km: Math.round(totalDistance * 100) / 100,
          total_fuel_litres: Math.round(totalFuel * 100) / 100,
          avg_co2_per_km: totalDistance > 0 ? Math.round((totalCo2 / totalDistance) * 1000) / 1000 : 0,
          ev_count: evCount,
          total_vehicles_profiled: totalVehicles,
          ev_adoption_percent: totalVehicles > 0 ? Math.round((evCount / totalVehicles) * 10000) / 100 : 0,
          period: { start, end },
          vehicle_breakdown: byVehicle,
          daily_trend: dailyTrend,
        }
      }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Unknown action. Use: calculate, compute_eco_score, fleet_summary' }, {
      status: 400, headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in calculate-emissions:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
});
