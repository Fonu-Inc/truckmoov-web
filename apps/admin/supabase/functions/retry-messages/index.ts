import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FONU_API_KEY = Deno.env.get('FONU_API_KEY');
const FONU_API_SECRET = Deno.env.get('FONU_API_SECRET');
const FONU_BASE_URL = 'https://api.fonu.com/v1';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BATCH_SIZE = 10;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting message retry job...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch pending messages that need retry
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('driver_messages')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(RETRY_BATCH_SIZE);

    if (fetchError) {
      console.error('Error fetching pending messages:', fetchError);
      throw fetchError;
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      console.log('No pending messages to retry');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending messages to retry',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${pendingMessages.length} pending messages to retry`);

    let successCount = 0;
    let failCount = 0;
    const results: any[] = [];

    for (const message of pendingMessages) {
      // Check retry count from metadata
      const metadata = message.metadata || {};
      const retryCount = metadata.retry_count || 0;

      if (retryCount >= MAX_RETRY_ATTEMPTS) {
        // Max retries reached, mark as failed
        await supabase
          .from('driver_messages')
          .update({ 
            status: 'failed', 
            error_message: 'Max retry attempts exceeded',
            metadata: { ...metadata, retry_count: retryCount }
          })
          .eq('id', message.id);
        
        failCount++;
        results.push({ id: message.id, status: 'max_retries_exceeded' });
        continue;
      }

      try {
        const formattedNumber = formatNigerianNumber(message.driver_phone);
        
        // Determine API endpoint based on message type
        const endpoint = message.message_type === 'whatsapp' 
          ? `${FONU_BASE_URL}/whatsapp`
          : `${FONU_BASE_URL}/sms`;

        const body = message.message_type === 'whatsapp'
          ? { to: formattedNumber, message: message.content, type: 'text' }
          : { 
              to: formattedNumber, 
              from: Deno.env.get('FONU_SENDER_ID') || 'FleetPro',
              message: message.content 
            };

        console.log(`Retrying ${message.message_type} to ${message.driver_name} (attempt ${retryCount + 1})`);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${FONU_API_KEY}:${FONU_API_SECRET}`)}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const responseText = await response.text();
        console.log(`Retry response status: ${response.status}`);

        if (!response.ok) {
          // Check if it's still a gateway error
          if (response.status === 502 || response.status === 503 || response.status === 504) {
            console.log('API still unavailable, incrementing retry count');
            await supabase
              .from('driver_messages')
              .update({ 
                metadata: { ...metadata, retry_count: retryCount + 1, last_retry: new Date().toISOString() }
              })
              .eq('id', message.id);
            
            results.push({ id: message.id, status: 'api_unavailable' });
            continue;
          }

          // Other error - mark as failed
          await supabase
            .from('driver_messages')
            .update({ 
              status: 'failed', 
              error_message: responseText,
              metadata: { ...metadata, retry_count: retryCount + 1 }
            })
            .eq('id', message.id);
          
          failCount++;
          results.push({ id: message.id, status: 'failed', error: responseText });
          continue;
        }

        // Success!
        let externalId;
        try {
          const result = JSON.parse(responseText);
          externalId = result.message_id || result.id;
        } catch {
          externalId = null;
        }

        await supabase
          .from('driver_messages')
          .update({ 
            status: 'sent', 
            external_id: externalId,
            metadata: { ...metadata, retry_count: retryCount + 1, sent_at: new Date().toISOString() }
          })
          .eq('id', message.id);

        successCount++;
        results.push({ id: message.id, status: 'sent' });
        console.log(`Successfully sent message to ${message.driver_name}`);

      } catch (error) {
        console.error(`Error retrying message ${message.id}:`, error);
        
        // Update retry count
        await supabase
          .from('driver_messages')
          .update({ 
            metadata: { ...metadata, retry_count: retryCount + 1, last_error: String(error) }
          })
          .eq('id', message.id);
        
        results.push({ id: message.id, status: 'error', error: String(error) });
      }
    }

    const summary = {
      success: true,
      processed: pendingMessages.length,
      sent: successCount,
      failed: failCount,
      pending: pendingMessages.length - successCount - failCount,
      results,
    };

    console.log('Retry job completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Retry job error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function formatNigerianNumber(phoneNumber: string): string {
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '+234' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('+')) {
    cleaned = '+234' + cleaned;
  }
  
  return cleaned;
}
