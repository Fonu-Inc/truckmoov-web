import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("SAGE_WEBHOOK_SECRET");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = req.headers.get("x-sage-signature");
      // In production, verify HMAC signature here
    }

    const payload = await req.json();
    const eventType = payload.event_type || payload.type;

    // Store the webhook event for processing
    const { data: event, error: insertError } = await supabase
      .from("accounting_webhook_events")
      .insert({
        provider: "sage",
        event_type: eventType,
        external_id: payload.resource_id || payload.id,
        payload,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to store webhook event:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process different event types
    try {
      switch (eventType) {
        case "sales_invoice.paid":
        case "sales_invoice.payment_received":
          await processPaidInvoice(supabase, payload);
          break;
        
        case "sales_invoice.created":
          // External invoice created - could be matched to a job
          await processInboundInvoice(supabase, payload);
          break;

        case "sales_invoice.deleted":
          await handleDeletedInvoice(supabase, payload);
          break;

        default:
          console.log(`Unhandled Sage event type: ${eventType}`);
      }

      // Mark event as processed
      await supabase
        .from("accounting_webhook_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", event.id);

    } catch (processError: unknown) {
      // Mark event as failed
      const errorMessage = processError instanceof Error ? processError.message : "Unknown error";
      await supabase
        .from("accounting_webhook_events")
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString(),
          error_message: errorMessage,
        })
        .eq("id", event.id);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Sage webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processPaidInvoice(supabase: any, payload: any) {
  const invoiceId = payload.resource_id || payload.invoice_id;
  
  // Find the sync record for this invoice
  const { data: sync, error } = await supabase
    .from("accounting_invoice_syncs")
    .select("*, integration:tenant_accounting_integrations(*)")
    .eq("external_invoice_id", invoiceId)
    .single();

  if (error || !sync) {
    console.log("No matching sync record for invoice:", invoiceId);
    return;
  }

  // Update the sync record with payment info
  await supabase
    .from("accounting_invoice_syncs")
    .update({
      metadata: {
        ...sync.metadata,
        paid: true,
        paid_at: new Date().toISOString(),
        payment_amount: payload.amount_paid,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", sync.id);

  console.log(`Invoice ${invoiceId} marked as paid for job ${sync.job_id}`);
}

async function processInboundInvoice(supabase: any, payload: any) {
  // Look for a reference that might match a job
  const reference = payload.reference || "";
  const jobIdMatch = reference.match(/JOB-([a-f0-9-]+)/i);

  if (jobIdMatch) {
    const partialJobId = jobIdMatch[1];
    
    // Find the job by partial ID match
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, tenant_id")
      .ilike("id", `${partialJobId}%`)
      .limit(1);

    if (jobs && jobs.length > 0) {
      const job = jobs[0];

      // Get or create integration record
      const { data: integration } = await supabase
        .from("tenant_accounting_integrations")
        .select("id")
        .eq("tenant_id", job.tenant_id)
        .eq("provider", "sage")
        .single();

      if (integration) {
        // Create inbound sync record
        await supabase.from("accounting_invoice_syncs").insert({
          tenant_id: job.tenant_id,
          integration_id: integration.id,
          job_id: job.id,
          external_invoice_id: payload.id,
          external_invoice_number: payload.displayed_as,
          sync_status: "synced",
          sync_direction: "inbound",
          external_amount: payload.total_amount,
          external_currency: payload.currency?.symbol || "NGN",
          synced_at: new Date().toISOString(),
        });

        console.log(`Inbound invoice ${payload.id} linked to job ${job.id}`);
      }
    }
  }
}

async function handleDeletedInvoice(supabase: any, payload: any) {
  const invoiceId = payload.resource_id || payload.invoice_id;

  // Update sync records to reflect deletion
  await supabase
    .from("accounting_invoice_syncs")
    .update({
      sync_status: "failed",
      error_message: "Invoice deleted in Sage",
      updated_at: new Date().toISOString(),
    })
    .eq("external_invoice_id", invoiceId);

  console.log(`Invoice ${invoiceId} marked as deleted`);
}
