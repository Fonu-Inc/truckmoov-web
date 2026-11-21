import { BILLING_QUERY_KEY } from "@truckmoov/api/billing";
import { queryClient } from "@truckmoov/api/lib/query-client";

export function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** Refetch the billing enforcement lists after a suspend/restore. */
export function invalidateEnforcement() {
  void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY.enforcementRoot });
}

export function errorMessage(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  return message || "Something went wrong. Please try again.";
}
