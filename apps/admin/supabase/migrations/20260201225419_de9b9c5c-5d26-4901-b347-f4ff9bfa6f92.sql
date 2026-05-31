-- ============================================================
-- PHASE 3: INTELLIGENCE & OPTIMIZATION (ENTERPRISE)
-- ============================================================

-- ============================================================
-- EPIC 6: PREDICTIVE MAINTENANCE
-- ============================================================

-- Story 6.1: Maintenance Risk Scoring
-- Stores computed risk scores for vehicles based on telemetry & history
CREATE TABLE IF NOT EXISTS public.maintenance_risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    
    -- Risk factors (0-100 scale)
    overall_risk_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    age_factor NUMERIC(5,2) DEFAULT 0,
    mileage_factor NUMERIC(5,2) DEFAULT 0,
    engine_hours_factor NUMERIC(5,2) DEFAULT 0,
    overdue_maintenance_factor NUMERIC(5,2) DEFAULT 0,
    behavioral_factor NUMERIC(5,2) DEFAULT 0, -- harsh events, speeding
    historical_breakdown_factor NUMERIC(5,2) DEFAULT 0,
    
    -- Risk classification
    risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    
    -- Evidence & reasoning
    contributing_factors JSONB DEFAULT '[]'::jsonb,
    recommendations TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Computation metadata
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    data_points_analyzed INTEGER DEFAULT 0,
    confidence_score NUMERIC(5,2) DEFAULT 0, -- How confident we are in this score
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_maintenance_risk_scores_tenant_vehicle 
    ON public.maintenance_risk_scores(tenant_id, vehicle_id);
CREATE INDEX idx_maintenance_risk_scores_level 
    ON public.maintenance_risk_scores(risk_level);

-- Story 6.2: Maintenance SLA Dashboard - aggregated metrics
CREATE TABLE IF NOT EXISTS public.maintenance_sla_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL UNIQUE,
    
    -- Current state metrics
    total_vehicles INTEGER DEFAULT 0,
    vehicles_with_overdue INTEGER DEFAULT 0,
    vehicles_with_due_soon INTEGER DEFAULT 0,
    overdue_percentage NUMERIC(5,2) DEFAULT 0,
    
    -- SLA performance
    avg_days_to_service NUMERIC(8,2) DEFAULT 0,
    avg_delay_days NUMERIC(8,2) DEFAULT 0, -- Days past due when serviced
    on_time_completion_rate NUMERIC(5,2) DEFAULT 0,
    
    -- Cost metrics (rolling 30 days)
    total_maintenance_cost_30d NUMERIC(14,2) DEFAULT 0,
    avg_cost_per_vehicle_30d NUMERIC(14,2) DEFAULT 0,
    cost_trend_percentage NUMERIC(8,2) DEFAULT 0, -- vs previous 30 days
    
    -- Completion metrics
    total_completions_30d INTEGER DEFAULT 0,
    preventive_vs_reactive_ratio NUMERIC(5,2) DEFAULT 0, -- Higher = more preventive
    
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- EPIC 7: ADVANCED FUEL INTELLIGENCE
-- ============================================================

-- Story 7.1: Fuel Theft Confidence Scoring
-- Enhanced fuel anomaly with theft confidence
ALTER TABLE public.fuel_anomaly_events 
    ADD COLUMN IF NOT EXISTS theft_confidence_score NUMERIC(5,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS theft_evidence JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS pattern_analysis TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS corroborating_events TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Story 7.2: Driver Fuel Behavior Analysis
CREATE TABLE IF NOT EXISTS public.driver_fuel_efficiency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    
    -- Efficiency metrics (aggregated)
    analysis_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    analysis_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Core metrics
    total_distance_km NUMERIC(12,2) DEFAULT 0,
    total_fuel_consumed_liters NUMERIC(12,2) DEFAULT 0,
    avg_fuel_efficiency_km_per_liter NUMERIC(8,4) DEFAULT 0,
    
    -- Comparative metrics
    fleet_avg_efficiency NUMERIC(8,4) DEFAULT 0,
    efficiency_vs_fleet_percent NUMERIC(8,2) DEFAULT 0, -- Positive = better than fleet
    efficiency_rank INTEGER DEFAULT 0, -- 1 = best in fleet
    
    -- Behavioral indicators (aggregated, not shaming)
    idle_time_hours NUMERIC(10,2) DEFAULT 0,
    harsh_event_count INTEGER DEFAULT 0,
    avg_speed_kmh NUMERIC(6,2) DEFAULT 0,
    
    -- Cost impact
    estimated_fuel_cost_ngn NUMERIC(14,2) DEFAULT 0,
    potential_savings_ngn NUMERIC(14,2) DEFAULT 0, -- If matched fleet avg
    
    -- Analysis metadata
    trips_analyzed INTEGER DEFAULT 0,
    data_completeness_percent NUMERIC(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_driver_fuel_efficiency_tenant_driver 
    ON public.driver_fuel_efficiency(tenant_id, driver_id);
CREATE INDEX idx_driver_fuel_efficiency_period 
    ON public.driver_fuel_efficiency(analysis_period_start, analysis_period_end);

-- ============================================================
-- EPIC 8: FLEET OPTIMIZATION INTEGRATION
-- ============================================================

-- Story 8.1: Vehicle scoring for AI job matching
CREATE TABLE IF NOT EXISTS public.vehicle_dispatch_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    
    -- Composite dispatch readiness score (0-100)
    overall_score NUMERIC(5,2) NOT NULL DEFAULT 100,
    
    -- Component scores
    maintenance_health_score NUMERIC(5,2) DEFAULT 100,
    fuel_efficiency_score NUMERIC(5,2) DEFAULT 100,
    driver_performance_score NUMERIC(5,2) DEFAULT 100,
    reliability_score NUMERIC(5,2) DEFAULT 100, -- Based on breakdown history
    
    -- Flags for AI matching
    is_dispatch_recommended BOOLEAN DEFAULT true,
    recommendation_reasons TEXT[] DEFAULT ARRAY[]::TEXT[],
    risk_warnings TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Last computation
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, vehicle_id)
);

CREATE INDEX idx_vehicle_dispatch_scores_tenant 
    ON public.vehicle_dispatch_scores(tenant_id);
CREATE INDEX idx_vehicle_dispatch_scores_score 
    ON public.vehicle_dispatch_scores(overall_score DESC);

-- ============================================================
-- FEATURE FLAGS FOR PHASED ROLLOUT
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Scope (platform-wide or tenant-specific)
    scope TEXT NOT NULL DEFAULT 'platform' CHECK (scope IN ('platform', 'tenant')),
    tenant_id TEXT DEFAULT NULL, -- NULL for platform-wide
    
    -- Feature identification
    feature_key TEXT NOT NULL,
    feature_name TEXT NOT NULL,
    feature_description TEXT,
    
    -- State
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    
    -- Rollout configuration
    rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage BETWEEN 0 AND 100),
    
    -- Metadata
    category TEXT DEFAULT 'general',
    phase TEXT DEFAULT NULL, -- 'phase_1', 'phase_2', 'phase_3'
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    enabled_by UUID DEFAULT NULL,
    
    UNIQUE(scope, tenant_id, feature_key)
);

-- Insert default Phase 3 feature flags (disabled by default for enterprise)
INSERT INTO public.feature_flags (scope, feature_key, feature_name, feature_description, is_enabled, category, phase)
VALUES 
    ('platform', 'predictive_maintenance', 'Predictive Maintenance', 'Risk scoring and failure prediction', false, 'maintenance', 'phase_3'),
    ('platform', 'maintenance_sla_dashboard', 'Maintenance SLA Dashboard', 'Fleet-level SLA visibility and metrics', false, 'maintenance', 'phase_3'),
    ('platform', 'fuel_theft_detection', 'Fuel Theft Detection', 'Confidence scoring for suspected theft', false, 'fuel', 'phase_3'),
    ('platform', 'driver_fuel_analysis', 'Driver Fuel Behavior Analysis', 'Efficiency analysis by driver', false, 'fuel', 'phase_3'),
    ('platform', 'ai_maintenance_signals', 'AI Matching: Maintenance Signals', 'Feed maintenance risk into job matching', false, 'optimization', 'phase_3'),
    ('platform', 'ai_fuel_signals', 'AI Matching: Fuel Signals', 'Feed fuel efficiency into job matching', false, 'optimization', 'phase_3')
ON CONFLICT (scope, tenant_id, feature_key) DO NOTHING;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Maintenance Risk Scores
ALTER TABLE public.maintenance_risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view own risk scores"
    ON public.maintenance_risk_scores FOR SELECT
    USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "System can manage risk scores"
    ON public.maintenance_risk_scores FOR ALL
    USING (is_platform_admin(auth.uid()));

-- Maintenance SLA Metrics
ALTER TABLE public.maintenance_sla_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view own SLA metrics"
    ON public.maintenance_sla_metrics FOR SELECT
    USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Platform admins can manage SLA metrics"
    ON public.maintenance_sla_metrics FOR ALL
    USING (is_platform_admin(auth.uid()));

-- Driver Fuel Efficiency
ALTER TABLE public.driver_fuel_efficiency ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view own driver efficiency"
    ON public.driver_fuel_efficiency FOR SELECT
    USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Platform admins can manage driver efficiency"
    ON public.driver_fuel_efficiency FOR ALL
    USING (is_platform_admin(auth.uid()));

-- Vehicle Dispatch Scores
ALTER TABLE public.vehicle_dispatch_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view own dispatch scores"
    ON public.vehicle_dispatch_scores FOR SELECT
    USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "System can manage dispatch scores"
    ON public.vehicle_dispatch_scores FOR ALL
    USING (is_platform_admin(auth.uid()));

-- Feature Flags
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage feature flags"
    ON public.feature_flags FOR ALL
    USING (is_platform_admin(auth.uid()));

CREATE POLICY "Tenant admins can view applicable flags"
    ON public.feature_flags FOR SELECT
    USING (
        is_platform_admin(auth.uid()) 
        OR scope = 'platform' 
        OR (scope = 'tenant' AND tenant_id = get_user_tenant_id(auth.uid()))
    );

-- ============================================================
-- HELPER FUNCTION: Check if feature is enabled
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_feature_enabled(
    p_feature_key TEXT,
    p_tenant_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_platform_enabled BOOLEAN;
    v_tenant_enabled BOOLEAN;
BEGIN
    -- Check platform-wide flag
    SELECT is_enabled INTO v_platform_enabled
    FROM feature_flags
    WHERE scope = 'platform' AND feature_key = p_feature_key;
    
    -- If platform flag is disabled, feature is disabled
    IF v_platform_enabled IS NOT TRUE THEN
        RETURN FALSE;
    END IF;
    
    -- If no tenant specified, return platform status
    IF p_tenant_id IS NULL THEN
        RETURN v_platform_enabled;
    END IF;
    
    -- Check tenant-specific override
    SELECT is_enabled INTO v_tenant_enabled
    FROM feature_flags
    WHERE scope = 'tenant' AND tenant_id = p_tenant_id AND feature_key = p_feature_key;
    
    -- If tenant has override, use it; otherwise use platform
    RETURN COALESCE(v_tenant_enabled, v_platform_enabled);
END;
$$;

-- ============================================================
-- FUNCTION: Compute maintenance risk score for a vehicle
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_vehicle_maintenance_risk(
    p_vehicle_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_vehicle RECORD;
    v_age_years NUMERIC;
    v_age_factor NUMERIC := 0;
    v_mileage_factor NUMERIC := 0;
    v_engine_hours_factor NUMERIC := 0;
    v_overdue_factor NUMERIC := 0;
    v_behavioral_factor NUMERIC := 0;
    v_breakdown_factor NUMERIC := 0;
    v_overall_score NUMERIC;
    v_risk_level TEXT;
    v_overdue_count INTEGER;
    v_harsh_events_30d INTEGER;
    v_factors JSONB := '[]'::jsonb;
    v_recommendations TEXT[] := ARRAY[]::TEXT[];
    v_data_points INTEGER := 0;
BEGIN
    -- Get vehicle data
    SELECT * INTO v_vehicle FROM vehicles WHERE id = p_vehicle_id;
    
    IF v_vehicle IS NULL THEN
        RETURN jsonb_build_object('error', 'Vehicle not found');
    END IF;
    
    -- Age factor (older vehicles = higher risk)
    v_age_years := EXTRACT(YEAR FROM age(now(), make_date(v_vehicle.year, 1, 1)));
    v_age_factor := LEAST(100, v_age_years * 5); -- 5 points per year, max 100
    IF v_age_years > 10 THEN
        v_factors := v_factors || jsonb_build_array(jsonb_build_object('factor', 'age', 'value', v_age_years || ' years old', 'impact', 'high'));
    END IF;
    v_data_points := v_data_points + 1;
    
    -- Mileage factor
    IF v_vehicle.current_mileage IS NOT NULL THEN
        v_mileage_factor := LEAST(100, (v_vehicle.current_mileage::NUMERIC / 2000)); -- 1 point per 2000km
        IF v_vehicle.current_mileage > 200000 THEN
            v_factors := v_factors || jsonb_build_array(jsonb_build_object('factor', 'mileage', 'value', v_vehicle.current_mileage || ' km', 'impact', 'high'));
        END IF;
        v_data_points := v_data_points + 1;
    END IF;
    
    -- Engine hours factor
    IF v_vehicle.engine_hours IS NOT NULL THEN
        v_engine_hours_factor := LEAST(100, (v_vehicle.engine_hours::NUMERIC / 50)); -- 1 point per 50 hours
        IF v_vehicle.engine_hours > 5000 THEN
            v_factors := v_factors || jsonb_build_array(jsonb_build_object('factor', 'engine_hours', 'value', v_vehicle.engine_hours || ' hours', 'impact', 'moderate'));
        END IF;
        v_data_points := v_data_points + 1;
    END IF;
    
    -- Overdue maintenance factor
    SELECT COUNT(*) INTO v_overdue_count
    FROM maintenance_profiles
    WHERE vehicle_id = p_vehicle_id 
      AND lifecycle_status = 'overdue'
      AND is_archived = false;
    
    v_overdue_factor := LEAST(100, v_overdue_count * 25); -- 25 points per overdue item
    IF v_overdue_count > 0 THEN
        v_factors := v_factors || jsonb_build_array(jsonb_build_object('factor', 'overdue_maintenance', 'value', v_overdue_count || ' overdue items', 'impact', 'critical'));
        v_recommendations := array_append(v_recommendations, 'Address overdue maintenance immediately');
    END IF;
    v_data_points := v_data_points + 1;
    
    -- Behavioral factor (harsh events in last 30 days)
    SELECT COUNT(*) INTO v_harsh_events_30d
    FROM driver_behavior_events dbe
    JOIN devices d ON d.id = dbe.device_id
    WHERE d.vehicle_id = p_vehicle_id
      AND dbe.created_at > now() - interval '30 days'
      AND dbe.event_type IN ('harsh_braking', 'harsh_acceleration', 'harsh_cornering');
    
    v_behavioral_factor := LEAST(100, v_harsh_events_30d * 5); -- 5 points per harsh event
    IF v_harsh_events_30d > 10 THEN
        v_factors := v_factors || jsonb_build_array(jsonb_build_object('factor', 'driving_behavior', 'value', v_harsh_events_30d || ' harsh events in 30 days', 'impact', 'moderate'));
        v_recommendations := array_append(v_recommendations, 'Review driver behavior patterns');
    END IF;
    v_data_points := v_data_points + 1;
    
    -- Calculate overall score (weighted average)
    v_overall_score := (
        v_age_factor * 0.15 +
        v_mileage_factor * 0.20 +
        v_engine_hours_factor * 0.15 +
        v_overdue_factor * 0.30 +
        v_behavioral_factor * 0.10 +
        v_breakdown_factor * 0.10
    );
    
    -- Determine risk level
    v_risk_level := CASE
        WHEN v_overall_score >= 75 THEN 'critical'
        WHEN v_overall_score >= 50 THEN 'high'
        WHEN v_overall_score >= 25 THEN 'moderate'
        ELSE 'low'
    END;
    
    -- Add general recommendations based on risk level
    IF v_risk_level IN ('high', 'critical') THEN
        v_recommendations := array_append(v_recommendations, 'Schedule comprehensive inspection');
        v_recommendations := array_append(v_recommendations, 'Consider reducing dispatch frequency');
    END IF;
    
    -- Upsert the risk score
    INSERT INTO maintenance_risk_scores (
        tenant_id, vehicle_id, overall_risk_score, age_factor, mileage_factor,
        engine_hours_factor, overdue_maintenance_factor, behavioral_factor,
        historical_breakdown_factor, risk_level, contributing_factors,
        recommendations, computed_at, data_points_analyzed,
        confidence_score
    )
    VALUES (
        v_vehicle.tenant_id, p_vehicle_id, v_overall_score, v_age_factor, v_mileage_factor,
        v_engine_hours_factor, v_overdue_factor, v_behavioral_factor,
        v_breakdown_factor, v_risk_level, v_factors,
        v_recommendations, now(), v_data_points,
        LEAST(100, v_data_points * 20) -- Confidence based on data availability
    )
    ON CONFLICT (tenant_id, vehicle_id) DO UPDATE SET
        overall_risk_score = EXCLUDED.overall_risk_score,
        age_factor = EXCLUDED.age_factor,
        mileage_factor = EXCLUDED.mileage_factor,
        engine_hours_factor = EXCLUDED.engine_hours_factor,
        overdue_maintenance_factor = EXCLUDED.overdue_maintenance_factor,
        behavioral_factor = EXCLUDED.behavioral_factor,
        historical_breakdown_factor = EXCLUDED.historical_breakdown_factor,
        risk_level = EXCLUDED.risk_level,
        contributing_factors = EXCLUDED.contributing_factors,
        recommendations = EXCLUDED.recommendations,
        computed_at = EXCLUDED.computed_at,
        data_points_analyzed = EXCLUDED.data_points_analyzed,
        confidence_score = EXCLUDED.confidence_score,
        updated_at = now();
    
    RETURN jsonb_build_object(
        'vehicle_id', p_vehicle_id,
        'overall_risk_score', v_overall_score,
        'risk_level', v_risk_level,
        'factors', v_factors,
        'recommendations', v_recommendations,
        'confidence', LEAST(100, v_data_points * 20)
    );
END;
$$;

-- Add unique constraint for risk scores
ALTER TABLE public.maintenance_risk_scores 
    ADD CONSTRAINT unique_tenant_vehicle_risk UNIQUE (tenant_id, vehicle_id);

-- ============================================================
-- FUNCTION: Compute fleet SLA metrics
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_tenant_sla_metrics(
    p_tenant_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_vehicles INTEGER;
    v_overdue_vehicles INTEGER;
    v_due_soon_vehicles INTEGER;
    v_overdue_pct NUMERIC;
    v_avg_delay NUMERIC;
    v_cost_30d NUMERIC;
    v_prev_cost_30d NUMERIC;
    v_cost_trend NUMERIC;
    v_completions_30d INTEGER;
    v_on_time_rate NUMERIC;
BEGIN
    -- Count vehicles by maintenance status
    SELECT 
        COUNT(DISTINCT v.id),
        COUNT(DISTINCT CASE WHEN mp.lifecycle_status = 'overdue' THEN v.id END),
        COUNT(DISTINCT CASE WHEN mp.lifecycle_status = 'due' THEN v.id END)
    INTO v_total_vehicles, v_overdue_vehicles, v_due_soon_vehicles
    FROM vehicles v
    LEFT JOIN maintenance_profiles mp ON mp.vehicle_id = v.id AND mp.is_archived = false
    WHERE v.tenant_id = p_tenant_id AND v.status != 'decommissioned';
    
    v_overdue_pct := CASE WHEN v_total_vehicles > 0 
        THEN (v_overdue_vehicles::NUMERIC / v_total_vehicles * 100) 
        ELSE 0 END;
    
    -- Calculate completion metrics (last 30 days)
    SELECT 
        COUNT(*),
        COALESCE(SUM(cost_ngn), 0),
        AVG(CASE WHEN completed_at > next_due_date THEN 
            EXTRACT(DAY FROM completed_at - next_due_date)
            ELSE 0 END)
    INTO v_completions_30d, v_cost_30d, v_avg_delay
    FROM maintenance_completions mc
    JOIN maintenance_profiles mp ON mp.id = mc.profile_id
    WHERE mc.tenant_id = p_tenant_id
      AND mc.completed_at > now() - interval '30 days';
    
    -- Previous 30 days cost for trend
    SELECT COALESCE(SUM(cost_ngn), 0) INTO v_prev_cost_30d
    FROM maintenance_completions mc
    WHERE mc.tenant_id = p_tenant_id
      AND mc.completed_at BETWEEN now() - interval '60 days' AND now() - interval '30 days';
    
    v_cost_trend := CASE WHEN v_prev_cost_30d > 0 
        THEN ((v_cost_30d - v_prev_cost_30d) / v_prev_cost_30d * 100)
        ELSE 0 END;
    
    -- On-time completion rate
    SELECT 
        CASE WHEN COUNT(*) > 0 THEN
            COUNT(CASE WHEN completed_at <= next_due_date THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100
        ELSE 100 END
    INTO v_on_time_rate
    FROM maintenance_completions mc
    JOIN maintenance_profiles mp ON mp.id = mc.profile_id
    WHERE mc.tenant_id = p_tenant_id
      AND mc.completed_at > now() - interval '90 days';
    
    -- Upsert metrics
    INSERT INTO maintenance_sla_metrics (
        tenant_id, total_vehicles, vehicles_with_overdue, vehicles_with_due_soon,
        overdue_percentage, avg_delay_days, total_maintenance_cost_30d,
        avg_cost_per_vehicle_30d, cost_trend_percentage, total_completions_30d,
        on_time_completion_rate, computed_at
    )
    VALUES (
        p_tenant_id, v_total_vehicles, v_overdue_vehicles, v_due_soon_vehicles,
        v_overdue_pct, COALESCE(v_avg_delay, 0), v_cost_30d,
        CASE WHEN v_total_vehicles > 0 THEN v_cost_30d / v_total_vehicles ELSE 0 END,
        v_cost_trend, v_completions_30d, v_on_time_rate, now()
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
        total_vehicles = EXCLUDED.total_vehicles,
        vehicles_with_overdue = EXCLUDED.vehicles_with_overdue,
        vehicles_with_due_soon = EXCLUDED.vehicles_with_due_soon,
        overdue_percentage = EXCLUDED.overdue_percentage,
        avg_delay_days = EXCLUDED.avg_delay_days,
        total_maintenance_cost_30d = EXCLUDED.total_maintenance_cost_30d,
        avg_cost_per_vehicle_30d = EXCLUDED.avg_cost_per_vehicle_30d,
        cost_trend_percentage = EXCLUDED.cost_trend_percentage,
        total_completions_30d = EXCLUDED.total_completions_30d,
        on_time_completion_rate = EXCLUDED.on_time_completion_rate,
        computed_at = EXCLUDED.computed_at,
        updated_at = now();
    
    RETURN jsonb_build_object(
        'total_vehicles', v_total_vehicles,
        'overdue_vehicles', v_overdue_vehicles,
        'overdue_percentage', v_overdue_pct,
        'cost_30d', v_cost_30d,
        'cost_trend', v_cost_trend,
        'on_time_rate', v_on_time_rate
    );
END;
$$;

-- ============================================================
-- FUNCTION: Get vehicle dispatch score for AI matching
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_vehicle_dispatch_scores(
    p_tenant_id TEXT,
    p_vehicle_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    vehicle_id UUID,
    overall_score NUMERIC,
    maintenance_health_score NUMERIC,
    fuel_efficiency_score NUMERIC,
    is_recommended BOOLEAN,
    risk_warnings TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vds.vehicle_id,
        vds.overall_score,
        vds.maintenance_health_score,
        vds.fuel_efficiency_score,
        vds.is_dispatch_recommended,
        vds.risk_warnings
    FROM vehicle_dispatch_scores vds
    WHERE vds.tenant_id = p_tenant_id
      AND (p_vehicle_ids IS NULL OR vds.vehicle_id = ANY(p_vehicle_ids));
END;
$$;