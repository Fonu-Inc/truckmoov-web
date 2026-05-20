import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckIPRequest {
  action: 'check' | 'block' | 'unblock' | 'list' | 'auto_block_check';
  ip_address?: string;
  reason?: string;
  expires_at?: string;
  is_permanent?: boolean;
  tenant_id?: string;
  metadata?: Record<string, string>;
  // For auto_block_check
  failed_attempts?: number;
  max_attempts?: number;
  block_duration_hours?: number | null;
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

    const { 
      action, 
      ip_address, 
      reason, 
      expires_at, 
      is_permanent, 
      tenant_id, 
      metadata,
      failed_attempts,
      max_attempts,
      block_duration_hours
    }: CheckIPRequest = await req.json();

    console.log('IP Blocking request:', { action, ip_address, timestamp: new Date().toISOString() });

    switch (action) {
      case 'check': {
        if (!ip_address) {
          return new Response(
            JSON.stringify({ error: 'IP address is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase.rpc('is_ip_blocked', { check_ip: ip_address });
        
        if (error) {
          console.error('Error checking IP:', error);
          throw error;
        }

        console.log('IP check result:', { ip_address, is_blocked: data });

        return new Response(
          JSON.stringify({ is_blocked: data, ip_address }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'block': {
        if (!ip_address || !reason) {
          return new Response(
            JSON.stringify({ error: 'IP address and reason are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase.rpc('block_ip', {
          p_ip_address: ip_address,
          p_reason: reason,
          p_expires_at: expires_at || null,
          p_is_permanent: is_permanent || false,
          p_tenant_id: tenant_id || null,
          p_metadata: metadata || {}
        });

        if (error) {
          console.error('Error blocking IP:', error);
          throw error;
        }

        // Log the security event
        await supabase.rpc('log_security_event', {
          p_event_type: 'ip_blocked',
          p_severity: 'high',
          p_description: `IP address ${ip_address} has been blocked: ${reason}`,
          p_ip_address: ip_address,
          p_tenant_id: tenant_id || null,
          p_metadata: { reason, is_permanent: String(is_permanent || false) }
        });

        console.log('IP blocked successfully:', { ip_address, id: data });

        return new Response(
          JSON.stringify({ success: true, id: data, message: `IP ${ip_address} has been blocked` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'unblock': {
        if (!ip_address) {
          return new Response(
            JSON.stringify({ error: 'IP address is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase.rpc('unblock_ip', { p_ip_address: ip_address });

        if (error) {
          console.error('Error unblocking IP:', error);
          throw error;
        }

        // Log the security event
        await supabase.rpc('log_security_event', {
          p_event_type: 'ip_unblocked',
          p_severity: 'medium',
          p_description: `IP address ${ip_address} has been unblocked`,
          p_ip_address: ip_address,
          p_metadata: {}
        });

        console.log('IP unblocked:', { ip_address, found: data });

        return new Response(
          JSON.stringify({ success: true, found: data, message: data ? `IP ${ip_address} has been unblocked` : `IP ${ip_address} was not found in blocked list` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list': {
        const { data, error } = await supabase
          .from('blocked_ips')
          .select('*')
          .order('blocked_at', { ascending: false });

        if (error) {
          console.error('Error listing blocked IPs:', error);
          throw error;
        }

        console.log('Listed blocked IPs:', { count: data?.length });

        return new Response(
          JSON.stringify({ blocked_ips: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'auto_block_check': {
        if (!ip_address || !failed_attempts || !max_attempts) {
          return new Response(
            JSON.stringify({ error: 'IP address, failed_attempts, and max_attempts are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if IP is already blocked
        const { data: isBlocked } = await supabase.rpc('is_ip_blocked', { check_ip: ip_address });
        
        if (isBlocked) {
          return new Response(
            JSON.stringify({ should_block: false, already_blocked: true, ip_address }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if we should auto-block
        const shouldBlock = failed_attempts >= max_attempts;
        
        if (shouldBlock) {
          const expiresAt = block_duration_hours 
            ? new Date(Date.now() + block_duration_hours * 60 * 60 * 1000).toISOString()
            : null;
          
          const autoReason = `Auto-blocked: ${failed_attempts} failed login attempts exceeded threshold of ${max_attempts}`;
          
          const { data: blockId, error: blockError } = await supabase.rpc('block_ip', {
            p_ip_address: ip_address,
            p_reason: autoReason,
            p_expires_at: expiresAt,
            p_is_permanent: !block_duration_hours,
            p_tenant_id: tenant_id || null,
            p_metadata: { auto_blocked: 'true', failed_attempts: String(failed_attempts) }
          });

          if (blockError) {
            console.error('Error auto-blocking IP:', blockError);
            throw blockError;
          }

          // Log the security event
          await supabase.rpc('log_security_event', {
            p_event_type: 'ip_auto_blocked',
            p_severity: 'high',
            p_description: `IP address ${ip_address} has been automatically blocked after ${failed_attempts} failed login attempts`,
            p_ip_address: ip_address,
            p_tenant_id: tenant_id || null,
            p_metadata: { 
              failed_attempts: String(failed_attempts), 
              max_attempts: String(max_attempts),
              block_duration_hours: block_duration_hours ? String(block_duration_hours) : 'permanent'
            }
          });

          console.log('IP auto-blocked:', { ip_address, failed_attempts, max_attempts, blockId });

          return new Response(
            JSON.stringify({ 
              should_block: true, 
              blocked: true, 
              id: blockId, 
              ip_address,
              reason: autoReason 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            should_block: false, 
            already_blocked: false, 
            ip_address,
            failed_attempts,
            remaining_attempts: max_attempts - failed_attempts
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: check, block, unblock, list, or auto_block_check' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('Error in ip-blocking function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
