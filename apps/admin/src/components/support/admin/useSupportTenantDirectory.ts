import { useQuery } from "@tanstack/react-query";
import { getSystemTenantsQueryOptions } from "@truckmoov/api/auth";
import { useMemo } from "react";

/**
 * Support rows carry only `tenantId`. Fleetflow resolves the tenant's name (and,
 * on All Tickets, its organisation types) from the tenants table — here the
 * unpaginated system tenants list supplies both.
 */
export function useSupportTenantDirectory() {
  const tenantsQuery = useQuery(getSystemTenantsQueryOptions());

  return useMemo(
    () => {
      const tenants = new Map((tenantsQuery.data?.data?.tenants ?? []).map(t => [
        t.id,
        {
          name: t.name,
          types: (t.organizationTypes ?? (t.organizationType ? [t.organizationType] : [])).map(type => type.toUpperCase()),
        },
      ]));

      return {
        /** Tenant name, or `undefined` while unknown so each caller keeps the fork's own fallback copy. */
        tenantName: (id: string) => (id === "system" ? "System / Platform" : tenants.get(id)?.name),
        /** Fleetflow's tenant-type rule: owner-operator wins, else any fleet org type is Enterprise. */
        tenantType: (id: string) => {
          const types = tenants.get(id)?.types;
          if (types?.includes("OWNER_OPERATOR"))
            return "Owner-Operator";
          if (types?.some(type => [
            "ENTERPRISE",
            "FLEET_PROVIDER",
            "AGGREGATOR",
          ].includes(type))) {
            return "Enterprise";
          }
          return "—";
        },
      };
    },
    [tenantsQuery.data],
  );
}
