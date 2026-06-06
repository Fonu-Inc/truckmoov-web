import { useState, useMemo } from "react";
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
  TableRow } from "@/components/shadcn/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter } from "@/components/shadcn/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/shadcn/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from "@/components/shadcn/dropdown-menu";
import {
  Dialog as Sheet,
  DialogContent as SheetContent,
  DialogDescription as SheetDescription,
  DialogHeader as SheetHeader,
  DialogTitle as SheetTitle } from "@/components/shadcn/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from "@/components/shadcn/alert-dialog";
import {Wifi, Search, Plus, MoreHorizontal, Signal, SignalLow, SignalZero, Building2, Upload, RefreshCw, SlidersHorizontal as Filter, Eye, Pencil, Trash2, Cpu, Phone, Calendar, CreditCard, TrendingUp, AlertTriangle, CheckCircle, XCircle, Smartphone, Globe, Zap, ArrowUpDown, Download} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PlatformFilterPopover, type FilterDraft } from "@/components/shadcn/platform-filter-popover";
import { toast } from "sonner";

interface SIMCard {
  id: string;
  iccid: string;
  msisdn: string;
  imsi: string;
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
  signalStrength: number;
  networkType: "2G" | "3G" | "4G" | "5G";
  roaming: boolean;
  monthlyCost: number;
}

const mockSIMs: SIMCard[] = [
  {
    id: "sim-001",
    iccid: "8923411012345678901",
    msisdn: "+2348031234567",
    imsi: "621301234567890",
    carrier: "MTN Nigeria",
    plan: "iot_premium",
    status: "active",
    tenant: "ABC Logistics",
    tenantId: "tenant-1",
    deviceId: "DEV-001",
    deviceImei: "359072061234567",
    dataUsage: 850,
    dataLimit: 2000,
    smsUsage: 45,
    smsLimit: 100,
    activationDate: "2024-01-15",
    expiryDate: "2025-01-15",
    lastActivity: "2 min ago",
    signalStrength: 95,
    networkType: "4G",
    roaming: false,
    monthlyCost: 15000 },
  {
    id: "sim-002",
    iccid: "8923411012345678902",
    msisdn: "+2348052345678",
    imsi: "621302345678901",
    carrier: "Glo",
    plan: "data_sms",
    status: "active",
    tenant: "XYZ Transport",
    tenantId: "tenant-2",
    deviceId: "DEV-002",
    deviceImei: "359072061234568",
    dataUsage: 1200,
    dataLimit: 1500,
    smsUsage: 78,
    smsLimit: 100,
    activationDate: "2023-08-20",
    expiryDate: "2024-08-20",
    lastActivity: "5 min ago",
    signalStrength: 72,
    networkType: "4G",
    roaming: false,
    monthlyCost: 12000 },
  {
    id: "sim-003",
    iccid: "8923411012345678903",
    msisdn: "+2348073456789",
    imsi: "621303456789012",
    carrier: "Airtel",
    plan: "iot_basic",
    status: "suspended",
    tenant: "Quick Movers",
    tenantId: "tenant-3",
    deviceId: "DEV-003",
    deviceImei: "359072061234569",
    dataUsage: 0,
    dataLimit: 500,
    smsUsage: 0,
    smsLimit: 50,
    activationDate: "2024-06-01",
    expiryDate: "2025-06-01",
    lastActivity: "15 days ago",
    signalStrength: 0,
    networkType: "3G",
    roaming: false,
    monthlyCost: 8000 },
  {
    id: "sim-004",
    iccid: "8923411012345678904",
    msisdn: "+2349014567890",
    imsi: "621304567890123",
    carrier: "MTN Nigeria",
    plan: "data_only",
    status: "unassigned",
    tenant: null,
    tenantId: null,
    deviceId: null,
    deviceImei: null,
    dataUsage: 0,
    dataLimit: 1000,
    smsUsage: 0,
    smsLimit: 0,
    activationDate: null,
    expiryDate: "2025-12-31",
    lastActivity: "Never",
    signalStrength: 0,
    networkType: "4G",
    roaming: false,
    monthlyCost: 6000 },
  {
    id: "sim-005",
    iccid: "8923411012345678905",
    msisdn: "+2348095678901",
    imsi: "621305678901234",
    carrier: "9mobile",
    plan: "data_sms_voice",
    status: "active",
    tenant: "ABC Logistics",
    tenantId: "tenant-1",
    deviceId: "DEV-005",
    deviceImei: "359072061234571",
    dataUsage: 450,
    dataLimit: 2000,
    smsUsage: 12,
    smsLimit: 200,
    activationDate: "2024-03-10",
    expiryDate: "2025-03-10",
    lastActivity: "1 hour ago",
    signalStrength: 28,
    networkType: "3G",
    roaming: true,
    monthlyCost: 18000 },
  {
    id: "sim-006",
    iccid: "8923411012345678906",
    msisdn: "+2348136789012",
    imsi: "621306789012345",
    carrier: "Glo",
    plan: "iot_premium",
    status: "active",
    tenant: "Metro Couriers",
    tenantId: "tenant-4",
    deviceId: "DEV-006",
    deviceImei: "359072061234572",
    dataUsage: 980,
    dataLimit: 2000,
    smsUsage: 34,
    smsLimit: 100,
    activationDate: "2024-02-15",
    expiryDate: "2025-02-15",
    lastActivity: "10 min ago",
    signalStrength: 88,
    networkType: "4G",
    roaming: false,
    monthlyCost: 15000 },
  {
    id: "sim-007",
    iccid: "8923411012345678907",
    msisdn: "+2348027890123",
    imsi: "621307890123456",
    carrier: "Airtel",
    plan: "data_sms",
    status: "active",
    tenant: "XYZ Transport",
    tenantId: "tenant-2",
    deviceId: "DEV-007",
    deviceImei: "359072061234573",
    dataUsage: 1100,
    dataLimit: 1500,
    smsUsage: 56,
    smsLimit: 100,
    activationDate: "2024-04-10",
    expiryDate: "2025-04-10",
    lastActivity: "30 min ago",
    signalStrength: 65,
    networkType: "4G",
    roaming: false,
    monthlyCost: 12000 },
];

const carriers = ["All", "MTN Nigeria", "Glo", "Airtel", "9mobile"];
const statuses = ["all", "active", "inactive", "suspended", "unassigned"];
const plans = ["all", "data_only", "data_sms", "data_sms_voice", "iot_basic", "iot_premium"];

const planLabels: Record<string, string> = {
  data_only: "Data Only",
  data_sms: "Data + SMS",
  data_sms_voice: "Data + SMS + Voice",
  iot_basic: "IoT Basic",
  iot_premium: "IoT Premium" };

const mockTenants = [
  { id: "tenant-1", name: "ABC Logistics" },
  { id: "tenant-2", name: "XYZ Transport" },
  { id: "tenant-3", name: "Quick Movers" },
  { id: "tenant-4", name: "Metro Couriers" },
];

const mockDevices = [
  { id: "DEV-001", imei: "359072061234567", tenantId: "tenant-1" },
  { id: "DEV-002", imei: "359072061234568", tenantId: "tenant-2" },
  { id: "DEV-003", imei: "359072061234569", tenantId: "tenant-3" },
  { id: "DEV-005", imei: "359072061234571", tenantId: "tenant-1" },
  { id: "DEV-006", imei: "359072061234572", tenantId: "tenant-1" },
  { id: "DEV-007", imei: "359072061234573", tenantId: "tenant-2" },
];

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
  monthlyCost: 35 };

export default function PlatformSIMs() {
  const [sims, setSims] = useState<SIMCard[]>(mockSIMs);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("All");
  const [simFilterDraft, setSimFilterDraft] = useState<FilterDraft>({
    carrier: { enabled: false },
    plan: { enabled: false },
    tenant: { enabled: false } });
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

  const handleBulkActivate = () => {
    setSims(sims.map(s => selectedSIMIds.has(s.id) && s.status !== "active" ? { ...s, status: "active" as const } : s));
    toast.success(`${selectedSIMIds.size} SIM(s) activated`);
    clearSelection();
  };

  const handleBulkSuspend = () => {
    setSims(sims.map(s => selectedSIMIds.has(s.id) && s.status === "active" ? { ...s, status: "suspended" as const } : s));
    toast.success(`${selectedSIMIds.size} SIM(s) suspended`);
    clearSelection();
  };

  const handleBulkAssign = () => {
    setIsBulkAssignOpen(true);
  };

  const handleBulkAssignConfirm = () => {
    const tenant = mockTenants.find(t => t.id === formData.tenantId);
    setSims(sims.map(s => 
      selectedSIMIds.has(s.id) 
        ? { 
            ...s, 
            tenant: tenant?.name || null, 
            tenantId: formData.tenantId || null, 
            status: formData.tenantId ? "active" as const : "unassigned" as const,
            activationDate: formData.tenantId ? new Date().toISOString().split("T")[0] : null 
          } 
        : s
    ));
    toast.success(`${selectedSIMIds.size} SIM(s) assigned to ${tenant?.name || "Unassigned"}`);
    clearSelection();
    setIsBulkAssignOpen(false);
    setFormData(emptySIM);
  };

  const selectedSIMs = useMemo(() => 
    sims.filter(s => selectedSIMIds.has(s.id)), 
    [sims, selectedSIMIds]
  );

  const filteredSIMs = sims.filter((sim) => {
    const matchesSearch =
      sim.iccid.includes(searchQuery) ||
      sim.msisdn.includes(searchQuery) ||
      sim.tenant?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || sim.status === statusFilter;

    const carrierF = simFilterDraft.carrier;
    const matchesCarrier = !carrierF?.enabled || !carrierF.value || sim.carrier === carrierF.value;

    const planF = simFilterDraft.plan;
    const matchesPlan = !planF?.enabled || !planF.value || sim.plan === planF.value;

    const tenantF = simFilterDraft.tenant;
    const matchesTenant = !tenantF?.enabled || !tenantF.value || sim.tenantId === tenantF.value;

    return matchesSearch && matchesStatus && matchesCarrier && matchesPlan && matchesTenant;
  });

  const totalSIMs = sims.length;
  const activeSIMs = sims.filter((s) => s.status === "active").length;
  const unassignedSIMs = sims.filter((s) => s.status === "unassigned").length;
  const totalDataUsage = sims.reduce((sum, s) => sum + s.dataUsage, 0);
  const totalMonthlyCost = sims.reduce((sum, s) => sum + s.monthlyCost, 0);

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

  const getSignalIcon = (strength: number, status: string) => {
    if (status !== "active") return <SignalZero className="h-4 w-4 text-muted-foreground" />;
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
    if (!formData.iccid || !formData.msisdn) {
      toast.error("ICCID and phone number are required");
      return;
    }

    const newSIM: SIMCard = {
      id: `sim-${Date.now()}`,
      iccid: formData.iccid!,
      msisdn: formData.msisdn!,
      imsi: formData.imsi || "",
      carrier: formData.carrier || "MTN",
      plan: formData.plan as SIMCard["plan"],
      status: "unassigned",
      tenant: null,
      tenantId: null,
      deviceId: null,
      deviceImei: null,
      dataUsage: 0,
      dataLimit: formData.dataLimit || 1000,
      smsUsage: 0,
      smsLimit: formData.smsLimit || 0,
      activationDate: null,
      expiryDate: formData.expiryDate || "",
      lastActivity: "Never",
      signalStrength: 0,
      networkType: "4G",
      roaming: false,
      monthlyCost: formData.monthlyCost || 35 };

    setSims([...sims, newSIM]);
    setIsCreateDialogOpen(false);
    setFormData(emptySIM);
    toast.success("SIM card added successfully");
  };

  const handleEditSIM = () => {
    if (!selectedSIM || !formData.iccid || !formData.msisdn) {
      toast.error("ICCID and phone number are required");
      return;
    }

    setSims(
      sims.map((s) =>
        s.id === selectedSIM.id ? { ...s, ...formData, id: s.id } as SIMCard : s
      )
    );
    setIsEditDialogOpen(false);
    setSelectedSIM(null);
    setFormData(emptySIM);
    toast.success("SIM card updated successfully");
  };

  const handleDeleteSIM = (simId: string) => {
    setSims(sims.filter((s) => s.id !== simId));
    setDeleteConfirmSIM(null);
    toast.success("SIM card deleted successfully");
  };

  const handleAssignSIM = () => {
    if (!selectedSIM) return;

    const tenant = mockTenants.find((t) => t.id === formData.tenantId);
    const device = mockDevices.find((d) => d.id === formData.deviceId);

    setSims(
      sims.map((s) =>
        s.id === selectedSIM.id
          ? {
              ...s,
              tenant: tenant?.name || null,
              tenantId: formData.tenantId || null,
              deviceId: formData.deviceId || null,
              deviceImei: device?.imei || null,
              status: formData.tenantId ? "active" : "unassigned",
              activationDate: formData.tenantId ? new Date().toISOString().split("T")[0] : null }
          : s
      )
    );
    setIsAssignDialogOpen(false);
    setSelectedSIM(null);
    setFormData(emptySIM);
    toast.success("SIM card assigned successfully");
  };

  const handleStatusChange = (simId: string, newStatus: SIMCard["status"]) => {
    setSims(sims.map((s) => (s.id === simId ? { ...s, status: newStatus } : s)));
    toast.success(`SIM status updated to ${newStatus}`);
  };

  const handleBulkImport = (importedSims: Partial<SIMCard>[]) => {
    const newSIMs: SIMCard[] = importedSims.map((sim, index) => ({
      id: `sim-bulk-${Date.now()}-${index}`,
      iccid: sim.iccid || "",
      msisdn: sim.msisdn || "",
      imsi: sim.imsi || "",
      carrier: sim.carrier || "MTN",
      plan: (sim.plan as SIMCard["plan"]) || "iot_basic",
      status: "unassigned" as const,
      tenant: null,
      tenantId: null,
      deviceId: null,
      deviceImei: null,
      dataUsage: 0,
      dataLimit: sim.dataLimit || 1000,
      smsUsage: 0,
      smsLimit: sim.smsLimit || 0,
      activationDate: null,
      expiryDate: sim.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      lastActivity: "Never",
      signalStrength: 0,
      networkType: "4G",
      roaming: false,
      monthlyCost: sim.monthlyCost || 35 }));
    setSims([...sims, ...newSIMs]);
    setIsBulkImportOpen(false);
    toast.success(`${newSIMs.length} SIM cards imported successfully`);
  };

  const handleViewDetails = (sim: SIMCard) => {
    setSelectedSIM(sim);
    setIsDetailsSheetOpen(true);
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
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="inventory">SIM Inventory</TabsTrigger>
              <TabsTrigger value="approval">Approval Queue</TabsTrigger>
              <TabsTrigger value="activation">Activation</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inventory" className="space-y-6">

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-5">
              <StatCard title="Total SIMs" value={totalSIMs} icon={Wifi} />
              <StatCard
                title="Active"
                value={activeSIMs}
                icon={CheckCircle}
                variant="success"
              />
              <StatCard
                title="Unassigned"
                value={unassignedSIMs}
                icon={AlertTriangle}
                variant="warning"
              />
              <StatCard
                title="Data Usage"
                value={`${(totalDataUsage / 1000).toFixed(1)} GB`}
                icon={TrendingUp}
              />
              <StatCard
                title="Monthly Cost"
                value={`₦${totalMonthlyCost.toLocaleString()}`}
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
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <PlatformFilterPopover
                entity="SIMs"
                fields={[
                  {
                    key: "carrier",
                    label: "Carrier",
                    type: "select",
                    options: carriers
                      .filter((c) => c !== "All")
                      .map((c) => ({ value: c, label: c })) },
                  {
                    key: "plan",
                    label: "Plan",
                    type: "select",
                    options: plans
                      .filter((p) => p !== "all")
                      .map((p) => ({ value: p, label: planLabels[p] || p })) },
                  {
                    key: "tenant",
                    label: "Tenant",
                    type: "select",
                    options: mockTenants.map((t) => ({ value: t.id, label: t.name })) },
                ]}
                value={simFilterDraft}
                onApply={setSimFilterDraft}
                onReset={() =>
                  setSimFilterDraft({
                    carrier: { enabled: false },
                    plan: { enabled: false },
                    tenant: { enabled: false } })
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

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedSIMIds.size === filteredSIMs.length && filteredSIMs.length > 0}
                        onCheckedChange={toggleAllSIMs}
                      />
                    </TableHead>
                    <TableHead>ICCID / Phone</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Usage</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
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
                          <p className="font-mono text-sm">{sim.iccid}</p>
                          <p className="text-xs text-muted-foreground">{sim.msisdn}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sim.carrier}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{planLabels[sim.plan]}</span>
                      </TableCell>
                      <TableCell>
                        {sim.tenant ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{sim.tenant}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sim.deviceId ? (
                          <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{sim.deviceId}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(sim.status)}</TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{sim.dataUsage} MB</span>
                            <span className="text-muted-foreground">/ {sim.dataLimit}</span>
                          </div>
                          <Progress
                            value={(sim.dataUsage / sim.dataLimit) * 100}
                            className="h-1.5"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSignalIcon(sim.signalStrength, sim.status)}
                          {sim.status === "active" && (
                            <span className="text-xs">{sim.networkType}</span>
                          )}
                          {sim.roaming && (
                            <span title="Roaming">
                              <Globe className="h-3 w-3 text-warning" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(sim)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(sim)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenAssign(sim)}>
                              <ArrowUpDown className="h-4 w-4 mr-2" />
                              {sim.tenant ? "Reassign" : "Assign"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {sim.tenant ? (
                              <>
                                {sim.status === "active" && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(sim.id, "suspended")}
                                    className="text-warning"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Suspend
                                  </DropdownMenuItem>
                                )}
                                {sim.status === "suspended" && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(sim.id, "active")}
                                    className="text-success"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Reactivate
                                  </DropdownMenuItem>
                                )}
                              </>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setDeleteConfirmSIM(sim.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                  {mockTenants.map((t) => (
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
                    {mockDevices
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
                      <span>{selectedSIM.msisdn}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IMSI</span>
                      <span className="font-mono">{selectedSIM.imsi}</span>
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
                        value={(selectedSIM.dataUsage / selectedSIM.dataLimit) * 100}
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
                          value={(selectedSIM.smsUsage / selectedSIM.smsLimit) * 100}
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
                        <span>{selectedSIM.signalStrength}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Network Type</span>
                      <span>{selectedSIM.networkType}</span>
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
                  {mockTenants.map((t) => (
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
  onImport: (sims: Partial<SIMCard>[]) => void;
  onClose: () => void;
}

function BulkImportContent({ onImport, onClose }: BulkImportContentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Array<{ 
    iccid: string; 
    msisdn: string; 
    imsi: string; 
    carrier: string; 
    plan: SIMCard["plan"];
    dataLimit: number;
    monthlyCost: number;
    isValid: boolean; 
    errors: string[] 
  }>>([]);
  const [isDragging, setIsDragging] = useState(false);

  const validPlans: SIMCard["plan"][] = ["data_only", "data_sms", "data_sms_voice", "iot_basic", "iot_premium"];

  const parseCSV = (content: string) => {
    const lines = content.split("\n").filter(l => l.trim()).slice(1);
    return lines.map(line => {
      const [iccid, msisdn, imsi, carrier, plan, dataLimit, monthlyCost] = line.split(",").map(s => s?.trim());
      const errors: string[] = [];
      if (!iccid || iccid.length < 18) errors.push("Invalid ICCID (min 18 chars)");
      if (!msisdn || !msisdn.startsWith("+")) errors.push("Phone must start with +");
      const validPlan = validPlans.includes(plan as SIMCard["plan"]) ? plan as SIMCard["plan"] : "iot_basic";
      return { 
        iccid, 
        msisdn, 
        imsi: imsi || "", 
        carrier: carrier || "MTN", 
        plan: validPlan,
        dataLimit: parseInt(dataLimit) || 1000,
        monthlyCost: parseFloat(monthlyCost) || 35,
        isValid: errors.length === 0, 
        errors 
      };
    });
  };

  const handleFile = async (f: File) => {
    if (!f.name.endsWith(".csv")) { 
      toast.error("Please upload a CSV file"); 
      return; 
    }
    setFile(f);
    setParsedData(parseCSV(await f.text()));
  };

  const handleDrop = (e: React.DragEvent) => { 
    e.preventDefault(); 
    setIsDragging(false); 
    e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); 
  };

  const downloadTemplate = () => {
    const blob = new Blob([
      `ICCID,Phone Number,IMSI,Carrier,Plan,Data Limit (MB),Monthly Cost\n` +
      `8927100012345678901,+27601234567,655101234567890,MTN,iot_premium,2000,89\n` +
      `8927100012345678902,+27602345678,655102345678901,Vodacom,data_sms,1500,65`
    ], { type: "text/csv" });
    const a = document.createElement("a"); 
    a.href = URL.createObjectURL(blob); 
    a.download = "sim_import_template.csv"; 
    a.click();
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <div className="space-y-4">
      {!file ? (
        <>
          <div className="flex items-center justify-between rounded-lg border bg-secondary/30 p-3">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Download Template</p>
                <p className="text-xs text-muted-foreground">CSV template with sample data</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
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
                <p className="text-xs text-muted-foreground">{parsedData.length} records found</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setFile(null); setParsedData([]); }}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium">{validCount} Valid</p>
                <p className="text-xs text-muted-foreground">Ready to import</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium">{invalidCount} Invalid</p>
                <p className="text-xs text-muted-foreground">Will be skipped</p>
              </div>
            </div>
          </div>

          {parsedData.length > 0 && (
            <div className="rounded-lg border">
              <div className="max-h-48 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">Status</TableHead>
                      <TableHead>ICCID</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Carrier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {row.isValid ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.iccid}</TableCell>
                        <TableCell className="text-sm">{row.msisdn}</TableCell>
                        <TableCell className="text-sm">{row.carrier}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsedData.length > 10 && (
                <div className="p-2 text-center text-xs text-muted-foreground border-t">
                  And {parsedData.length - 10} more records...
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button 
          onClick={() => onImport(parsedData.filter(r => r.isValid))} 
          disabled={!file || validCount === 0}
        >
          Import {validCount} SIM{validCount !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}



