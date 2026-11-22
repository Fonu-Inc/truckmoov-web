import type { SIMFormData } from "@/features/sims/components/ui/SIMFormDialog";
import type { SIMRequestSubmitData } from "@/features/sims/components/ui/SIMRequestFormDialog";
import type {
  IoTDevice, SIMCard,
} from "@/types";
import { useQuery } from "@tanstack/react-query";
import {
  exportSims,
  getSimCarriersQueryOptions,
  getSimsQueryOptions,
  useCreateSim,
  useCreateSimRequest,
  useDeleteSim,
  useReactivateSim,
  useSuspendSim,
  useUnassignSimDevice,
  useUpdateSim,
  useUploadSimRequestDeviceMapping,
} from "@truckmoov/api/auth";
import {
  CheckCircle2, Clock, Link, PauseCircle, Plus, Upload, Wifi,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";

import {
  Card, CardContent,
} from "@/components/shadcn/card";

import { useAuthStore } from "@/features/auth/stores/authStore";
import { InstallationGate } from "@/features/get-started/components/ui/InstallationGate";
import { useInstallationPending } from "@/features/get-started/hooks/useInstallationPending";
import { AssignSIMDialog } from "@/features/sims/components/ui/AssignSIMDialog";
import { SIMBulkUploadDialog } from "@/features/sims/components/ui/SIMBulkUploadDialog";
import { SIMDetailsSheet } from "@/features/sims/components/ui/SIMDetailsSheet";
import { SIMFormDialog } from "@/features/sims/components/ui/SIMFormDialog";
import { SIMInventoryTable } from "@/features/sims/components/ui/SIMInventoryTable";
import { SIMRequestFormDialog } from "@/features/sims/components/ui/SIMRequestFormDialog";
import { SIMRequestsTracker } from "@/features/sims/components/ui/SIMRequestsTracker";
import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { cn } from "@/lib/utils";

export default function SIMManagement() {
  const { requireSubscription } = useRequireSubscription();
  const installationPending = useInstallationPending();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const createSimRequestMutation = useCreateSimRequest();
  const createSimMutation = useCreateSim();
  const uploadDeviceMappingMutation = useUploadSimRequestDeviceMapping();
  const isSubmitting = createSimRequestMutation.isPending || uploadDeviceMappingMutation.isPending;
  const canRequestSIM = true;
  const kycStatus = {
    status: "pending", isLoading: false,
  };

  const tenantId = user?.tenantId || "f7f5af88-fd76-4439-aae3-0461be52f63f";
  const { devices } = useDeviceTelemetry(tenantId);

  const PAGE_SIZE = 20;
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<string>("all");
  const [
    operatorFilters,
    setOperatorFilters,
  ] = useState<string[]>([]);
  const [
    page,
    setPage,
  ] = useState(1);

  // Debounce search (300ms — matches the wired fleet tabs)
  useEffect(
    () => {
      const t = setTimeout(
        setDebouncedSearch,
        300,
        searchQuery,
      );
      return () => clearTimeout(t);
    },
    [searchQuery],
  );

  // Reset to page 1 whenever a filter changes
  useEffect(
    () => {
      setPage(1);
    },
    [
      debouncedSearch,
      statusFilter,
      operatorFilters,
    ],
  );

  const simsParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      operators: operatorFilters.length ? operatorFilters : undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [
      debouncedSearch,
      statusFilter,
      operatorFilters,
      page,
    ],
  );

  const simsQuery = useQuery(getSimsQueryOptions({ params: simsParams }));
  const carriersQuery = useQuery(getSimCarriersQueryOptions());

  const apiSims = simsQuery.data?.data.items ?? [];
  const total = simsQuery.data?.data.total ?? 0;
  const loading = simsQuery.isLoading;

  const sims: SIMCard[] = apiSims.map(s => ({
    id: s.id,
    iccid: s.iccid,
    imsi: s.imsi,
    mobileNumber: s.mobileNumber,
    networkOperator: s.operator,
    status: s.status as SIMCard["status"],
    dataUsage: s.dataUsedGb ?? 0,
    dataLimit: s.dataLimitGb ?? 0,
    deviceId: s.assignedDevice?.id,
  }));

  const stats = useMemo(
    () => ({
      total: sims.length,
      active: sims.filter(s => s.status === "active").length,
      assigned: sims.filter(s => s.status === "assigned").length,
      suspended: sims.filter(s => s.status === "suspended").length,
      registered: sims.filter(s => s.status === "registered").length,
    }),
    [sims],
  );

  const operators = (carriersQuery.data?.data.carriers ?? []).map(c => c.displayName);

  const errMsg = (error: unknown, fallback: string) =>
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : fallback;

  const refetch = () => {
    void simsQuery.refetch();
  };

  const suspendSimMutation = useSuspendSim();
  const reactivateSimMutation = useReactivateSim();
  const deleteSimMutation = useDeleteSim();
  const unassignSimMutation = useUnassignSimDevice();
  const updateSimMutation = useUpdateSim();

  const handleSuspend = async (id: string) => {
    try {
      await suspendSimMutation.mutateAsync({
        id, data: { reason: "Suspended by tenant admin" },
      });
      toast.success("SIM suspended");
    }
    catch (error) {
      toast.error(errMsg(
        error,
        "Unable to suspend the SIM",
      ));
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await reactivateSimMutation.mutateAsync({ id });
      toast.success("SIM activated");
    }
    catch (error) {
      toast.error(errMsg(
        error,
        "Unable to activate the SIM",
      ));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSimMutation.mutateAsync({ id });
      toast.success("SIM deleted");
    }
    catch (error) {
      toast.error(errMsg(
        error,
        "Unable to delete the SIM",
      ));
    }
  };

  const handleUnassign = async (id: string) => {
    try {
      await unassignSimMutation.mutateAsync({ id });
      toast.success("Device unassigned");
    }
    catch (error) {
      toast.error(errMsg(
        error,
        "Unable to unassign the device",
      ));
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportSims({ params: simsParams });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sim-cards.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
    catch (error) {
      toast.error(errMsg(
        error,
        "Failed to export SIM cards",
      ));
    }
  };

  // ponytail: device assignment has no tenant endpoint yet — no-op until the API ships it.
  const assignSIMToDevice = async (_simId: string, _deviceId: string) => {};
  const [
    isRequestDialogOpen,
    setIsRequestDialogOpen,
  ] = useState(false);
  const [
    isAddDialogOpen,
    setIsAddDialogOpen,
  ] = useState(false);
  const [
    isEditDialogOpen,
    setIsEditDialogOpen,
  ] = useState(false);
  const [
    isBulkUploadOpen,
    setIsBulkUploadOpen,
  ] = useState(false);
  const [
    isAssignDialogOpen,
    setIsAssignDialogOpen,
  ] = useState(false);
  const [
    selectedSIM,
    setSelectedSIM,
  ] = useState<SIMCard | null>(null);
  const [
    isDetailsOpen,
    setIsDetailsOpen,
  ] = useState(false);

  // Device info comes from the SIM list response's inline `assignedDevice`.
  const getDeviceInfo = (deviceId?: string): IoTDevice | null => {
    if (!deviceId)
      return null;
    const ad = apiSims.find(s => s.assignedDevice?.id === deviceId)?.assignedDevice;
    if (!ad)
      return null;
    return {
      id: ad.id,
      imei: ad.imei,
      manufacturer: ad.name,
      model: ad.type || "",
      status: "active",
      firmwareVersion: "",
    };
  };

  const availableDevices = devices
    .filter(d => !sims.some(s => s.deviceId === d.id) && d.status !== "registered")
    .map(device => ({
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
      toast.error(
        "KYC Verification Required",
        { description: "Complete your business verification before requesting SIM cards." },
      );
      navigate("/settings");
      return;
    }
    setIsRequestDialogOpen(true);
  };

  const submitRequest = async (data: SIMRequestSubmitData) => {
    try {
      let deviceMappingFileId: string | undefined;

      if (data.deviceMappingEnabled && data.deviceMappingFile) {
        const uploadResponse = await uploadDeviceMappingMutation.mutateAsync(data.deviceMappingFile);
        deviceMappingFileId = uploadResponse.data.fileId;
      }

      await createSimRequestMutation.mutateAsync({
        data: {
          quantity: data.numberOfSims,
          carrier: data.preferredOperator,
          planType: data.planCycle,
          dataBundlePlanId: data.bundleCode,
          useCase: data.useCase,
          notes: data.notes || undefined,
          deviceMappingFileId,
        },
      });
      toast.success("SIM request submitted successfully");
      refetch();
      return true;
    }
    catch (error) {
      const message = error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Unable to submit the SIM request";
      toast.error(message);
      return false;
    }
  };

  const registerSim = async (data: SIMFormData) => {
    try {
      await createSimMutation.mutateAsync({
        data: {
          iccid: data.iccid,
          imsi: data.imsi,
          mobileNumber: data.mobileNumber,
          operator: data.networkOperator,
          dataLimitGb: data.dataLimit,
          simType: data.simType,
          monthlyRentalNaira: data.monthlyRentalNgn,
        },
      });
      await refetch();
      toast.success("SIM card registered successfully");
      setIsAddDialogOpen(false);
    }
    catch (error) {
      const message = error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Unable to register the SIM card";
      toast.error(message);
    }
  };

  const editSim = async (data: SIMFormData) => {
    if (!selectedSIM)
      return;
    try {
      await updateSimMutation.mutateAsync({
        id: selectedSIM.id,
        data: {
          iccid: data.iccid,
          imsi: data.imsi,
          mobileNumber: data.mobileNumber,
          operator: data.networkOperator,
          dataLimitGb: data.dataLimit, // ponytail: PATCH uses Gb; create sends Mb — see plan flag
          simType: data.simType,
          monthlyRentalNaira: data.monthlyRentalNgn,
        },
      });
      toast.success("SIM card updated successfully");
      setIsEditDialogOpen(false);
      setSelectedSIM(null);
    }
    catch (error) {
      toast.error(errMsg(
        error,
        "Unable to update the SIM card",
      ));
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* KPI stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Wifi className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Total SIMs</p>
                  <p className="mt-1 truncate text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="mt-1 truncate text-xl font-bold text-success">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/10">
                  <Link className="h-5 w-5 text-info" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Assigned</p>
                  <p className="mt-1 truncate text-xl font-bold text-info">{stats.assigned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                  <PauseCircle className="h-5 w-5 text-warning" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Suspended</p>
                  <p className="mt-1 truncate text-xl font-bold text-warning">{stats.suspended}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Registered</p>
                  <p className="mt-1 truncate text-xl font-bold">{stats.registered}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top-right actions */}
        <div className="flex items-center justify-end gap-2">
          <InstallationGate pending={installationPending}>
            <Button
              variant="outline"
              disabled={installationPending}
              onClick={() => setIsBulkUploadOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </Button>
          </InstallationGate>
          <InstallationGate pending={installationPending}>
            <Button
              variant="outline"
              onClick={requireSubscription(openRequestDialog)}
              disabled={installationPending || (!canRequestSIM && !kycStatus.isLoading)}
              className={cn(!canRequestSIM && "opacity-60")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Request SIM
            </Button>
          </InstallationGate>
          <InstallationGate pending={installationPending}>
            <Button
              disabled={installationPending}
              onClick={requireSubscription(() => setIsAddDialogOpen(true))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add SIM
            </Button>
          </InstallationGate>
        </div>

        <SIMInventoryTable
          sims={sims}
          total={total}
          loading={loading}
          isFetching={simsQuery.isFetching}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onExport={handleExport}
          getDeviceInfo={getDeviceInfo}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          operatorFilters={operatorFilters}
          onOperatorFiltersChange={setOperatorFilters}
          operators={operators}
          onViewDetails={(sim) => {
            setSelectedSIM(sim);
            setIsDetailsOpen(true);
          }}
          onEdit={(sim) => {
            setSelectedSIM(sim);
            setIsEditDialogOpen(true);
          }}
          onActivate={handleReactivate}
          onSuspend={handleSuspend}
          onResume={handleReactivate}
          onAssign={(sim) => {
            setSelectedSIM(sim);
            setIsAssignDialogOpen(true);
          }}
          onUnassign={handleUnassign}
          onDelete={handleDelete}
        />

        <SIMRequestsTracker />
      </div>

      <SIMRequestFormDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onSubmit={async (data) => {
          const success = await submitRequest(data);
          if (success)
            setIsRequestDialogOpen(false);
        }}
        isSubmitting={isSubmitting}
      />

      <SIMFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={registerSim}
        sim={null}
        title="Register New SIM Card"
        isSubmitting={createSimMutation.isPending}
      />

      <SIMFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={editSim}
        sim={selectedSIM}
        title="Edit SIM Card"
        isSubmitting={updateSimMutation.isPending}
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
        onUpload={(importedCount) => {
          refetch();
          toast.success(`${importedCount} SIM cards imported successfully`);
          setIsBulkUploadOpen(false);
        }}
      />

      <AssignSIMDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        sim={selectedSIM}
        devices={availableDevices}
        onAssign={async (simId, deviceId) => {
          await assignSIMToDevice(
            simId,
            deviceId,
          );
          setIsAssignDialogOpen(false);
        }}
      />
    </>
  );
}
