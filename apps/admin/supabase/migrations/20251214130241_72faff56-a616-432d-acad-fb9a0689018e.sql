-- Create broadcast messages table
CREATE TABLE public.broadcast_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  sent_by TEXT,
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create broadcast recipients table
CREATE TABLE public.broadcast_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broadcast_id UUID NOT NULL REFERENCES public.broadcast_messages(id) ON DELETE CASCADE,
  driver_id TEXT NOT NULL,
  driver_name TEXT,
  driver_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  external_message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  reply_content TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_recipients ENABLE ROW LEVEL SECURITY;

-- RLS policies for broadcast_messages
CREATE POLICY "Authenticated users can view broadcasts"
  ON public.broadcast_messages FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert broadcasts"
  ON public.broadcast_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update broadcasts"
  ON public.broadcast_messages FOR UPDATE
  USING (true);

-- RLS policies for broadcast_recipients
CREATE POLICY "Authenticated users can view broadcast recipients"
  ON public.broadcast_recipients FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert broadcast recipients"
  ON public.broadcast_recipients FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update broadcast recipients"
  ON public.broadcast_recipients FOR UPDATE
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_broadcast_recipients_broadcast_id ON public.broadcast_recipients(broadcast_id);
CREATE INDEX idx_broadcast_recipients_status ON public.broadcast_recipients(status);
CREATE INDEX idx_broadcast_messages_tenant_id ON public.broadcast_messages(tenant_id);