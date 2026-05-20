import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookDelivery {
  id: string;
  webhook_event_id: string;
  subscription_id: string;
  tenant_id: string;
  status: string;
  attempt_number: number;
  request_url: string;
  request_body: any;
  next_retry_at: string | null;
}

interface WebhookSubscription {
  id: string;
  signing_secret: string;
  headers: Record<string, string>;
  timeout_seconds: number;
  retry_count: number;
}

// Backoff delays in seconds: 30s, 2min, 10min, 1hr
const RETRY_DELAYS = [30, 120, 600, 3600];

function signPayload(payload: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  return `sha256=${hmac.digest("hex")}`;
}

async function deliverWebhook(
  supabase: any,
  delivery: WebhookDelivery,
  subscription: WebhookSubscription
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const payloadStr = JSON.stringify(delivery.request_body);
  const signature = signPayload(payloadStr, subscription.signing_secret);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-FleetPro-Signature": signature,
    "X-FleetPro-Event-ID": delivery.request_body.event_id,
    "X-FleetPro-Timestamp": new Date().toISOString(),
    ...subscription.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), subscription.timeout_seconds * 1000);

  try {
    const startTime = Date.now();
    const response = await fetch(delivery.request_url, {
      method: "POST",
      headers,
      body: payloadStr,
      signal: controller.signal,
    });
    const duration = Date.now() - startTime;

    clearTimeout(timeoutId);

    const responseBody = await response.text();

    // Update delivery log
    await supabase
      .from("webhook_delivery_logs")
      .update({
        status: response.ok ? "success" : "failed",
        response_status_code: response.status,
        response_body: responseBody.slice(0, 1000), // Limit response body size
        duration_ms: duration,
        completed_at: new Date().toISOString(),
      })
      .eq("id", delivery.id);

    if (response.ok) {
      // Update event as processed
      await supabase
        .from("webhook_events")
        .update({ processed_at: new Date().toISOString() })
        .eq("id", delivery.webhook_event_id);
    }

    return { success: response.ok, statusCode: response.status };
  } catch (error: any) {
    clearTimeout(timeoutId);

    const errorMessage = error.name === "AbortError" ? "Request timeout" : error.message;

    // Update delivery log with error
    await supabase
      .from("webhook_delivery_logs")
      .update({
        status: "failed",
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq("id", delivery.id);

    return { success: false, error: errorMessage };
  }
}

async function scheduleRetry(
  supabase: any,
  delivery: WebhookDelivery,
  subscription: WebhookSubscription
): Promise<boolean> {
  const nextAttempt = delivery.attempt_number + 1;

  // Check if we've exceeded retry limit
  if (nextAttempt > subscription.retry_count) {
    // Move to dead letter queue
    await supabase
      .from("webhook_delivery_logs")
      .update({
        status: "dead_letter",
        completed_at: new Date().toISOString(),
      })
      .eq("id", delivery.id);
    return false;
  }

  // Calculate next retry time
  const delaySeconds = RETRY_DELAYS[Math.min(nextAttempt - 1, RETRY_DELAYS.length - 1)];
  const nextRetryAt = new Date(Date.now() + delaySeconds * 1000);

  // Create new delivery attempt
  await supabase.from("webhook_delivery_logs").insert({
    webhook_event_id: delivery.webhook_event_id,
    subscription_id: delivery.subscription_id,
    tenant_id: delivery.tenant_id,
    status: "retrying",
    attempt_number: nextAttempt,
    request_url: delivery.request_url,
    request_body: delivery.request_body,
    next_retry_at: nextRetryAt.toISOString(),
  });

  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const now = new Date();

    // Get pending deliveries
    const { data: pendingDeliveries, error: pendingError } = await supabase
      .from("webhook_delivery_logs")
      .select("*")
      .eq("status", "pending")
      .limit(50);

    if (pendingError) throw pendingError;

    // Get retrying deliveries that are due
    const { data: retryDeliveries, error: retryError } = await supabase
      .from("webhook_delivery_logs")
      .select("*")
      .eq("status", "retrying")
      .lte("next_retry_at", now.toISOString())
      .limit(50);

    if (retryError) throw retryError;

    const allDeliveries = [...(pendingDeliveries || []), ...(retryDeliveries || [])];

    console.log(`Processing ${allDeliveries.length} webhook deliveries`);

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      retrying: 0,
      deadLettered: 0,
    };

    for (const delivery of allDeliveries) {
      results.processed++;

      // Get subscription details
      const { data: subscription, error: subError } = await supabase
        .from("webhook_subscriptions")
        .select("*")
        .eq("id", delivery.subscription_id)
        .single();

      if (subError || !subscription) {
        console.error(`Subscription not found for delivery ${delivery.id}`);
        continue;
      }

      // Mark as in-progress
      await supabase
        .from("webhook_delivery_logs")
        .update({ status: "pending" })
        .eq("id", delivery.id);

      // Attempt delivery
      const result = await deliverWebhook(supabase, delivery, subscription);

      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        // Schedule retry
        const willRetry = await scheduleRetry(supabase, delivery, subscription);
        if (willRetry) {
          results.retrying++;
        } else {
          results.deadLettered++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        timestamp: now.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Webhook dispatcher error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: "Dispatcher failed", message: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
