import type { SystemTenant } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import { getSystemTenantsQueryOptions } from "@truckmoov/api/auth";
import { ArrowLeft } from "lucide-react";
import {
  useNavigate, useParams,
} from "react-router";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";
import { TenantDetailsSheet } from "@/features/tenants/components/ui/TenantDetailsSheet";

/**
 * Tenant detail screen behind `/tenants/:id`.
 *
 * `/tenants/:id` has no `sidebarNav` entry, so the shell gives it no top-bar title —
 * the back link below is the page's own heading (see docs/design.md, "One route, one name").
 *
 * ponytail: the tenant row comes from the already-cached list query rather than a
 * detail endpoint. `getSystemTenantQueryOptions(id)` returns an untyped
 * `Record<string, unknown>` (packages/api types.ts:2025), and TenantDetailsSheet
 * already fetches it internally for the extended fields. Swap to a typed detail
 * endpoint here if one lands.
 */
export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const tenantsQuery = useQuery(getSystemTenantsQueryOptions());
  const tenants: SystemTenant[] = tenantsQuery.data?.data?.tenants ?? [];
  const tenant = tenants.find(t => t.id === id);

  const backToList = (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 gap-2"
      onClick={() => navigate("/tenants")}
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tenants
    </Button>
  );

  if (tenantsQuery.isLoading) {
    return (
      <div className="space-y-6">
        {backToList}
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-4">
        {backToList}
        <p className="text-sm text-muted-foreground">Tenant not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {backToList}
      <TenantDetailsSheet
        tenant={tenant}
        open
        onOpenChange={o => !o && navigate("/tenants")}
        asPage
      />
    </div>
  );
}
