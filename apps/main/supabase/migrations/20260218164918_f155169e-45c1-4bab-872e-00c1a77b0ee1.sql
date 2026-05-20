
-- Device Setup Requests table
CREATE TABLE public.device_setup_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  requesting_org_id UUID NOT NULL REFERENCES public.organizations(id),
  requester_user_id UUID NOT NULL,
  requester_name TEXT,
  
  -- Device info from requester
  manufacturer TEXT NOT NULL,
  model TEXT,
  catalog_id UUID REFERENCES public.device_catalog(id),
  imei TEXT NOT NULL,
  tracker_type TEXT NOT NULL DEFAULT 'hardwired', -- 'obd', 'hardwired', 'battery'
  
  -- SIM info
  sim_iccid TEXT,
  needs_sim BOOLEAN NOT NULL DEFAULT false,
  linked_sim_request_id UUID, -- references iot_sim_requests if "I need SIM"
  
  -- Vehicle
  vehicle_id UUID REFERENCES public.vehicles(id),
  vehicle_name TEXT,
  
  -- Installation details
  installation_state TEXT,
  installation_city TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  
  -- File uploads
  device_photo_path TEXT,
  receipt_photo_path TEXT,
  
  -- Assignment & processing
  status TEXT NOT NULL DEFAULT 'pending_review',
  -- pending_review, assigned, in_progress, awaiting_heartbeat, active, rejected, cancelled
  assigned_to_user_id UUID,
  assigned_to_name TEXT,
  configurator_org_id UUID REFERENCES public.organizations(id),
  assigned_at TIMESTAMPTZ,
  
  -- Resulting device
  resulting_device_id UUID REFERENCES public.devices(id),
  
  -- Support mode
  is_support_mode BOOLEAN NOT NULL DEFAULT false,
  support_actor_id UUID,
  
  -- Notes
  requester_notes TEXT,
  configurator_notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_device_setup_requests_tenant ON public.device_setup_requests(tenant_id);
CREATE INDEX idx_device_setup_requests_requesting_org ON public.device_setup_requests(requesting_org_id);
CREATE INDEX idx_device_setup_requests_configurator_org ON public.device_setup_requests(configurator_org_id);
CREATE INDEX idx_device_setup_requests_status ON public.device_setup_requests(status);

-- Enable RLS
ALTER TABLE public.device_setup_requests ENABLE ROW LEVEL SECURITY;

-- Requester can view their own org's requests
CREATE POLICY "Members can view own org requests"
ON public.device_setup_requests FOR SELECT
USING (
  public.is_org_member(auth.uid(), requesting_org_id)
  OR public.is_org_member(auth.uid(), configurator_org_id)
  OR public.has_cross_org_visibility(auth.uid(), requesting_org_id)
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);

-- Owner-operators can create requests for their org
CREATE POLICY "Members can create requests for their org"
ON public.device_setup_requests FOR INSERT
WITH CHECK (
  public.is_org_member(auth.uid(), requesting_org_id)
  AND auth.uid() = requester_user_id
);

-- Configurators and platform admins can update requests
CREATE POLICY "Configurators and admins can update requests"
ON public.device_setup_requests FOR UPDATE
USING (
  public.is_org_member(auth.uid(), configurator_org_id)
  OR public.has_cross_org_visibility(auth.uid(), requesting_org_id)
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  OR (public.is_org_member(auth.uid(), requesting_org_id) AND status = 'pending_review')
);

-- Updated_at trigger
CREATE TRIGGER update_device_setup_requests_updated_at
BEFORE UPDATE ON public.device_setup_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Device setup request status history for audit
CREATE TABLE public.device_setup_request_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.device_setup_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'assigned', 'started', 'heartbeat_waiting', 'completed', 'rejected', 'cancelled'
  previous_status TEXT,
  new_status TEXT NOT NULL,
  actor_id UUID,
  actor_name TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_setup_request_events_request ON public.device_setup_request_events(request_id);

ALTER TABLE public.device_setup_request_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Viewable by request participants"
ON public.device_setup_request_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.device_setup_requests r
    WHERE r.id = request_id
    AND (
      public.is_org_member(auth.uid(), r.requesting_org_id)
      OR public.is_org_member(auth.uid(), r.configurator_org_id)
      OR public.has_cross_org_visibility(auth.uid(), r.requesting_org_id)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
    )
  )
);

CREATE POLICY "Actors can insert events"
ON public.device_setup_request_events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.device_setup_requests r
    WHERE r.id = request_id
    AND (
      public.is_org_member(auth.uid(), r.requesting_org_id)
      OR public.is_org_member(auth.uid(), r.configurator_org_id)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
    )
  )
);

-- Storage bucket for device setup uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('device-setup-uploads', 'device-setup-uploads', false);

-- Storage policies
CREATE POLICY "Authenticated users can upload device setup files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'device-setup-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view device setup files"
ON storage.objects FOR SELECT
USING (bucket_id = 'device-setup-uploads' AND auth.role() = 'authenticated');

-- Enable realtime for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_setup_requests;
