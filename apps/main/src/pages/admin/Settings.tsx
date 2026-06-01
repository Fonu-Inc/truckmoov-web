import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Switch } from "@/components/shadcn/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn/avatar";
import { Separator } from "@/components/shadcn/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import { 
  Building2, Bell, Users, Plug, Save, Upload, Plus,
  MoreHorizontal, Pencil, Trash2, Mail, Phone, Clock, MapPin,
  CheckCircle, XCircle, FileCheck, Bot, Wrench, CreditCard, BarChart3, Palette, Receipt, HardDrive
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { toast } from "sonner";
import { TenantKYCVerification } from "@/components/platform/TenantKYCVerification";
import { TenantAIConfigPanel } from "@/components/settings/TenantAIConfigPanel";
import { AIUsageAnalyticsPanel } from "@/components/settings/AIUsageAnalyticsPanel";
import { MaintenanceConfigPanel } from "@/components/fleet/MaintenanceConfigPanel";
import { AccountingIntegrationPanel } from "@/components/settings/AccountingIntegrationPanel";
import { TenantSubscriptionCard } from "@/components/settings/TenantSubscriptionCard";
import { StoragePanel } from "@/components/settings/StoragePanel";
import { SubscriptionInvoicesPanel } from "@/components/billing/SubscriptionInvoicesPanel";
import { TenantCommunicationSettings } from "@/components/settings/TenantCommunicationSettings";
import { TenantBrandingPanel } from "@/components/settings/TenantBrandingPanel";
import { RolePermissionsMatrix } from "@/components/settings/RolePermissionsMatrix";
import { TableToolbar, type FilterField, type FilterValues } from "@/components/shadcn/table-toolbar";
import { TenantInvoiceConfigPanel } from "@/components/settings/TenantInvoiceConfigPanel";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/hooks/useOrgContext";
import { useActiveOrgStore } from "@/stores/activeOrgStore";

/** Invite role options scoped per organization type. */
const INVITE_ROLES_BY_ORG_TYPE: Record<
  string,
  Array<{ value: string; label: string }>
> = {
  ENTERPRISE: [
    { value: "operations_manager", label: "Operations Manager - Run day-to-day operations" },
    { value: "finance", label: "Finance Officer - Billing, invoices & wallet" },
    { value: "viewer", label: "Viewer - Read-only access" },
  ],
  FLEET_PROVIDER: [
    { value: "operations_manager", label: "Operations Manager - Run day-to-day operations" },
    { value: "dispatcher", label: "Dispatcher - Assign jobs & track drivers" },
    { value: "finance", label: "Finance Officer - Billing, invoices & wallet" },
    { value: "maintenance_supervisor", label: "Maintenance Supervisor - Vehicle service & repairs" },
  ],
  AGGREGATOR: [
    { value: "operations_manager", label: "Operations Manager - Cross-fleet coordination" },
    { value: "analyst", label: "Analyst - Reporting & insights" },
  ],
  OWNER_OPERATOR: [],
};

/** Map invite UI role -> DB role enum. */
const INVITE_ROLE_TO_DB: Record<string, string> = {
  operations_manager: "operations_manager",
  dispatcher: "dispatcher",
  finance: "viewer_finance",
  viewer: "viewer_finance",
  maintenance_supervisor: "supervisor",
  analyst: "viewer_finance",
};

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
}

export default function Settings() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "organization";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Sync tab with URL
  useEffect(() => {
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };
  const [orgName, setOrgName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgBillingEmail, setOrgBillingEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgTimezone, setOrgTimezone] = useState("Africa/Lagos");
  const [orgLanguage, setOrgLanguage] = useState("en");
  const { memberships } = useOrgContext();
  const { resolveActiveOrg } = useActiveOrgStore();
  const activeOrg = resolveActiveOrg(memberships);
  const activeOrgType = activeOrg?.orgType || "FLEET_PROVIDER";
  const inviteRoleOptions = INVITE_ROLES_BY_ORG_TYPE[activeOrgType] ?? [];
  const canInviteUsers = inviteRoleOptions.length > 0;
  const defaultInviteRole = inviteRoleOptions[0]?.value ?? "viewer";

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState(defaultInviteRole);

  // Keep inviteRole valid when the active org type changes
  useEffect(() => {
    if (!inviteRoleOptions.find((r) => r.value === inviteRole)) {
      setInviteRole(defaultInviteRole);
    }
  }, [activeOrgType]); // eslint-disable-line react-hooks/exhaustive-deps
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  // Edit user state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  
  // Remove user state
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [removingUser, setRemovingUser] = useState<TenantUser | null>(null);
  const [isRemovingUser, setIsRemovingUser] = useState(false);

  // Map database roles to display roles
  const roleDisplayMap: Record<string, string> = {
    tenant_admin: "admin",
    operations_manager: "manager",
    supervisor: "supervisor",
    dispatcher: "dispatcher",
    viewer_finance: "viewer",
    platform_admin: "admin",
    driver: "driver",
  };

  // Fetch tenant data on mount
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!user?.tenantId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', user.tenantId)
          .single();

        if (error) throw error;

        if (data) {
          setOrgName(data.name || '');
          setOrgEmail(data.email || '');
          setOrgPhone(data.phone || '');
          setOrgAddress(data.address || '');
        }
      } catch (error) {
        console.error('Error fetching tenant:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, [user?.tenantId]);

  // Demo tenant ID for Lagos Express Logistics
  const DEMO_TENANT_ID = 'f7f5af88-fd76-4439-aae3-0461be52f63f';
  
  // Demo users for Lagos Express Logistics
  const demoUsers: TenantUser[] = [
    { id: '1', name: 'Olumide Adeyemi', email: 'olumide@lagosexpresslogistics.ng', role: 'admin', status: 'active', lastActive: '5 min ago' },
    { id: '2', name: 'Adebayo Ogundimu', email: 'adebayo@lagosexpresslogistics.ng', role: 'manager', status: 'active', lastActive: '1 hour ago' },
    { id: '3', name: 'Chidinma Okonkwo', email: 'chidinma@lagosexpresslogistics.ng', role: 'supervisor', status: 'active', lastActive: '2 hours ago' },
    { id: '4', name: 'Emeka Nwosu', email: 'emeka@lagosexpresslogistics.ng', role: 'dispatcher', status: 'active', lastActive: '30 min ago' },
    { id: '5', name: 'Ngozi Eze', email: 'ngozi@lagosexpresslogistics.ng', role: 'viewer', status: 'active', lastActive: 'Yesterday' },
  ];

  // Fetch tenant users
  useEffect(() => {
    const fetchTenantUsers = async () => {
      if (!user?.tenantId) {
        console.log('No tenant ID, skipping user fetch');
        setIsLoadingUsers(false);
        return;
      }

      console.log('Fetching users for tenant:', user.tenantId);
      try {
        // Fetch profiles for this tenant
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .eq('tenant_id', user.tenantId);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }
        console.log('Fetched profiles:', profiles);

        // If no profiles found and this is the demo tenant, use demo data
        if ((!profiles || profiles.length === 0) && user.tenantId === DEMO_TENANT_ID) {
          console.log('Using demo users for demo tenant');
          setTenantUsers(demoUsers);
          setIsLoadingUsers(false);
          return;
        }

        if (!profiles || profiles.length === 0) {
          console.log('No profiles found');
          setTenantUsers([]);
          setIsLoadingUsers(false);
          return;
        }

        // Fetch roles for these users
        const userIds = profiles.map(p => p.user_id);
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        if (rolesError) throw rolesError;

        // Combine profiles with roles
        const users: TenantUser[] = profiles.map(profile => {
          const userRole = roles?.find(r => r.user_id === profile.user_id);
          const displayRole = roleDisplayMap[userRole?.role || 'viewer_finance'] || 'viewer';
          
          return {
            id: profile.user_id,
            name: profile.full_name || 'Unknown',
            email: profile.email,
            role: displayRole,
            status: 'active',
            lastActive: 'Recently',
          };
        });

        setTenantUsers(users);
      } catch (error) {
        console.error('Error fetching tenant users:', error);
        // Fallback to demo users for demo tenant on error
        if (user.tenantId === DEMO_TENANT_ID) {
          setTenantUsers(demoUsers);
        } else {
          setTenantUsers([]);
        }
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchTenantUsers();
  }, [user?.tenantId]);

  const [notifications, setNotifications] = useState({
    jobAssignment: true,
    jobCompletion: true,
    driverAlerts: true,
    maintenanceReminders: true,
    fuelAlerts: false,
    geofenceAlerts: true,
    emailDigest: true,
    smsAlerts: false,
    pushNotifications: true,
  });

  const handleSaveOrganization = () => {
    toast.success("Organization settings saved successfully");
  };

  const [isInviting, setIsInviting] = useState(false);

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }

    const dbRole = INVITE_ROLE_TO_DB[inviteRole] || "viewer_finance";

    setIsInviting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("user-invitation", {
        body: {
          email: inviteEmail,
          role: dbRole,
          inviterName: user?.name,
          organizationName: orgName || "Lagos Express Logistics",
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send invitation");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success("Invitation Sent!", {
        description: `An invitation email has been sent to ${inviteEmail}`,
      });
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole(defaultInviteRole);
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleToggleIntegration = (integrationId: string) => {
    toast.success("Integration settings updated");
  };

  // Open edit dialog for a user
  const handleEditUser = (tenantUser: TenantUser) => {
    setEditingUser(tenantUser);
    setEditName(tenantUser.name);
    // Map display role back to select value
    const reverseRoleMap: Record<string, string> = {
      admin: "admin",
      manager: "manager",
      supervisor: "supervisor",
      dispatcher: "dispatcher",
      viewer: "viewer",
    };
    setEditRole(reverseRoleMap[tenantUser.role] || "viewer");
    setIsEditDialogOpen(true);
  };

  // Save user changes
  const handleSaveUser = async () => {
    if (!editingUser) return;

    // Check if this is a demo user (demo users have string IDs like '1', '2', etc.)
    const isDemoUser = editingUser.id.length < 10;
    
    if (isDemoUser) {
      // For demo users, just update local state
      setTenantUsers(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { ...u, name: editName, role: editRole }
          : u
      ));
      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      setEditingUser(null);
      return;
    }

    setIsUpdatingUser(true);
    try {
      console.log('Updating user:', editingUser.id, 'Name:', editName, 'Role:', editRole);
      
      // Update profile name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: editName, updated_at: new Date().toISOString() })
        .eq('user_id', editingUser.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }
      console.log('Profile updated successfully');

      // Map UI role to database role
      const roleMapping: Record<string, string> = {
        admin: "tenant_admin",
        manager: "operations_manager",
        supervisor: "supervisor",
        dispatcher: "dispatcher",
        viewer: "viewer_finance",
      };
      const dbRole = roleMapping[editRole] || "supervisor";
      console.log('Mapped role:', editRole, '->', dbRole);

      // First, check if user has an existing role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id, role')
        .eq('user_id', editingUser.id)
        .maybeSingle();

      console.log('Existing role:', existingRole);

      if (existingRole) {
        // Update existing role
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: dbRole as "tenant_admin" | "operations_manager" | "supervisor" | "dispatcher" | "viewer_finance" | "platform_admin" })
          .eq('user_id', editingUser.id);

        if (roleError) {
          console.error('Role update error:', roleError);
          throw roleError;
        }
        console.log('Role updated successfully');
      } else {
        // Insert new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: editingUser.id, 
            role: dbRole as "tenant_admin" | "operations_manager" | "supervisor" | "dispatcher" | "viewer_finance" | "platform_admin"
          });

        if (roleError) {
          console.error('Role insert error:', roleError);
          throw roleError;
        }
        console.log('Role inserted successfully');
      }

      // Update local state
      setTenantUsers(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { ...u, name: editName, role: editRole }
          : u
      ));

      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Open remove confirmation dialog
  const handleOpenRemoveDialog = (tenantUser: TenantUser) => {
    setRemovingUser(tenantUser);
    setIsRemoveDialogOpen(true);
  };

  // Remove user
  const handleRemoveUser = async () => {
    if (!removingUser) return;
    
    // Check if this is a demo user
    const isDemoUser = removingUser.id.length < 10;
    
    if (isDemoUser) {
      setTenantUsers(prev => prev.filter(u => u.id !== removingUser.id));
      toast.success("User removed successfully");
      setIsRemoveDialogOpen(false);
      setRemovingUser(null);
      return;
    }

    console.log('Removing user:', removingUser.id, removingUser.name);
    setIsRemovingUser(true);
    try {
      // Remove user role (may not exist)
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', removingUser.id);

      // Role deletion might fail if no role exists - that's ok
      if (roleError) {
        console.warn('Role deletion warning (may not exist):', roleError);
      } else {
        console.log('Role deleted successfully');
      }

      // Unlink user from tenant (don't delete profile, just remove tenant association)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ tenant_id: null, updated_at: new Date().toISOString() })
        .eq('user_id', removingUser.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }
      console.log('User unlinked from tenant successfully');

      setTenantUsers(prev => prev.filter(u => u.id !== removingUser.id));
      toast.success("User removed from organization");
      setIsRemoveDialogOpen(false);
      setRemovingUser(null);
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast.error("Failed to remove user", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsRemovingUser(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText("tm_live_sk_xxxxxxxxxxxxxxxxxxxx");
    toast.success("API key copied to clipboard");
  };

  const roleColors: Record<string, string> = {
    admin: "bg-primary/20 text-primary border-primary/30",
    manager: "bg-accent/20 text-accent border-accent/30",
    supervisor: "bg-warning/20 text-warning border-warning/30",
    dispatcher: "bg-success/20 text-success border-success/30",
    viewer: "bg-muted text-muted-foreground border-muted",
  };

  const statusColors: Record<string, string> = {
    active: "bg-success/20 text-success border-success/30",
    invited: "bg-warning/20 text-warning border-warning/30",
    suspended: "bg-destructive/20 text-destructive border-destructive/30",
  };

  // Team members table toolbar state
  const [teamSearch, setTeamSearch] = useState("");
  const [teamStatus, setTeamStatus] = useState("all");
  const [teamFilters, setTeamFilters] = useState<FilterValues>({});

  const teamFilterFields: FilterField[] = [
    {
      type: "select",
      key: "role",
      label: "Role",
      options: [
        { value: "admin", label: "Admin" },
        { value: "manager", label: "Manager" },
        { value: "supervisor", label: "Supervisor" },
        { value: "dispatcher", label: "Dispatcher" },
        { value: "viewer", label: "Viewer" },
      ],
    },
    {
      type: "select",
      key: "lastActive",
      label: "Last Active",
      options: [
        { value: "today", label: "Today" },
        { value: "week", label: "This week" },
        { value: "older", label: "Older" },
      ],
    },
  ];

  const filteredTenantUsers = tenantUsers.filter((u) => {
    const q = teamSearch.trim().toLowerCase();
    if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q)) return false;
    if (teamStatus !== "all" && u.status !== teamStatus) return false;
    const roleF = teamFilters.role;
    if (roleF?.enabled && roleF.value && u.role !== roleF.value) return false;
    const laF = teamFilters.lastActive;
    if (laF?.enabled && laF.value) {
      const la = (u.lastActive || "").toLowerCase();
      const isToday = /min|hour|today/.test(la);
      const isWeek = isToday || /day|yesterday/.test(la);
      if (laF.value === "today" && !isToday) return false;
      if (laF.value === "week" && !isWeek) return false;
      if (laF.value === "older" && isWeek) return false;
    }
    return true;
  });

  return (
    <DashboardLayout title="Settings">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted/50 flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organization</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Subscription</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            <span className="hidden sm:inline">Storage</span>
          </TabsTrigger>
          <TabsTrigger value="invoicing" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Invoicing</span>
          </TabsTrigger>
          <TabsTrigger value="kyc" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">KYC</span>
          </TabsTrigger>
          <TabsTrigger value="fleet" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Fleet</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">AI Matching</span>
          </TabsTrigger>
          <TabsTrigger value="ai-usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">AI Usage</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Communication</span>
          </TabsTrigger>
          {activeOrgType !== "OWNER_OPERATOR" && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Connections</span>
          </TabsTrigger>
        </TabsList>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>Manage your organization's information and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl">TM</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 2MB</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgEmail">Contact Email</Label>
                  <Input
                    id="orgEmail"
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgBillingEmail">Billing Email</Label>
                  <Input
                    id="orgBillingEmail"
                    type="email"
                    placeholder="billing@company.com"
                    value={orgBillingEmail}
                    onChange={(e) => setOrgBillingEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgPhone">Phone Number</Label>
                  <Input
                    id="orgPhone"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgTimezone">Timezone</Label>
                  <Select value={orgTimezone} onValueChange={setOrgTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Lagos">Africa/Lagos (WAT, GMT+1)</SelectItem>
                      <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgLanguage">Language</Label>
                  <Select value={orgLanguage} onValueChange={setOrgLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ha">Hausa</SelectItem>
                      <SelectItem value="yo">Yoruba</SelectItem>
                      <SelectItem value="ig">Igbo</SelectItem>
                      <SelectItem value="pcm">Nigerian Pidgin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="orgAddress">Address</Label>
                  <Textarea
                    id="orgAddress"
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    rows={2}
                  />
                </div>
                {/* US-E02-006 — Portal session timeout */}
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Portal Session Timeout</Label>
                  <Select defaultValue="60">
                    <SelectTrigger id="sessionTimeout">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Inactive users are signed out after this period. Applies to all team members.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="gradient" onClick={handleSaveOrganization}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* KYC Verification Tab */}
        <TabsContent value="kyc" className="space-y-6">
          <TenantKYCVerification tenantId={user?.tenantId || ''} />
        </TabsContent>

        <TabsContent value="invoicing" className="space-y-6">
          <TenantInvoiceConfigPanel />
        </TabsContent>

        {/* Fleet Tab */}
        <TabsContent value="fleet" className="space-y-6">
          <MaintenanceConfigPanel />
        </TabsContent>

        {/* AI Matching Tab */}
        <TabsContent value="ai" className="space-y-6">
          <TenantAIConfigPanel tenantId={user?.tenantId || ''} />
        </TabsContent>

        {/* AI Usage Tab */}
        <TabsContent value="ai-usage" className="space-y-6">
          <AIUsageAnalyticsPanel />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Alert Preferences</CardTitle>
              <CardDescription>Choose which events trigger notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "jobAssignment", label: "Job Assignments", description: "When new jobs are assigned to drivers" },
                { key: "jobCompletion", label: "Job Completions", description: "When jobs are marked as completed" },
                { key: "driverAlerts", label: "Driver Alerts", description: "SOS signals and emergency notifications" },
                { key: "maintenanceReminders", label: "Maintenance Reminders", description: "Upcoming vehicle maintenance schedules" },
                { key: "fuelAlerts", label: "Fuel Alerts", description: "Low fuel warnings and refueling events" },
                { key: "geofenceAlerts", label: "Geofence Alerts", description: "When vehicles enter or exit zones" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Delivery Channels</CardTitle>
              <CardDescription>How you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "emailDigest", label: "Email Digest", description: "Daily summary of all activities", icon: Mail },
                { key: "smsAlerts", label: "SMS Alerts", description: "Critical alerts via SMS", icon: Phone },
                { key: "pushNotifications", label: "Push Notifications", description: "Real-time browser notifications", icon: Bell },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication Settings Tab */}
        <TabsContent value="communication" className="space-y-6">
          <TenantCommunicationSettings />
        </TabsContent>

        {/* Users Tab */}
        {activeOrgType !== "OWNER_OPERATOR" && (
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Team Members</h3>
                <p className="text-sm text-muted-foreground">Manage who has access to your organization</p>
              </div>
              {canInviteUsers ? (
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="gradient">
                      <Plus className="h-4 w-4 mr-2" />
                      Invite User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>Send an invitation to join your organization</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="inviteEmail">Email Address</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          placeholder="colleague@company.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inviteRole">Role</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {inviteRoleOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={isInviting}>Cancel</Button>
                      <Button variant="gradient" onClick={handleInviteUser} disabled={isInviting}>
                        {isInviting ? "Sending..." : "Send Invitation"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Owner-operator accounts are single-user. Inviting additional team
                  members isn't available on this plan.
                </span>
              )}
            </div>

            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <TableToolbar
                  search={teamSearch}
                  onSearchChange={setTeamSearch}
                  searchPlaceholder="Search by name or email..."
                  status={teamStatus}
                  onStatusChange={setTeamStatus}
                  statusOptions={[
                    { value: "all", label: "All statuses" },
                    { value: "active", label: "Active" },
                    { value: "invited", label: "Invited" },
                    { value: "suspended", label: "Suspended" },
                  ]}
                  filterEntity="team members"
                  filterFields={teamFilterFields}
                  filterValues={teamFilters}
                  onFiltersApply={setTeamFilters}
                />
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredTenantUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {tenantUsers.length === 0 ? "No team members yet. Invite someone to get started." : "No team members match your filters."}
                      </TableCell>
                    </TableRow>
                  ) : filteredTenantUsers.map((tenantUser) => (
                    <TableRow key={tenantUser.id} className="border-border/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xs">
                              {tenantUser.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{tenantUser.name}</p>
                            <p className="text-sm text-muted-foreground">{tenantUser.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[tenantUser.role]}>{tenantUser.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[tenantUser.status]}>{tenantUser.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {tenantUser.lastActive}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(tenantUser)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Resend Invite
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleOpenRemoveDialog(tenantUser)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update user details and permissions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="editName">Full Name</Label>
                    <Input
                      id="editName"
                      placeholder="Enter full name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editEmail">Email</Label>
                    <Input
                      id="editEmail"
                      value={editingUser?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editRole">Role</Label>
                    <Select value={editRole} onValueChange={setEditRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin - Full access</SelectItem>
                        <SelectItem value="manager">Manager - Manage fleet & drivers</SelectItem>
                        <SelectItem value="supervisor">Supervisor - Monitor operations</SelectItem>
                        <SelectItem value="dispatcher">Dispatcher - Assign jobs</SelectItem>
                        <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdatingUser}>
                    Cancel
                  </Button>
                  <Button variant="gradient" onClick={handleSaveUser} disabled={isUpdatingUser}>
                    {isUpdatingUser ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Remove User Confirmation Dialog */}
            <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Remove User</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove {removingUser?.name} from your organization? 
                    They will lose access to all resources.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsRemoveDialogOpen(false);
                      setRemovingUser(null);
                    }} 
                    disabled={isRemovingUser}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleRemoveUser} 
                    disabled={isRemovingUser}
                  >
                    {isRemovingUser ? "Removing..." : "Remove User"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Role Permissions Summary — US-E02-002 */}
            <RolePermissionsMatrix />
          </TabsContent>
        )}

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <TenantBrandingPanel />
        </TabsContent>

        {/* Integrations Tab - External Services */}
        <TabsContent value="integrations" className="space-y-6">
          {/* Accounting Integration */}
          <AccountingIntegrationPanel />

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Connected Services</CardTitle>
              <CardDescription>Manage third-party integrations and external services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "whatsapp", name: "WhatsApp Business", icon: WhatsAppIcon, connected: true, description: "Send messages and notifications via WhatsApp" },
                { id: "sms", name: "SMS Gateway", icon: Phone, connected: true, description: "Send SMS notifications to drivers" },
                { id: "gmail", name: "Gmail", icon: Mail, connected: false, description: "Send emails using your Gmail account" },
                { id: "outlook", name: "Outlook", icon: Mail, connected: false, description: "Send emails using Microsoft Outlook" },
                { id: "maps", name: "Google Maps", icon: MapPin, connected: true, description: "Route optimization and live tracking" },
              ].map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${integration.connected ? "bg-primary/20" : "bg-muted"}`}>
                      <integration.icon className={`h-5 w-5 ${integration.connected ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{integration.name}</p>
                        {integration.connected ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  <Button
                    variant={integration.connected ? "outline" : "gradient"}
                    size="sm"
                    onClick={() => toast.success("Integration settings updated")}
                  >
                    {integration.connected ? "Configure" : "Connect"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <Tabs defaultValue="plan" className="space-y-4">
            <TabsList>
              <TabsTrigger value="plan">Subscription</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>
            <TabsContent value="plan" className="space-y-6">
              <TenantSubscriptionCard />
            </TabsContent>
            <TabsContent value="invoices" className="space-y-6">
              <SubscriptionInvoicesPanel />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-6">
          <StoragePanel />
        </TabsContent>

      </Tabs>
    </DashboardLayout>
  );
}
