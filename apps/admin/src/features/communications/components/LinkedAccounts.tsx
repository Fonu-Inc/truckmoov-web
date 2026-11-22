import type { MessagingLinkedDriver } from "@truckmoov/api/notification";
import { useQuery } from "@tanstack/react-query";
import { getSystemTenantQueryOptions } from "@truckmoov/api/auth";
import { getMessagingContactLinks } from "@truckmoov/api/notification";
import { Link } from "react-router";
import { Skeleton } from "@/components/shadcn/skeleton";

function DriverLink({ driver }: { driver: MessagingLinkedDriver }) {
  const tenant = useQuery(getSystemTenantQueryOptions(driver.tenant_id));
  const tenantName = tenant.data?.data.tenant.name;
  return (
    <li className="text-sm">
      <p className="font-medium text-foreground">{driver.name || "Unnamed driver"}</p>
      <p className="text-xs text-muted-foreground">
        {driver.status ? `${driver.status} driver` : "Driver"}
        {" at "}
        <Link
          className="text-primary underline-offset-2 hover:underline"
          to={`/tenants/${driver.tenant_id}`}
        >
          {tenantName ?? "their organization"}
        </Link>
      </p>
    </li>
  );
}

/** Drivers, in any tenant, who list this conversation's number. */
export function LinkedAccounts({ conversationId }: { conversationId: string }) {
  const links = useQuery({
    queryKey: [
      "platform-messaging",
      "links",
      conversationId,
    ],
    queryFn: () => getMessagingContactLinks(conversationId),
    staleTime: 5 * 60_000,
    retry: false,
  });

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">Linked accounts</p>
      {links.isLoading && <Skeleton className="h-10 w-full" />}
      {links.isError && <p className="text-sm text-muted-foreground">Could not check linked accounts.</p>}
      {links.data && links.data.drivers.length === 0 && (
        <p className="text-sm text-muted-foreground">No driver uses this number.</p>
      )}
      {links.data && links.data.drivers.length > 0 && (
        <ul className="space-y-2">
          {links.data.drivers.map(driver => (
            <DriverLink
              key={`${driver.tenant_id}:${driver.driver_id}`}
              driver={driver}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
