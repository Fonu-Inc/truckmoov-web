
-- Create table for driver messages (SMS/WhatsApp)
CREATE TABLE public.driver_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  driver_id TEXT NOT NULL,
  driver_name TEXT,
  driver_phone TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'sms', -- 'sms', 'whatsapp'
  direction TEXT NOT NULL DEFAULT 'outbound', -- 'inbound', 'outbound'
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'read'
  external_id TEXT, -- ID from Fonu/provider
  sender_id TEXT, -- user who sent the message
  sender_name TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for call logs
CREATE TABLE public.driver_call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  driver_id TEXT,
  driver_name TEXT,
  driver_phone TEXT NOT NULL,
  caller_id TEXT, -- user who initiated the call
  caller_name TEXT,
  call_type TEXT NOT NULL DEFAULT 'outbound', -- 'inbound', 'outbound'
  status TEXT NOT NULL DEFAULT 'initiated', -- 'initiated', 'ringing', 'connected', 'completed', 'failed', 'no_answer'
  external_call_id TEXT, -- ID from Fonu
  duration_seconds INTEGER,
  recording_url TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_call_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for driver_messages
CREATE POLICY "Authenticated users can view messages"
ON public.driver_messages FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert messages"
ON public.driver_messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update messages"
ON public.driver_messages FOR UPDATE
USING (true);

-- RLS policies for driver_call_logs
CREATE POLICY "Authenticated users can view call logs"
ON public.driver_call_logs FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert call logs"
ON public.driver_call_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update call logs"
ON public.driver_call_logs FOR UPDATE
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_driver_messages_tenant ON public.driver_messages(tenant_id);
CREATE INDEX idx_driver_messages_driver ON public.driver_messages(driver_id);
CREATE INDEX idx_driver_messages_created ON public.driver_messages(created_at DESC);
CREATE INDEX idx_driver_call_logs_tenant ON public.driver_call_logs(tenant_id);
CREATE INDEX idx_driver_call_logs_driver ON public.driver_call_logs(driver_id);

-- Update trigger for driver_messages
CREATE TRIGGER update_driver_messages_updated_at
BEFORE UPDATE ON public.driver_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
