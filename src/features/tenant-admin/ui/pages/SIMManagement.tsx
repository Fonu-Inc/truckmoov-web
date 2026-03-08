import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useIOTSIMs, SIMCardExtended } from "@/hooks/useIOTSIMs";
import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import { SIMCard } from "@/types";
import {
  Search, Filter, Upload, Plus, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
import { useNavigate } from "react-router-dom";
import { useSIMRequestSubmit } from "@/hooks/useSIMRequestSubmit";

export default function SIMManagement() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { submitRequest, isSubmitting, canRequestSIM, kycStatus } = useSIMRequestSubmit();

  const tenantId = user?.tenantId || "f7f5af88-fd76-4439-aae3-0461be52f63f";
  const { sims, loading, refetch, updateSIMStatus, assignSIMToDevice, unassignSIM, deleteSIM } = useIOTSIMs(tenantId);
  const { devices } = useDeviceTelemetry(tenantId);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [operatorFilter, setOperatorFilter] = useState<string>("all");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedSIM, setSelectedSIM] = useState<SIMCardExtended | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const kycPending = kycStatus.status === "pending" || kycStatus.status === "under_review";

  const filteredSIMs = sims.filter((sim) => {
    const matchesSearch =
      sim.iccid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.mobileNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.networkOperator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || sim.status === statusFilter;
    const matchesOperator = operatorFilter === "all" || sim.networkOperator === operatorFilter;
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
    if (!canRequestSIM) {
      toast.error("KYC Verification Required", {
        description: "Complete your business verification before requesting SIM cards.",
      });
      navigate("/admin/settings");
      return;
    }
    setIsRequestDialogOpen(true);
  };

  return (
    <DashboardLayout title="IoT SIM Management" subtitle="Visibility over your SIMs connectivity">
      <div className="space-y-6">
        {/* KYC Verification Gate */}
        {!kycStatus.isLoading && !canRequestSIM && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="font-semibold">
              {kycPending ? "KYC Verification In Progress" : "KYC Verification Required"}
            </AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {kycPending
                  ? "Your business verification is being reviewed. SIM requests will be available once approved."
                  : "Complete your business verification to request IoT SIM cards for your fleet."}
              </span>
              {!kycPending && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/admin/settings")}
                  className="whitespace-nowrap border-destructive/30 hover:bg-destructive/10"
                >
                  Complete Verification
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <SIMOverviewCards
          totalSIMs={sims.length}
          activeSIMs={statusCounts.active + statusCounts.assigned}
          suspendedSIMs={statusCounts.suspended}
          totalDataUsage={totalDataUsage}
          totalDataLimit={totalDataLimit}
        />

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "All", value: "all", count: statusCounts.all },
            { label: "Registered", value: "registered", count: statusCounts.registered },
            { label: "Active", value: "active", count: statusCounts.active },
            { label: "Assigned", value: "assigned", count: statusCounts.assigned },
            { label: "Suspended", value: "suspended", count: statusCounts.suspended },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Actions Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by ICCID, phone number, operator..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Operators</SelectItem>
                    {operators.map((op) => (
                      <SelectItem key={op} value={op}>{op}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Import
                </Button>
                <Button
                  onClick={openRequestDialog}
                  disabled={!canRequestSIM && !kycStatus.isLoading}
                  className={cn(!canRequestSIM && "opacity-60")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Request SIM
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <SIMInventoryTable
          sims={filteredSIMs}
          getDeviceInfo={getDeviceInfo}
          onViewDetails={(sim) => { setSelectedSIM(sim); setIsDetailsOpen(true); }}
          onEdit={(sim) => { setSelectedSIM(sim); setIsEditDialogOpen(true); }}
          onActivate={(id) => updateSIMStatus(id, "active")}
          onSuspend={(id) => updateSIMStatus(id, "suspended")}
          onResume={(id) => updateSIMStatus(id, "active")}
          onAssign={(sim) => { setSelectedSIM(sim); setIsAssignDialogOpen(true); }}
          onUnassign={(id) => unassignSIM(id)}
          onDelete={(id) => deleteSIM(id)}
        />

        <SIMRequestsTracker onNewRequest={openRequestDialog} />
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
