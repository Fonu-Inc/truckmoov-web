import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfigQueue } from '@/components/installation/ConfigQueue';
import { InstallerGuide } from '@/components/installation/InstallerGuide';
import { VerificationMonitor } from '@/components/installation/VerificationMonitor';
import { DeviceTroubleshooting } from '@/components/installation/DeviceTroubleshooting';
import { useInstallerConfig } from '@/hooks/useInstallerConfig';
import { useDeviceCatalog } from '@/hooks/useDeviceCatalog';
import {
  ListChecks,
  BookOpen,
  Radio,
  Wrench,
} from 'lucide-react';

export default function DeviceInstallation() {
  const [activeTab, setActiveTab] = useState('config-queue');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const {
    configQueueDevices,
    loading,
    refetch,
    markConfigured,
    resetToConfigPending,
    canConfigureDevices,
    canResetDevices,
  } = useInstallerConfig();

  const { catalog, loading: catalogLoading } = useDeviceCatalog();

  const handleOpenTroubleshooting = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setActiveTab('troubleshooting');
  };

  return (
    <DashboardLayout
      title="Installation & Configuration"
      subtitle="Installer-friendly device setup and verification"
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="config-queue" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              <span className="hidden sm:inline">Config Queue</span>
            </TabsTrigger>
            <TabsTrigger value="installer-guide" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Installer Guide</span>
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              <span className="hidden sm:inline">Verification</span>
            </TabsTrigger>
            <TabsTrigger value="troubleshooting" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Troubleshooting</span>
            </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="config-queue" className="mt-6">
            <ConfigQueue
              devices={configQueueDevices}
              catalog={catalog}
              loading={loading || catalogLoading}
              onRefresh={refetch}
              onMarkConfigured={markConfigured}
              onReset={resetToConfigPending}
              onTroubleshoot={handleOpenTroubleshooting}
              canConfigure={canConfigureDevices()}
              canReset={canResetDevices()}
            />
          </TabsContent>

          <TabsContent value="installer-guide" className="mt-6">
            <InstallerGuide catalog={catalog} loading={catalogLoading} />
          </TabsContent>

          <TabsContent value="verification" className="mt-6">
            <VerificationMonitor
              devices={configQueueDevices.filter(d =>
                d.lifecycle_status === 'configured' ||
                (d as any).verification_status === 'pending'
              )}
              loading={loading}
              onRefresh={refetch}
              onTroubleshoot={handleOpenTroubleshooting}
            />
          </TabsContent>

          <TabsContent value="troubleshooting" className="mt-6">
            <DeviceTroubleshooting
              devices={configQueueDevices}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={setSelectedDeviceId}
              onReset={canResetDevices() ? resetToConfigPending : undefined}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
