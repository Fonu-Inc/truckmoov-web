import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-imei, x-device-protocol',
};

interface TelemetryData {
  imei: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  fuel_level?: number;
  odometer?: number;
  engine_status?: string;
  engine_rpm?: number;
  coolant_temp?: number;
  battery_voltage?: number;
  harsh_braking?: boolean;
  harsh_acceleration?: boolean;
  harsh_cornering?: boolean;
  overspeeding?: boolean;
  signal_strength?: number;
  battery_level?: number;
  raw_data?: unknown;
  timestamp?: string;
}

interface TeltonikaData {
  imei: string;
  codec_id?: number;
  records?: Array<{
    timestamp: number;
    priority: number;
    gps: {
      longitude: number;
      latitude: number;
      altitude: number;
      angle: number;
      satellites: number;
      speed: number;
    };
    io_elements?: Record<string, number>;
  }>;
}

interface QueclinkData {
  imei: string;
  message_type: string;
  gps_utc_time?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  course?: number;
  altitude?: number;
  mileage?: number;
  battery_percentage?: number;
}

// Parse Teltonika FMB protocol data
function parseTeltonikaData(data: TeltonikaData): TelemetryData[] {
  console.log("Parsing Teltonika data:", JSON.stringify(data));
  
  if (!data.records || !Array.isArray(data.records)) {
    return [{
      imei: data.imei,
      raw_data: data
    }];
  }

  return data.records.map(record => {
    const ioElements = record.io_elements || {};
    
    return {
      imei: data.imei,
      latitude: record.gps.latitude,
      longitude: record.gps.longitude,
      altitude: record.gps.altitude,
      speed: record.gps.speed,
      heading: record.gps.angle,
      fuel_level: ioElements['9'], // IO element 9 is typically fuel level
      engine_rpm: ioElements['24'], // IO element 24 is RPM
      coolant_temp: ioElements['72'], // IO element 72 is coolant temp
      battery_voltage: ioElements['66'] ? ioElements['66'] / 1000 : undefined, // mV to V
      harsh_braking: ioElements['253'] === 1,
      harsh_acceleration: ioElements['254'] === 1,
      harsh_cornering: ioElements['255'] === 1,
      overspeeding: ioElements['250'] === 1,
      signal_strength: ioElements['21'],
      battery_level: ioElements['67'],
      timestamp: new Date(record.timestamp).toISOString(),
      raw_data: record
    };
  });
}

// Parse Queclink protocol data
function parseQueclinkData(data: QueclinkData): TelemetryData {
  console.log("Parsing Queclink data:", JSON.stringify(data));
  
  return {
    imei: data.imei,
    latitude: data.latitude,
    longitude: data.longitude,
    altitude: data.altitude,
    speed: data.speed,
    heading: data.course,
    odometer: data.mileage,
    battery_level: data.battery_percentage,
    timestamp: data.gps_utc_time,
    raw_data: data
  };
}

// Check for driver behavior events
function detectBehaviorEvents(telemetry: TelemetryData, deviceId: string, tenantId: string): Array<{
  device_id: string;
  tenant_id: string;
  event_type: string;
  severity: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  event_data: Record<string, unknown>;
}> {
  const events: Array<{
    device_id: string;
    tenant_id: string;
    event_type: string;
    severity: string;
    latitude?: number;
    longitude?: number;
    speed?: number;
    event_data: Record<string, unknown>;
  }> = [];

  if (telemetry.harsh_braking) {
    events.push({
      device_id: deviceId,
      tenant_id: tenantId,
      event_type: 'harsh_braking',
      severity: 'medium',
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
      speed: telemetry.speed,
      event_data: {}
    });
  }

  if (telemetry.harsh_acceleration) {
    events.push({
      device_id: deviceId,
      tenant_id: tenantId,
      event_type: 'harsh_acceleration',
      severity: 'low',
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
      speed: telemetry.speed,
      event_data: {}
    });
  }

  if (telemetry.harsh_cornering) {
    events.push({
      device_id: deviceId,
      tenant_id: tenantId,
      event_type: 'harsh_cornering',
      severity: 'medium',
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
      speed: telemetry.speed,
      event_data: {}
    });
  }

  if (telemetry.overspeeding) {
    events.push({
      device_id: deviceId,
      tenant_id: tenantId,
      event_type: 'overspeeding',
      severity: 'high',
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
      speed: telemetry.speed,
      event_data: {}
    });
  }

  return events;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const protocol = req.headers.get('x-device-protocol') || 'generic';
    const body = await req.json();
    
    console.log(`Received telemetry data via ${protocol}:`, JSON.stringify(body));

    let telemetryRecords: TelemetryData[] = [];

    // Parse data based on protocol
    switch (protocol.toLowerCase()) {
      case 'teltonika':
        telemetryRecords = parseTeltonikaData(body as TeltonikaData);
        break;
      case 'queclink':
        telemetryRecords = [parseQueclinkData(body as QueclinkData)];
        break;
      default:
        // Generic format - expect standard telemetry structure
        telemetryRecords = Array.isArray(body) ? body : [body];
    }

    const results = [];

    for (const telemetry of telemetryRecords) {
      if (!telemetry.imei) {
        console.error("Missing IMEI in telemetry data");
        continue;
      }

      // Find or create device
      let { data: device, error: deviceError } = await supabase
        .from('devices')
        .select('id, tenant_id, status')
        .eq('imei', telemetry.imei)
        .maybeSingle();

      if (deviceError) {
        console.error("Error finding device:", deviceError);
        continue;
      }

      if (!device) {
        // Auto-register new device
        const { data: newDevice, error: createError } = await supabase
          .from('devices')
          .insert({
            imei: telemetry.imei,
            manufacturer: protocol.toLowerCase() === 'teltonika' ? 'Teltonika' : 
                         protocol.toLowerCase() === 'queclink' ? 'Queclink' : 'Generic',
            status: 'active',
            protocol: protocol.toLowerCase() === 'teltonika' || protocol.toLowerCase() === 'queclink' ? 'http' : 'http',
            tenant_id: 'default', // Will be assigned to proper tenant later
            last_seen: new Date().toISOString(),
            signal_strength: telemetry.signal_strength,
            battery_level: telemetry.battery_level
          })
          .select()
          .single();

        if (createError || !newDevice) {
          console.error("Error creating device:", createError);
          continue;
        }

        device = newDevice;
        console.log("Auto-registered new device:", newDevice.id);
      }

      if (!device) {
        console.error("Device not found and could not be created");
        continue;
      }

      // Update device status
      await supabase
        .from('devices')
        .update({
          status: 'active',
          last_seen: new Date().toISOString(),
          signal_strength: telemetry.signal_strength,
          battery_level: telemetry.battery_level
        })
        .eq('id', device.id);

      // Insert telemetry record
      const { data: telemetryRecord, error: telemetryError } = await supabase
        .from('device_telemetry')
        .insert({
          device_id: device.id,
          tenant_id: device.tenant_id,
          timestamp: telemetry.timestamp || new Date().toISOString(),
          latitude: telemetry.latitude,
          longitude: telemetry.longitude,
          altitude: telemetry.altitude,
          speed: telemetry.speed,
          heading: telemetry.heading,
          accuracy: telemetry.accuracy,
          fuel_level: telemetry.fuel_level,
          odometer: telemetry.odometer,
          engine_status: telemetry.engine_status,
          engine_rpm: telemetry.engine_rpm,
          coolant_temp: telemetry.coolant_temp,
          battery_voltage: telemetry.battery_voltage,
          harsh_braking: telemetry.harsh_braking,
          harsh_acceleration: telemetry.harsh_acceleration,
          harsh_cornering: telemetry.harsh_cornering,
          overspeeding: telemetry.overspeeding,
          raw_data: telemetry.raw_data
        })
        .select()
        .single();

      if (telemetryError) {
        console.error("Error inserting telemetry:", telemetryError);
        continue;
      }

      // Detect and log behavior events
      const behaviorEvents = detectBehaviorEvents(telemetry, device.id, device.tenant_id);
      if (behaviorEvents.length > 0) {
        const { error: eventsError } = await supabase
          .from('driver_behavior_events')
          .insert(behaviorEvents);

        if (eventsError) {
          console.error("Error inserting behavior events:", eventsError);
        } else {
          console.log(`Logged ${behaviorEvents.length} behavior events`);
        }
      }

      results.push({
        device_id: device.id,
        telemetry_id: telemetryRecord.id,
        behavior_events: behaviorEvents.length
      });
    }

    console.log(`Processed ${results.length} telemetry records`);

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error("Error processing telemetry:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
