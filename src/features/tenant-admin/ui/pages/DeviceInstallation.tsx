import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfigQueue } from '@/components/installation/ConfigQueue';
import { InstallerGuide } from '@/components/installation/InstallerGuide';
import { VerificationMonitor } from '@/components/installation/VerificationMonitor';
import { BulkDeviceImport } from '@/components/installation/BulkDeviceImport';
import { DeviceTroubleshooting } from '@/components/installation/DeviceTroubleshooting';
import { DeviceSetupRequestsQueue } from '@/components/devices/DeviceSetupRequestsQueue';
import { useInstallerConfig } from '@/hooks/useInstallerConfig';
import { useDeviceCatalog } from '@/hooks/useDeviceCatalog';
import { useDeviceSetupRequests } from '@/hooks/useDeviceSetupRequests';
import {
  ListChecks,
  BookOpen,
  Radio,
  Upload,
  Wrench,
  Inbox,
} from 'lucide-react';

export default function DeviceInstallation() {
  const [activeTab, setActiveTab] = useState('setup-requests');
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
  const { requests, loading: requestsLoading, refetch: refetchRequests, updateRequestStatus, pendingCount } = useDeviceSetupRequests();

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
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="setup-requests" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              <span className="hidden sm:inline">Setup Requests</span>
              {pendingCount > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
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
            <TabsTrigger value="bulk-import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Bulk Import</span>
            </TabsTrigger>
            <TabsTrigger value="troubleshooting" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Troubleshooting</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup-requests" className="mt-6">
            <DeviceSetupRequestsQueue
              requests={requests}
              loading={requestsLoading}
              onRefresh={refetchRequests}
              onUpdateStatus={updateRequestStatus}
              isConfigurator={canConfigureDevices()}
            />
          </TabsContent>

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

          <TabsContent value="bulk-import" className="mt-6">
            <BulkDeviceImport
              catalog={catalog}
              onImportComplete={refetch}
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
