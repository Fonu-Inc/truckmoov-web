import type { InstallationLayoutContext } from "@/features/installation/components/layout/InstallationLayout";
import { useOutletContext } from "react-router";
import { ConfigQueue } from "@/features/installation/components/ui/ConfigQueue";

export default function ConfigQueuePage() {
  const {
    configQueueDevices,
    catalog,
    loading,
    catalogLoading,
    refetch,
    markConfigured,
    resetToConfigPending,
    openTroubleshooting,
    canConfigureDevices,
    canResetDevices,
  } = useOutletContext<InstallationLayoutContext>();

  return (
    <ConfigQueue
      devices={configQueueDevices}
      catalog={catalog}
      loading={loading || catalogLoading}
      onRefresh={refetch}
      onMarkConfigured={markConfigured}
      onReset={resetToConfigPending}
      onTroubleshoot={openTroubleshooting}
      canConfigure={canConfigureDevices()}
      canReset={canResetDevices()}
    />
  );
}
