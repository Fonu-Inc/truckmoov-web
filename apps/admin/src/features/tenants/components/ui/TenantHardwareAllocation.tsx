import type { SystemOnboardingApplicationDetail } from "@truckmoov/api/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";

/**
 * "Device & SIM Allocation" card on an approved application. Devices are
 * allocated automatically on approval; SIM counts are not tracked here.
 */
export function TenantHardwareAllocation({ application }: { application: Pick<SystemOnboardingApplicationDetail, "deviceRequests" | "deviceAllocation"> }) {
  const allocation = application.deviceAllocation;
  const requestedDevices = application.deviceRequests.reduce(
    (sum, request) => sum + request.quantity,
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device & SIM Allocation</CardTitle>
        <CardDescription>
          {requestedDevices === 1
            ? "1 device requested"
            : `${requestedDevices} devices requested`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {allocation && (
          <dl className="mb-3 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Requested</dt>
              <dd className="font-medium">{allocation.requested}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Allocated</dt>
              <dd className="font-medium">{allocation.allocated}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Still owed</dt>
              <dd className="font-medium">{allocation.owed}</dd>
            </div>
          </dl>
        )}
        {allocation && allocation.owed > 0 && (
          <p className="mb-3 text-sm text-destructive">
            {`Platform stock ran short. Use Record Assignment to allocate the remaining ${allocation.owed} once stock is available.`}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Installation and vehicle/device connections remain with the installer.
        </p>
      </CardContent>
    </Card>
  );
}
