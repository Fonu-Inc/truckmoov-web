import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeviceTransition {
  device_id: string;
  tenant_id: string;
  vehicle_id: string | null;
  previous_status: string;
  new_status: string;
  last_seen: string | null;
  seconds_offline: number;
}

interface HeartbeatResult {
  success: boolean;
  devices_checked: number;
  devices_transitioned: number;
  transitions: DeviceTransition[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[HeartbeatMonitor] Starting heartbeat check...');

    // Call the database function to run heartbeat check
    const { data: result, error: rpcError } = await supabase.rpc('run_heartbeat_check');

    if (rpcError) {
      console.error('[HeartbeatMonitor] RPC error:', rpcError);
      throw new Error(`Heartbeat check failed: ${rpcError.message}`);
    }

    const heartbeatResult = result as HeartbeatResult;
    console.log(`[HeartbeatMonitor] Checked ${heartbeatResult.devices_checked} devices, ${heartbeatResult.devices_transitioned} transitions`);

    // Process transitions and create alerts
    const alertsCreated: string[] = [];
    
    for (const transition of heartbeatResult.transitions || []) {
      const { device_id, tenant_id, vehicle_id, previous_status, new_status, last_seen, seconds_offline } = transition;

      // Determine alert type based on transition
      let alertType: string | null = null;
      let alertMessage = '';
      let severity = 'medium';

      if (previous_status !== 'offline' && new_status === 'offline') {
        // Device went offline
        alertType = 'device_offline';
        alertMessage = `Device went offline. Last seen: ${last_seen ? new Date(last_seen).toLocaleString() : 'Never'}`;
        severity = 'high';
      } else if (previous_status === 'offline' && new_status !== 'offline') {
        // Device came back online
        alertType = 'device_back_online';
        const downtimeMinutes = Math.round(seconds_offline / 60);
        alertMessage = `Device is back online after ${downtimeMinutes} minutes of downtime`;
        severity = 'low';
      } else if (previous_status === 'online' && new_status === 'degraded') {
        // Device becoming degraded (optional warning)
        alertType = 'device_degraded';
        alertMessage = `Device connectivity degraded. No heartbeat received in expected interval`;
        severity = 'medium';
      }

      if (alertType) {
        // Create alert in the alerts table
        const { error: alertError } = await supabase
          .from('alerts')
          .insert({
            tenant_id,
            device_id,
            vehicle_id,
            type: alertType,
            severity,
            message: alertMessage,
            acknowledged: false,
            metadata: {
              previous_status,
              new_status,
              last_seen,
              seconds_offline,
              triggered_by: 'heartbeat_monitor'
            }
          });

        if (alertError) {
          console.error(`[HeartbeatMonitor] Failed to create alert for device ${device_id}:`, alertError);
        } else {
          alertsCreated.push(`${alertType}:${device_id}`);
          console.log(`[HeartbeatMonitor] Created ${alertType} alert for device ${device_id}`);
        }

        // Log to activity logs for audit trail
        const { error: logError } = await supabase
          .from('activity_logs')
          .insert({
            tenant_id,
            entity_type: 'device',
            entity_id: device_id,
            action: 'health_status_change',
            description: `Device health status changed from ${previous_status} to ${new_status}`,
            metadata: {
              previous_status,
              new_status,
              last_seen,
              seconds_offline,
              alert_type: alertType
            }
          });

        if (logError) {
          console.error(`[HeartbeatMonitor] Failed to log activity for device ${device_id}:`, logError);
        }
      }
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      devices_checked: heartbeatResult.devices_checked,
      devices_transitioned: heartbeatResult.devices_transitioned,
      alerts_created: alertsCreated.length,
      details: {
        transitions: heartbeatResult.transitions,
        alerts: alertsCreated
      }
    };

    console.log('[HeartbeatMonitor] Complete:', JSON.stringify(response));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[HeartbeatMonitor] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
