import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSystemSimsExportQueryOptions,
  getSystemSimsQueryOptions,
  getSystemSimsSummaryQueryOptions,
  type SystemSimItem,
  type SystemSimsQuery,
} from "@truckmoov/api/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Badge } from "@/components/shadcn/badge";
import { Label } from "@/components/shadcn/label";
import { Progress } from "@/components/shadcn/progress";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { SIMAnalyticsDashboardLive } from "@/components/sims/SIMAnalyticsDashboardLive";
import { SIMApprovalQueue } from "@/components/sims/SIMApprovalQueue";
import { ActivationBatchesPanel } from "@/components/sims/ActivationBatchesPanel";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/shadcn/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/shadcn/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/shadcn/select";
import {
  Dialog as Sheet,
  DialogContent as SheetContent,
  DialogDescription as SheetDescription,
  DialogHeader as SheetHeader,
  DialogTitle as SheetTitle
} from "@/components/shadcn/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/shadcn/alert-dialog";
import { Wifi, Search, Plus, Signal, SignalLow, SignalZero, Building2, Upload, RefreshCw, SlidersHorizontal as Filter, Pencil, Cpu, Phone, Calendar, CreditCard, TrendingUp, AlertTriangle, CheckCircle, XCircle, Smartphone, Globe, Zap, ArrowUpDown, Download } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PlatformFilterPopover, type FilterDraft } from "@/components/shadcn/platform-filter-popover";
import { toast } from "sonner";

interface SIMCard {
  id: string;
  iccid: string;
  msisdn: string | null;
  imsi: string | null;
  carrier: string;
  plan: "data_only" | "data_sms" | "data_sms_voice" | "iot_basic" | "iot_premium";
  status: "active" | "inactive" | "suspended" | "unassigned";
  tenant: string | null;
  tenantId: string | null;
  deviceId: string | null;
  deviceImei: string | null;
  dataUsage: number; // MB
  dataLimit: number; // MB
  smsUsage: number;
  smsLimit: number;
  activationDate: string | null;
  expiryDate: string;
  lastActivity: string;
  signalStrength: number | null;
  networkType: "2G" | "3G" | "4G" | "5G" | null;
  roaming: boolean;
  monthlyCost: number;
}

const simPlans = ["data_only", "data_sms", "data_sms_voice", "iot_basic", "iot_premium"] as const;
const simStatuses = ["active", "inactive", "suspended", "unassigned"] as const;
const networkTypes = ["2G", "3G", "4G", "5G"] as const;

const normalizePlan = (plan: string): SIMCard["plan"] => {
  const normalizedPlan = plan.toLowerCase().replace(/\s*\+\s*/g, "_").replace(/[\s-]+/g, "_");
  return simPlans.includes(normalizedPlan as SIMCard["plan"])
    ? normalizedPlan as SIMCard["plan"]
    : "data_only";
};

const normalizeStatus = (status: string): SIMCard["status"] =>
  simStatuses.includes(status.toLowerCase() as SIMCard["status"])
    ? status.toLowerCase() as SIMCard["status"]
    : "inactive";

const normalizeNetworkType = (networkType: string | null): SIMCard["networkType"] => {
  if (!networkType) return null;
  return networkTypes.includes(networkType.toUpperCase() as Exclude<SIMCard["networkType"], null>)
    ? networkType.toUpperCase() as Exclude<SIMCard["networkType"], null>
    : null;
};

const mapSystemSimToRow = (sim: SystemSimItem): SIMCard => ({
  id: sim.id,
  iccid: sim.iccid,
  msisdn: sim.msisdn,
  imsi: sim.imsi,
  carrier: sim.carrier,
  plan: normalizePlan(sim.plan),
  status: normalizeStatus(sim.status),
  tenant: sim.tenantId || null,
  tenantId: sim.tenantId || null,
  deviceId: sim.deviceId || null,
  deviceImei: null,
  dataUsage: sim.dataUsageMb,
  dataLimit: sim.dataLimitMb,
  smsUsage: sim.smsUsage,
  smsLimit: sim.smsLimit,
  activationDate: sim.activationDate,
  expiryDate: "",
  lastActivity: sim.updatedAt,
  signalStrength: sim.signalStrength,
  networkType: normalizeNetworkType(sim.networkType),
  roaming: sim.roaming,
  monthlyCost: sim.monthlyCostNgn,
});

const carriers = ["All", "MTN Nigeria", "Glo", "Airtel", "9mobile"];
const statuses = ["all", "active", "inactive", "suspended", "unassigned"];
const plans = ["all", "data_only", "data_sms", "data_sms_voice", "iot_basic", "iot_premium"];

const planLabels: Record<string, string> = {
  data_only: "Data Only",
  data_sms: "Data + SMS",
  data_sms_voice: "Data + SMS + Voice",
  iot_basic: "IoT Basic",
  iot_premium: "IoT Premium"
};

const emptyValue = "—";

const getUsagePercentage = (usage: number, limit: number) =>
  limit > 0 ? Math.min((usage / limit) * 100, 100) : 0;

const tenantOptions: Array<{ id: string; name: string }> = [];
const deviceOptions: Array<{ id: string; imei: string; tenantId: string }> = [];

const emptySIM: Partial<SIMCard> = {
  iccid: "",
  msisdn: "",
  imsi: "",
  carrier: "MTN",
  plan: "data_only",
  status: "unassigned",
  tenant: null,
  tenantId: null,
  deviceId: null,
  dataLimit: 1000,
  smsLimit: 0,
  expiryDate: "",
  monthlyCost: 35
};

export default function PlatformSIMs() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [simFilterDraft, setSimFilterDraft] = useState<FilterDraft>({
    status: { enabled: false },
    carrier: { enabled: false }
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSIM, setSelectedSIM] = useState<SIMCard | null>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [deleteConfirmSIM, setDeleteConfirmSIM] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SIMCard>>(emptySIM);
  const [selectedSIMIds, setSelectedSIMIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const systemSimsQueryPayload = useMemo<SystemSimsQuery>(() => {
    const statusF = simFilterDraft.status;
    const carrierF = simFilterDraft.carrier;

    return {
      params: {
        ...(debouncedSearchQuery ? { search: debouncedSearchQuery } : {}),
        ...(statusF?.enabled && statusF.value ? { status: statusF.value } : {}),
        ...(carrierF?.enabled && carrierF.value ? { carrier: carrierF.value } : {}),
      },
    };
  }, [debouncedSearchQuery, simFilterDraft]);

  const systemSimsQuery = useQuery(getSystemSimsQueryOptions(systemSimsQueryPayload));
  const systemSimsSummaryQuery = useQuery(getSystemSimsSummaryQueryOptions());
  const summary = systemSimsSummaryQuery.data?.data;
  const summaryStats = useMemo(() => {
    const getStatusCount = (status: string): number | undefined => {
      if (!summary?.byStatus) return undefined;
      return Object.entries(summary.byStatus).find(
        ([key]) => key.toLowerCase() === status.toLowerCase(),
      )?.[1];
    };

    return {
      total: summary?.total ?? "N/A",
      active: summary?.active ?? getStatusCount("active") ?? "N/A",
      unassigned: summary?.unassigned ?? getStatusCount("unassigned") ?? "N/A",
      pendingRequests: summary?.pendingRequests ?? "N/A",
      carriers: summary?.carriers ?? (summary?.byCarrier ? Object.keys(summary.byCarrier).length : "N/A"),
    };
  }, [summary]);
  const sims = useMemo(
    () => systemSimsQuery.data?.data.sims.map(mapSystemSimToRow) ?? [],
    [systemSimsQuery.data],
  );

  const toggleSIMSelection = (simId: string) => {
    setSelectedSIMIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(simId)) {
        newSet.delete(simId);
      } else {
        newSet.add(simId);
      }
      return newSet;
    });
  };

  const toggleAllSIMs = () => {
    if (selectedSIMIds.size === filteredSIMs.length) {
      setSelectedSIMIds(new Set());
    } else {
      setSelectedSIMIds(new Set(filteredSIMs.map(s => s.id)));
    }
  };

  const clearSelection = () => setSelectedSIMIds(new Set());

  const handleBulkActivate = () => clearSelection();

  const handleBulkSuspend = () => clearSelection();

  const handleBulkAssign = () => setIsBulkAssignOpen(true);

  const handleBulkAssignConfirm = () => {
    clearSelection();
    setIsBulkAssignOpen(false);
    setFormData(emptySIM);
  };

  const selectedSIMs = useMemo(
    () => sims.filter((sim) => selectedSIMIds.has(sim.id)),
    [selectedSIMIds, sims],
  );

  const filteredSIMs = sims.filter((sim) => {
    const normalizedSearchQuery = debouncedSearchQuery.toLowerCase();
    const matchesSearch =
      sim.iccid.includes(debouncedSearchQuery) ||
      Boolean(sim.msisdn?.includes(debouncedSearchQuery)) ||
      Boolean(sim.tenant?.toLowerCase().includes(normalizedSearchQuery));

    const statusF = simFilterDraft.status;
    const matchesStatus = !statusF?.enabled || !statusF.value || sim.status === statusF.value;

    const carrierF = simFilterDraft.carrier;
    const matchesCarrier = !carrierF?.enabled || !carrierF.value || sim.carrier === carrierF.value;

    return matchesSearch && matchesStatus && matchesCarrier;
  });

  const statPlaceholder = systemSimsSummaryQuery.isLoading ? "..." : "N/A";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/10 text-success border-success/30">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "unassigned":
        return <Badge className="bg-warning/10 text-warning border-warning/30">Unassigned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSignalIcon = (strength: number | null, status: string) => {
    if (status !== "active" || strength === null) return <SignalZero className="h-4 w-4 text-muted-foreground" />;
    if (strength >= 70) return <Signal className="h-4 w-4 text-success" />;
    if (strength >= 30) return <SignalLow className="h-4 w-4 text-warning" />;
    return <SignalZero className="h-4 w-4 text-destructive" />;
  };

  const getDataUsageColor = (usage: number, limit: number) => {
    const percent = (usage / limit) * 100;
    if (percent >= 90) return "bg-destructive";
    if (percent >= 70) return "bg-warning";
    return "bg-primary";
  };

  const handleCreateSIM = () => {
    setIsCreateDialogOpen(false);
    setFormData(emptySIM);
  };

  const handleEditSIM = () => {
    setIsEditDialogOpen(false);
    setSelectedSIM(null);
    setFormData(emptySIM);
  };

  const handleDeleteSIM = (_simId?: string) => {
    setDeleteConfirmSIM(null);
  };

  const handleAssignSIM = () => {
    setIsAssignDialogOpen(false);
    setSelectedSIM(null);
    setFormData(emptySIM);
  };

  const handleBulkImport = () => {
    setIsBulkImportOpen(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(
        getSystemSimsExportQueryOptions(systemSimsQueryPayload),
      );
      const url = URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sims.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenEdit = (sim: SIMCard) => {
    setSelectedSIM(sim);
    setFormData({ ...sim });
    setIsEditDialogOpen(true);
  };

  const handleOpenAssign = (sim: SIMCard) => {
    setSelectedSIM(sim);
    setFormData({ tenantId: sim.tenantId, deviceId: sim.deviceId });
    setIsAssignDialogOpen(true);
  };

  const updateFormData = (updates: Partial<SIMCard>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const SIMForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="iccid">ICCID *</Label>
          <Input
            id="iccid"
            value={formData.iccid || ""}
            onChange={(e) => updateFormData({ iccid: e.target.value })}
            placeholder="8923411012345678901"
            maxLength={20}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="msisdn">Phone Number *</Label>
          <Input
            id="msisdn"
            value={formData.msisdn || ""}
            onChange={(e) => updateFormData({ msisdn: e.target.value })}
            placeholder="+2348031234567"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="imsi">IMSI</Label>
          <Input
            id="imsi"
            value={formData.imsi || ""}
            onChange={(e) => updateFormData({ imsi: e.target.value })}
            placeholder="621301234567890"
          />
        </div>
        <div className="space-y-2">
          <Label>Carrier</Label>
          <Select
            value={formData.carrier}
            onValueChange={(value) => updateFormData({ carrier: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MTN Nigeria">MTN Nigeria</SelectItem>
              <SelectItem value="Glo">Glo</SelectItem>
              <SelectItem value="Airtel">Airtel</SelectItem>
              <SelectItem value="9mobile">9mobile</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Plan</Label>
          <Select
            value={formData.plan}
            onValueChange={(value) => updateFormData({ plan: value as SIMCard["plan"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="data_only">Data Only</SelectItem>
              <SelectItem value="data_sms">Data + SMS</SelectItem>
              <SelectItem value="data_sms_voice">Data + SMS + Voice</SelectItem>
              <SelectItem value="iot_basic">IoT Basic</SelectItem>
              <SelectItem value="iot_premium">IoT Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthlyCost">Monthly Cost (R)</Label>
          <Input
            id="monthlyCost"
            type="number"
            value={formData.monthlyCost || 0}
            onChange={(e) => updateFormData({ monthlyCost: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataLimit">Data Limit (MB)</Label>
          <Input
            id="dataLimit"
            type="number"
            value={formData.dataLimit || 0}
            onChange={(e) => updateFormData({ dataLimit: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smsLimit">SMS Limit</Label>
          <Input
            id="smsLimit"
            type="number"
            value={formData.smsLimit || 0}
            onChange={(e) => updateFormData({ smsLimit: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry Date</Label>
        <Input
          id="expiryDate"
          type="date"
          value={formData.expiryDate || ""}
          onChange={(e) => updateFormData({ expiryDate: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <DashboardLayout
      title="IoT SIM Management"
      subtitle="Manage SIM inventory and assignments across all tenants"
    >
      <Tabs defaultValue="inventory" className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="w-fit flex">
            <TabsTrigger value="inventory">SIM Inventory</TabsTrigger>
            <TabsTrigger value="approval">Approval Queue</TabsTrigger>
            <TabsTrigger value="activation">Activation</TabsTrigger>
            {/* <TabsTrigger value="analytics">Analytics</TabsTrigger> */}
          </TabsList>
        </div>

        <TabsContent value="inventory" className="space-y-6">

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-5">
            <StatCard title="Total SIMs" value={systemSimsSummaryQuery.isLoading ? statPlaceholder : summaryStats.total} icon={Wifi} />
            <StatCard
              title="Active"
              value={systemSimsSummaryQuery.isLoading ? statPlaceholder : summaryStats.active}
              icon={CheckCircle}
              variant="success"
            />
            <StatCard
              title="Unassigned"
              value={systemSimsSummaryQuery.isLoading ? statPlaceholder : summaryStats.unassigned}
              icon={AlertTriangle}
              variant="warning"
            />
            <StatCard
              title="Pending Requests"
              value={systemSimsSummaryQuery.isLoading ? statPlaceholder : summaryStats.pendingRequests}
              icon={TrendingUp}
            />
            <StatCard
              title="Carriers"
              value={systemSimsSummaryQuery.isLoading ? statPlaceholder : summaryStats.carriers}
              icon={CreditCard}
            />
          </div>

          {/* Filters & Actions */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-primary" />
                    SIM Inventory
                  </CardTitle>
                  <CardDescription>All provisioned SIMs across tenants — search, filter, assign and export</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export Data"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by ICCID, phone number, or tenant..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <PlatformFilterPopover
                  entity="SIMs"
                  fields={[
                    {
                      key: "status",
                      label: "Status",
                      type: "select",
                      options: statuses
                        .filter((s) => s !== "all")
                        .map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))
                    },
                    {
                      key: "carrier",
                      label: "Carrier",
                      type: "select",
                      options: carriers
                        .filter((c) => c !== "All")
                        .map((c) => ({ value: c, label: c }))
                    },
                  ]}
                  value={simFilterDraft}
                  onApply={setSimFilterDraft}
                  onReset={() =>
                    setSimFilterDraft({
                      status: { enabled: false },
                      carrier: { enabled: false }
                    })
                  }
                />
              </div>

              {/* Bulk Actions Toolbar */}
              {selectedSIMIds.size > 0 && (
                <div className="flex items-center gap-3 rounded-lg border bg-primary/5 p-3">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={true} />
                    <span className="text-sm font-medium">{selectedSIMIds.size} selected</span>
                  </div>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleBulkActivate}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleBulkSuspend}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Suspend
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleBulkAssign}>
                      <ArrowUpDown className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                  <div className="ml-auto">
                    <Button size="sm" variant="ghost" onClick={clearSelection}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedSIMIds.size === filteredSIMs.length && filteredSIMs.length > 0}
                          onCheckedChange={toggleAllSIMs}
                        />
                      </TableHead>
                      <TableHead className="min-w-[220px]">ICCID / Phone</TableHead>
                      <TableHead className="min-w-[140px]">Carrier</TableHead>
                      <TableHead className="min-w-[170px]">Plan</TableHead>
                      <TableHead className="min-w-[190px]">Tenant</TableHead>
                      <TableHead className="min-w-[150px]">Device</TableHead>
                      <TableHead className="min-w-[140px]">Status</TableHead>
                      <TableHead className="min-w-[170px]">Data Usage</TableHead>
                      <TableHead className="min-w-[120px]">Signal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSIMs.map((sim) => (
                      <TableRow key={sim.id} className={selectedSIMIds.has(sim.id) ? "bg-primary/5" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedSIMIds.has(sim.id)}
                            onCheckedChange={() => toggleSIMSelection(sim.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm font-semibold leading-5">{sim.iccid}</p>
                            <p className="text-xs text-muted-foreground">{sim.msisdn ?? emptyValue}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">{sim.carrier}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{planLabels[sim.plan]}</span>
                        </TableCell>
                        <TableCell>
                          {sim.tenant ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{sim.tenant}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">{emptyValue}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {sim.deviceId ? (
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{sim.deviceId}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">{emptyValue}</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(sim.status)}</TableCell>
                        <TableCell>
                          <div className="w-28">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-semibold">{sim.dataUsage} MB</span>
                              <span className="text-muted-foreground">/ {sim.dataLimit}</span>
                            </div>
                            <Progress
                              value={getUsagePercentage(sim.dataUsage, sim.dataLimit)}
                              className="h-1.5"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSignalIcon(sim.signalStrength, sim.status)}
                            {sim.status === "active" && sim.networkType ? (
                              <span className="text-xs font-semibold">{sim.networkType}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">{emptyValue}</span>
                            )}
                            {sim.roaming && (
                              <span title="Roaming">
                                <Globe className="h-3 w-3 text-warning" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval">
          <SIMApprovalQueue />
        </TabsContent>

        <TabsContent value="activation">
          <ActivationBatchesPanel />
        </TabsContent>

        <TabsContent value="analytics">
          <SIMAnalyticsDashboardLive sims={[]} loading={false} />
        </TabsContent>
      </Tabs>

      {/* Create SIM Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New SIM Card</DialogTitle>
            <DialogDescription>
              Add a new SIM card to the inventory
            </DialogDescription>
          </DialogHeader>
          <SIMForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSIM}>Add SIM</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit SIM Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit SIM Card</DialogTitle>
            <DialogDescription>
              Update SIM card information
            </DialogDescription>
          </DialogHeader>
          <SIMForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSIM}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign SIM Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign SIM Card</DialogTitle>
            <DialogDescription>
              Assign this SIM to a tenant and device
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tenant</Label>
              <Select
                value={formData.tenantId || "unassigned"}
                onValueChange={(value) => {
                  updateFormData({ tenantId: value === "unassigned" ? null : value, deviceId: null });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {tenantOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.tenantId && (
              <div className="space-y-2">
                <Label>Device</Label>
                <Select
                  value={formData.deviceId || "none"}
                  onValueChange={(value) => updateFormData({ deviceId: value === "none" ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a device" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No device</SelectItem>
                    {deviceOptions
                      .filter((d) => d.tenantId === formData.tenantId)
                      .map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.id} ({d.imei})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignSIM}>Assign SIM</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SIM Details Sheet */}
      <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
        <SheetContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Wifi className="h-6 w-6 text-primary" />
              </div>
              SIM Details
            </SheetTitle>
            <SheetDescription className="flex items-center gap-2">
              {getStatusBadge(selectedSIM?.status || "")}
              <Badge variant="outline">{selectedSIM?.carrier}</Badge>
              {selectedSIM?.roaming && (
                <Badge className="bg-warning/10 text-warning">Roaming</Badge>
              )}
            </SheetDescription>
          </SheetHeader>

          {selectedSIM && (
            <ScrollArea className="h-[calc(100vh-180px)] mt-6">
              <div className="space-y-6 pr-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">SIM Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ICCID</span>
                      <span className="font-mono">{selectedSIM.iccid}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phone Number</span>
                      <span>{selectedSIM.msisdn ?? emptyValue}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IMSI</span>
                      <span className="font-mono">{selectedSIM.imsi ?? emptyValue}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Plan</span>
                      <span>{planLabels[selectedSIM.plan]}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Assignment</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tenant</span>
                      <span>{selectedSIM.tenant || "Unassigned"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Device</span>
                      <span>{selectedSIM.deviceId || "None"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Device IMEI</span>
                      <span className="font-mono">{selectedSIM.deviceImei || "—"}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Usage</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Data Usage</span>
                        <span>
                          {selectedSIM.dataUsage} / {selectedSIM.dataLimit} MB
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(selectedSIM.dataUsage, selectedSIM.dataLimit)}
                        className="h-2"
                      />
                    </div>
                    {selectedSIM.smsLimit > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>SMS Usage</span>
                          <span>
                            {selectedSIM.smsUsage} / {selectedSIM.smsLimit}
                          </span>
                        </div>
                        <Progress
                          value={getUsagePercentage(selectedSIM.smsUsage, selectedSIM.smsLimit)}
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Connection</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Signal Strength</span>
                      <div className="flex items-center gap-2">
                        {getSignalIcon(selectedSIM.signalStrength, selectedSIM.status)}
                        <span>{selectedSIM.signalStrength === null ? emptyValue : `${selectedSIM.signalStrength}%`}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Network Type</span>
                      <span>{selectedSIM.networkType ?? emptyValue}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Activity</span>
                      <span>{selectedSIM.lastActivity}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Billing</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Cost</span>
                      <span className="font-medium">R{selectedSIM.monthlyCost}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Activation Date</span>
                      <span>{selectedSIM.activationDate || "Not activated"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expiry Date</span>
                      <span>{selectedSIM.expiryDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setIsDetailsSheetOpen(false);
                      handleOpenAssign(selectedSIM);
                    }}
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailsSheetOpen(false);
                      handleOpenEdit(selectedSIM);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmSIM} onOpenChange={() => setDeleteConfirmSIM(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SIM Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this SIM card? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmSIM && handleDeleteSIM(deleteConfirmSIM)}
            >
              Delete SIM
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Bulk Import SIM Cards</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple SIM cards at once
            </DialogDescription>
          </DialogHeader>
          <BulkImportContent onImport={handleBulkImport} onClose={() => setIsBulkImportOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={isBulkAssignOpen} onOpenChange={setIsBulkAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Assign SIMs</DialogTitle>
            <DialogDescription>
              Assign {selectedSIMIds.size} selected SIM card(s) to a tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-secondary/30 p-3">
              <p className="text-sm font-medium mb-2">Selected SIMs:</p>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {selectedSIMs.slice(0, 8).map(sim => (
                  <Badge key={sim.id} variant="outline" className="text-xs">
                    {sim.msisdn}
                  </Badge>
                ))}
                {selectedSIMs.length > 8 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedSIMs.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign to Tenant</Label>
              <Select
                value={formData.tenantId || "unassigned"}
                onValueChange={(value) => updateFormData({ tenantId: value === "unassigned" ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {tenantOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAssignConfirm}>
              Assign {selectedSIMIds.size} SIM(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

interface BulkImportContentProps {
  onImport: () => void;
  onClose: () => void;
}

function BulkImportContent({ onImport, onClose }: BulkImportContentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (f: File) => {
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <>
          <div className="flex items-center justify-between rounded-lg border bg-secondary/30 p-3">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Download Template</p>
                <p className="text-xs text-muted-foreground">CSV template</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border"}`}
          >
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">Drag and drop your CSV file here</p>
            <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                Browse Files
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wifi className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">Ready for import</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFile(null)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium">0 Valid</p>
                <p className="text-xs text-muted-foreground">Ready to import</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium">0 Invalid</p>
                <p className="text-xs text-muted-foreground">Will be skipped</p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={onImport}
          disabled={!file}
        >
          Import SIMs
        </Button>
      </div>
    </div>
  );
}

