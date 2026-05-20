-- Create maintenance_records table
CREATE TABLE public.maintenance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  vehicle_name TEXT NOT NULL,
  maintenance_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  cost_ngn NUMERIC DEFAULT 0,
  technician TEXT,
  notes TEXT,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fuel_transactions table
CREATE TABLE public.fuel_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  vehicle_name TEXT NOT NULL,
  driver_name TEXT,
  fuel_type TEXT NOT NULL DEFAULT 'diesel',
  quantity_liters NUMERIC NOT NULL,
  cost_ngn NUMERIC NOT NULL,
  odometer_reading NUMERIC,
  station_name TEXT,
  location TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compliance_documents table
CREATE TABLE public.compliance_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  vehicle_id TEXT,
  vehicle_name TEXT,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_number TEXT,
  issue_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid',
  file_path TEXT,
  reminder_days INTEGER DEFAULT 30,
  reminder_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reminder_settings table
CREATE TABLE public.reminder_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  reminder_type TEXT NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  days_before INTEGER[] DEFAULT '{30, 14, 7, 1}',
  recipient_emails TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, reminder_type)
);

-- Enable RLS
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance_records
CREATE POLICY "Authenticated users can view maintenance records"
ON public.maintenance_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert maintenance records"
ON public.maintenance_records FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update maintenance records"
ON public.maintenance_records FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete maintenance records"
ON public.maintenance_records FOR DELETE
TO authenticated
USING (true);

-- RLS Policies for fuel_transactions
CREATE POLICY "Authenticated users can view fuel transactions"
ON public.fuel_transactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert fuel transactions"
ON public.fuel_transactions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update fuel transactions"
ON public.fuel_transactions FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete fuel transactions"
ON public.fuel_transactions FOR DELETE
TO authenticated
USING (true);

-- RLS Policies for compliance_documents
CREATE POLICY "Authenticated users can view compliance documents"
ON public.compliance_documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert compliance documents"
ON public.compliance_documents FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update compliance documents"
ON public.compliance_documents FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete compliance documents"
ON public.compliance_documents FOR DELETE
TO authenticated
USING (true);

-- RLS Policies for reminder_settings
CREATE POLICY "Authenticated users can view reminder settings"
ON public.reminder_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert reminder settings"
ON public.reminder_settings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update reminder settings"
ON public.reminder_settings FOR UPDATE
TO authenticated
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_maintenance_records_updated_at
BEFORE UPDATE ON public.maintenance_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fuel_transactions_updated_at
BEFORE UPDATE ON public.fuel_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_documents_updated_at
BEFORE UPDATE ON public.compliance_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reminder_settings_updated_at
BEFORE UPDATE ON public.reminder_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_maintenance_records_tenant ON public.maintenance_records(tenant_id);
CREATE INDEX idx_maintenance_records_status ON public.maintenance_records(status);
CREATE INDEX idx_maintenance_records_scheduled ON public.maintenance_records(scheduled_date);

CREATE INDEX idx_fuel_transactions_tenant ON public.fuel_transactions(tenant_id);
CREATE INDEX idx_fuel_transactions_date ON public.fuel_transactions(transaction_date);

CREATE INDEX idx_compliance_documents_tenant ON public.compliance_documents(tenant_id);
CREATE INDEX idx_compliance_documents_expiry ON public.compliance_documents(expiry_date);
CREATE INDEX idx_compliance_documents_status ON public.compliance_documents(status);