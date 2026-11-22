import type { SystemOnboardingApplicationDetail } from "@truckmoov/api/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";

/**
 * Fleetflow's "Device & SIM Allocation" card on an approved application.
 * Requested devices are live; allocation happens in the provisioning step, so
 * this card does not invent SIM or allocated counts.
 */
export function TenantHardwareAllocation({ application }: { application: Pick<SystemOnboardingApplicationDetail, "deviceRequests"> }) {
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
        <p className="text-sm text-muted-foreground">
          Devices are reserved when the application is marked provisioned.
          Installation and vehicle/device connections remain with the installer.
        </p>
      </CardContent>
    </Card>
  );
}
