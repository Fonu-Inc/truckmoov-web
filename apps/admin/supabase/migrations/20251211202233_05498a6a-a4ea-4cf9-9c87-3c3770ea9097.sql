-- Create table for blocked IPs
CREATE TABLE public.blocked_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  reason TEXT NOT NULL,
  blocked_by UUID REFERENCES auth.users(id),
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  tenant_id TEXT,
  metadata JSONB DEFAULT '{}',
  UNIQUE(ip_address)
);

-- Create index for faster IP lookups
CREATE INDEX idx_blocked_ips_ip_address ON public.blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_expires_at ON public.blocked_ips(expires_at);

-- Enable Row Level Security
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if IP is blocked (public access for edge functions)
CREATE OR REPLACE FUNCTION public.is_ip_blocked(check_ip TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blocked_ips
    WHERE ip_address = check_ip
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Create security definer function to block an IP
CREATE OR REPLACE FUNCTION public.block_ip(
  p_ip_address TEXT,
  p_reason TEXT,
  p_blocked_by UUID DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_is_permanent BOOLEAN DEFAULT false,
  p_tenant_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.blocked_ips (ip_address, reason, blocked_by, expires_at, is_permanent, tenant_id, metadata)
  VALUES (p_ip_address, p_reason, p_blocked_by, p_expires_at, p_is_permanent, p_tenant_id, p_metadata)
  ON CONFLICT (ip_address) 
  DO UPDATE SET 
    reason = EXCLUDED.reason,
    blocked_by = EXCLUDED.blocked_by,
    blocked_at = now(),
    expires_at = EXCLUDED.expires_at,
    is_permanent = EXCLUDED.is_permanent,
    tenant_id = EXCLUDED.tenant_id,
    metadata = EXCLUDED.metadata
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Create security definer function to unblock an IP
CREATE OR REPLACE FUNCTION public.unblock_ip(p_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.blocked_ips WHERE ip_address = p_ip_address;
  RETURN FOUND;
END;
$$;

-- Policy: Platform admins can view all blocked IPs (authenticated users only)
CREATE POLICY "Authenticated users can view blocked IPs"
ON public.blocked_ips
FOR SELECT
TO authenticated
USING (true);

-- Policy: Platform admins can insert blocked IPs
CREATE POLICY "Authenticated users can insert blocked IPs"
ON public.blocked_ips
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Platform admins can delete blocked IPs
CREATE POLICY "Authenticated users can delete blocked IPs"
ON public.blocked_ips
FOR DELETE
TO authenticated
USING (true);

-- Create security audit log table
CREATE TABLE public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_name TEXT,
  tenant_id TEXT,
  tenant_name TEXT,
  description TEXT NOT NULL,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for audit logs
CREATE INDEX idx_security_audit_logs_event_type ON public.security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_severity ON public.security_audit_logs(severity);
CREATE INDEX idx_security_audit_logs_created_at ON public.security_audit_logs(created_at DESC);
CREATE INDEX idx_security_audit_logs_tenant_id ON public.security_audit_logs(tenant_id);

-- Enable RLS on audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view audit logs
CREATE POLICY "Authenticated users can view audit logs"
ON public.security_audit_logs
FOR SELECT
TO authenticated
USING (true);

-- Policy: System can insert audit logs (via security definer function)
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_user_id UUID DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL,
  p_user_name TEXT DEFAULT NULL,
  p_tenant_id TEXT DEFAULT NULL,
  p_tenant_name TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.security_audit_logs (
    event_type, severity, description, user_id, user_email, user_name, 
    tenant_id, tenant_name, ip_address, metadata
  )
  VALUES (
    p_event_type, p_severity, p_description, p_user_id, p_user_email, p_user_name,
    p_tenant_id, p_tenant_name, p_ip_address, p_metadata
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;