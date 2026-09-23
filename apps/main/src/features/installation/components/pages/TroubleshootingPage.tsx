import type { InstallationLayoutContext } from "@/features/installation/components/layout/InstallationLayout";
import { DeviceTroubleshooting } from "@truckmoov/reusables/components/installation/DeviceTroubleshooting";
import { useOutletContext } from "react-router";

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
