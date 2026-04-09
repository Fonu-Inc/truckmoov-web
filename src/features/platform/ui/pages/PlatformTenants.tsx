import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Trash2,
  RefreshCw,
  Download,
  Filter,
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
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CurrencySelector } from "@/components/CurrencySelector";
import { TenantOnboardingWizard } from "@/components/platform/TenantOnboardingWizard";
import { NotificationCenter } from "@/components/platform/NotificationCenter";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { TenantDetailsSheet } from "@/components/platform/TenantDetailsSheet";
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
  enterprise: { name: "Enterprise", priceNGN: 7748500, priceUSD: 4999, color: "bg-success/10 text-success", maxVehicles: 200, maxDrivers: 250, maxDevices: 200, maxSims: 200 },
};

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
    dataRetentionDays: 90,
  },
  features: {
    liveTracking: true,
    geofencing: false,
    routeOptimization: false,
    messaging: true,
    analytics: false,
    apiAccess: false,
  },
};

export default function PlatformTenants() {
  const { currency, format } = useCurrency();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, addNotification } = useRealtimeNotifications();

  // Fetch real tenants from database
  const { tenants: dbTenants, isLoading: isLoadingDbTenants, refetch: refetchDbTenants, updateTenantStatus, updateTenant: updateDbTenant, deleteTenant: deleteDbTenant } = useTenants();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedDbTenant, setSelectedDbTenant] = useState<TenantData | null>(null);
  const [isDbDetailsSheetOpen, setIsDbDetailsSheetOpen] = useState(false);
  const [isDbEditDialogOpen, setIsDbEditDialogOpen] = useState(false);
  const [deleteConfirmDbTenant, setDeleteConfirmDbTenant] = useState<TenantData | null>(null);
  const [dbFormData, setDbFormData] = useState<Partial<TenantData>>({});

  // Fetch org types per tenant using SECURITY DEFINER RPC (bypasses RLS)
  // For demo users with mock tenant IDs, provide a default mapping
  const [tenantOrgTypesState, setTenantOrgTypesState] = useState<Record<string, string[]>>({});
  useEffect(() => {
    if (dbTenants.length === 0) return;
    // Check if tenants are mock (non-UUID IDs like "t1", "t2")
    const isMockData = dbTenants.some(t => !t.id.includes('-'));
    if (isMockData) {
      // Provide default org type for mock tenants
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
    const matchesPlan = planFilter === "all" || tenant.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Stats from live data
  const totalTenants = dbTenants.length;
  const activeTenants = dbTenants.filter((t) => t.status === "active").length;
  const totalRevenueNGN = dbTenants.reduce((sum, t) => sum + (t.monthlyRevenueNgn || 0), 0);
  const totalVehicles = dbTenants.reduce((sum, t) => sum + (t.vehicleCount || 0), 0);

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
      case "pending":
        return <Badge className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
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
      severity: "success",
    });
  };

  // DB Tenant handlers
  const handleDbTenantStatusChange = async (tenant: TenantData, newStatus: TenantData["status"]) => {
    const success = await updateTenantStatus(tenant.id, newStatus);
    if (success) {
      addNotification({
        type: "system",
        title: "Tenant Status Changed",
        message: `${tenant.name} status changed to ${newStatus}`,
        severity: newStatus === "suspended" ? "warning" : "info",
      });
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
      plan: tenant.plan,
    });
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
      plan: dbFormData.plan,
    });

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
        severity: "warning",
      });
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
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tenantId: tenant.id }),
        }
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
        severity: "success",
      });
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to resend invitation", { id: "resend-invitation" });
    }
  };


  return (
    <>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CurrencySelector />
          </div>
          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClear={clearNotifications}
          />
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
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
            title="Monthly Revenue"
            value={formatTotalRevenue()}
            icon={CreditCard}
            change={18}
            changeLabel="vs last month"
          />
          <StatCard
            title="Total Vehicles"
            value={totalVehicles}
            icon={Truck}
          />
        </div>

        {/* All Tenants */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                All Tenants
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchDbTenants()} disabled={isLoadingDbTenants}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingDbTenants ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" onClick={() => setIsWizardOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Onboard Tenant
                </Button>
              </div>
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
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
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
            ) : filteredDbTenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tenants found
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Org Type</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Vehicles</TableHead>
                      <TableHead>Drivers</TableHead>
                      <TableHead>Devices</TableHead>
                      <TableHead>SIMs</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
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
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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

      {/* Delete DB Tenant Confirmation */}
      <AlertDialog open={!!deleteConfirmDbTenant} onOpenChange={() => setDeleteConfirmDbTenant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmDbTenant?.name}"? This will permanently remove
              all their data including business information and documents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteDbTenant}
            >
              Delete Tenant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
