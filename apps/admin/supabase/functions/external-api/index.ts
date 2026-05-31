import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// API scope type
type ApiScope = 
  | "jobs.read" | "jobs.write"
  | "vehicles.read" | "vehicles.write"
  | "drivers.read" | "drivers.write"
  | "devices.read"
  | "geofences.read" | "geofences.write"
  | "alerts.read"
  | "maintenance.read"
  | "fuel.read"
  | "webhooks.manage"
  | "waybills.read" | "waybills.write"
  | "pricing.read" | "pricing.write"
  | "invoices.read" | "invoices.write";

interface ValidationResult {
  valid: boolean;
  error?: string;
  tenant_id?: string;
  api_key_id?: string;
  scopes?: ApiScope[];
}

async function validateApiKey(supabase: any, apiKey: string, requiredScope: ApiScope): Promise<ValidationResult> {
  const { data, error } = await supabase.rpc("validate_api_key", {
    p_api_key: apiKey,
    p_required_scope: requiredScope,
  });

  if (error) {
    console.error("API key validation error:", error);
    return { valid: false, error: "VALIDATION_ERROR" };
  }

  return data as ValidationResult;
}

async function logApiUsage(
  supabase: any,
  tenantId: string,
  apiKeyId: string | null,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  ipAddress: string | null,
  userAgent: string | null,
  errorMessage: string | null
) {
  await supabase.from("api_usage_logs").insert({
    tenant_id: tenantId,
    api_key_id: apiKeyId,
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
    ip_address: ipAddress,
    user_agent: userAgent,
    error_message: errorMessage,
  });
}

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(error: string, message: string, status: number): Response {
  return jsonResponse({ error, message }, status);
}

// Helper: parse pagination params
function parsePagination(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  return { url, limit, offset };
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Remove function name from path
  if (pathParts[0] === "external-api") pathParts.shift();
  
  const apiVersion = pathParts[0]; // v1
  const resource = pathParts[1]; // vehicles, drivers, jobs, waybills, pricing, invoices, etc.
  const resourceId = pathParts[2]; // optional ID
  const subResource = pathParts[3]; // optional sub-resource (e.g., status, extract, approve)

  // Validate API version
  if (apiVersion !== "v1") {
    return errorResponse("INVALID_VERSION", "API version not supported. Use /v1/", 400);
  }

  // Get API key from header
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return errorResponse("MISSING_API_KEY", "X-API-Key header is required", 401);
  }

  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip");
  const userAgent = req.headers.get("user-agent");

  // Route handling
  try {
    let requiredScope: ApiScope;
    let result: Response;

    switch (resource) {
      case "vehicles":
        requiredScope = req.method === "GET" ? "vehicles.read" : "vehicles.write";
        result = await handleVehicles(supabase, req, apiKey, requiredScope, resourceId);
        break;

      case "drivers":
        requiredScope = req.method === "GET" ? "drivers.read" : "drivers.write";
        result = await handleDrivers(supabase, req, apiKey, requiredScope, resourceId);
        break;

      case "devices":
        requiredScope = "devices.read";
        result = await handleDevices(supabase, req, apiKey, requiredScope, resourceId);
        break;

      case "geofences":
        requiredScope = req.method === "GET" ? "geofences.read" : "geofences.write";
        result = await handleGeofences(supabase, req, apiKey, requiredScope, resourceId);
        break;

      case "geofence-events":
        requiredScope = "geofences.read";
        result = await handleGeofenceEvents(supabase, req, apiKey, requiredScope);
        break;

      case "alerts":
        requiredScope = "alerts.read";
        result = await handleAlerts(supabase, req, apiKey, requiredScope, resourceId);
        break;

      case "maintenance":
        requiredScope = "maintenance.read";
        result = await handleMaintenance(supabase, req, apiKey, requiredScope, resourceId);
        break;

      case "fuel":
        requiredScope = "fuel.read";
        result = await handleFuel(supabase, req, apiKey, requiredScope, resourceId);
        break;

      case "jobs":
        requiredScope = req.method === "GET" ? "jobs.read" : "jobs.write";
        result = await handleJobs(supabase, req, apiKey, requiredScope, resourceId, subResource);
        break;

      case "job-offers":
        requiredScope = "jobs.read";
        result = await handleJobOffers(supabase, req, apiKey, requiredScope, resourceId);
        break;

      // --- NEW ENDPOINTS ---

      case "waybills":
        requiredScope = req.method === "GET" ? "waybills.read" : "waybills.write";
        result = await handleWaybills(supabase, req, apiKey, requiredScope, resourceId, subResource);
        break;

      case "pricing":
        // /v1/pricing/destinations or /v1/pricing/destinations/{id}
        if (pathParts[2] === "destinations") {
          requiredScope = req.method === "GET" ? "pricing.read" : "pricing.write";
          result = await handlePricingDestinations(supabase, req, apiKey, requiredScope, pathParts[3]);
        } else {
          result = errorResponse("NOT_FOUND", "Use /v1/pricing/destinations", 404);
        }
        break;

      case "invoices":
        requiredScope = req.method === "GET" ? "invoices.read" : "invoices.write";
        result = await handleInvoices(supabase, req, apiKey, requiredScope, resourceId, subResource);
        break;

      default:
        result = errorResponse("NOT_FOUND", `Resource '${resource}' not found`, 404);
    }

    // Log API usage
    const responseTime = Date.now() - startTime;
    const validation = await validateApiKey(supabase, apiKey, "jobs.read");
    if (validation.valid) {
      await logApiUsage(
        supabase,
        validation.tenant_id!,
        validation.api_key_id || null,
        `/${resource}${resourceId ? `/${resourceId}` : ""}`,
        req.method,
        result.status,
        responseTime,
        ipAddress,
        userAgent,
        result.status >= 400 ? await result.clone().text() : null
      );
    }

    return result;

  } catch (error) {
    console.error("API error:", error);
    return errorResponse("INTERNAL_ERROR", "An internal error occurred", 500);
  }
});

// ========== EXISTING RESOURCE HANDLERS ==========

async function handleVehicles(
  supabase: any, req: Request, apiKey: string, scope: ApiScope, vehicleId?: string
): Promise<Response> {
  const validation = await validateApiKey(supabase, apiKey, scope);
  if (!validation.valid) return errorResponse(validation.error!, "Authentication failed", 401);

  if (req.method === "GET") {
    let query = supabase
      .from("vehicles")
      .select("id, registration_number, make, model, year, type, status, capacity, current_mileage, fuel_type, created_at")
      .eq("tenant_id", validation.tenant_id);

    if (vehicleId) {
      query = query.eq("id", vehicleId).single();
    } else {
      const { limit, offset, url } = parsePagination(req);
      const status = url.searchParams.get("status");
      if (status) query = query.eq("status", status);
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) return errorResponse("QUERY_ERROR", error.message, 500);
    return jsonResponse({ data: vehicleId ? data : { items: data } });
  }

  return errorResponse("METHOD_NOT_ALLOWED", "Method not supported", 405);
}

async function handleDrivers(
  supabase: any, req: Request, apiKey: string, scope: ApiScope, driverId?: string
): Promise<Response> {
  const validation = await validateApiKey(supabase, apiKey, scope);
  if (!validation.valid) return errorResponse(validation.error!, "Authentication failed", 401);

  if (req.method === "GET") {
    let query = supabase
      .from("drivers")
      .select("id, name, phone, email, license_number, status, rating, total_trips, communication_preference, created_at")
      .eq("tenant_id", validation.tenant_id);

    if (driverId) {
      query = query.eq("id", driverId).single();
    } else {
      const { limit, offset, url } = parsePagination(req);
      const status = url.searchParams.get("status");
      if (status) query = query.eq("status", status);
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) return errorResponse("QUERY_ERROR", error.message, 500);
    return jsonResponse({ data: driverId ? data : { items: data } });
  }

  return errorResponse("METHOD_NOT_ALLOWED", "Method not supported", 405);
}

async function handleDevices(
  supabase: any, req: Request, apiKey: string, scope: ApiScope, deviceId?: string
): Promise<Response> {
  const validation = await validateApiKey(supabase, apiKey, scope);
  if (!validation.valid) return errorResponse(validation.error!, "Authentication failed", 401);

  if (req.method === "GET") {
    let query = supabase
      .from("devices")
      .select("id, imei, manufacturer, model, status, lifecycle_status, health_status, vehicle_id, last_seen, signal_strength, battery_level, created_at")
      .eq("tenant_id", validation.tenant_id);

    if (deviceId) {
      query = query.eq("id", deviceId).single();
    } else {
      const { limit, offset, url } = parsePagination(req);
      const status = url.searchParams.get("status");
      const healthStatus = url.searchParams.get("health_status");
      if (status) query = query.eq("lifecycle_status", status);
      if (healthStatus) query = query.eq("health_status", healthStatus);
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) return errorResponse("QUERY_ERROR", error.message, 500);
    return jsonResponse({ data: deviceId ? data : { items: data } });
  }

  return errorResponse("METHOD_NOT_ALLOWED", "Method not supported", 405);
}

async function handleGeofences(
  supabase: any, req: Request, apiKey: string, scope: ApiScope, geofenceId?: string
): Promise<Response> {
  const validation = await validateApiKey(supabase, apiKey, scope);
  if (!validation.valid) return errorResponse(validation.error!, "Authentication failed", 401);

  if (req.method === "GET") {
    let query = supabase
      .from("geofences")
      .select("id, name, category, geofence_type, status, alert_on_entry, alert_on_exit, alert_on_dwell, created_at")
      .eq("tenant_id", validation.tenant_id);

    if (geofenceId) query = query.eq("id", geofenceId).single();

    const { data, error } = await query;
    if (error) return errorResponse("QUERY_ERROR", error.message, 500);
    return jsonResponse({ data: geofenceId ? data : { items: data } });
  }

  return errorResponse("METHOD_NOT_ALLOWED", "Method not supported", 405);
}

async function handleGeofenceEvents(
  supabase: any, req: Request, apiKey: string, scope: ApiScope
): Promise<Response> {
  const validation = await validateApiKey(supabase, apiKey, scope);
  if (!validation.valid) return errorResponse(validation.error!, "Authentication failed", 401);

  if (req.method === "GET") {
    const { limit, offset, url } = parsePagination(req);
    const since = url.searchParams.get("since");

    let query = supabase
      .from("geofence_events")
      .select("id, geofence_id, vehicle_id, event_type, occurred_at, latitude, longitude")
      .eq("tenant_id", validation.tenant_id)
      .order("occurred_at", { ascending: false });

    if (since) query = query.gte("occurred_at", since);
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) return errorResponse("QUERY_ERROR", error.message, 500);
    return jsonResponse({ data: { items: data } });
  }

  return errorResponse("METHOD_NOT_ALLOWED", "Method not supported", 405);
}

async function handleAlerts(
  supabase: any, req: Request, apiKey: string, scope: ApiScope, alertId?: string
): Promise<Response> {
  const validation = await validateApiKey(supabase, apiKey, scope);
  if (!validation.valid) return errorResponse(validation.error!, "Authentication failed", 401);

  if (req.method === "GET") {
    let query = supabase
      .from("alerts")
      .select("id, type, severity, message, vehicle_id, driver_id, device_id, acknowledged, created_at")
      .eq("tenant_id", validation.tenant_id)
      .order("created_at", { ascending: false });

    if (alertId) {
      query = query.eq("id", alertId).single();
    } else {
      const { limit, offset, url } = parsePagination(req);
      const severity = url.searchParams.get("severity");
      const acknowledged = url.searchParams.get("acknowledged");
      if (severity) query = query.eq("severity", severity);
      if (acknowledged !== null) query = query.eq("acknowledged", acknowledged === "true");
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) return errorResponse("QUERY_ERROR", error.message, 500);
    return jsonResponse({ data: alertId ? data : { items: data } });
  }

  return errorResponse("METHOD_NOT_ALLOWED", "Method not supported", 405);
}

async function handleMaintenance(
  supabase: any, req: Request, apiKey: string, scope: ApiScope, recordId?: string
): Promise<Response> {
  const validation = await validateApiKey(supabase, apiKey, scope);
  if (!validation.valid) return errorResponse(validation.error!, "Authentication failed", 401);

  if (req.method === "GET") {
    let query = supabase
      .from("maintenance_profiles")
      .select("id, vehicle_id, service_type, lifecycle_status, next_due_date, next_due_mileage, last_service_date, created_at")
      .eq("tenant_id", validation.tenant_id)
      .eq("is_archived", false);

    if (recordId) {
      query = query.eq("id", recordId).single();
    } else {
      const { url } = parsePagination(req);
      const status = url.searchParams.get("status");
      if (status) query = query.eq("lifecycle_status", status);
    }

    const { data, error } = await query;
    if (error) return errorResponse("QUERY_ERROR", error.message, 500);
    return jsonResponse({ data: recordId ? data : { items: data } });
  }

  return errorResponse("METHOD_NOT_ALLOWED", "Method not supported", 405);
}

async function handleFuel(
  supabase: any, req: Request, apiKey: string, scope: ApiScope, transactionId?: string
): Promise<Response> {
  const validation = await validateApiKey(supabase, apiKey, scope);
  if (!validation.valid) return errorResponse(validation.error!, "Authentication failed", 401);

  if (req.method === "GET") {
    let query = supabase
      .from("fuel_transactions")
      .select("id, vehicle_id, vehicle_name, quantity_liters, cost_ngn, fuel_type, station_name, transaction_date, created_at")
      .eq("tenant_id", validation.tenant_id)
      .order("transaction_date", { ascending: false });

    if (transactionId) {
      query = query.eq("id", transactionId).single();
    } else {
      const { limit, offset } = parsePagination(req);
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) return errorResponse("QUERY_ERROR", error.message, 500);
    return jsonResponse({ data: transactionId ? data : { items: data } });
  }

  return errorResponse("METHOD_NOT_ALLOWED", "Method not supported", 405);
}

async function handleJobs(
  supabase: any, req: Request, apiKey: string, scope: ApiScope, jobId?: string, subResource?: string
): Promise<Response> {
  const validation = await validateApiKey(supabase, apiKey, scope);
  if (!validation.valid) return errorResponse(validation.error!, "Authentication failed", 401);

  if (req.method === "GET") {
    if (jobId && subResource === "status") {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, status, driver_id, vehicle_id, updated_at")
        .eq("tenant_id", validation.tenant_id)
        .eq("id", jobId)
        .single();
      if (error) return errorResponse("NOT_FOUND", "Job not found", 404);
      return jsonResponse({ data });
    }

    let query = supabase
      .from("jobs")
      .select("id, reference, status, pickup_address, delivery_address, cargo_type, cargo_weight, driver_id, vehicle_id, amount, deadline, created_at")
      .eq("tenant_id", validation.tenant_id)
      .order("created_at", { ascending: false });

    if (jobId) {
      query = query.eq("id", jobId).single();
    } else {
      const { limit, offset, url } = parsePagination(req);
      const status = url.searchParams.get("status");
      if (status) query = query.eq("status", status);
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) return errorResponse("QUERY_ERROR", error.message, 500);
    return jsonResponse({ data: jobId ? data : { items: data } });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const required = ["reference", "pickup_address", "delivery_address", "cargo_type"];
    for (const field of required) {
      if (!body[field]) return errorResponse("VALIDATION_ERROR", `Missing required field: ${field}`, 400);
    }

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        tenant_id: validation.tenant_id,
        reference: body.reference,
        status: "created",
        pickup_address: body.pickup_address,
        pickup_lat: body.pickup_lat,
        pickup_lng: body.pickup_lng,
        delivery_address: body.delivery_address,
        delivery_lat: body.delivery_lat,
        delivery_lng: body.delivery_lng,
        cargo_type: body.cargo_type,
        cargo_weight: body.cargo_weight,
        cargo_description: body.cargo_description,
        amount: body.amount,
        deadline: body.deadline,
      })
      .select()
      .single();

    if (error) return errorResponse("INSERT_ERROR", error.message, 500);

    await supabase.rpc("dispatch_webhook_event", {
      p_tenant_id: validation.tenant_id,
      p_event_type: "job.created",
      p_data: { job_id: data.id, reference: data.reference, status: data.status },
    });

    return jsonResponse({ data }, 201);
  }

  return errorResponse("METHOD_NOT_ALLOWED", "Method not supported", 405);
}

async function handleJobOffers(
  supabase: any, req: Request, apiKey: string, scope: ApiScope, offerId?: string
): Promise<Response> {
  const validation = await validateApiKey(supabase, apiKey, scope);
  if (!validation.valid) return errorResponse(validation.error!, "Authentication failed", 401);

  if (req.method === "GET") {
    let query = supabase
      .from("driver_ivr_calls")
      .select("id, job_id, driver_phone, driver_name, driver_response, call_status, created_at, response_received_at")
      .eq("tenant_id", validation.tenant_id)
      .order("created_at", { ascending: false });

    if (offerId) query = query.eq("id", offerId).single();

    const { data, error } = await query;
    if (error) return errorResponse("QUERY_ERROR", error.message, 500);

    const transformedData = Array.isArray(data)
      ? data.map((item: any) => ({
          id: item.id,
          job_id: item.job_id,
          driver_phone: item.driver_phone,
          driver_name: item.driver_name,
          status: item.driver_response === "accepted" ? "accepted"
                : item.driver_response === "declined" ? "declined"
                : "pending",
          sent_at: item.created_at,
          responded_at: item.response_received_at,
        }))
      : data;

    return jsonResponse({ data: offerId ? transformedData : { items: transformedData } });
  }

  return errorResponse("METHOD_NOT_ALLOWED", "Method not supported", 405);
}

// ========== NEW RESOURCE HANDLERS ==========

// --- WAYBILLS ---

async function handleWaybills(
  supabase: any, req: Request, apiKey: string, scope: ApiScope, waybillId?: string, subResource?: string
): Promise<Response> {
  const validation = await validateApiKey(supabase, apiKey, scope);
  if (!validation.valid) return errorResponse(validation.error!, "Authentication failed", 401);

  // POST sub-resources: extract, approve, reject
  if (req.method === "POST" && waybillId && subResource) {
    switch (subResource) {
      case "extract":
        return handleWaybillExtract(supabase, validation.tenant_id!, waybillId);
      case "approve":
        return handleWaybillApprove(supabase, validation.tenant_id!, waybillId);
      case "reject":
        return handleWaybillReject(supabase, req, validation.tenant_id!, waybillId);
      default:
        return errorResponse("NOT_FOUND", `Sub-resource '${subResource}' not found`, 404);
    }
  }

  if (req.method === "GET") {
    const selectFields = "id, tenant_id, org_id, status, source_type, driver_name, destination, origin, vehicle_number, waybill_number, customer_name, waybill_date, quantity, quantity_unit, weight_kg, calculated_price_ngn, ai_confidence_score, created_at, updated_at";

    if (waybillId) {
      const { data, error } = await supabase
        .from("waybill_records")
        .select(selectFields)
        .eq("tenant_id", validation.tenant_id)
        .eq("id", waybillId)
        .single();
      if (error) return errorResponse("NOT_FOUND", "Waybill not found", 404);
      return jsonResponse({ data });
    }

    const { limit, offset, url } = parsePagination(req);
    const status = url.searchParams.get("status");

    let query = supabase
      .from("waybill_records")
      .select(selectFields)
      .eq("tenant_id", validation.tenant_id)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) return errorResponse("QUERY_ERROR", error.message, 500);
    return jsonResponse({ data: { items: data } });
  }

  return errorResponse("METHOD_NOT_ALLOWED", "Method not supported", 405);
}

async function handleWaybillExtract(
  supabase: any, tenantId: string, waybillId: string
): Promise<Response> {
  // Get the waybill
  const { data: waybill, error } = await supabase
    .from("waybill_records")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", waybillId)
    .single();

  if (error || !waybill) return errorResponse("NOT_FOUND", "Waybill not found", 404);
  if (waybill.status !== "pending") {
    return errorResponse("INVALID_STATE", `Waybill is already '${waybill.status}', cannot extract`, 409);
  }

  // Update status to extracting
  await supabase
    .from("waybill_records")
    .update({ status: "extracting", updated_at: new Date().toISOString() })
    .eq("id", waybillId);

  return jsonResponse({ data: { id: waybillId, status: "extracting", message: "Extraction triggered" } });
}

async function handleWaybillApprove(
  supabase: any, tenantId: string, waybillId: string
): Promise<Response> {
  const { data: waybill, error } = await supabase
    .from("waybill_records")
    .select("id, status")
    .eq("tenant_id", tenantId)
    .eq("id", waybillId)
    .single();

  if (error || !waybill) return errorResponse("NOT_FOUND", "Waybill not found", 404);
  if (waybill.status !== "extracted") {
    return errorResponse("INVALID_STATE", `Waybill must be 'extracted' to approve, currently '${waybill.status}'`, 409);
  }

  const { data, error: updateError } = await supabase
    .from("waybill_records")
    .update({ status: "approved", processed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", waybillId)
    .select("id, status, updated_at")
    .single();

  if (updateError) return errorResponse("UPDATE_ERROR", updateError.message, 500);

  // Dispatch webhook
  await supabase.rpc("dispatch_webhook_event", {
    p_tenant_id: tenantId,
    p_event_type: "waybill.approved",
    p_data: { waybill_id: waybillId },
  }).catch(() => {}); // Best effort

  return jsonResponse({ data });
}

async function handleWaybillReject(
  supabase: any, req: Request, tenantId: string, waybillId: string
): Promise<Response> {
  const body = await req.json().catch(() => ({}));

  const { data: waybill, error } = await supabase
    .from("waybill_records")
    .select("id, status")
    .eq("tenant_id", tenantId)
    .eq("id", waybillId)
    .single();

  if (error || !waybill) return errorResponse("NOT_FOUND", "Waybill not found", 404);
  if (waybill.status !== "extracted") {
    return errorResponse("INVALID_STATE", `Waybill must be 'extracted' to reject, currently '${waybill.status}'`, 409);
  }

  const { data, error: updateError } = await supabase
    .from("waybill_records")
    .update({
      status: "rejected",
      extraction_error: body.reason || "Rejected via API",
      updated_at: new Date().toISOString(),
    })
    .eq("id", waybillId)
    .select("id, status, updated_at")
    .single();

  if (updateError) return errorResponse("UPDATE_ERROR", updateError.message, 500);

  await supabase.rpc("dispatch_webhook_event", {
    p_tenant_id: tenantId,
    p_event_type: "waybill.rejected",
    p_data: { waybill_id: waybillId, reason: body.reason },
  }).catch(() => {});

  return jsonResponse({ data });
}

// --- PRICING DESTINATIONS ---

async function handlePricingDestinations(
  supabase: any, req: Request, apiKey: string, scope: ApiScope, ruleId?: string
): Promise<Response> {
  const validation = await validateApiKey(supabase, apiKey, scope);
  if (!validation.valid) return errorResponse(validation.error!, "Authentication failed", 401);

  const selectFields = "id, rule_name, origin, destination, vehicle_type, customer_name, pricing_mode, price_ngn, price_per_unit_ngn, unit_type, minimum_charge, currency, effective_from, effective_to, is_active, created_at, updated_at";

  if (req.method === "GET") {
    if (ruleId) {
      const { data, error } = await supabase
        .from("destination_pricing_rules")
        .select(selectFields)
        .eq("tenant_id", validation.tenant_id)
        .eq("id", ruleId)
        .single();
      if (error) return errorResponse("NOT_FOUND", "Pricing rule not found", 404);
      return jsonResponse({ data });
    }

    const { limit, offset, url } = parsePagination(req);
    const destination = url.searchParams.get("destination");
    const active = url.searchParams.get("active");

    let query = supabase
      .from("destination_pricing_rules")
      .select(selectFields)
      .eq("tenant_id", validation.tenant_id)
      .order("created_at", { ascending: false });

    if (destination) query = query.ilike("destination", `%${destination}%`);
    if (active !== null && active !== undefined) query = query.eq("is_active", active === "true");
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) return errorResponse("QUERY_ERROR", error.message, 500);
    return jsonResponse({ data: { items: data } });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const required = ["rule_name", "destination", "price_ngn"];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return errorResponse("VALIDATION_ERROR", `Missing required field: ${field}`, 400);
      }
    }

    const { data, error } = await supabase
      .from("destination_pricing_rules")
      .insert({
        tenant_id: validation.tenant_id,
        rule_name: body.rule_name,
        origin: body.origin || null,
        destination: body.destination,
        destination_aliases: body.destination_aliases || null,
        vehicle_type: body.vehicle_type || null,
        customer_name: body.customer_name || null,
        pricing_mode: body.pricing_mode || "flat",
        price_ngn: body.price_ngn,
        price_per_unit_ngn: body.price_per_unit_ngn || null,
        unit_type: body.unit_type || null,
        minimum_charge: body.minimum_charge || null,
        currency: body.currency || "NGN",
        effective_from: body.effective_from || new Date().toISOString().split("T")[0],
        effective_to: body.effective_to || null,
        notes: body.notes || null,
      })
      .select(selectFields)
      .single();

    if (error) return errorResponse("INSERT_ERROR", error.message, 500);
    return jsonResponse({ data }, 201);
  }

  if (req.method === "PUT" && ruleId) {
    const body = await req.json();

    const { data, error } = await supabase
      .from("destination_pricing_rules")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", validation.tenant_id)
      .eq("id", ruleId)
      .select(selectFields)
      .single();

    if (error) return errorResponse("UPDATE_ERROR", error.message, 500);
    return jsonResponse({ data });
  }

  if (req.method === "DELETE" && ruleId) {
    // Soft delete: set is_active = false
    const { data, error } = await supabase
      .from("destination_pricing_rules")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("tenant_id", validation.tenant_id)
      .eq("id", ruleId)
      .select("id, is_active, updated_at")
      .single();

    if (error) return errorResponse("DELETE_ERROR", error.message, 500);
    return jsonResponse({ data, message: "Pricing rule deactivated (soft delete)" });
  }

  return errorResponse("METHOD_NOT_ALLOWED", "Method not supported", 405);
}

// --- INVOICES ---

async function handleInvoices(
  supabase: any, req: Request, apiKey: string, scope: ApiScope, invoiceId?: string, subResource?: string
): Promise<Response> {
  const validation = await validateApiKey(supabase, apiKey, scope);
  if (!validation.valid) return errorResponse(validation.error!, "Authentication failed", 401);

  const selectFields = "id, invoice_number, waybill_id, status, customer_name, customer_phone, customer_email, subtotal_ngn, tax_rate_percent, tax_amount_ngn, discount_ngn, total_ngn, amount_paid_ngn, invoice_date, due_date, payment_terms, origin, destination, vehicle_number, waybill_number, quantity, quantity_unit, sent_via, sent_at, sent_to, created_at, updated_at";

  // POST /v1/invoices/from-waybill/{waybillId}
  if (req.method === "POST" && invoiceId === "from-waybill" && subResource) {
    return handleInvoiceFromWaybill(supabase, validation.tenant_id!, subResource);
  }

  // POST sub-resources: generate-pdf, share
  if (req.method === "POST" && invoiceId && subResource) {
    switch (subResource) {
      case "generate-pdf":
        return handleInvoiceGeneratePdf(supabase, validation.tenant_id!, invoiceId);
      case "share":
        return handleInvoiceShare(supabase, req, validation.tenant_id!, invoiceId);
      default:
        return errorResponse("NOT_FOUND", `Sub-resource '${subResource}' not found`, 404);
    }
  }

  if (req.method === "GET") {
    if (invoiceId) {
      const { data, error } = await supabase
        .from("waybill_invoices")
        .select(selectFields)
        .eq("tenant_id", validation.tenant_id)
        .eq("id", invoiceId)
        .single();
      if (error) return errorResponse("NOT_FOUND", "Invoice not found", 404);
      return jsonResponse({ data });
    }

    const { limit, offset, url } = parsePagination(req);
    const status = url.searchParams.get("status");

    let query = supabase
      .from("waybill_invoices")
      .select(selectFields)
      .eq("tenant_id", validation.tenant_id)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) return errorResponse("QUERY_ERROR", error.message, 500);
    return jsonResponse({ data: { items: data } });
  }

  // PUT /v1/invoices/{id} — edit draft only
  if (req.method === "PUT" && invoiceId) {
    // Verify it's a draft
    const { data: existing, error: fetchErr } = await supabase
      .from("waybill_invoices")
      .select("id, status")
      .eq("tenant_id", validation.tenant_id)
      .eq("id", invoiceId)
      .single();

    if (fetchErr || !existing) return errorResponse("NOT_FOUND", "Invoice not found", 404);
    if (existing.status !== "draft") {
      return errorResponse("INVALID_STATE", `Only draft invoices can be edited, current status: '${existing.status}'`, 409);
    }

    const body = await req.json();
    // Only allow safe fields to be updated
    const allowedFields = [
      "customer_name", "customer_phone", "customer_email", "customer_address",
      "line_items", "subtotal_ngn", "tax_rate_percent", "tax_amount_ngn",
      "discount_ngn", "total_ngn", "invoice_date", "due_date",
      "payment_terms", "notes",
    ];
    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) updatePayload[field] = body[field];
    }

    const { data, error } = await supabase
      .from("waybill_invoices")
      .update(updatePayload)
      .eq("id", invoiceId)
      .select(selectFields)
      .single();

    if (error) return errorResponse("UPDATE_ERROR", error.message, 500);
    return jsonResponse({ data });
  }

  return errorResponse("METHOD_NOT_ALLOWED", "Method not supported", 405);
}

async function handleInvoiceFromWaybill(
  supabase: any, tenantId: string, waybillId: string
): Promise<Response> {
  // Get the approved waybill
  const { data: waybill, error } = await supabase
    .from("waybill_records")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", waybillId)
    .single();

  if (error || !waybill) return errorResponse("NOT_FOUND", "Waybill not found", 404);
  if (waybill.status !== "approved") {
    return errorResponse("INVALID_STATE", `Waybill must be 'approved' to generate invoice, currently '${waybill.status}'`, 409);
  }

  // Check if invoice already exists for this waybill
  const { data: existingInvoice } = await supabase
    .from("waybill_invoices")
    .select("id, invoice_number")
    .eq("waybill_id", waybillId)
    .limit(1);

  if (existingInvoice && existingInvoice.length > 0) {
    return errorResponse("DUPLICATE", `Invoice already exists for this waybill: ${existingInvoice[0].invoice_number}`, 409);
  }

  // Generate invoice number
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

  const { data: invoice, error: insertError } = await supabase
    .from("waybill_invoices")
    .insert({
      tenant_id: tenantId,
      org_id: waybill.org_id,
      invoice_number: invoiceNumber,
      waybill_id: waybillId,
      status: "draft",
      customer_name: waybill.customer_name,
      origin: waybill.origin,
      destination: waybill.destination,
      vehicle_number: waybill.vehicle_number,
      waybill_number: waybill.waybill_number,
      waybill_date: waybill.waybill_date,
      quantity: waybill.quantity,
      quantity_unit: waybill.quantity_unit,
      subtotal_ngn: waybill.calculated_price_ngn || 0,
      tax_rate_percent: 7.5,
      tax_amount_ngn: (waybill.calculated_price_ngn || 0) * 0.075,
      total_ngn: (waybill.calculated_price_ngn || 0) * 1.075,
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      payment_terms: "Net 30",
    })
    .select("id, invoice_number, waybill_id, status, total_ngn, created_at")
    .single();

  if (insertError) return errorResponse("INSERT_ERROR", insertError.message, 500);

  // Update waybill status to invoiced
  await supabase
    .from("waybill_records")
    .update({ status: "invoiced", updated_at: new Date().toISOString() })
    .eq("id", waybillId);

  await supabase.rpc("dispatch_webhook_event", {
    p_tenant_id: tenantId,
    p_event_type: "invoice.created",
    p_data: { invoice_id: invoice.id, invoice_number: invoice.invoice_number, waybill_id: waybillId },
  }).catch(() => {});

  return jsonResponse({ data: invoice }, 201);
}

async function handleInvoiceGeneratePdf(
  supabase: any, tenantId: string, invoiceId: string
): Promise<Response> {
  const { data: invoice, error } = await supabase
    .from("waybill_invoices")
    .select("id, status, invoice_number, pdf_storage_path")
    .eq("tenant_id", tenantId)
    .eq("id", invoiceId)
    .single();

  if (error || !invoice) return errorResponse("NOT_FOUND", "Invoice not found", 404);

  // In production this would trigger actual PDF generation
  // For now, mark that PDF generation was requested
  const pdfPath = `invoices/${tenantId}/${invoice.invoice_number}.pdf`;

  const { error: updateError } = await supabase
    .from("waybill_invoices")
    .update({ pdf_storage_path: pdfPath, updated_at: new Date().toISOString() })
    .eq("id", invoiceId);

  if (updateError) return errorResponse("UPDATE_ERROR", updateError.message, 500);

  return jsonResponse({
    data: {
      invoice_id: invoiceId,
      pdf_path: pdfPath,
      status: "generated",
      message: "PDF generation triggered",
    },
  });
}

async function handleInvoiceShare(
  supabase: any, req: Request, tenantId: string, invoiceId: string
): Promise<Response> {
  const body = await req.json();

  if (!body.channel || !body.recipient) {
    return errorResponse("VALIDATION_ERROR", "Missing required fields: channel, recipient", 400);
  }

  if (!["whatsapp", "email"].includes(body.channel)) {
    return errorResponse("VALIDATION_ERROR", "Channel must be 'whatsapp' or 'email'", 400);
  }

  const { data: invoice, error } = await supabase
    .from("waybill_invoices")
    .select("id, status, invoice_number")
    .eq("tenant_id", tenantId)
    .eq("id", invoiceId)
    .single();

  if (error || !invoice) return errorResponse("NOT_FOUND", "Invoice not found", 404);

  // Update share info
  const { error: updateError } = await supabase
    .from("waybill_invoices")
    .update({
      sent_via: body.channel,
      sent_to: body.recipient,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  if (updateError) return errorResponse("UPDATE_ERROR", updateError.message, 500);

  // Record in invoice_shares
  await supabase
    .from("invoice_shares")
    .insert({
      tenant_id: tenantId,
      invoice_id: invoiceId,
      channel: body.channel,
      recipient: body.recipient,
      message: body.message || null,
      status: "queued",
    }).catch(() => {});

  await supabase.rpc("dispatch_webhook_event", {
    p_tenant_id: tenantId,
    p_event_type: "invoice.shared",
    p_data: { invoice_id: invoiceId, channel: body.channel, recipient: body.recipient },
  }).catch(() => {});

  return jsonResponse({
    data: {
      invoice_id: invoiceId,
      channel: body.channel,
      recipient: body.recipient,
      status: "queued",
      message: `Invoice ${invoice.invoice_number} queued for ${body.channel} delivery`,
    },
  });
}
