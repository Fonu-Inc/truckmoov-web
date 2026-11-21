import type { SystemOnboardingApplicationDetail } from "@truckmoov/api/auth";
import { Cpu } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";

/**
 * Fleetflow's "Device & SIM Allocation" card on an approved application.
 *
 * ponytail: mock data from fleetflow parity port — wire to packages/api
 * There is no platform allocation endpoint: device stock is reserved by the provisioning
 * step ("Mark provisioned"). Requested devices are live; the SIM count follows the
 * reference's `includeSim` rule (no such flag here, so 0), allocated counts are 0, and the
 * button points at provisioning instead of opening the reference's inventory picker.
 */
export function TenantHardwareAllocation({ application }: { application: Pick<SystemOnboardingApplicationDetail, "deviceRequests"> }) {
  const requestedDevices = application.deviceRequests.reduce(
    (sum, request) => sum + request.quantity,
    0,
  );
  const requestedSims = 0;
  const allocatedDevices = 0;
  const allocatedSims = 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Device & SIM Allocation</CardTitle>
            <CardDescription>
              {`${requestedDevices} devices and ${requestedSims} SIMs requested · ${allocatedDevices} devices and ${allocatedSims} SIMs allocated`}
            </CardDescription>
          </div>
          <Button onClick={() => toast.info("Devices are reserved when the application is marked provisioned.")}>
            <Cpu className="mr-2 h-4 w-4" />
            Allocate Devices & SIMs
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Allocation reserves hardware for this tenant. Installation and vehicle/device connections remain with the installer.</p>
        <p className="text-sm text-muted-foreground">No devices or SIMs allocated.</p>
      </CardContent>
    </Card>
  );
}
