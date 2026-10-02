import type { PlatformWalletRow, SystemTenant } from "@truckmoov/api/auth";
import type { EnforcementRow } from "@truckmoov/api/billing";
import { formatCurrency } from "@/lib/currency";

export type CustomerFilter = "all" | "behind" | "in_grace" | "past_grace" | "suspended";

export type PaymentState = {
  label: string;
  tone: "success" | "warning" | "destructive" | "muted";
  detail?: string;
};

export type CustomerRow = {
  tenant: SystemTenant;
  wallet: PlatformWalletRow | undefined;
  enforcement: EnforcementRow | undefined;
};

export const PAGE_SIZE = 10;

const KOBO_PER_NAIRA = 100;

export function paymentState(wallet: PlatformWalletRow | undefined, walletsReady: boolean): PaymentState {
  if (!walletsReady)
    return { label: "Not available", tone: "muted" };
  if (!wallet)
    return { label: "No wallet yet", tone: "muted" };
  const balance = formatCurrency(wallet.balanceKobo / KOBO_PER_NAIRA, "NGN");
  if (wallet.status === "negative")
    return { label: "Negative balance", tone: "destructive", detail: balance };
  if (wallet.status === "low")
    return { label: "Low balance", tone: "warning", detail: balance };
  return { label: "Up to date", tone: "success" };
}

export function isBehindOnPayment(wallet: PlatformWalletRow | undefined) {
  return wallet?.status === "negative";
}

export function isSuspended(tenant: SystemTenant) {
  return tenant.status === "suspended";
}

export function parseFilter(value: string | null): CustomerFilter {
  const known: CustomerFilter[] = ["behind", "in_grace", "past_grace", "suspended"];
  return known.find(f => f === value) ?? "all";
}

export function applyFilter(rows: CustomerRow[], filter: CustomerFilter) {
  if (filter === "behind")
    return rows.filter(r => isBehindOnPayment(r.wallet));
  if (filter === "in_grace" || filter === "past_grace")
    return rows.filter(r => r.enforcement?.stage === filter && !r.enforcement.suspended);
  if (filter === "suspended")
    return rows.filter(r => isSuspended(r.tenant));
  return rows;
}

export function errorMessage(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  return message || "Something went wrong. Please try again.";
}
