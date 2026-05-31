/**
 * Shared utility for recording postpaid usage events.
 * Called by edge functions (fonu-sms, fonu-voice, whatsapp-send, ai-load-matching)
 * after a billable action succeeds, but ONLY for postpaid tenants.
 */

export async function recordUsageIfPostpaid(
  supabase: any,
  tenantId: string,
  eventType: string,
  quantity: number = 1,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // Check if tenant is postpaid
    const { data: tenant } = await supabase
      .from("tenants")
      .select("billing_model")
      .eq("id", tenantId)
      .single();

    if (!tenant || tenant.billing_model !== "postpaid") {
      return; // Not postpaid, skip usage recording
    }

    // Look up rate
    const { data: rate } = await supabase
      .from("communication_rates")
      .select("rate_ngn")
      .eq("communication_type", eventType)
      .eq("is_active", true)
      .single();

    const unitRate = rate?.rate_ngn || 0;

    // Record usage event via the DB function
    const { error } = await supabase.rpc("record_usage_event", {
      p_tenant_id: tenantId,
      p_org_id: null,
      p_event_type: eventType,
      p_quantity: quantity,
      p_unit_rate_ngn: unitRate,
      p_metadata: metadata || null,
    });

    if (error) {
      console.error(`[usage-recorder] Failed to record ${eventType} for tenant ${tenantId}:`, error);
    } else {
      console.log(`[usage-recorder] Recorded ${quantity}x ${eventType} for postpaid tenant ${tenantId}`);
    }
  } catch (err) {
    // Non-blocking: don't fail the parent operation
    console.error("[usage-recorder] Error:", err);
  }
}

/**
 * Pre-action credit limit check for postpaid tenants.
 * Returns { allowed: true } for non-postpaid tenants or if within limits.
 */
export async function checkCreditLimit(
  supabase: any,
  tenantId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("billing_model")
      .eq("id", tenantId)
      .single();

    if (!tenant || tenant.billing_model !== "postpaid") {
      return { allowed: true }; // Not postpaid, no credit limit applies
    }

    const { data: creditLimit } = await supabase
      .from("credit_limits")
      .select("credit_limit_ngn, current_usage_ngn, is_suspended, hard_limit_action")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!creditLimit) {
      return { allowed: true }; // No credit limit configured
    }

    if (creditLimit.is_suspended) {
      return { allowed: false, reason: "Account suspended due to credit limit exceeded" };
    }

    if (
      creditLimit.hard_limit_action === "suspend_services" &&
      creditLimit.current_usage_ngn >= creditLimit.credit_limit_ngn
    ) {
      return { allowed: false, reason: "Credit limit reached. Please contact support." };
    }

    return { allowed: true };
  } catch (err) {
    console.error("[credit-check] Error:", err);
    return { allowed: true }; // Fail open to avoid blocking services
  }
}
