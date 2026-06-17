import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import {
  Search, SlidersHorizontal as Filter, Upload, Plus, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Card, CardContent } from "@/components/shadcn/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { SIMFormDialog } from "@/components/sims/SIMFormDialog";
import { SIMRequestFormDialog } from "@/components/sims/SIMRequestFormDialog";
import { SIMDetailsSheet } from "@/components/sims/SIMDetailsSheet";
import { SIMBulkUploadDialog } from "@/components/sims/SIMBulkUploadDialog";
import { AssignSIMDialog } from "@/components/sims/AssignSIMDialog";
import { SIMRequestsTracker } from "@/components/sims/SIMRequestsTracker";
import { SIMOverviewCards } from "@/components/sims/SIMOverviewCards";
import { SIMInventoryTable } from "@/components/sims/SIMInventoryTable";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";

type SIMCardExtended = any;

export default function DispatcherSIMs() {
  const { requireSubscription } = useRequireSubscription();
  const { user } = useAuthStore();
const submitRequest = async (..._args: any[]) => false;
  const isSubmitting = false;
  const canRequestSIM = true;

  const tenantId = user?.tenantId || "f7f5af88-fd76-4439-aae3-0461be52f63f";
  const sims: SIMCardExtended[] = [];
  const loading = false;
  const refetch = () => {};
  const updateSIMStatus = async (_id: string, _status: string) => {};
  const assignSIMToDevice = async (_simId: string, _deviceId: string) => {};
  const unassignSIM = async (_id: string) => {};
  const deleteSIM = async (_id: string) => {};
  const { devices } = useDeviceTelemetry(tenantId);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [operatorFilters, setOperatorFilters] = useState<string[]>([]);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedSIM, setSelectedSIM] = useState<SIMCardExtended | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const filteredSIMs = sims.filter((sim) => {
    const matchesSearch =
      sim.iccid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.mobileNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.networkOperator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || sim.status === statusFilter;
    const matchesOperator = operatorFilters.length === 0 || operatorFilters.includes(sim.networkOperator);
    return matchesSearch && matchesStatus && matchesOperator;
  });

  const operators = [...new Set(sims.map((s) => s.networkOperator))];

  const statusCounts = {
    all: sims.length,
    registered: sims.filter((s) => s.status === "registered").length,
    active: sims.filter((s) => s.status === "active").length,
    assigned: sims.filter((s) => s.status === "assigned").length,
    suspended: sims.filter((s) => s.status === "suspended").length,
    deactivated: sims.filter((s) => s.status === "deactivated").length,
  };

  const totalDataUsage = sims.reduce((sum, s) => sum + s.dataUsage, 0);
  const totalDataLimit = sims.reduce((sum, s) => sum + s.dataLimit, 0);

  const getDeviceInfo = (deviceId?: string): any => {
    if (!deviceId) return null;
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return null;
    return {
      id: device.id,
      imei: device.imei,
      manufacturer: device.manufacturer,
      model: device.model || "",
      status: device.status as any,
      firmwareVersion: "",
      lastSeen: device.last_seen ? new Date(device.last_seen) : undefined,
      signalStrength: device.signal_strength || undefined,
      batteryLevel: device.battery_level || undefined,
    };
  };

  const availableDevices = devices
    .filter((d) => !sims.some((s) => s.deviceId === d.id) && d.status !== "registered")
    .map((device) => ({
      id: device.id,
      imei: device.imei,
      manufacturer: device.manufacturer,
      model: device.model || "",
      status: device.status as "registered" | "configured" | "assigned" | "active" | "faulty" | "decommissioned",
      vehicleId: device.vehicle_id || undefined,
      simId: undefined,
      firmwareVersion: "",
      lastSeen: device.last_seen ? new Date(device.last_seen) : undefined,
      signalStrength: device.signal_strength || undefined,
      batteryLevel: device.battery_level || undefined,
    }));

  const openRequestDialog = () => {
    setIsRequestDialogOpen(true);
  };

  return (
    <DashboardLayout title="IoT SIM Management" subtitle="Visibility over your SIMs connectivity">
      <div className="space-y-6">
        {/* Top-right actions */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button
            variant="outline"
            onClick={requireSubscription(openRequestDialog)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Request SIM
          </Button>
          <Button onClick={requireSubscription(() => setIsAddDialogOpen(true))}>
            <Plus className="mr-2 h-4 w-4" />
            Add SIM
          </Button>
        </div>

        <SIMInventoryTable
          sims={filteredSIMs}
          getDeviceInfo={getDeviceInfo}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          operatorFilters={operatorFilters}
          onOperatorFiltersChange={setOperatorFilters}
          operators={operators}
          onViewDetails={(sim) => { setSelectedSIM(sim); setIsDetailsOpen(true); }}
          onEdit={(sim) => { setSelectedSIM(sim); setIsEditDialogOpen(true); }}
          onActivate={(id) => updateSIMStatus(id, "active")}
          onSuspend={(id) => updateSIMStatus(id, "suspended")}
          onResume={(id) => updateSIMStatus(id, "active")}
          onAssign={(sim) => { setSelectedSIM(sim); setIsAssignDialogOpen(true); }}
          onUnassign={(id) => unassignSIM(id)}
          onDelete={(id) => deleteSIM(id)}
        />

        <SIMRequestsTracker />
      </div>

      <SIMRequestFormDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onSubmit={async (data) => {
          const success = await submitRequest(data);
          if (success) setIsRequestDialogOpen(false);
        }}
        isSubmitting={isSubmitting}
      />

      <SIMFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={() => { refetch(); toast.success("SIM card registered successfully"); setIsAddDialogOpen(false); }}
        sim={null}
        title="Register New SIM Card"
      />

      <SIMFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={() => { refetch(); toast.success("SIM card updated successfully"); setIsEditDialogOpen(false); setSelectedSIM(null); }}
        sim={selectedSIM}
        title="Edit SIM Card"
      />

      <SIMDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        sim={selectedSIM}
        device={getDeviceInfo(selectedSIM?.deviceId)}
      />

      <SIMBulkUploadDialog
        open={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
        onUpload={(newSIMs) => { refetch(); toast.success(`${newSIMs.length} SIM cards imported successfully`); setIsBulkUploadOpen(false); }}
      />

      <AssignSIMDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        sim={selectedSIM}
        devices={availableDevices}
        onAssign={async (simId, deviceId) => { await assignSIMToDevice(simId, deviceId); setIsAssignDialogOpen(false); }}
      />
    </DashboardLayout>
  );
}
