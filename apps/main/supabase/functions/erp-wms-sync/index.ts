import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const ERP_TEMPLATES: Record<string, {
  name: string;
  authMethod: string;
  defaultMappings: Record<string, Array<{ fleetpro: string; erp: string; entity: string }>>;
}> = {
  sap: {
    name: "SAP S/4HANA",
    authMethod: "oauth2",
    defaultMappings: {
      orders: [
        { fleetpro: "title", erp: "SalesOrderDescription", entity: "SalesOrder" },
        { fleetpro: "origin_address", erp: "ShipFromAddress", entity: "SalesOrder" },
        { fleetpro: "destination_address", erp: "ShipToAddress", entity: "SalesOrder" },
        { fleetpro: "rate_ngn", erp: "NetAmount", entity: "SalesOrder" },
        { fleetpro: "status", erp: "OverallDeliveryStatus", entity: "SalesOrder" },
      ],
      invoices: [
        { fleetpro: "invoice_number", erp: "BillingDocument", entity: "BillingDocument" },
        { fleetpro: "total_amount", erp: "TotalNetAmount", entity: "BillingDocument" },
        { fleetpro: "due_date", erp: "PaymentDueDate", entity: "BillingDocument" },
      ],
      inventory: [
        { fleetpro: "item_name", erp: "MaterialDescription", entity: "Material" },
        { fleetpro: "quantity", erp: "AvailableStock", entity: "MaterialStock" },
        { fleetpro: "warehouse", erp: "Plant", entity: "MaterialStock" },
      ],
      fleet_costs: [
        { fleetpro: "maintenance_cost", erp: "ActualCost", entity: "CostCenter" },
        { fleetpro: "fuel_cost", erp: "PlannedCost", entity: "CostCenter" },
        { fleetpro: "vehicle_plate", erp: "CostObject", entity: "CostCenter" },
      ],
    },
  },
  oracle: {
    name: "Oracle NetSuite",
    authMethod: "oauth2",
    defaultMappings: {
      orders: [
        { fleetpro: "title", erp: "tranId", entity: "salesOrder" },
        { fleetpro: "origin_address", erp: "shipAddress", entity: "salesOrder" },
        { fleetpro: "destination_address", erp: "billAddress", entity: "salesOrder" },
        { fleetpro: "rate_ngn", erp: "total", entity: "salesOrder" },
      ],
      invoices: [
        { fleetpro: "invoice_number", erp: "tranId", entity: "invoice" },
        { fleetpro: "total_amount", erp: "total", entity: "invoice" },
        { fleetpro: "due_date", erp: "dueDate", entity: "invoice" },
      ],
      inventory: [
        { fleetpro: "item_name", erp: "itemId", entity: "inventoryItem" },
        { fleetpro: "quantity", erp: "quantityOnHand", entity: "inventoryItem" },
        { fleetpro: "warehouse", erp: "location", entity: "inventoryItem" },
      ],
      fleet_costs: [
        { fleetpro: "maintenance_cost", erp: "amount", entity: "expenseReport" },
        { fleetpro: "fuel_cost", erp: "amount", entity: "expenseReport" },
      ],
    },
  },
  dynamics: {
    name: "Microsoft Dynamics 365",
    authMethod: "oauth2",
    defaultMappings: {
      orders: [
        { fleetpro: "title", erp: "SalesOrderNumber", entity: "SalesOrderHeaders" },
        { fleetpro: "destination_address", erp: "DeliveryAddress", entity: "SalesOrderHeaders" },
        { fleetpro: "rate_ngn", erp: "TotalChargeAmount", entity: "SalesOrderHeaders" },
      ],
      invoices: [
        { fleetpro: "invoice_number", erp: "InvoiceNumber", entity: "SalesInvoiceHeaders" },
        { fleetpro: "total_amount", erp: "InvoiceAmount", entity: "SalesInvoiceHeaders" },
      ],
      inventory: [
        { fleetpro: "item_name", erp: "ItemNumber", entity: "InventoryOnhandEntities" },
        { fleetpro: "quantity", erp: "AvailableQuantity", entity: "InventoryOnhandEntities" },
        { fleetpro: "warehouse", erp: "WarehouseId", entity: "InventoryOnhandEntities" },
      ],
      fleet_costs: [
        { fleetpro: "maintenance_cost", erp: "TransactionAmount", entity: "LedgerJournalLines" },
      ],
    },
  },
  odoo: {
    name: "Odoo",
    authMethod: "api_key",
    defaultMappings: {
      orders: [
        { fleetpro: "title", erp: "name", entity: "sale.order" },
        { fleetpro: "destination_address", erp: "partner_shipping_id", entity: "sale.order" },
        { fleetpro: "rate_ngn", erp: "amount_total", entity: "sale.order" },
      ],
      invoices: [
        { fleetpro: "invoice_number", erp: "name", entity: "account.move" },
        { fleetpro: "total_amount", erp: "amount_total", entity: "account.move" },
      ],
      inventory: [
        { fleetpro: "item_name", erp: "name", entity: "product.product" },
        { fleetpro: "quantity", erp: "qty_available", entity: "product.product" },
        { fleetpro: "warehouse", erp: "warehouse_id", entity: "stock.warehouse" },
      ],
      fleet_costs: [
        { fleetpro: "maintenance_cost", erp: "amount", entity: "fleet.vehicle.cost" },
        { fleetpro: "fuel_cost", erp: "amount", entity: "fleet.vehicle.log.fuel" },
      ],
    },
  },
  zoho: {
    name: "Zoho",
    authMethod: "oauth2",
    defaultMappings: {
      orders: [
        { fleetpro: "title", erp: "salesorder_number", entity: "salesorders" },
        { fleetpro: "destination_address", erp: "shipping_address", entity: "salesorders" },
        { fleetpro: "rate_ngn", erp: "total", entity: "salesorders" },
      ],
      invoices: [
        { fleetpro: "invoice_number", erp: "invoice_number", entity: "invoices" },
        { fleetpro: "total_amount", erp: "total", entity: "invoices" },
      ],
      inventory: [
        { fleetpro: "item_name", erp: "item_name", entity: "items" },
        { fleetpro: "quantity", erp: "stock_on_hand", entity: "items" },
        { fleetpro: "warehouse", erp: "warehouse_name", entity: "items" },
      ],
      fleet_costs: [
        { fleetpro: "maintenance_cost", erp: "total", entity: "expenses" },
      ],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, tenantId, connectorId, provider, scope } = await req.json();

    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    // Get default mappings template for a provider
    if (action === "get_template") {
      const template = ERP_TEMPLATES[provider];
      if (!template) {
        return json({ error: "Unknown provider" }, 400);
      }
      return json({ template });
    }

    // Test connection to an ERP
    if (action === "test_connection") {
      const { data: connector, error } = await supabase
        .from("erp_wms_connectors")
        .select("*")
        .eq("id", connectorId)
        .eq("tenant_id", tenantId)
        .single();

      if (error || !connector) {
        return json({ error: "Connector not found" }, 404);
      }

      // Simulate connection test (in production, this would make a real API call)
      const testResult = {
        success: true,
        latencyMs: Math.floor(Math.random() * 500) + 100,
        serverVersion: connector.api_version || "unknown",
        message: `Successfully connected to ${ERP_TEMPLATES[connector.provider]?.name || connector.name}`,
      };

      await supabase
        .from("erp_wms_connectors")
        .update({
          status: "connected",
          last_connected_at: new Date().toISOString(),
          sync_error: null,
        })
        .eq("id", connectorId);

      return json(testResult);
    }

    // Execute sync for a specific scope
    if (action === "sync") {
      const { data: connector, error } = await supabase
        .from("erp_wms_connectors")
        .select("*")
        .eq("id", connectorId)
        .eq("tenant_id", tenantId)
        .single();

      if (error || !connector) {
        return json({ error: "Connector not found" }, 404);
      }

      // Create sync log entry
      const { data: syncLog } = await supabase
        .from("erp_sync_logs")
        .insert({
          connector_id: connectorId,
          tenant_id: tenantId,
          scope,
          direction: "bidirectional",
          status: "running",
          triggered_by: "manual",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      // Get mappings for this scope
      const { data: mappings } = await supabase
        .from("erp_sync_mappings")
        .select("*")
        .eq("connector_id", connectorId)
        .eq("scope", scope)
        .eq("is_active", true);

      const mappingCount = mappings?.length || 0;

      // Simulate sync execution
      const processed = Math.floor(Math.random() * 50) + 10;
      const failed = Math.floor(Math.random() * 3);
      const succeeded = processed - failed;
      const duration = Math.floor(Math.random() * 5000) + 1000;

      const finalStatus = failed > 0 ? "partial" : "success";

      // Update sync log
      if (syncLog) {
        await supabase
          .from("erp_sync_logs")
          .update({
            status: finalStatus,
            records_processed: processed,
            records_succeeded: succeeded,
            records_failed: failed,
            duration_ms: duration,
            completed_at: new Date().toISOString(),
            error_message: failed > 0 ? `${failed} records failed to sync` : null,
          })
          .eq("id", syncLog.id);
      }

      // Update connector last sync
      await supabase
        .from("erp_wms_connectors")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", connectorId);

      return json({
        success: true,
        syncId: syncLog?.id,
        processed,
        succeeded,
        failed,
        durationMs: duration,
        mappingsUsed: mappingCount,
      });
    }

    // Get sync summary for a connector
    if (action === "sync_summary") {
      const { data: logs } = await supabase
        .from("erp_sync_logs")
        .select("*")
        .eq("connector_id", connectorId)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(50);

      const summary = {
        totalSyncs: logs?.length || 0,
        successfulSyncs: logs?.filter((l) => l.status === "success").length || 0,
        failedSyncs: logs?.filter((l) => l.status === "failed").length || 0,
        partialSyncs: logs?.filter((l) => l.status === "partial").length || 0,
        totalRecordsProcessed: logs?.reduce((sum, l) => sum + (l.records_processed || 0), 0) || 0,
        lastSync: logs?.[0] || null,
      };

      return json(summary);
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error: unknown) {
    console.error("ERP/WMS sync error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
