-- =============================================
-- ENFORCE TENANT DATA ISOLATION (Tenant-only + Platform-all)
-- =============================================

-- 1. Drop overly permissive demo policies and replace with strict tenant isolation

-- VEHICLES TABLE
DROP POLICY IF EXISTS "Anyone can view vehicles for demo" ON public.vehicles;
DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON public.vehicles;

CREATE POLICY "Tenant users view own vehicles"
  ON public.vehicles FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert vehicles" ON public.vehicles;
CREATE POLICY "Tenant users insert own vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update vehicles" ON public.vehicles;
CREATE POLICY "Tenant users update own vehicles"
  ON public.vehicles FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete vehicles" ON public.vehicles;
CREATE POLICY "Tenant users delete own vehicles"
  ON public.vehicles FOR DELETE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- DRIVERS TABLE
DROP POLICY IF EXISTS "Anyone can view drivers for demo" ON public.drivers;
DROP POLICY IF EXISTS "Authenticated users can view drivers" ON public.drivers;

CREATE POLICY "Tenant users view own drivers"
  ON public.drivers FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert drivers" ON public.drivers;
CREATE POLICY "Tenant users insert own drivers"
  ON public.drivers FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update drivers" ON public.drivers;
CREATE POLICY "Tenant users update own drivers"
  ON public.drivers FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete drivers" ON public.drivers;
CREATE POLICY "Tenant users delete own drivers"
  ON public.drivers FOR DELETE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- DEVICES TABLE
DROP POLICY IF EXISTS "Anyone can view devices" ON public.devices;
DROP POLICY IF EXISTS "Authenticated users can view devices" ON public.devices;

CREATE POLICY "Tenant users view own devices"
  ON public.devices FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- DEVICE TELEMETRY TABLE
DROP POLICY IF EXISTS "Anyone can view telemetry" ON public.device_telemetry;
DROP POLICY IF EXISTS "Authenticated users can view telemetry" ON public.device_telemetry;

CREATE POLICY "Tenant users view own telemetry"
  ON public.device_telemetry FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- FUEL TRANSACTIONS TABLE
DROP POLICY IF EXISTS "Authenticated users can view fuel transactions" ON public.fuel_transactions;

CREATE POLICY "Tenant users view own fuel transactions"
  ON public.fuel_transactions FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert fuel transactions" ON public.fuel_transactions;
CREATE POLICY "Tenant users insert own fuel transactions"
  ON public.fuel_transactions FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update fuel transactions" ON public.fuel_transactions;
CREATE POLICY "Tenant users update own fuel transactions"
  ON public.fuel_transactions FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete fuel transactions" ON public.fuel_transactions;
CREATE POLICY "Tenant users delete own fuel transactions"
  ON public.fuel_transactions FOR DELETE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- MAINTENANCE RECORDS TABLE
DROP POLICY IF EXISTS "Authenticated users can view maintenance records" ON public.maintenance_records;

CREATE POLICY "Tenant users view own maintenance records"
  ON public.maintenance_records FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert maintenance records" ON public.maintenance_records;
CREATE POLICY "Tenant users insert own maintenance records"
  ON public.maintenance_records FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update maintenance records" ON public.maintenance_records;
CREATE POLICY "Tenant users update own maintenance records"
  ON public.maintenance_records FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete maintenance records" ON public.maintenance_records;
CREATE POLICY "Tenant users delete own maintenance records"
  ON public.maintenance_records FOR DELETE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- COMPLIANCE DOCUMENTS TABLE
DROP POLICY IF EXISTS "Authenticated users can view compliance documents" ON public.compliance_documents;

CREATE POLICY "Tenant users view own compliance documents"
  ON public.compliance_documents FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert compliance documents" ON public.compliance_documents;
CREATE POLICY "Tenant users insert own compliance documents"
  ON public.compliance_documents FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update compliance documents" ON public.compliance_documents;
CREATE POLICY "Tenant users update own compliance documents"
  ON public.compliance_documents FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete compliance documents" ON public.compliance_documents;
CREATE POLICY "Tenant users delete own compliance documents"
  ON public.compliance_documents FOR DELETE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- DRIVER MESSAGES TABLE
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.driver_messages;

CREATE POLICY "Tenant users view own messages"
  ON public.driver_messages FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.driver_messages;
CREATE POLICY "Tenant users insert own messages"
  ON public.driver_messages FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update messages" ON public.driver_messages;
CREATE POLICY "Tenant users update own messages"
  ON public.driver_messages FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- BROADCAST MESSAGES TABLE
DROP POLICY IF EXISTS "Authenticated users can view broadcasts" ON public.broadcast_messages;

CREATE POLICY "Tenant users view own broadcasts"
  ON public.broadcast_messages FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert broadcasts" ON public.broadcast_messages;
CREATE POLICY "Tenant users insert own broadcasts"
  ON public.broadcast_messages FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update broadcasts" ON public.broadcast_messages;
CREATE POLICY "Tenant users update own broadcasts"
  ON public.broadcast_messages FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- BROADCAST RECIPIENTS TABLE (join with broadcast_messages for tenant check)
DROP POLICY IF EXISTS "Authenticated users can view broadcast recipients" ON public.broadcast_recipients;

CREATE POLICY "Tenant users view own broadcast recipients"
  ON public.broadcast_recipients FOR SELECT
  USING (
    is_platform_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.broadcast_messages bm 
      WHERE bm.id = broadcast_id AND bm.tenant_id = get_user_tenant_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert broadcast recipients" ON public.broadcast_recipients;
CREATE POLICY "Tenant users insert own broadcast recipients"
  ON public.broadcast_recipients FOR INSERT
  WITH CHECK (
    is_platform_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.broadcast_messages bm 
      WHERE bm.id = broadcast_id AND bm.tenant_id = get_user_tenant_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can update broadcast recipients" ON public.broadcast_recipients;
CREATE POLICY "Tenant users update own broadcast recipients"
  ON public.broadcast_recipients FOR UPDATE
  USING (
    is_platform_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.broadcast_messages bm 
      WHERE bm.id = broadcast_id AND bm.tenant_id = get_user_tenant_id(auth.uid())
    )
  );

-- DRIVER BEHAVIOR EVENTS TABLE
DROP POLICY IF EXISTS "Authenticated users can view behavior events" ON public.driver_behavior_events;

CREATE POLICY "Tenant users view own behavior events"
  ON public.driver_behavior_events FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- DRIVER FATIGUE ALERTS TABLE (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_fatigue_alerts') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view fatigue alerts" ON public.driver_fatigue_alerts';
    EXECUTE 'CREATE POLICY "Tenant users view own fatigue alerts" ON public.driver_fatigue_alerts FOR SELECT USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()))';
  END IF;
END $$;

-- DRIVER IVR CALLS TABLE
DROP POLICY IF EXISTS "Authenticated users can view IVR calls" ON public.driver_ivr_calls;

CREATE POLICY "Tenant users view own IVR calls"
  ON public.driver_ivr_calls FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert IVR calls" ON public.driver_ivr_calls;
CREATE POLICY "Tenant users insert own IVR calls"
  ON public.driver_ivr_calls FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update IVR calls" ON public.driver_ivr_calls;
CREATE POLICY "Tenant users update own IVR calls"
  ON public.driver_ivr_calls FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- DRIVER CALL LOGS TABLE (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_call_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view call logs" ON public.driver_call_logs';
    EXECUTE 'CREATE POLICY "Tenant users view own call logs" ON public.driver_call_logs FOR SELECT USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()))';
  END IF;
END $$;

-- REMINDER SETTINGS TABLE
DROP POLICY IF EXISTS "Authenticated users can view reminder settings" ON public.reminder_settings;

CREATE POLICY "Tenant users view own reminder settings"
  ON public.reminder_settings FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert reminder settings" ON public.reminder_settings;
CREATE POLICY "Tenant users insert own reminder settings"
  ON public.reminder_settings FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update reminder settings" ON public.reminder_settings;
CREATE POLICY "Tenant users update own reminder settings"
  ON public.reminder_settings FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- DEVICE GEOFENCE ALERTS TABLE (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'device_geofence_alerts') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view geofence alerts" ON public.device_geofence_alerts';
    EXECUTE 'CREATE POLICY "Tenant users view own geofence alerts" ON public.device_geofence_alerts FOR SELECT USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()))';
  END IF;
END $$;

-- IOT SIMS TABLE - Update to include tenant isolation
DROP POLICY IF EXISTS "Anyone can view SIMs for demo" ON public.iot_sims;

CREATE POLICY "Tenant users view own SIMs"
  ON public.iot_sims FOR SELECT
  USING (
    is_platform_admin(auth.uid()) OR 
    (tenant_id IS NOT NULL AND tenant_id = get_user_tenant_id(auth.uid()))
  );

-- INVOICES TABLE
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;

CREATE POLICY "Tenant users view own invoices"
  ON public.invoices FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON public.invoices;
CREATE POLICY "Tenant users insert own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update invoices" ON public.invoices;
CREATE POLICY "Tenant users update own invoices"
  ON public.invoices FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- PAYMENT TRANSACTIONS TABLE
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.payment_transactions;

CREATE POLICY "Tenant users view own payment transactions"
  ON public.payment_transactions FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON public.payment_transactions;
CREATE POLICY "Tenant users insert own payment transactions"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update transactions" ON public.payment_transactions;
CREATE POLICY "Tenant users update own payment transactions"
  ON public.payment_transactions FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- KYC DOCUMENTS TABLE
DROP POLICY IF EXISTS "Authenticated users can view KYC documents" ON public.tenant_kyc_documents;

CREATE POLICY "Tenant users view own KYC documents"
  ON public.tenant_kyc_documents FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert KYC documents" ON public.tenant_kyc_documents;
CREATE POLICY "Tenant users insert own KYC documents"
  ON public.tenant_kyc_documents FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update KYC documents" ON public.tenant_kyc_documents;
CREATE POLICY "Tenant users update own KYC documents"
  ON public.tenant_kyc_documents FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete KYC documents" ON public.tenant_kyc_documents;
CREATE POLICY "Tenant users delete own KYC documents"
  ON public.tenant_kyc_documents FOR DELETE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- TENANT BUSINESS INFO TABLE
DROP POLICY IF EXISTS "Anyone can view business info for demo" ON public.tenant_business_info;
DROP POLICY IF EXISTS "Authenticated users can view business info" ON public.tenant_business_info;

CREATE POLICY "Tenant users view own business info"
  ON public.tenant_business_info FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert business info" ON public.tenant_business_info;
CREATE POLICY "Tenant users insert own business info"
  ON public.tenant_business_info FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update business info" ON public.tenant_business_info;
CREATE POLICY "Tenant users update own business info"
  ON public.tenant_business_info FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- SIM PROVISIONING REQUESTS TABLE
DROP POLICY IF EXISTS "Authorized users can view provisioning requests" ON public.sim_provisioning_requests;

CREATE POLICY "Tenant users view own provisioning requests"
  ON public.sim_provisioning_requests FOR SELECT
  USING (is_platform_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- BLOCKED IPS TABLE (platform admin only for management)
DROP POLICY IF EXISTS "Authenticated users can view blocked IPs" ON public.blocked_ips;

CREATE POLICY "Platform admins and tenant users view relevant blocked IPs"
  ON public.blocked_ips FOR SELECT
  USING (
    is_platform_admin(auth.uid()) OR 
    (tenant_id IS NOT NULL AND tenant_id = get_user_tenant_id(auth.uid()))
  );

DROP POLICY IF EXISTS "Authenticated users can insert blocked IPs" ON public.blocked_ips;
CREATE POLICY "Platform admins and tenant users insert blocked IPs"
  ON public.blocked_ips FOR INSERT
  WITH CHECK (
    is_platform_admin(auth.uid()) OR 
    (tenant_id IS NOT NULL AND tenant_id = get_user_tenant_id(auth.uid()))
  );

DROP POLICY IF EXISTS "Authenticated users can delete blocked IPs" ON public.blocked_ips;
CREATE POLICY "Platform admins and tenant users delete blocked IPs"
  ON public.blocked_ips FOR DELETE
  USING (
    is_platform_admin(auth.uid()) OR 
    (tenant_id IS NOT NULL AND tenant_id = get_user_tenant_id(auth.uid()))
  );

-- SECURITY AUDIT LOGS TABLE
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.security_audit_logs;

CREATE POLICY "Tenant users view relevant audit logs"
  ON public.security_audit_logs FOR SELECT
  USING (
    is_platform_admin(auth.uid()) OR 
    (tenant_id IS NOT NULL AND tenant_id = get_user_tenant_id(auth.uid()))
  );