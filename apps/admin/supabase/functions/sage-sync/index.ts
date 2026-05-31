import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SAGE_API_URL = "https://api.accounting.sage.com/v3.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, tenantId, jobId, invoiceData } = await req.json();

    // Get integration and validate
    const { data: integration, error: intError } = await supabase
      .from("tenant_accounting_integrations")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("provider", "sage")
      .eq("status", "connected")
      .single();

    if (intError || !integration) {
      return new Response(
        JSON.stringify({ error: "Sage integration not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token needs refresh
    if (new Date(integration.token_expires_at) < new Date()) {
      const refreshResponse = await fetch(`${supabaseUrl}/functions/v1/sage-oauth?action=refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });

      if (!refreshResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to refresh access token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Re-fetch integration with new token
      const { data: refreshedInt } = await supabase
        .from("tenant_accounting_integrations")
        .select("*")
        .eq("id", integration.id)
        .single();
      
      if (refreshedInt) {
        integration.access_token_encrypted = refreshedInt.access_token_encrypted;
      }
    }

    const accessToken = integration.access_token_encrypted;

    // Sync job to Sage invoice
    if (action === "create_invoice") {
      // Get job details
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError || !job) {
        return new Response(
          JSON.stringify({ error: "Job not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create sales invoice in Sage
      const invoicePayload = {
        contact_id: invoiceData?.contactId || null, // Map to Sage contact
        date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        reference: `JOB-${job.id.substring(0, 8)}`,
        notes: `Fleet job: ${job.title || "Transport Service"}`,
        main_address: {
          address_line_1: job.destination_address || "",
        },
        invoice_lines: [
          {
            description: job.title || "Transport Service",
            quantity: 1,
            unit_price: job.revenue_ngn || job.rate_ngn || 0,
            tax_rate_id: null, // Configure based on tenant settings
          },
        ],
      };

      const sageResponse = await fetch(`${SAGE_API_URL}/sales_invoices`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sales_invoice: invoicePayload }),
      });

      if (!sageResponse.ok) {
        const errorData = await sageResponse.text();
        console.error("Sage invoice creation failed:", errorData);

        // Record failed sync
        await supabase.from("accounting_invoice_syncs").insert({
          tenant_id: tenantId,
          integration_id: integration.id,
          job_id: jobId,
          sync_status: "failed",
          sync_direction: "outbound",
          amount_ngn: job.revenue_ngn || job.rate_ngn,
          error_message: errorData,
        });

        return new Response(
          JSON.stringify({ error: "Failed to create invoice in Sage", details: errorData }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const sageInvoice = await sageResponse.json();

      // Record successful sync
      await supabase.from("accounting_invoice_syncs").insert({
        tenant_id: tenantId,
        integration_id: integration.id,
        job_id: jobId,
        external_invoice_id: sageInvoice.id,
        external_invoice_number: sageInvoice.displayed_as,
        sync_status: "synced",
        sync_direction: "outbound",
        amount_ngn: job.revenue_ngn || job.rate_ngn,
        external_amount: sageInvoice.total_amount,
        external_currency: sageInvoice.currency?.symbol || "NGN",
        synced_at: new Date().toISOString(),
      });

      // Update integration last sync time
      await supabase
        .from("tenant_accounting_integrations")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", integration.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          invoiceId: sageInvoice.id,
          invoiceNumber: sageInvoice.displayed_as,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch invoices from Sage
    if (action === "list_invoices") {
      const sageResponse = await fetch(`${SAGE_API_URL}/sales_invoices?items_per_page=50`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!sageResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch invoices from Sage" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const invoices = await sageResponse.json();

      return new Response(
        JSON.stringify({ invoices: invoices.$items || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get sync status for a job
    if (action === "get_sync_status") {
      const { data: syncs, error: syncError } = await supabase
        .from("accounting_invoice_syncs")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (syncError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch sync status" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ syncs }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Sage sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
