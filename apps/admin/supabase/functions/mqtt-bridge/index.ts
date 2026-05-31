import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MQTT-style topic handlers
const TOPICS = {
  TELEMETRY: 'device/+/telemetry',
  COMMAND: 'device/+/command',
  STATUS: 'device/+/status',
  CONFIG: 'device/+/config',
  ALERT: 'device/+/alert',
};

interface MQTTMessage {
  topic: string;
  payload: any;
  qos?: number;
  retain?: boolean;
}

interface DeviceTelemetry {
  imei: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  fuel_level?: number;
  battery_voltage?: number;
  engine_status?: string;
  engine_rpm?: number;
  coolant_temp?: number;
  odometer?: number;
  harsh_braking?: boolean;
  harsh_acceleration?: boolean;
  harsh_cornering?: boolean;
  overspeeding?: boolean;
  raw_data?: any;
}

// Parse MQTT topic to extract device ID
function parseDeviceTopic(topic: string): { deviceId: string | null; action: string | null } {
  const parts = topic.split('/');
  if (parts.length >= 3 && parts[0] === 'device') {
    return { deviceId: parts[1], action: parts[2] };
  }
  return { deviceId: null, action: null };
}

// Detect driver behavior events
function detectBehaviorEvents(telemetry: DeviceTelemetry): any[] {
  const events = [];
  
  if (telemetry.harsh_braking) {
    events.push({
      event_type: 'harsh_braking',
      severity: 'medium',
      speed: telemetry.speed,
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
    });
  }
  
  if (telemetry.harsh_acceleration) {
    events.push({
      event_type: 'harsh_acceleration',
      severity: 'low',
      speed: telemetry.speed,
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
    });
  }
  
  if (telemetry.harsh_cornering) {
    events.push({
      event_type: 'harsh_cornering',
      severity: 'medium',
      speed: telemetry.speed,
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
    });
  }
  
  if (telemetry.overspeeding || (telemetry.speed && telemetry.speed > 120)) {
    events.push({
      event_type: 'overspeeding',
      severity: telemetry.speed && telemetry.speed > 140 ? 'high' : 'medium',
      speed: telemetry.speed,
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
    });
  }
  
  return events;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  // WebSocket upgrade request
  if (upgradeHeader.toLowerCase() === "websocket") {
    console.log("WebSocket connection request received");
    
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let deviceImei: string | null = null;
    let tenantId: string | null = null;
    let deviceId: string | null = null;
    
    socket.onopen = () => {
      console.log("WebSocket connection opened");
      // Send CONNACK-style response
      socket.send(JSON.stringify({
        type: 'connack',
        returnCode: 0,
        message: 'Connection accepted',
        timestamp: new Date().toISOString(),
      }));
    };
    
    socket.onmessage = async (event) => {
      try {
        const message: MQTTMessage = JSON.parse(event.data);
        console.log("Received MQTT message:", message.topic);
        
        const { deviceId: parsedDeviceId, action } = parseDeviceTopic(message.topic);
        
        if (!parsedDeviceId) {
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Invalid topic format. Use: device/{imei}/{action}',
          }));
          return;
        }
        
        // Handle different topic actions
        switch (action) {
          case 'connect': {
            // Device connection/registration
            deviceImei = parsedDeviceId;
            tenantId = message.payload.tenant_id || 'default';
            
            console.log(`Device connecting: IMEI=${deviceImei}, Tenant=${tenantId}`);
            
            // Check if device exists
            const { data: existingDevice, error: fetchError } = await supabase
              .from('devices')
              .select('id, status')
              .eq('imei', deviceImei)
              .maybeSingle();
            
            if (fetchError) {
              console.error("Error fetching device:", fetchError);
            }
            
            if (existingDevice) {
              deviceId = existingDevice.id;
              // Update device status and last seen
              await supabase
                .from('devices')
                .update({
                  status: 'active',
                  last_seen: new Date().toISOString(),
                  protocol: 'websocket',
                })
                .eq('id', deviceId);
              
              socket.send(JSON.stringify({
                type: 'connack',
                deviceId,
                status: 'connected',
                message: 'Device reconnected successfully',
              }));
            } else {
              // Register new device
              const { data: newDevice, error: insertError } = await supabase
                .from('devices')
                .insert({
                  imei: deviceImei,
                  tenant_id: tenantId,
                  manufacturer: message.payload.manufacturer || 'generic',
                  model: message.payload.model,
                  firmware_version: message.payload.firmware_version,
                  status: 'active',
                  protocol: 'websocket',
                  last_seen: new Date().toISOString(),
                })
                .select('id')
                .single();
              
              if (insertError) {
                console.error("Error registering device:", insertError);
                socket.send(JSON.stringify({
                  type: 'error',
                  message: 'Failed to register device',
                  error: insertError.message,
                }));
                return;
              }
              
              deviceId = newDevice.id;
              socket.send(JSON.stringify({
                type: 'connack',
                deviceId,
                status: 'registered',
                message: 'New device registered successfully',
              }));
            }
            break;
          }
          
          case 'telemetry': {
            // Process telemetry data
            if (!deviceId && !deviceImei) {
              deviceImei = parsedDeviceId;
              // Look up device
              const { data: device } = await supabase
                .from('devices')
                .select('id, tenant_id')
                .eq('imei', deviceImei)
                .maybeSingle();
              
              if (device) {
                deviceId = device.id;
                tenantId = device.tenant_id;
              }
            }
            
            if (!deviceId) {
              socket.send(JSON.stringify({
                type: 'puback',
                success: false,
                message: 'Device not registered. Send connect message first.',
              }));
              return;
            }
            
            const telemetry: DeviceTelemetry = message.payload;
            
            // Insert telemetry data
            const { error: telemetryError } = await supabase
              .from('device_telemetry')
              .insert({
                device_id: deviceId,
                tenant_id: tenantId,
                latitude: telemetry.latitude,
                longitude: telemetry.longitude,
                altitude: telemetry.altitude,
                speed: telemetry.speed,
                heading: telemetry.heading,
                fuel_level: telemetry.fuel_level,
                battery_voltage: telemetry.battery_voltage,
                engine_status: telemetry.engine_status,
                engine_rpm: telemetry.engine_rpm,
                coolant_temp: telemetry.coolant_temp,
                odometer: telemetry.odometer,
                harsh_braking: telemetry.harsh_braking,
                harsh_acceleration: telemetry.harsh_acceleration,
                harsh_cornering: telemetry.harsh_cornering,
                overspeeding: telemetry.overspeeding,
                raw_data: telemetry.raw_data || message.payload,
              });
            
            if (telemetryError) {
              console.error("Error inserting telemetry:", telemetryError);
            }
            
            // Update device last seen
            await supabase
               .from('devices')
               .update({
                 last_seen: new Date().toISOString(),
                 // Ensure integer signal strength to avoid type errors
                 signal_strength: telemetry.raw_data?.signal_strength !== undefined
                   ? Math.round(telemetry.raw_data.signal_strength)
                   : null,
                 battery_level: telemetry.battery_voltage
                   ? Math.min(100, Math.round((telemetry.battery_voltage / 14) * 100))
                   : null,
               })
               .eq('id', deviceId);
            
            // Detect and log behavior events
            const events = detectBehaviorEvents(telemetry);
            for (const event of events) {
              await supabase
                .from('driver_behavior_events')
                .insert({
                  device_id: deviceId,
                  tenant_id: tenantId,
                  ...event,
                });
            }
            
            // Send PUBACK
            socket.send(JSON.stringify({
              type: 'puback',
              success: true,
              topic: message.topic,
              eventsDetected: events.length,
            }));
            break;
          }
          
          case 'status': {
            // Device status update
            if (!deviceId && parsedDeviceId) {
              const { data: device } = await supabase
                .from('devices')
                .select('id')
                .eq('imei', parsedDeviceId)
                .maybeSingle();
              
              if (device) deviceId = device.id;
            }
            
            if (deviceId) {
              await supabase
                .from('devices')
                .update({
                  status: message.payload.status || 'active',
                  last_seen: new Date().toISOString(),
                  battery_level: message.payload.battery_level,
                  signal_strength: message.payload.signal_strength,
                })
                .eq('id', deviceId);
              
              socket.send(JSON.stringify({
                type: 'puback',
                success: true,
                topic: message.topic,
              }));
            }
            break;
          }
          
          case 'alert': {
            // Geofence or other alerts
            if (!deviceId && parsedDeviceId) {
              const { data: device } = await supabase
                .from('devices')
                .select('id, tenant_id')
                .eq('imei', parsedDeviceId)
                .maybeSingle();
              
              if (device) {
                deviceId = device.id;
                tenantId = device.tenant_id;
              }
            }
            
            if (deviceId && message.payload.alert_type) {
              await supabase
                .from('device_geofence_alerts')
                .insert({
                  device_id: deviceId,
                  tenant_id: tenantId,
                  geofence_name: message.payload.geofence_name || 'Unknown',
                  alert_type: message.payload.alert_type,
                  latitude: message.payload.latitude,
                  longitude: message.payload.longitude,
                });
              
              socket.send(JSON.stringify({
                type: 'puback',
                success: true,
                topic: message.topic,
                alertType: message.payload.alert_type,
              }));
            }
            break;
          }
          
          case 'subscribe': {
            // Handle subscription requests
            const topics = message.payload.topics || [];
            console.log(`Device ${parsedDeviceId} subscribing to:`, topics);
            
            socket.send(JSON.stringify({
              type: 'suback',
              topics,
              returnCodes: topics.map(() => 0),
            }));
            break;
          }
          
          case 'ping': {
            // Keep-alive ping
            socket.send(JSON.stringify({
              type: 'pingresp',
              timestamp: new Date().toISOString(),
            }));
            break;
          }
          
          default: {
            socket.send(JSON.stringify({
              type: 'error',
              message: `Unknown action: ${action}`,
              validActions: ['connect', 'telemetry', 'status', 'alert', 'subscribe', 'ping'],
            }));
          }
        }
      } catch (error: unknown) {
        console.error("Error processing message:", error);
        socket.send(JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    };
    
    socket.onclose = async () => {
      console.log(`WebSocket closed for device: ${deviceImei}`);
      
      // Update device status to offline
      if (deviceId) {
        await supabase
          .from('devices')
          .update({
            status: 'configured',
            last_seen: new Date().toISOString(),
          })
          .eq('id', deviceId);
      }
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    return response;
  }

  // HTTP endpoint for documentation/health check
  if (req.method === 'GET') {
    return new Response(JSON.stringify({
      service: 'MQTT WebSocket Bridge',
      version: '1.0.0',
      status: 'healthy',
      websocket_url: `wss://${Deno.env.get('SUPABASE_URL')?.replace('https://', '')}/functions/v1/mqtt-bridge`,
      documentation: {
        description: 'WebSocket-based MQTT-style broker for IoT device communication',
        topics: TOPICS,
        messageFormat: {
          topic: 'device/{imei}/{action}',
          payload: 'JSON object with action-specific data',
          qos: 'Optional QoS level (0-2)',
        },
        actions: {
          connect: {
            description: 'Register or reconnect a device',
            payload: { tenant_id: 'string', manufacturer: 'string', model: 'string' },
          },
          telemetry: {
            description: 'Send telemetry data',
            payload: { latitude: 'number', longitude: 'number', speed: 'number', '...': 'other telemetry fields' },
          },
          status: {
            description: 'Update device status',
            payload: { status: 'string', battery_level: 'number', signal_strength: 'number' },
          },
          alert: {
            description: 'Send geofence or other alerts',
            payload: { alert_type: 'enter|exit|dwell', geofence_name: 'string', latitude: 'number', longitude: 'number' },
          },
          ping: {
            description: 'Keep-alive ping',
            payload: {},
          },
        },
        example: {
          topic: 'device/123456789012345/telemetry',
          payload: {
            latitude: 6.5244,
            longitude: 3.3792,
            speed: 45.5,
            heading: 180,
            fuel_level: 65.2,
          },
        },
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
