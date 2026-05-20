import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Device Setup Request Notification
 * 
 * Sends WhatsApp notifications to owner-operators when their
 * device setup request status changes (assigned, configured, active).
 * 
 * Also handles auto-linking device↔SIM↔vehicle when status = 'active'.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NotifyRequest {
  requestId: string;
  newStatus: string;
  actorName?: string;
  resultingDeviceId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { requestId, newStatus, actorName, resultingDeviceId }: NotifyRequest = await req.json();
    console.log('[Device Setup Notify] Request:', { requestId, newStatus });

    // 1. Fetch the setup request with requester details
    const { data: request, error: reqError } = await supabase
      .from('device_setup_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (reqError || !request) {
      console.error('[Device Setup Notify] Request not found:', reqError);
      return new Response(JSON.stringify({ success: false, error: 'Request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Auto-link device↔SIM↔vehicle when status = 'active'
    if (newStatus === 'active' && resultingDeviceId && request.vehicle_id) {
      console.log('[Device Setup Notify] Auto-linking device to vehicle:', {
        deviceId: resultingDeviceId,
        vehicleId: request.vehicle_id,
      });

      // Assign device to vehicle
      const { error: assignError } = await supabase
        .from('devices')
        .update({
          vehicle_id: request.vehicle_id,
          lifecycle_status: 'assigned',
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', resultingDeviceId);

      if (assignError) {
        console.error('[Device Setup Notify] Device assign error:', assignError);
      } else {
        console.log('[Device Setup Notify] Device assigned to vehicle successfully');

        // Log device installation event
        await supabase.from('device_installation_events').insert({
          device_id: resultingDeviceId,
          tenant_id: request.tenant_id,
          event_type: 'auto_assigned_from_setup_request',
          new_status: 'assigned',
          previous_status: 'assignable',
          actor_id: request.requester_user_id,
          metadata: {
            setup_request_id: requestId,
            vehicle_id: request.vehicle_id,
            vehicle_name: request.vehicle_name,
          },
        });
      }

      // Link SIM to device if SIM ICCID was provided
      if (request.sim_iccid) {
        const { data: simRecord } = await supabase
          .from('iot_sims')
          .select('id')
          .eq('iccid', request.sim_iccid)
          .maybeSingle();

        if (simRecord) {
          await supabase
            .from('devices')
            .update({
              sim_id: simRecord.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', resultingDeviceId);

          console.log('[Device Setup Notify] SIM linked to device:', simRecord.id);
        }
      }

      // If there was a linked SIM request, update it
      if (request.linked_sim_request_id) {
        await supabase
          .from('sim_provisioning_requests')
          .update({
            status: 'completed',
            notes: `Auto-completed: device setup request ${requestId} is now active`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', request.linked_sim_request_id);
      }
    }

    // 3. Get requester's phone for WhatsApp notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('user_id', request.requester_user_id)
      .maybeSingle();

    if (!profile?.phone) {
      console.log('[Device Setup Notify] No phone for requester, skipping WhatsApp');
      return new Response(JSON.stringify({ 
        success: true, 
        autoLinked: newStatus === 'active',
        notificationSent: false,
        reason: 'no_phone',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Determine WhatsApp template to use
    const templateMap: Record<string, { name: string; variables: Record<string, string> }> = {
      assigned: {
        name: 'device_setup_assigned',
        variables: {
          '1': profile.full_name || 'Owner',
          '2': request.imei,
          '3': actorName || 'Support team',
        },
      },
      awaiting_heartbeat: {
        name: 'device_setup_configured',
        variables: {
          '1': profile.full_name || 'Owner',
          '2': request.imei,
          '3': request.vehicle_name || 'your vehicle',
        },
      },
      active: {
        name: 'device_setup_active',
        variables: {
          '1': profile.full_name || 'Owner',
          '2': request.vehicle_name || 'your vehicle',
          '3': request.imei,
        },
      },
    };

    const template = templateMap[newStatus];
    if (!template) {
      console.log('[Device Setup Notify] No template for status:', newStatus);
      return new Response(JSON.stringify({ 
        success: true, 
        autoLinked: newStatus === 'active',
        notificationSent: false,
        reason: 'no_template_for_status',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Send WhatsApp via whatsapp-send function
    try {
      const whatsappResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          tenantId: request.tenant_id,
          toPhone: profile.phone,
          messageType: 'TEMPLATE',
          templateName: template.name,
          templateLanguage: 'en',
          templateVariables: template.variables,
          enableSmsFallback: true,
        }),
      });

      const whatsappResult = await whatsappResponse.json();
      console.log('[Device Setup Notify] WhatsApp result:', whatsappResult.success);

      return new Response(JSON.stringify({
        success: true,
        autoLinked: newStatus === 'active',
        notificationSent: whatsappResult.success,
        whatsappResult,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (waError) {
      console.error('[Device Setup Notify] WhatsApp send error:', waError);
      return new Response(JSON.stringify({
        success: true,
        autoLinked: newStatus === 'active',
        notificationSent: false,
        reason: 'whatsapp_error',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Device Setup Notify] Error:', error);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
