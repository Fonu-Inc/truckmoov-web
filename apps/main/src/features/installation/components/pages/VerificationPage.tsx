import type { InstallationLayoutContext } from "@/features/installation/components/layout/InstallationLayout";
import { VerificationMonitor } from "@truckmoov/reusables/components/installation/VerificationMonitor";
import { useOutletContext } from "react-router";

export default function VerificationPage() {
  const {
    configQueueDevices,
    loading,
    refetch,
    openTroubleshooting,
  } = useOutletContext<InstallationLayoutContext>();

  const devices = configQueueDevices.filter(device =>
    device.lifecycle_status === "configured"
    || device.verification_status === "pending");

  return (
    <VerificationMonitor
      devices={devices}
      loading={loading}
      onRefresh={refetch}
      onTroubleshoot={openTroubleshooting}
    />
  );
}
