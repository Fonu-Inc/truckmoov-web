-- Create a table to track KYC notification emails
CREATE TABLE public.kyc_notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  tenant_email TEXT NOT NULL,
  tenant_name TEXT,
  document_id UUID REFERENCES public.tenant_kyc_documents(id) ON DELETE SET NULL,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('approved', 'rejected')),
  rejection_reason TEXT,
  email_subject TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  error_message TEXT,
  resend_message_id TEXT,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kyc_notification_logs ENABLE ROW LEVEL SECURITY;

-- Platform admins can view all notification logs
CREATE POLICY "Platform admins can view all notification logs"
ON public.kyc_notification_logs
FOR SELECT
USING (is_platform_admin(auth.uid()));

-- Platform admins can insert notification logs
CREATE POLICY "Platform admins can insert notification logs"
ON public.kyc_notification_logs
FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()));

-- System can insert notification logs (for edge functions)
CREATE POLICY "System can insert notification logs"
ON public.kyc_notification_logs
FOR INSERT
WITH CHECK (true);

-- Platform admins can update notification logs
CREATE POLICY "Platform admins can update notification logs"
ON public.kyc_notification_logs
FOR UPDATE
USING (is_platform_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_kyc_notification_logs_tenant_id ON public.kyc_notification_logs(tenant_id);
CREATE INDEX idx_kyc_notification_logs_sent_at ON public.kyc_notification_logs(sent_at DESC);
CREATE INDEX idx_kyc_notification_logs_delivery_status ON public.kyc_notification_logs(delivery_status);