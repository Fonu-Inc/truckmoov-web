import type { SystemTenant } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import { useEnforcementList, useEnforcementSettings } from "@truckmoov/api/billing";
import { getSystemTenantsQueryOptions, getSystemWalletsQueryOptions } from "@truckmoov/api/auth";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { AccessBanner } from "@/features/security/components/payments-access/AccessBanner";
import { PaymentGraceCard } from "@/features/security/components/payments-access/PaymentGraceCard";
import { WouldSuspendPanel } from "@/features/security/components/payments-access/WouldSuspendPanel";
import { CustomerTable } from "@/features/security/components/payments-access/CustomerTable";
import { applyFilter, parseFilter } from "@/features/security/components/payments-access/paymentsAccessModel";
import type { CustomerFilter, CustomerRow } from "@/features/security/components/payments-access/paymentsAccessModel";
import { RestoreAccessDialog } from "@/features/security/components/payments-access/RestoreAccessDialog";
import { SuspendAccessDialog } from "@/features/security/components/payments-access/SuspendAccessDialog";
import { useAuthStore } from "@/stores/authStore";

const SEARCH_DEBOUNCE_MS = 350;
const ACTING_ROLES = ["SUPER_ADMIN", "SYSTEM_ADMIN"];
const ENFORCEMENT_PAGE_SIZE = 100;

const FILTERS: { value: CustomerFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "behind", label: "Negative balance" },
  { value: "in_grace", label: "In grace" },
  { value: "past_grace", label: "Grace ended" },
  { value: "suspended", label: "Suspended" },
];

function useDebounced(value: string) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);
  return debounced;
}

function useCustomerRows(search: string, filter: CustomerFilter) {
  const tenantsQuery = useQuery(getSystemTenantsQueryOptions({
    params: {
      ...(search ? { search } : {}),
      ...(filter === "suspended" ? { status: "suspended" as const } : {}),
    },
  }));
  const walletsQuery = useQuery(getSystemWalletsQueryOptions());
  const enforcementQuery = useEnforcementList({ params: { pageSize: ENFORCEMENT_PAGE_SIZE } });

  const rows = useMemo<CustomerRow[]>(() => {
    const wallets = new Map((walletsQuery.data?.data.wallets ?? []).map(w => [w.tenantId, w]));
    const enforcement = new Map((enforcementQuery.data?.data.items ?? []).map(e => [e.tenantId, e]));
    const tenants = tenantsQuery.data?.data.tenants ?? [];
    return applyFilter(
      tenants.map(tenant => ({ tenant, wallet: wallets.get(tenant.id), enforcement: enforcement.get(tenant.id) })),
      filter,
    );
  }, [tenantsQuery.data, walletsQuery.data, enforcementQuery.data, filter]);

  const needsEnforcement = filter === "in_grace" || filter === "past_grace";

  return {
    rows,
    isLoading: tenantsQuery.isLoading || (filter === "behind" && walletsQuery.isLoading) || (needsEnforcement && enforcementQuery.isLoading),
    isError: tenantsQuery.isError || (filter === "behind" && walletsQuery.isError) || (needsEnforcement && enforcementQuery.isError),
    enforcementTotal: enforcementQuery.data?.data.total ?? 0,
    enforcementFailed: enforcementQuery.isError,
    walletsReady: !!walletsQuery.data,
    walletsFailed: walletsQuery.isError,
    retry: () => {
      void tenantsQuery.refetch();
      void walletsQuery.refetch();
      void enforcementQuery.refetch();
    },
  };
}

export default function PaymentsAccessPage() {
  const role = useAuthStore(s => s.user?.role);
  const canAct = !!role && ACTING_ROLES.includes(role);
  const [searchInput, setSearchInput] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = parseFilter(searchParams.get("status"));
  const setFilter = (next: CustomerFilter) =>
    setSearchParams(next === "all" ? {} : { status: next }, { replace: true });
  const [page, setPage] = useState(1);
  const [toSuspend, setToSuspend] = useState<SystemTenant | null>(null);
  const [toRestore, setToRestore] = useState<SystemTenant | null>(null);
  const search = useDebounced(searchInput);
  const data = useCustomerRows(search, filter);
  const settings = useEnforcementSettings();

  useEffect(() => setPage(1), [search, filter]);

  return (
    <div className="space-y-4">
      <PaymentGraceCard isSuperAdmin={role === "SUPER_ADMIN"} canEdit={canAct} />
      <WouldSuspendPanel autoSuspendEnabled={settings.data?.data.autoSuspendEnabled} />
      <AccessBanner />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? "default" : "outline"}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by company"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
      </div>
      <CustomerTable
        rows={data.rows}
        page={page}
        onPage={setPage}
        isLoading={data.isLoading}
        isError={data.isError}
        onRetry={data.retry}
        walletsReady={data.walletsReady}
        canAct={canAct}
        onSuspend={setToSuspend}
        onRestore={setToRestore}
      />
      <p className="text-xs text-muted-foreground">
        {data.walletsFailed
          ? "Payment state could not be loaded right now. "
          : ""}
        {data.enforcementFailed ? "Grace information could not be loaded right now. " : ""}
        {data.enforcementTotal > ENFORCEMENT_PAGE_SIZE
          ? `Grace information is shown for the ${ENFORCEMENT_PAGE_SIZE} customers who have been overdue longest. `
          : ""}
        Today the automatic check covers unpaid invoices and unpaid SIM monthly charges.
      </p>
      <SuspendAccessDialog tenant={toSuspend} onClose={() => setToSuspend(null)} />
      <RestoreAccessDialog tenant={toRestore} onClose={() => setToRestore(null)} />
    </div>
  );
}
