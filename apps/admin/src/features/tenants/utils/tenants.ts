import type { SystemTenant } from "@truckmoov/api/auth";
import {
  endOfDay,
  isAfter,
  isBefore,
  startOfDay,
  subMinutes,
  toDate,
} from "@truckmoov/app-core/utils/time-utils";

export type TenantLifecycleStatus = "active" | "suspended" | "terminated" | "inactive";

/**
 * Tenants only ever carry four lifecycle states inside the platform —
 * KYC/approval happens before the account is provisioned, so legacy
 * "pending"/"trial" records are surfaced as Inactive (fleetflow's normalizeStatus).
 */
export function normalizeStatus(status: string): TenantLifecycleStatus {
  if (status === "active")
    return "active";
  if (status === "suspended")
    return "suspended";
  if (status === "terminated")
    return "terminated";
  return "inactive";
}

/**
 * Fleetflow's two tenant types, from the tenant's organisation types. Anything
 * that is not an owner-operator reads as Enterprise there, so fleet providers and
 * aggregators fold into ENTERPRISE (deduplicated).
 */
export function tenantOrgTypes(tenant: Pick<SystemTenant, "organizationTypes" | "organizationType">): string[] {
  const raw = tenant.organizationTypes?.length
    ? tenant.organizationTypes
    : tenant.organizationType ? [tenant.organizationType] : [];
  return [...new Set(raw.map(t => (t.toUpperCase() === "OWNER_OPERATOR" ? "OWNER_OPERATOR" : "ENTERPRISE")))];
}

export function tenantTypeOf(tenant: Pick<SystemTenant, "organizationTypes" | "organizationType">): "ENTERPRISE" | "OWNER_OPERATOR" {
  return tenantOrgTypes(tenant).includes("OWNER_OPERATOR") ? "OWNER_OPERATOR" : "ENTERPRISE";
}

/**
 * Prepaid vs postpaid, from the tenant's plan entitlements. Returns null when
 * the plan has no payment model rather than inventing one.
 */
export function getBillingModel(tenant: { billingModel?: string | null }): "prepaid" | "postpaid" | null {
  const raw = (tenant.billingModel || "").toLowerCase();
  if (raw === "postpaid")
    return "postpaid";
  if (raw === "prepaid" || raw === "subscription")
    return "prepaid";
  return null;
}

/** Epoch ms for sorting; 0 when missing, so undated rows sort first ascending. */
export function toTime(value: string | null | undefined): number {
  return toDate(value)?.getTime() ?? 0;
}

/** Inclusive day window for a "from / to" date filter. A missing value never matches a set bound. */
export function inDateWindow(value: string | null | undefined, from?: string, to?: string): boolean {
  if (!from && !to)
    return true;
  if (!toDate(value))
    return false;
  return (!from || !isBefore(
    value,
    startOfDay(from),
  ))
  && (!to || !isAfter(
    value,
    endOfDay(to),
  ));
}

/** ISO timestamp `mins` minutes before now — keeps demo rows looking recent. */
export function minutesAgo(mins: number) {
  return subMinutes(
    new Date(),
    mins,
  )?.toISOString() ?? "";
}
