-- Vehicle Financial Configuration (costs & depreciation)
CREATE TABLE public.vehicle_financial_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  
  -- Fixed monthly costs
  monthly_insurance_ngn NUMERIC DEFAULT 0,
  monthly_driver_wage_ngn NUMERIC DEFAULT 0,
  monthly_parking_ngn NUMERIC DEFAULT 0,
  monthly_other_fixed_ngn NUMERIC DEFAULT 0,
  
  -- Depreciation
  purchase_price_ngn NUMERIC,
  purchase_date DATE,
  useful_life_months INTEGER DEFAULT 60,
  salvage_value_ngn NUMERIC DEFAULT 0,
  depreciation_method TEXT DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance')),
  
  -- Per-trip wage allocation (optional alternative)
  per_trip_wage_ngn NUMERIC DEFAULT 0,
  per_km_wage_ngn NUMERIC DEFAULT 0,
  wage_allocation_method TEXT DEFAULT 'fixed' CHECK (wage_allocation_method IN ('fixed', 'per_trip', 'per_km', 'hybrid')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(vehicle_id)
);

-- Enable RLS
ALTER TABLE public.vehicle_financial_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their tenant's financial config"
ON public.vehicle_financial_config FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin'
));

CREATE POLICY "Tenant admins can manage financial config"
ON public.vehicle_financial_config FOR ALL
USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('tenant_admin', 'platform_admin')
));

-- Job Revenue Enhancement (add revenue fields to jobs)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS revenue_ngn NUMERIC,
ADD COLUMN IF NOT EXISTS billable_km NUMERIC,
ADD COLUMN IF NOT EXISTS billable_hours NUMERIC,
ADD COLUMN IF NOT EXISTS customer_charge_ngn NUMERIC,
ADD COLUMN IF NOT EXISTS profit_margin_percent NUMERIC;

-- Vehicle Financial Summary (aggregated view)
CREATE TABLE public.vehicle_financial_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Costs
  fuel_cost_ngn NUMERIC DEFAULT 0,
  maintenance_cost_ngn NUMERIC DEFAULT 0,
  wage_cost_ngn NUMERIC DEFAULT 0,
  insurance_cost_ngn NUMERIC DEFAULT 0,
  depreciation_ngn NUMERIC DEFAULT 0,
  other_costs_ngn NUMERIC DEFAULT 0,
  total_cost_ngn NUMERIC GENERATED ALWAYS AS (
    COALESCE(fuel_cost_ngn, 0) + COALESCE(maintenance_cost_ngn, 0) + 
    COALESCE(wage_cost_ngn, 0) + COALESCE(insurance_cost_ngn, 0) + 
    COALESCE(depreciation_ngn, 0) + COALESCE(other_costs_ngn, 0)
  ) STORED,
  
  -- Revenue
  total_revenue_ngn NUMERIC DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  total_km_driven NUMERIC DEFAULT 0,
  total_hours_operated NUMERIC DEFAULT 0,
  
  -- Profitability
  net_profit_ngn NUMERIC GENERATED ALWAYS AS (
    COALESCE(total_revenue_ngn, 0) - (
      COALESCE(fuel_cost_ngn, 0) + COALESCE(maintenance_cost_ngn, 0) + 
      COALESCE(wage_cost_ngn, 0) + COALESCE(insurance_cost_ngn, 0) + 
      COALESCE(depreciation_ngn, 0) + COALESCE(other_costs_ngn, 0)
    )
  ) STORED,
  profit_margin_percent NUMERIC,
  profitability_score INTEGER CHECK (profitability_score BETWEEN 0 AND 100),
  profitability_tier TEXT CHECK (profitability_tier IN ('excellent', 'good', 'marginal', 'loss-making')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(vehicle_id, period_start, period_end)
);

-- Enable RLS
ALTER TABLE public.vehicle_financial_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their tenant's financial summaries"
ON public.vehicle_financial_summary FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin'
));

CREATE POLICY "System can manage financial summaries"
ON public.vehicle_financial_summary FOR ALL
USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('tenant_admin', 'platform_admin')
));

-- Function to calculate vehicle profitability for a period
CREATE OR REPLACE FUNCTION public.calculate_vehicle_profitability(
  p_vehicle_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_vehicle RECORD;
  v_config RECORD;
  v_fuel_cost NUMERIC := 0;
  v_maintenance_cost NUMERIC := 0;
  v_revenue NUMERIC := 0;
  v_jobs_count INTEGER := 0;
  v_total_km NUMERIC := 0;
  v_wage_cost NUMERIC := 0;
  v_depreciation NUMERIC := 0;
  v_months NUMERIC;
  v_profit NUMERIC;
  v_margin NUMERIC;
  v_score INTEGER;
  v_tier TEXT;
BEGIN
  -- Get vehicle and config
  SELECT * INTO v_vehicle FROM vehicles WHERE id = p_vehicle_id;
  SELECT * INTO v_config FROM vehicle_financial_config WHERE vehicle_id = p_vehicle_id;
  
  IF NOT FOUND THEN
    v_config := NULL;
  END IF;
  
  -- Calculate months in period
  v_months := EXTRACT(EPOCH FROM (p_end_date - p_start_date)) / (30 * 24 * 60 * 60);
  IF v_months < 1 THEN v_months := 1; END IF;
  
  -- Get fuel costs
  SELECT COALESCE(SUM(cost_ngn), 0) INTO v_fuel_cost
  FROM fuel_transactions
  WHERE vehicle_id = p_vehicle_id::text
    AND transaction_date BETWEEN p_start_date AND p_end_date;
  
  -- Get maintenance costs
  SELECT COALESCE(SUM(cost_ngn), 0) INTO v_maintenance_cost
  FROM maintenance_records
  WHERE vehicle_id = p_vehicle_id::text
    AND completed_date BETWEEN p_start_date AND p_end_date
    AND status = 'completed';
  
  -- Get revenue from jobs
  SELECT 
    COALESCE(SUM(COALESCE(revenue_ngn, rate_ngn, 0)), 0),
    COUNT(*),
    COALESCE(SUM(distance), 0)
  INTO v_revenue, v_jobs_count, v_total_km
  FROM jobs
  WHERE assigned_vehicle_id = p_vehicle_id
    AND status = 'completed'
    AND updated_at BETWEEN p_start_date AND p_end_date;
  
  -- Calculate wage cost based on method
  IF v_config IS NOT NULL THEN
    CASE v_config.wage_allocation_method
      WHEN 'fixed' THEN
        v_wage_cost := v_config.monthly_driver_wage_ngn * v_months;
      WHEN 'per_trip' THEN
        v_wage_cost := v_config.per_trip_wage_ngn * v_jobs_count;
      WHEN 'per_km' THEN
        v_wage_cost := v_config.per_km_wage_ngn * v_total_km;
      WHEN 'hybrid' THEN
        v_wage_cost := (v_config.monthly_driver_wage_ngn * v_months) + 
                       (v_config.per_trip_wage_ngn * v_jobs_count);
      ELSE
        v_wage_cost := v_config.monthly_driver_wage_ngn * v_months;
    END CASE;
    
    -- Calculate depreciation (straight line)
    IF v_config.purchase_price_ngn IS NOT NULL AND v_config.useful_life_months > 0 THEN
      v_depreciation := ((v_config.purchase_price_ngn - COALESCE(v_config.salvage_value_ngn, 0)) 
                         / v_config.useful_life_months) * v_months;
    END IF;
  END IF;
  
  -- Calculate profit and margin
  v_profit := v_revenue - (v_fuel_cost + v_maintenance_cost + v_wage_cost + 
              COALESCE(v_config.monthly_insurance_ngn, 0) * v_months + v_depreciation);
  
  IF v_revenue > 0 THEN
    v_margin := (v_profit / v_revenue) * 100;
  ELSE
    v_margin := 0;
  END IF;
  
  -- Calculate profitability score (0-100)
  v_score := GREATEST(0, LEAST(100, 50 + (v_margin * 0.5)::INTEGER));
  
  -- Determine tier
  v_tier := CASE
    WHEN v_margin >= 25 THEN 'excellent'
    WHEN v_margin >= 10 THEN 'good'
    WHEN v_margin >= 0 THEN 'marginal'
    ELSE 'loss-making'
  END;
  
  RETURN jsonb_build_object(
    'vehicle_id', p_vehicle_id,
    'period_start', p_start_date,
    'period_end', p_end_date,
    'costs', jsonb_build_object(
      'fuel', v_fuel_cost,
      'maintenance', v_maintenance_cost,
      'wages', v_wage_cost,
      'insurance', COALESCE(v_config.monthly_insurance_ngn, 0) * v_months,
      'depreciation', v_depreciation,
      'total', v_fuel_cost + v_maintenance_cost + v_wage_cost + 
               COALESCE(v_config.monthly_insurance_ngn, 0) * v_months + v_depreciation
    ),
    'revenue', jsonb_build_object(
      'total', v_revenue,
      'jobs_completed', v_jobs_count,
      'total_km', v_total_km
    ),
    'profitability', jsonb_build_object(
      'net_profit', v_profit,
      'margin_percent', ROUND(v_margin, 2),
      'score', v_score,
      'tier', v_tier
    )
  );
END;
$$;

-- Indexes for performance
CREATE INDEX idx_vehicle_financial_config_tenant ON public.vehicle_financial_config(tenant_id);
CREATE INDEX idx_vehicle_financial_config_vehicle ON public.vehicle_financial_config(vehicle_id);
CREATE INDEX idx_vehicle_financial_summary_tenant ON public.vehicle_financial_summary(tenant_id);
CREATE INDEX idx_vehicle_financial_summary_vehicle ON public.vehicle_financial_summary(vehicle_id);
CREATE INDEX idx_vehicle_financial_summary_period ON public.vehicle_financial_summary(period_start, period_end);