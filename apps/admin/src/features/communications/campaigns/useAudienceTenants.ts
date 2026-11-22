import type { AudienceTenant } from "./audience";
import { useQuery } from "@tanstack/react-query";
import { getSystemTenantsQueryOptions } from "@truckmoov/api/auth";
import { useMemo } from "react";
import { isMessageable } from "./audience";

export function useAudienceTenants(enabled: boolean) {
  const query = useQuery({
    ...getSystemTenantsQueryOptions(), enabled,
  });
  const tenants = useMemo<AudienceTenant[]>(
    () => (query.data?.data.tenants ?? [])
      .map(t => ({
        id: t.id, name: t.name, email: t.email, phone: t.phone, status: t.status,
      }))
      .filter(isMessageable),
    [query.data],
  );
  return {
    tenants, isLoading: query.isLoading, isError: query.isError,
  };
}
