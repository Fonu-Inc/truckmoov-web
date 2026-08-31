import type { InstallationLayoutContext } from "@/features/installation/components/layout/InstallationLayout";
import { useOutletContext } from "react-router";
import { VerificationMonitor } from "@/features/installation/components/ui/VerificationMonitor";

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
