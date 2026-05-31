-- Create table for tracking IVR call notifications and driver responses
CREATE TABLE public.driver_ivr_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  driver_name TEXT,
  job_id TEXT,
  call_type TEXT NOT NULL DEFAULT 'new_job', -- new_job, update, urgent
  call_status TEXT NOT NULL DEFAULT 'initiated', -- initiated, ringing, answered, no_answer, busy, failed
  driver_response TEXT, -- accepted, rejected, pending, no_response
  fonu_call_id TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  call_duration_seconds INTEGER,
  response_received_at TIMESTAMP WITH TIME ZONE,
  job_details JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_ivr_calls ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view IVR calls"
ON public.driver_ivr_calls
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert IVR calls"
ON public.driver_ivr_calls
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update IVR calls"
ON public.driver_ivr_calls
FOR UPDATE
USING (true);

-- Create indexes for common queries
CREATE INDEX idx_driver_ivr_calls_tenant ON public.driver_ivr_calls(tenant_id);
CREATE INDEX idx_driver_ivr_calls_created ON public.driver_ivr_calls(created_at DESC);
CREATE INDEX idx_driver_ivr_calls_status ON public.driver_ivr_calls(call_status);
CREATE INDEX idx_driver_ivr_calls_response ON public.driver_ivr_calls(driver_response);

-- Trigger for updated_at
CREATE TRIGGER update_driver_ivr_calls_updated_at
BEFORE UPDATE ON public.driver_ivr_calls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_ivr_calls;