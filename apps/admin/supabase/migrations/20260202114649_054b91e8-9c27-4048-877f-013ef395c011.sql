-- Drop the existing check constraint and add geofence alert types
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_type_check;

-- Add updated constraint with geofence types
ALTER TABLE alerts ADD CONSTRAINT alerts_type_check CHECK (
  type IN (
    'speed', 'geofence', 'fuel', 'maintenance', 'driver', 'device', 'system',
    'OVERSPEED', 'HARSH_BRAKING', 'HARSH_ACCELERATION', 'HARSH_CORNERING',
    'GEOFENCE_ENTRY', 'GEOFENCE_EXIT', 'GEOFENCE_DWELL', 'LOW_FUEL', 
    'SUDDEN_FUEL_DROP', 'DEVICE_OFFLINE', 'SOS', 'ENGINE_IDLE',
    'GEOFENCE_ENTER'
  )
);