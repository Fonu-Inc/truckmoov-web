-- =====================================================
-- PHASE 1: MAINTENANCE SCHEDULING & FUEL MONITORING
-- =====================================================

-- 1. Create maintenance service type enum
CREATE TYPE public.maintenance_interval_type AS ENUM ('date', 'mileage', 'both');
CREATE TYPE public.maintenance_lifecycle_status AS ENUM ('upcoming', 'due', 'overdue', 'completed');

-- 2. Create maintenance_profiles table (Story 1.1)
CREATE TABLE public.maintenance_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL, -- Oil Change, Brakes, Inspection, Tire Rotation, etc.
    service_label TEXT, -- Custom label
    interval_type maintenance_interval_type NOT NULL DEFAULT 'date',
    -- Date-based interval
    interval_days INTEGER, -- Days between services
    interval_months INTEGER, -- Months between services
    -- Mileage-based interval
    interval_km INTEGER, -- Kilometers between services
    -- Tracking
    last_service_date TIMESTAMP WITH TIME ZONE,
    last_service_mileage INTEGER,
    next_due_date TIMESTAMP WITH TIME ZONE,
    next_due_mileage INTEGER,
    -- Thresholds for DUE status
    due_soon_days INTEGER DEFAULT 7, -- Days before due to mark as DUE
    due_soon_km INTEGER DEFAULT 500, -- KM before due to mark as DUE
    -- Status
    lifecycle_status maintenance_lifecycle_status NOT NULL DEFAULT 'upcoming',
    is_archived BOOLEAN NOT NULL DEFAULT false,
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    
    CONSTRAINT valid_interval CHECK (
        (interval_type = 'date' AND (interval_days IS NOT NULL OR interval_months IS NOT NULL)) OR
        (interval_type = 'mileage' AND interval_km IS NOT NULL) OR
        (interval_type = 'both' AND (interval_days IS NOT NULL OR interval_months IS NOT NULL) AND interval_km IS NOT NULL)
    )
);

-- 3. Add mileage tracking to vehicles table (Story 1.3)
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS current_mileage INTEGER,
ADD COLUMN IF NOT EXISTS mileage_source TEXT DEFAULT 'manual' CHECK (mileage_source IN ('telemetry', 'manual')),
ADD COLUMN IF NOT EXISTS last_mileage_update TIMESTAMP WITH TIME ZONE;

-- 4. Add alert tracking to maintenance_profiles
ALTER TABLE public.maintenance_profiles
ADD COLUMN IF NOT EXISTS due_alert_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS overdue_alert_sent BOOLEAN DEFAULT false;

-- 5. Create vehicle_fuel_efficiency table for tracking efficiency per vehicle
CREATE TABLE public.vehicle_fuel_efficiency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_distance_km NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_fuel_liters NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_cost_ngn NUMERIC(12, 2) NOT NULL DEFAULT 0,
    efficiency_km_per_liter NUMERIC(6, 2),
    cost_per_km_ngn NUMERIC(8, 2),
    transaction_count INTEGER DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(vehicle_id, period_start, period_end)
);

-- 6. Add fuel efficiency threshold settings to tenants
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS fuel_efficiency_threshold_km_l NUMERIC(6, 2) DEFAULT 7.0,
ADD COLUMN IF NOT EXISTS fuel_efficiency_alert_enabled BOOLEAN DEFAULT true;

-- 7. Enable RLS on new tables
ALTER TABLE public.maintenance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_fuel_efficiency ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies for maintenance_profiles
CREATE POLICY "Users can view maintenance profiles in their tenant"
ON public.maintenance_profiles FOR SELECT
USING (
    public.is_platform_admin(auth.uid()) OR
    tenant_id = public.get_user_tenant_id(auth.uid())
);

CREATE POLICY "Tenant admins and ops managers can manage maintenance profiles"
ON public.maintenance_profiles FOR ALL
USING (
    public.is_platform_admin(auth.uid()) OR
    (tenant_id = public.get_user_tenant_id(auth.uid()) AND 
     public.get_user_role(auth.uid()) IN ('tenant_admin', 'operations_manager'))
);

-- 9. RLS policies for vehicle_fuel_efficiency
CREATE POLICY "Users can view fuel efficiency in their tenant"
ON public.vehicle_fuel_efficiency FOR SELECT
USING (
    public.is_platform_admin(auth.uid()) OR
    tenant_id = public.get_user_tenant_id(auth.uid())
);

CREATE POLICY "System can manage fuel efficiency records"
ON public.vehicle_fuel_efficiency FOR ALL
USING (
    public.is_platform_admin(auth.uid()) OR
    (tenant_id = public.get_user_tenant_id(auth.uid()) AND 
     public.get_user_role(auth.uid()) IN ('tenant_admin', 'operations_manager'))
);

-- 10. Function to compute maintenance lifecycle status
CREATE OR REPLACE FUNCTION public.compute_maintenance_lifecycle_status(
    p_profile_id UUID
) RETURNS maintenance_lifecycle_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile RECORD;
    v_vehicle RECORD;
    v_days_until_due INTEGER;
    v_km_until_due INTEGER;
BEGIN
    -- Get profile and vehicle
    SELECT mp.*, v.current_mileage
    INTO v_profile
    FROM maintenance_profiles mp
    JOIN vehicles v ON v.id = mp.vehicle_id
    WHERE mp.id = p_profile_id;
    
    IF NOT FOUND THEN
        RETURN 'upcoming';
    END IF;
    
    -- Already completed stays completed
    IF v_profile.lifecycle_status = 'completed' THEN
        RETURN 'completed';
    END IF;
    
    -- Check date-based threshold
    IF v_profile.next_due_date IS NOT NULL THEN
        v_days_until_due := EXTRACT(DAY FROM (v_profile.next_due_date - now()));
        
        IF v_days_until_due < 0 THEN
            RETURN 'overdue';
        ELSIF v_days_until_due <= COALESCE(v_profile.due_soon_days, 7) THEN
            RETURN 'due';
        END IF;
    END IF;
    
    -- Check mileage-based threshold
    IF v_profile.next_due_mileage IS NOT NULL AND v_profile.current_mileage IS NOT NULL THEN
        v_km_until_due := v_profile.next_due_mileage - v_profile.current_mileage;
        
        IF v_km_until_due < 0 THEN
            RETURN 'overdue';
        ELSIF v_km_until_due <= COALESCE(v_profile.due_soon_km, 500) THEN
            RETURN 'due';
        END IF;
    END IF;
    
    RETURN 'upcoming';
END;
$$;

-- 11. Function to update vehicle mileage from telemetry
CREATE OR REPLACE FUNCTION public.update_vehicle_mileage_from_telemetry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_device RECORD;
BEGIN
    -- Get the device and its associated vehicle
    SELECT d.vehicle_id, d.tenant_id
    INTO v_device
    FROM devices d
    WHERE d.id = NEW.device_id AND d.vehicle_id IS NOT NULL;
    
    IF FOUND AND NEW.odometer IS NOT NULL THEN
        -- Update vehicle mileage from telemetry
        UPDATE vehicles
        SET 
            current_mileage = NEW.odometer,
            mileage_source = 'telemetry',
            last_mileage_update = now(),
            updated_at = now()
        WHERE id = v_device.vehicle_id
          AND (current_mileage IS NULL OR NEW.odometer > current_mileage);
    END IF;
    
    RETURN NEW;
END;
$$;

-- 12. Create trigger for mileage updates
DROP TRIGGER IF EXISTS trg_update_vehicle_mileage ON device_telemetry;
CREATE TRIGGER trg_update_vehicle_mileage
AFTER INSERT ON device_telemetry
FOR EACH ROW
WHEN (NEW.odometer IS NOT NULL)
EXECUTE FUNCTION update_vehicle_mileage_from_telemetry();

-- 13. Function to calculate fuel efficiency for a vehicle
CREATE OR REPLACE FUNCTION public.calculate_vehicle_fuel_efficiency(
    p_vehicle_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT (now() - INTERVAL '30 days'),
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT now()
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result RECORD;
    v_vehicle RECORD;
    v_distance_km NUMERIC;
    v_efficiency NUMERIC;
    v_cost_per_km NUMERIC;
BEGIN
    -- Get vehicle info
    SELECT * INTO v_vehicle FROM vehicles WHERE id = p_vehicle_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Vehicle not found');
    END IF;
    
    -- Get fuel transaction totals
    SELECT 
        COALESCE(SUM(quantity_liters), 0) as total_liters,
        COALESCE(SUM(cost_ngn), 0) as total_cost,
        COUNT(*) as transaction_count,
        MIN(odometer_reading) as start_odometer,
        MAX(odometer_reading) as end_odometer
    INTO v_result
    FROM fuel_transactions
    WHERE vehicle_id = p_vehicle_id::text
      AND transaction_date BETWEEN p_start_date AND p_end_date;
    
    -- Calculate distance from odometer readings if available
    IF v_result.start_odometer IS NOT NULL AND v_result.end_odometer IS NOT NULL THEN
        v_distance_km := v_result.end_odometer - v_result.start_odometer;
    ELSE
        v_distance_km := 0;
    END IF;
    
    -- Calculate efficiency
    IF v_result.total_liters > 0 AND v_distance_km > 0 THEN
        v_efficiency := ROUND(v_distance_km / v_result.total_liters, 2);
        v_cost_per_km := ROUND(v_result.total_cost / v_distance_km, 2);
    ELSE
        v_efficiency := NULL;
        v_cost_per_km := NULL;
    END IF;
    
    RETURN jsonb_build_object(
        'vehicle_id', p_vehicle_id,
        'period_start', p_start_date,
        'period_end', p_end_date,
        'total_distance_km', v_distance_km,
        'total_fuel_liters', v_result.total_liters,
        'total_cost_ngn', v_result.total_cost,
        'efficiency_km_per_liter', v_efficiency,
        'cost_per_km_ngn', v_cost_per_km,
        'transaction_count', v_result.transaction_count,
        'has_sufficient_data', v_distance_km > 0 AND v_result.total_liters > 0
    );
END;
$$;

-- 14. Function to complete maintenance and recalculate next due
CREATE OR REPLACE FUNCTION public.complete_maintenance_profile(
    p_profile_id UUID,
    p_completion_mileage INTEGER DEFAULT NULL,
    p_completion_cost NUMERIC DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile RECORD;
    v_next_date TIMESTAMP WITH TIME ZONE;
    v_next_mileage INTEGER;
BEGIN
    -- Get the profile
    SELECT * INTO v_profile FROM maintenance_profiles WHERE id = p_profile_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
    END IF;
    
    -- Calculate next due date
    IF v_profile.interval_days IS NOT NULL THEN
        v_next_date := now() + (v_profile.interval_days || ' days')::INTERVAL;
    ELSIF v_profile.interval_months IS NOT NULL THEN
        v_next_date := now() + (v_profile.interval_months || ' months')::INTERVAL;
    END IF;
    
    -- Calculate next due mileage
    IF v_profile.interval_km IS NOT NULL AND p_completion_mileage IS NOT NULL THEN
        v_next_mileage := p_completion_mileage + v_profile.interval_km;
    END IF;
    
    -- Update the profile
    UPDATE maintenance_profiles
    SET 
        lifecycle_status = 'upcoming',
        last_service_date = now(),
        last_service_mileage = p_completion_mileage,
        next_due_date = v_next_date,
        next_due_mileage = v_next_mileage,
        due_alert_sent = false,
        overdue_alert_sent = false,
        updated_at = now()
    WHERE id = p_profile_id;
    
    -- Create maintenance record for history
    INSERT INTO maintenance_records (
        tenant_id,
        vehicle_id,
        vehicle_name,
        maintenance_type,
        status,
        scheduled_date,
        completed_date,
        cost_ngn,
        notes,
        priority
    )
    SELECT 
        v_profile.tenant_id,
        v_profile.vehicle_id::text,
        v.registration_number,
        v_profile.service_type,
        'completed',
        COALESCE(v_profile.next_due_date, now()),
        now(),
        p_completion_cost,
        p_notes,
        'medium'
    FROM vehicles v WHERE v.id = v_profile.vehicle_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'next_due_date', v_next_date,
        'next_due_mileage', v_next_mileage
    );
END;
$$;

-- 15. Add updated_at trigger for maintenance_profiles
CREATE TRIGGER update_maintenance_profiles_updated_at
BEFORE UPDATE ON maintenance_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 16. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_profiles_tenant ON maintenance_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_profiles_vehicle ON maintenance_profiles(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_profiles_status ON maintenance_profiles(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_maintenance_profiles_next_due ON maintenance_profiles(next_due_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_fuel_efficiency_vehicle ON vehicle_fuel_efficiency(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_fuel_efficiency_period ON vehicle_fuel_efficiency(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_vehicles_mileage ON vehicles(current_mileage) WHERE current_mileage IS NOT NULL;