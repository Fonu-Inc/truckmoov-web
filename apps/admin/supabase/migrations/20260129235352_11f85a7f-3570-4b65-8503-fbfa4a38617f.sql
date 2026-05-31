-- Fix remaining overly permissive policies

-- DRIVER CALL LOGS - Replace with tenant-scoped policies
DROP POLICY IF EXISTS "Authenticated users can insert call logs" ON public.driver_call_logs;
DROP POLICY IF EXISTS "Authenticated users can update call logs" ON public.driver_call_logs;
DROP POLICY IF EXISTS "Authenticated users can view call logs" ON public.driver_call_logs;

CREATE POLICY "Tenant users insert own call logs"
  ON public.driver_call_logs FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant users update own call logs"
  ON public.driver_call_logs FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- TENANT SUBSCRIPTIONS - Replace with tenant-scoped policies
DROP POLICY IF EXISTS "Authenticated users can insert subscriptions" ON public.tenant_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can update subscriptions" ON public.tenant_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can view subscriptions" ON public.tenant_subscriptions;

CREATE POLICY "Tenant users view own subscriptions"
  ON public.tenant_subscriptions FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Platform admins manage subscriptions"
  ON public.tenant_subscriptions FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- TENANTS - Remove demo policy, keep proper policies
DROP POLICY IF EXISTS "Anyone can view tenants for demo" ON public.tenants;

-- Note: The following policies remain intentionally permissive for system-to-system operations:
-- - device_telemetry: IoT devices insert telemetry without user auth
-- - driver_behavior_events: IoT devices insert behavior events without user auth  
-- - device_geofence_alerts: IoT devices insert geofence alerts without user auth
-- - sim_usage_signals: System inserts SIM usage data
-- - driver_fatigue_alerts: System inserts AI-generated fatigue alerts
-- - kyc_notification_logs: System inserts notification logs
-- - wallet_transactions: System inserts wallet transactions (security definer function)
-- - communication_rates: Public read for pricing display
-- - subscription_plans: Public read for plan display