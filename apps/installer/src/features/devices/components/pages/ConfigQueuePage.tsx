import type { ElementType } from "react";
import { ConfigQueue } from "@truckmoov/reusables/components/installation/ConfigQueue";
import {
  CheckCircle2,
  Link2,
  ListChecks,
  PackageCheck,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Card, CardContent,
} from "@/components/shadcn/card";
import {
  useDeviceCatalog,
  useDeviceConfig,
} from "@/features/devices/hooks/useDeviceConfig";

export default function ConfigQueuePage() {
  const navigate = useNavigate();

  const {
    configQueueDevices,
    loading,
    refetch,
    markConfigured,
    resetToConfigPending,
    canConfigureDevices,
    canResetDevices,
  } = useDeviceConfig();

  const {
    catalog, loading: catalogLoading,
  } = useDeviceCatalog();

  const kpis: {
    id: string; label: string; value: number; icon: ElementType;
  }[] = useMemo(
    () => {
      const count = (s: string) =>
        configQueueDevices.filter(d => d.lifecycle_status === s).length;
      return [
        {
          id: "total", label: "Devices In Queue", value: configQueueDevices.length, icon: ListChecks,
        },
        {
          id: "config_pending", label: "Configuration Pending", value: count("config_pending"), icon: Settings2,
        },
        {
          id: "configured", label: "Configured", value: count("configured"), icon: CheckCircle2,
        },
        {
          id: "registered", label: "Registered", value: count("registered"), icon: PackageCheck,
        },
        {
          id: "verified_online", label: "Verified", value: count("verified_online"), icon: ShieldCheck,
        },
        {
          id: "assignable", label: "Assignable", value: count("assignable"), icon: Link2,
        },
      ];
    },
    [configQueueDevices],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(k => (
          <Card key={k.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <k.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{k.label}</p>
                <p className="truncate text-xl font-semibold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfigQueue
        devices={configQueueDevices}
        catalog={catalog}
        loading={loading || catalogLoading}
        onRefresh={refetch}
        onMarkConfigured={markConfigured}
        onReset={resetToConfigPending}
        onTroubleshoot={(deviceId: string) => {
          navigate(`/jobs?troubleshoot=${deviceId}`);
        }}
        canConfigure={canConfigureDevices()}
        canReset={canResetDevices()}
      />
    </div>
  );
}
