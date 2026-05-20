import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Building2,
  Search,
  Plus,
  MoreHorizontal,
  Truck,
  Users,
  CreditCard,
  Calendar,
  Mail,
  Send,
  Phone,
  MapPin,
  Settings,
  Eye,
  Pencil,
  Ban,
  RefreshCw,
  SlidersHorizontal as Filter,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Cpu,
  MessageSquare,
  Sparkles,
  Shield,
  FileText,
  Smartphone,
  ArrowUpDown,
  ArrowUp,
  ArrowDown } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CurrencySelector } from "@/components/CurrencySelector";
import { TenantOnboardingWizard } from "@/components/platform/TenantOnboardingWizard";
import { ExportButton } from "@/components/ui/export-button";
import {
  PlatformFilterPopover,
  buildEmptyDraft,
  type FilterField,
  type FilterDraft } from "@/components/ui/platform-filter-popover";

const tenantFilterFields: FilterField[] = [
  {
    key: "orgType",
    label: "Organization Type",
    type: "select",
    options: [
      { value: "ENTERPRISE", label: "Enterprise" },
      { value: "FLEET_PROVIDER", label: "Fleet Provider" },
      { value: "AGGREGATOR", label: "Aggregator" },
      { value: "OWNER_OPERATOR", label: "Owner-Operator" },
    ] },
  {
    key: "plan",
    label: "Plan",
    type: "select",
    options: [
      { value: "starter", label: "Starter" },
      { value: "professional", label: "Professional" },
      { value: "enterprise", label: "Enterprise" },
    ] },
  {
    key: "kyc",
    label: "KYC Status",
    type: "select",
    options: [
      { value: "verified", label: "Verified" },
      { value: "under_review", label: "Under Review" },
      { value: "pending", label: "Pending" },
      { value: "rejected", label: "Rejected" },
    ] },
  { key: "revenue", label: "Revenue (NGN)", type: "range" },
  { key: "lastActive", label: "Last Active", type: "date" },
];

import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { TenantDetailsSheet } from "@/components/platform/TenantDetailsSheet";
import { TerminateTenantDialog } from "@/components/platform/TerminateTenantDialog";
import { TenantKYCVerification } from "@/components/platform/TenantKYCVerification";
import { useTenants, TenantData } from "@/hooks/useTenants";
import { supabase } from "@/integrations/supabase/client";

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "pending" | "suspended" | "inactive";
  vehicleCount: number;
  driverCount: number;
  deviceCount: number;
  createdAt: string;
  lastActive: string;
  billingEmail: string;
  monthlyRevenueNGN: number;
  monthlyRevenueUSD: number;
  usageLimits: {
    maxVehicles: number;
    maxDrivers: number;
    maxDevices: number;
    maxMessages: number;
    dataRetentionDays: number;
  };
  features: {
    liveTracking: boolean;
    geofencing: boolean;
    routeOptimization: boolean;
    messaging: boolean;
    analytics: boolean;
    apiAccess: boolean;
  };
}

// Mock tenants removed - using live database data only

const planDetails = {
  starter: { name: "Starter", priceNGN: 774500, priceUSD: 499, color: "bg-muted text-muted-foreground", maxVehicles: 10, maxDrivers: 15, maxDevices: 10, maxSims: 10 },
  professional: { name: "Professional", priceNGN: 2323500, priceUSD: 1499, color: "bg-primary/10 text-primary", maxVehicles: 50, maxDrivers: 75, maxDevices: 50, maxSims: 50 },
  enterprise: { name: "Enterprise", priceNGN: 7748500, priceUSD: 4999, color: "bg-success/10 text-success", maxVehicles: 200, maxDrivers: 250, maxDevices: 200, maxSims: 200 } };

// Helper to get plan limits for database tenants
const getPlanLimits = (plan: string) => {
  const validPlan = plan as keyof typeof planDetails;
  return planDetails[validPlan] || planDetails.starter;
};

const emptyTenant: Partial<Tenant> = {
  name: "",
  email: "",
  phone: "",
  address: "",
  plan: "starter",
  status: "pending",
  billingEmail: "",
  usageLimits: {
    maxVehicles: 10,
    maxDrivers: 15,
    maxDevices: 10,
    maxMessages: 500,
    dataRetentionDays: 90 },
  features: {
    liveTracking: true,
    geofencing: false,
    routeOptimization: false,
    messaging: true,
    analytics: false,
    apiAccess: false } };

export default function PlatformTenants() {
  const { currency, format } = useCurrency();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, addNotification } = useRealtimeNotifications();
  
  // Fetch real tenants from database
  const { tenants: dbTenants, isLoading: isLoadingDbTenants, refetch: refetchDbTenants, updateTenantStatus, updateTenant: updateDbTenant, deleteTenant: deleteDbTenant } = useTenants();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [advancedFilters, setAdvancedFilters] = useState<FilterDraft>(buildEmptyDraft(tenantFilterFields));
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedDbTenant, setSelectedDbTenant] = useState<TenantData | null>(null);
  const [isDbDetailsSheetOpen, setIsDbDetailsSheetOpen] = useState(false);
  const [isDbEditDialogOpen, setIsDbEditDialogOpen] = useState(false);
  const [deleteConfirmDbTenant, setDeleteConfirmDbTenant] = useState<TenantData | null>(null);
  const [dbFormData, setDbFormData] = useState<Partial<TenantData>>({});

  // Sorting state
  type SortKey = "name" | "orgType" | "plan" | "status" | "vehicleCount" | "simCount" | "monthlyRevenueNgn" | "lastActiveAt";
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };
  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-50" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1 inline" />
      : <ArrowDown className="h-3 w-3 ml-1 inline" />;
  };

  // Overdue invoices per tenant (id -> count) — deterministic mock
  const overdueByTenant = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    dbTenants.forEach((t, i) => {
      // Mark ~25% of tenants as having overdue invoices for demo
      if ((i % 4) === 1) map[t.id] = (i % 3) + 1;
    });
    return map;
  }, [dbTenants]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(() => {
      refetchDbTenants();
    }, 60000);
    return () => clearInterval(id);
  }, [refetchDbTenants]);


  // Fetch org types per tenant using SECURITY DEFINER RPC (bypasses RLS)
  const [tenantOrgTypesState, setTenantOrgTypesState] = useState<Record<string, string[]>>({});
  useEffect(() => {
    if (dbTenants.length === 0) return;
    const isMockData = dbTenants.some(t => !t.id.includes('-'));
    if (isMockData) {
      const map: Record<string, string[]> = {};
      dbTenants.forEach(t => { map[t.id] = ['FLEET_PROVIDER']; });
      setTenantOrgTypesState(map);
      return;
    }
    const fetchOrgTypes = async () => {
      const { data, error } = await supabase.rpc('get_tenant_org_types');
      if (error || !data) return;
      const map: Record<string, string[]> = {};
      (data as any[]).forEach((row) => {
        if (row.tenant_id && row.org_types) {
          map[row.tenant_id] = row.org_types;
        }
      });
      setTenantOrgTypesState(map);
    };
    fetchOrgTypes();
  }, [dbTenants]);

  // Filter live database tenants
  const filteredDbTenants = dbTenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;

    // Advanced filters
    const orgTypeF = advancedFilters.orgType;
    const orgTypes = tenantOrgTypesState[tenant.id] || [];
    const matchesOrgType = !orgTypeF?.enabled || !orgTypeF.value || orgTypes.includes(orgTypeF.value);

    const planF = advancedFilters.plan;
    const matchesPlan = !planF?.enabled || !planF.value || tenant.plan === planF.value;

    const kycF = advancedFilters.kyc;
    const kycStatus = tenant.businessInfo?.verificationStatus || "pending";
    const matchesKyc = !kycF?.enabled || !kycF.value || kycStatus === kycF.value;

    const revF = advancedFilters.revenue;
    const rev = tenant.monthlyRevenueNgn || 0;
    const matchesRev = !revF?.enabled
      || ((!revF.from || rev >= Number(revF.from)) && (!revF.to || rev <= Number(revF.to)));

    const lastF = advancedFilters.lastActive;
    const lastMs = tenant.lastActiveAt ? new Date(tenant.lastActiveAt).getTime() : 0;
    const fromMs = lastF?.from ? new Date(lastF.from).getTime() : 0;
    const toMs = lastF?.to ? new Date(lastF.to).getTime() + 86400000 : 0;
    const matchesLast = !lastF?.enabled
      || ((!fromMs || lastMs >= fromMs) && (!toMs || lastMs <= toMs));

    return matchesSearch && matchesStatus && matchesOrgType && matchesPlan && matchesKyc && matchesRev && matchesLast;
  });

  // Apply sorting
  const sortedDbTenants = useMemo(() => {
    const arr = [...filteredDbTenants];
    arr.sort((a, b) => {
      let av: any;
      let bv: any;
      switch (sortKey) {
        case "name": av = a.name?.toLowerCase() || ""; bv = b.name?.toLowerCase() || ""; break;
        case "orgType":
          av = (tenantOrgTypesState[a.id] || []).join(",");
          bv = (tenantOrgTypesState[b.id] || []).join(",");
          break;
        case "plan": av = a.plan || ""; bv = b.plan || ""; break;
        case "status": av = a.status || ""; bv = b.status || ""; break;
        case "vehicleCount": av = a.vehicleCount || 0; bv = b.vehicleCount || 0; break;
        case "simCount": av = a.simCount || 0; bv = b.simCount || 0; break;
        case "monthlyRevenueNgn": av = a.monthlyRevenueNgn || 0; bv = b.monthlyRevenueNgn || 0; break;
        case "lastActiveAt":
          av = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
          bv = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
          break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredDbTenants, sortKey, sortDir, tenantOrgTypesState]);

  // Stats from live data
  const totalTenants = dbTenants.length;
  const activeTenants = dbTenants.filter((t) => t.status === "active").length;
  const suspendedTenants = dbTenants.filter((t) => t.status === "suspended" || t.status === "terminated").length;
  const totalRevenueNGN = dbTenants.reduce((sum, t) => sum + (t.monthlyRevenueNgn || 0), 0);
  const totalVehicles = dbTenants.reduce((sum, t) => sum + (t.vehicleCount || 0), 0);
  const totalSims = dbTenants.reduce((sum, t) => sum + (t.simCount || 0), 0);
  const overdueInvoices = Object.values(overdueByTenant).reduce((s, n) => s + n, 0);

  const formatTotalRevenue = () => {
    return currency === "NGN" 
      ? `₦${totalRevenueNGN.toLocaleString()}` 
      : `$${Math.round(totalRevenueNGN / 1550).toLocaleString()}`;
  };

  const formatPlanPrice = (plan: keyof typeof planDetails) => {
    return currency === "NGN" 
      ? `₦${planDetails[plan].priceNGN.toLocaleString()}` 
      : `$${planDetails[plan].priceUSD}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/10 text-success border-success/30">Active</Badge>;
      case "trial":
        return <Badge className="bg-primary/10 text-primary border-primary/30">Trial</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "terminated":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/40">Terminated</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };


  const handleWizardComplete = (wizardData: any) => {
    // Wizard now creates tenants via the API - just trigger a refetch and notification
    refetchDbTenants();
    
    addNotification({
      type: "tenant_created",
      title: "Tenant Onboarded",
      message: `${wizardData.companyName} has been fully onboarded with ${wizardData.deviceCount} devices and ${wizardData.simCount} SIMs`,
      severity: "success" });
  };

  // DB Tenant handlers
  const handleDbTenantStatusChange = async (tenant: TenantData, newStatus: TenantData["status"]) => {
    const success = await updateTenantStatus(tenant.id, newStatus);
    if (success) {
      addNotification({
        type: "system",
        title: "Tenant Status Changed",
        message: `${tenant.name} status changed to ${newStatus}`,
        severity: newStatus === "suspended" ? "warning" : "info" });
    }
  };

  const handleOpenDbEdit = (tenant: TenantData) => {
    setSelectedDbTenant(tenant);
    setDbFormData({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      billingEmail: tenant.billingEmail,
      plan: tenant.plan });
    setIsDbEditDialogOpen(true);
  };

  const handleEditDbTenant = async () => {
    if (!selectedDbTenant || !dbFormData.name || !dbFormData.email) {
      toast.error("Name and email are required");
      return;
    }

    const success = await updateDbTenant(selectedDbTenant.id, {
      name: dbFormData.name,
      email: dbFormData.email,
      phone: dbFormData.phone || null,
      address: dbFormData.address || null,
      billingEmail: dbFormData.billingEmail || null,
      plan: dbFormData.plan });

    if (success) {
      setIsDbEditDialogOpen(false);
      setSelectedDbTenant(null);
      setDbFormData({});
    }
  };

  const handleDeleteDbTenant = async () => {
    if (!deleteConfirmDbTenant) return;

    const tenantName = deleteConfirmDbTenant.name;
    const success = await deleteDbTenant(deleteConfirmDbTenant.id);
    
    if (success) {
      addNotification({
        type: "system",
        title: "Tenant Deleted",
        message: `${tenantName} has been removed from the platform`,
        severity: "warning" });
    }
    
    setDeleteConfirmDbTenant(null);
  };

  const handleResendInvitation = async (tenant: TenantData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to resend invitations");
        return;
      }

      toast.loading("Sending invitation email...", { id: "resend-invitation" });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-tenant-invitation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}` },
          body: JSON.stringify({ tenantId: tenant.id }) }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to resend invitation");
      }

      toast.success(`Welcome email sent to ${tenant.email}`, { id: "resend-invitation" });
      
      addNotification({
        type: "system",
        title: "Invitation Sent",
        message: `Welcome email resent to ${tenant.name}`,
        severity: "success" });
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to resend invitation", { id: "resend-invitation" });
    }
  };


  return (
    <DashboardLayout
      title="Tenant Management"
      subtitle="Create, edit, and manage tenant organizations"
    >
      <div className="space-y-6">
        {/* Top-right grouped controls (currency configured globally in Settings → Billing) */}
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" onClick={() => setIsWizardOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Onboard Tenant
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Total Tenants"
            value={totalTenants}
            icon={Building2}
            change={12}
            changeLabel="this month"
          />
          <StatCard
            title="Active Tenants"
            value={activeTenants}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Suspended"
            value={suspendedTenants}
            icon={Ban}
            variant="danger"
          />
          <StatCard
            title="Total Vehicles"
            value={totalVehicles.toLocaleString()}
            icon={Truck}
          />
          <StatCard
            title="Total SIMs"
            value={totalSims.toLocaleString()}
            icon={Smartphone}
          />
          <StatCard
            title="Overdue Invoices"
            value={overdueInvoices}
            icon={AlertTriangle}
            variant={overdueInvoices > 0 ? "warning" : "default"}
          />
        </div>


        {/* All Tenants */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  All Tenants
                </CardTitle>
                <CardDescription>
                  Complete directory of tenant organizations with plan, KYC status, fleet size, and revenue.
                </CardDescription>
              </div>
              <ExportButton
                filename="tenants"
                rows={sortedDbTenants}
                columns={[
                  { header: "Name", accessor: (t) => t.name },
                  { header: "Primary Contact", accessor: (t) => t.primaryContactName || "" },
                  { header: "Email", accessor: (t) => t.email },
                  { header: "Plan", accessor: (t) => t.plan },
                  { header: "Status", accessor: (t) => t.status },
                  { header: "KYC", accessor: (t) => t.businessInfo?.verificationStatus || "pending" },
                  { header: "Vehicles", accessor: (t) => t.vehicleCount },
                  { header: "Drivers", accessor: (t) => t.driverCount },
                  { header: "Devices", accessor: (t) => t.deviceCount },
                  { header: "SIMs", accessor: (t) => t.simCount },
                  { header: "Revenue (NGN)", accessor: (t) => t.monthlyRevenueNgn || 0 },
                  { header: "Last Active", accessor: (t) => t.lastActiveAt || "" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Trial</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <PlatformFilterPopover
                entity="tenants"
                fields={tenantFilterFields}
                value={advancedFilters}
                onApply={setAdvancedFilters}
                onReset={() => setAdvancedFilters(buildEmptyDraft(tenantFilterFields))}
              />
            </div>

            {isLoadingDbTenants ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedDbTenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tenants found
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table className="[&_th]:px-6 [&_td]:px-6 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant ID</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                        Tenant<SortIcon k="name" />
                      </TableHead>
                      <TableHead>Primary Contact</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("orgType")}>
                        Org Type<SortIcon k="orgType" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("plan")}>
                        Plan<SortIcon k="plan" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("status")}>
                        Status<SortIcon k="status" />
                      </TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("vehicleCount")}>
                        Vehicles<SortIcon k="vehicleCount" />
                      </TableHead>
                      <TableHead>Drivers</TableHead>
                      <TableHead>Devices</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("simCount")}>
                        SIMs<SortIcon k="simCount" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("monthlyRevenueNgn")}>
                        Revenue<SortIcon k="monthlyRevenueNgn" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("lastActiveAt")}>
                        Last Active<SortIcon k="lastActiveAt" />
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDbTenants.map((tenant) => (
                      <TableRow
                        key={tenant.id}
                        className={overdueByTenant[tenant.id] ? "bg-warning/5 hover:bg-warning/10" : undefined}
                      >
                        <TableCell>
                          <span className="font-mono text-xs px-2 py-1 rounded bg-muted text-foreground">
                            TENANT-{String(tenant.id).replace(/-/g, "").slice(0, 8).toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                              {tenant.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{tenant.name}</p>
                              <p className="text-xs text-muted-foreground">{tenant.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {tenant.primaryContactName ? (
                            <span className="font-medium">{tenant.primaryContactName}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(tenantOrgTypesState[tenant.id] || []).length > 0 ? (
                              tenantOrgTypesState[tenant.id].map((ot) => (
                                <Badge key={ot} variant="outline" className="text-xs whitespace-nowrap">
                                  {ot === 'ENTERPRISE' ? 'Enterprise' : ot === 'FLEET_PROVIDER' ? 'Fleet Provider' : ot === 'AGGREGATOR' ? 'Aggregator' : ot === 'OWNER_OPERATOR' ? 'Owner-Operator' : ot}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={planDetails[tenant.plan]?.color || "bg-muted"}>
                            {planDetails[tenant.plan]?.name || tenant.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {getStatusBadge(tenant.status)}
                            {tenant.status === "pending" && (
                              <span className="text-xs text-muted-foreground">
                                {/* Check invitation status first, then KYC status */}
                                {!tenant.invitationStatus?.invitationAccepted && tenant.invitationStatus?.hasPendingInvitation
                                  ? "(Awaiting Invite Acceptance)"
                                  : (!tenant.businessInfo?.verificationStatus || tenant.businessInfo?.verificationStatus === "pending")
                                    ? "(Awaiting KYC)"
                                    : null
                                }
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {tenant.businessInfo?.verificationStatus === "verified" ? (
                            <Badge className="bg-success/10 text-success border-success/30">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : tenant.businessInfo?.verificationStatus === "under_review" ? (
                            <Badge className="bg-warning/10 text-warning border-warning/30">
                              <Clock className="h-3 w-3 mr-1" />
                              Under Review
                            </Badge>
                          ) : tenant.businessInfo?.verificationStatus === "rejected" ? (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              Not Submitted
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className={tenant.vehicleCount >= getPlanLimits(tenant.plan).maxVehicles ? "text-destructive font-medium" : ""}>
                              {tenant.vehicleCount}/{getPlanLimits(tenant.plan).maxVehicles}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className={tenant.driverCount >= getPlanLimits(tenant.plan).maxDrivers ? "text-destructive font-medium" : ""}>
                              {tenant.driverCount}/{getPlanLimits(tenant.plan).maxDrivers}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                            <span className={tenant.deviceCount >= getPlanLimits(tenant.plan).maxDevices ? "text-destructive font-medium" : ""}>
                              {tenant.deviceCount}/{getPlanLimits(tenant.plan).maxDevices}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <span className={tenant.simCount >= getPlanLimits(tenant.plan).maxSims ? "text-destructive font-medium" : ""}>
                              {tenant.simCount}/{getPlanLimits(tenant.plan).maxSims}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {currency === "NGN" 
                            ? `₦${(tenant.monthlyRevenueNgn || 0).toLocaleString()}` 
                            : `$${Math.round((tenant.monthlyRevenueNgn || 0) / 1550).toLocaleString()}`}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tenant.lastActiveAt 
                            ? new Date(tenant.lastActiveAt).toLocaleDateString() 
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedDbTenant(tenant);
                                setIsDbDetailsSheetOpen(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenDbEdit(tenant)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {(tenant.status === "pending" || tenant.status === "inactive") && (
                                <DropdownMenuItem onClick={() => handleResendInvitation(tenant)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Resend Invitation
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {tenant.status === "active" ? (
                                <DropdownMenuItem
                                  onClick={() => handleDbTenantStatusChange(tenant, "suspended")}
                                  className="text-warning"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              ) : tenant.status === "suspended" ? (
                                <DropdownMenuItem
                                  onClick={() => handleDbTenantStatusChange(tenant, "active")}
                                  className="text-success"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              ) : tenant.status === "pending" ? (
                                <DropdownMenuItem
                                  onClick={() => handleDbTenantStatusChange(tenant, "active")}
                                  className="text-success"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteConfirmDbTenant(tenant)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Terminate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tenant Onboarding Wizard */}
      <TenantOnboardingWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onComplete={handleWizardComplete}
      />
      {/* Database Tenant Details Sheet */}
      <TenantDetailsSheet
        tenant={selectedDbTenant}
        open={isDbDetailsSheetOpen}
        onOpenChange={setIsDbDetailsSheetOpen}
      />

      {/* Edit DB Tenant Dialog */}
      <Dialog open={isDbEditDialogOpen} onOpenChange={setIsDbEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>
              Update tenant information and subscription plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="db-name">Company Name *</Label>
              <Input
                id="db-name"
                value={dbFormData.name || ""}
                onChange={(e) => setDbFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="db-email">Email *</Label>
              <Input
                id="db-email"
                type="email"
                value={dbFormData.email || ""}
                onChange={(e) => setDbFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="db-phone">Phone</Label>
              <Input
                id="db-phone"
                value={dbFormData.phone || ""}
                onChange={(e) => setDbFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="db-address">Address</Label>
              <Input
                id="db-address"
                value={dbFormData.address || ""}
                onChange={(e) => setDbFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="db-billing-email">Billing Email</Label>
              <Input
                id="db-billing-email"
                type="email"
                value={dbFormData.billingEmail || ""}
                onChange={(e) => setDbFormData(prev => ({ ...prev, billingEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Subscription Plan</Label>
              <Select
                value={dbFormData.plan || "starter"}
                onValueChange={(value) => setDbFormData(prev => ({ ...prev, plan: value as TenantData["plan"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDbEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDbTenant}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate DB Tenant Confirmation */}
      {deleteConfirmDbTenant && (
        <TerminateTenantDialog
          tenant={deleteConfirmDbTenant}
          open={!!deleteConfirmDbTenant}
          onOpenChange={(o) => { if (!o) setDeleteConfirmDbTenant(null); }}
          onTerminated={() => {
            setDeleteConfirmDbTenant(null);
            refetchDbTenants();
          }}
        />
      )}
    </DashboardLayout>
  );
}
