import { useState } from "react";
import {
  NavLink, Outlet, useNavigate,
} from "react-router";
import { INSTALLATION_TABS } from "@/features/installation/utils/installationNav";
import { cn } from "@/lib/utils";

export type InstallationLayoutContext = {
  configQueueDevices: any[];
  catalog: any[];
  loading: boolean;
  catalogLoading: boolean;
  selectedDeviceId: string | null;
  setSelectedDeviceId: (deviceId: string | null) => void;
  refetch: () => Promise<void>;
  markConfigured: (deviceId: string, notes?: string) => Promise<{ success: boolean }>;
  resetToConfigPending: (deviceId: string, reason: string) => Promise<{ success: boolean }>;
  canConfigureDevices: () => boolean;
  canResetDevices: () => boolean;
  openTroubleshooting: (deviceId: string) => void;
};

export default function InstallationLayout() {
  const navigate = useNavigate();
  const [
    selectedDeviceId,
    setSelectedDeviceId,
  ] = useState<string | null>(null);

  const configQueueDevices: any[] = [];
  const loading = false;
  const refetch = async () => {};
  const markConfigured = async (
    _deviceId: string,
    _notes?: string,
  ) => ({ success: false });
  const resetToConfigPending = async (
    _deviceId: string,
    _reason: string,
  ) => ({ success: false });
  const canConfigureDevices = () => false;
  const canResetDevices = () => false;

  const catalog: any[] = [];
  const catalogLoading = false;

  const openTroubleshooting = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    navigate("/installation/troubleshooting");
  };

  const context: InstallationLayoutContext = {
    configQueueDevices,
    catalog,
    loading,
    catalogLoading,
    selectedDeviceId,
    setSelectedDeviceId,
    refetch,
    markConfigured,
    resetToConfigPending,
    canConfigureDevices,
    canResetDevices,
    openTroubleshooting,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <nav
          aria-label="Installation sections"
          className="bg-secondary/60 text-muted-foreground grid h-9 w-full grid-cols-4 rounded-md p-1 lg:w-auto lg:inline-grid"
        >
          {INSTALLATION_TABS.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) => cn(
                "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150",
                "hover:text-foreground/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet context={context} />
    </div>
  );
}
