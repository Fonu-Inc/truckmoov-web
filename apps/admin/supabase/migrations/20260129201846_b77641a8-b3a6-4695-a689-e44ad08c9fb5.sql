-- Create drivers table FIRST (so vehicles can reference it)
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  license_number TEXT NOT NULL,
  license_expiry TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'available',
  rating NUMERIC DEFAULT 0,
  total_trips INTEGER DEFAULT 0,
  current_vehicle_id UUID,
  communication_preference TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, license_number),
  UNIQUE(tenant_id, phone)
);

-- Create vehicles table with UUID for driver reference
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  vin TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'truck',
  status TEXT NOT NULL DEFAULT 'active',
  capacity NUMERIC,
  current_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  fuel_level NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, registration_number),
  UNIQUE(tenant_id, vin)
);

-- Add foreign key from drivers to vehicles (after vehicles table exists)
ALTER TABLE public.drivers 
ADD CONSTRAINT fk_drivers_vehicle 
FOREIGN KEY (current_vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles
CREATE POLICY "Anyone can view vehicles for demo"
ON public.vehicles FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
ON public.vehicles FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles"
ON public.vehicles FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete vehicles"
ON public.vehicles FOR DELETE USING (true);

-- RLS Policies for drivers
CREATE POLICY "Anyone can view drivers for demo"
ON public.drivers FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert drivers"
ON public.drivers FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update drivers"
ON public.drivers FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete drivers"
ON public.drivers FOR DELETE USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();