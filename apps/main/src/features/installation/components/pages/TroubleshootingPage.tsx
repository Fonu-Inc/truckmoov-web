import type { InstallationLayoutContext } from "@/features/installation/components/layout/InstallationLayout";
import { useOutletContext } from "react-router";
import { DeviceTroubleshooting } from "@/features/installation/components/ui/DeviceTroubleshooting";

export default function TroubleshootingPage() {
  const {
    configQueueDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    resetToConfigPending,
    canResetDevices,
  } = useOutletContext<InstallationLayoutContext>();

  return (
    <DeviceTroubleshooting
      devices={configQueueDevices}
      selectedDeviceId={selectedDeviceId}
      onSelectDevice={setSelectedDeviceId}
      onReset={canResetDevices() ? resetToConfigPending : undefined}
    />
  );
}
