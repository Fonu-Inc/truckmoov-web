
-- =============================================
-- PHASE 2: Organization Ownership & Visibility
-- =============================================

-- 1. VEHICLES — add owning_org_id and managing_org_id
ALTER TABLE public.vehicles
  ADD COLUMN owning_org_id UUID REFERENCES public.organizations(id),
  ADD COLUMN managing_org_id UUID REFERENCES public.organizations(id);

CREATE INDEX idx_vehicles_owning_org ON public.vehicles(owning_org_id);
CREATE INDEX idx_vehicles_managing_org ON public.vehicles(managing_org_id);

-- 2. DRIVERS — add owning_org_id
ALTER TABLE public.drivers
  ADD COLUMN owning_org_id UUID REFERENCES public.organizations(id);

CREATE INDEX idx_drivers_owning_org ON public.drivers(owning_org_id);

-- 3. DEVICES — add owning_org_id
ALTER TABLE public.devices
  ADD COLUMN owning_org_id UUID REFERENCES public.organizations(id);

CREATE INDEX idx_devices_owning_org ON public.devices(owning_org_id);

-- 4. JOBS — add dual-org ownership model
ALTER TABLE public.jobs
  ADD COLUMN job_owner_org_id UUID REFERENCES public.organizations(id),
  ADD COLUMN executing_org_id UUID REFERENCES public.organizations(id),
  ADD COLUMN assigned_vehicle_id UUID REFERENCES public.vehicles(id),
  ADD COLUMN assigned_driver_id UUID REFERENCES public.drivers(id);

CREATE INDEX idx_jobs_owner_org ON public.jobs(job_owner_org_id);
CREATE INDEX idx_jobs_executing_org ON public.jobs(executing_org_id);
CREATE INDEX idx_jobs_assigned_vehicle ON public.jobs(assigned_vehicle_id);
CREATE INDEX idx_jobs_assigned_driver ON public.jobs(assigned_driver_id);

-- 5. JOB OFFERS — new table for multi-stakeholder dispatch
CREATE TABLE public.job_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_owner_org_id UUID NOT NULL REFERENCES public.organizations(id),
  target_org_id UUID NOT NULL REFERENCES public.organizations(id),
  target_driver_id UUID REFERENCES public.drivers(id),
  target_vehicle_id UUID REFERENCES public.vehicles(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'withdrawn')),
  offered_rate_ngn NUMERIC,
  response_note TEXT,
  offered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_offers_job ON public.job_offers(job_id);
CREATE INDEX idx_job_offers_target_org ON public.job_offers(target_org_id);
CREATE INDEX idx_job_offers_owner_org ON public.job_offers(job_owner_org_id);
CREATE INDEX idx_job_offers_status ON public.job_offers(status);

-- 6. RLS on job_offers
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;

-- Platform admin: full access
CREATE POLICY "Platform admins full access to job_offers"
  ON public.job_offers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'platform_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'platform_admin'
    )
  );

-- Tenant users can view offers involving their organizations
CREATE POLICY "Tenant users view own org job offers"
  ON public.job_offers FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.tenant_id = public.get_user_tenant_id(auth.uid())
        AND (o.id = job_offers.job_owner_org_id OR o.id = job_offers.target_org_id)
    )
  );

-- Tenant users can insert offers from their own orgs
CREATE POLICY "Tenant users create job offers from own org"
  ON public.job_offers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.tenant_id = public.get_user_tenant_id(auth.uid())
        AND o.id = job_offers.job_owner_org_id
    )
  );

-- Tenant users can update offers targeting their orgs (accept/decline)
CREATE POLICY "Tenant users respond to job offers targeting own org"
  ON public.job_offers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.tenant_id = public.get_user_tenant_id(auth.uid())
        AND (o.id = job_offers.target_org_id OR o.id = job_offers.job_owner_org_id)
    )
  );

-- Public SELECT for demo tenant
CREATE POLICY "Public read job_offers for demo tenant"
  ON public.job_offers FOR SELECT
  USING (tenant_id = 'f7f5af88-fd76-4439-aae3-0461be52f63f');

-- 7. Enable realtime for job_offers
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_offers;
