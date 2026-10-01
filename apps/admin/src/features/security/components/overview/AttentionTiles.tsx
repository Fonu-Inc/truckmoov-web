import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemDevicesSummaryQueryOptions,
  getSystemInstallationJobsQueryOptions,
  getSystemSimsSummaryQueryOptions,
  getSystemTenantsSummaryQueryOptions,
  getSystemWalletsQueryOptions,
} from "@truckmoov/api/auth";
import type { TileState } from "./TileShell";
import { TileShell } from "./TileShell";

const PAYMENTS = "/security/payments-access";
const DEVICES_SIMS = "/security/devices-sims";

function stateOf(...queries: UseQueryResult[]): TileState {
  if (queries.some(q => q.isError))
    return "error";
  if (queries.some(q => q.isPending))
    return "loading";
  return "ready";
}

function retryAll(...queries: UseQueryResult[]) {
  return () => queries.forEach(q => void q.refetch());
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function SuspendedCustomersTile() {
  const query = useQuery(getSystemTenantsSummaryQueryOptions());
  return (
    <TileShell
      label="Customers suspended"
      to={`${PAYMENTS}?status=suspended`}
      state={stateOf(query)}
      value={query.data?.data.suspendedTenants}
      hint="Locked out, and their devices, SIMs and share links are held."
      onRetry={retryAll(query)}
    />
  );
}

function InGraceTile() {
  const query = useQuery(getSystemTenantsSummaryQueryOptions());
  const pastGrace = query.data?.data.pastGraceTenants;
  return (
    <TileShell
      label="Customers in grace"
      to={`${PAYMENTS}?status=in_grace`}
      state={stateOf(query)}
      value={query.data?.data.inGraceTenants}
      hint={pastGrace ? `Overdue but not yet suspended. Also ${pastGrace} past grace (suspended or next in line).` : "Overdue but not yet suspended"}
      onRetry={retryAll(query)}
    />
  );
}

function BehindOnPaymentTile() {
  const wallets = useQuery(getSystemWalletsQueryOptions());
  const tenants = useQuery(getSystemTenantsSummaryQueryOptions());
  const overdue = tenants.data?.data.overdueInvoices;
  const hint = overdue == null
    ? "Customers with a negative wallet balance"
    : `Negative wallet balance. Also ${plural(overdue, "overdue invoice", "overdue invoices")}.`;
  return (
    <TileShell
      label="Customers behind on payment"
      to={`${PAYMENTS}?status=behind`}
      state={stateOf(wallets)}
      value={wallets.data?.data.summary.negativeBalance}
      hint={hint}
      partial
      onRetry={retryAll(wallets, tenants)}
    />
  );
}

function SuspendedDevicesTile() {
  const query = useQuery(getSystemDevicesSummaryQueryOptions());
  return (
    <TileShell
      label="Devices suspended"
      to={`${DEVICES_SIMS}?status=suspended`}
      state={stateOf(query)}
      value={query.data?.data.suspendedDevices}
      onRetry={retryAll(query)}
    />
  );
}

function SuspendedSimsTile() {
  const query = useQuery(getSystemSimsSummaryQueryOptions());
  return (
    <TileShell
      label="SIMs suspended"
      to={`${DEVICES_SIMS}?status=suspended`}
      state={stateOf(query)}
      value={query.data ? (query.data.data.byStatus.suspended ?? 0) : undefined}
      onRetry={retryAll(query)}
    />
  );
}

function InstallProblemsTile() {
  const reported = useQuery(getSystemInstallationJobsQueryOptions({ status: "issue_reported", limit: 1 }));
  const overdue = useQuery(getSystemInstallationJobsQueryOptions({ status: "overdue", limit: 1 }));
  const total = reported.data && overdue.data
    ? reported.data.data.total + overdue.data.data.total
    : undefined;
  return (
    <TileShell
      label="Installation problems"
      to="/installers"
      state={stateOf(reported, overdue)}
      value={total}
      hint="Issues reported or jobs running late"
      onRetry={retryAll(reported, overdue)}
    />
  );
}

export function AttentionTiles() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <SuspendedCustomersTile />
      <InGraceTile />
      <BehindOnPaymentTile />
      <SuspendedDevicesTile />
      <SuspendedSimsTile />
      <InstallProblemsTile />
    </div>
  );
}
