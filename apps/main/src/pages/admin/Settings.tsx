import type { OrganizationUser } from "@truckmoov/api/auth";
import type {
  FilterField, FilterValues,
} from "@/components/shadcn/table-toolbar";
import { useQuery } from "@tanstack/react-query";
import {
  getOrganizationUsersQueryOptions,

  useChangeRole,
  useDeleteOrganizationUser,
  useInviteUser,
  useResendOrgInvite,
  UserRole,
  useUpdateOrganizationUser,
  useUpdateOrganizationUserStatus,
} from "@truckmoov/api/auth";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  BarChart3, Bell, Bot, Building2, CheckCircle,
  Clock, CreditCard, FileCheck, HardDrive, Mail, MapPin, MoreHorizontal,
  Palette, Pencil, Phone, Plug, Plus, Receipt, Trash2, UserCheck, Users, UserX,
  Wrench, XCircle,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { SubscriptionInvoicesPanel } from "@/components/billing/SubscriptionInvoicesPanel";
import { MaintenanceConfigPanel } from "@/components/fleet/MaintenanceConfigPanel";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { TenantKYCVerification } from "@/components/platform/TenantKYCVerification";
import { AccountingIntegrationPanel } from "@/components/settings/AccountingIntegrationPanel";
import { AIUsageAnalyticsPanel } from "@/components/settings/AIUsageAnalyticsPanel";
import { NotificationPreferencesPanel } from "@/components/settings/NotificationPreferencesPanel";
import { OrganizationSettingsForm } from "@/components/settings/OrganizationSettingsForm";
import { RolePermissionsMatrix } from "@/components/settings/RolePermissionsMatrix";
import { StoragePanel } from "@/components/settings/StoragePanel";
import { TenantAIConfigPanel } from "@/components/settings/TenantAIConfigPanel";
import { TenantBrandingPanel } from "@/components/settings/TenantBrandingPanel";
import { TenantCommunicationSettings } from "@/components/settings/TenantCommunicationSettings";
import { TenantInvoiceConfigPanel } from "@/components/settings/TenantInvoiceConfigPanel";
import { TenantSubscriptionCard } from "@/components/settings/TenantSubscriptionCard";
import {
  Avatar, AvatarFallback,
} from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
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
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { getRoleLabel } from "@/features/auth/utils/role-label";
import { useAuthStore } from "@/stores/authStore";

type RoleOption = {
  value: UserRole; label: string;
};

/** The standard team roles a fleet or enterprise admin can hand out. */
const TEAM_ROLES: RoleOption[] = [
  {
    value: UserRole.OPERATIONS_MANAGER, label: "Operations Manager - Run day-to-day operations",
  },
  {
    value: UserRole.DISPATCHER, label: "Dispatcher - Assign jobs & track drivers",
  },
  {
    value: UserRole.FINANCE_VIEWER, label: "Finance Viewer - Billing, invoices & wallet",
  },
];

/**
 * Who each admin role may invite. `/settings` is admin-only (see sidebarConfig),
 * so the signed-in role is the whole org context — no separate org-type axis.
 * OWNER_OPERATOR is absent: those accounts are single-user.
 *
 * ponytail: the old "Maintenance Supervisor" and "Analyst" options are gone —
 * the backend has no matching role, so those invites silently landed as
 * something else. Add them back when `UserRole` gains SUPERVISOR / ANALYST.
 */
const INVITE_ROLES_BY_ADMIN_ROLE: Partial<Record<UserRole, RoleOption[]>> = {
  ENTERPRISE_ADMIN: TEAM_ROLES,
  FLEET_ADMIN: TEAM_ROLES,
  AGGREGATOR_ADMIN: [
    {
      value: UserRole.OPERATIONS_MANAGER, label: "Operations Manager - Cross-fleet coordination",
    },
    {
      value: UserRole.FINANCE_VIEWER, label: "Finance Viewer - Reporting & insights",
    },
  ],
};

type TenantUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  lastActive: string;
  accountStatus: string;
};

export default function Settings() {
  const { user } = useAuthStore();
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "organization";
  const [
    activeTab,
    setActiveTab,
  ] = useState(tabFromUrl);

  // Sync tab with URL
  useEffect(
    () => {
      if (tabFromUrl !== activeTab) {
        setActiveTab(tabFromUrl);
      }
    },
    [
      activeTab,
      tabFromUrl,
    ],
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };
  // ponytail: the signed-in role IS the org context here — /settings is admin-only
  // and each admin role maps 1:1 to an org type, so there is nothing to look up.
  const currentRole = user?.role;
  const inviteRoleOptions = (currentRole && INVITE_ROLES_BY_ADMIN_ROLE[currentRole]) || [];
  const canInviteUsers = inviteRoleOptions.length > 0;
  const defaultInviteRole: UserRole = inviteRoleOptions[0]?.value ?? UserRole.FINANCE_VIEWER;

  const [
    isInviteDialogOpen,
    setIsInviteDialogOpen,
  ] = useState(false);
  const [
    inviteEmail,
    setInviteEmail,
  ] = useState("");
  const [
    inviteRole,
    setInviteRole,
  ] = useState(defaultInviteRole);

  // Keep inviteRole valid when the signed-in role changes
  useEffect(
    () => {
      if (!inviteRoleOptions.some(r => r.value === inviteRole)) {
        setInviteRole(defaultInviteRole);
      }
    },
    [currentRole],
  );
  const [_showApiKey] = useState(false);
  // Edit user state
  const [
    isEditDialogOpen,
    setIsEditDialogOpen,
  ] = useState(false);
  const [
    editingUser,
    setEditingUser,
  ] = useState<TenantUser | null>(null);
  const [
    editName,
    setEditName,
  ] = useState("");
  const [
    editRole,
    setEditRole,
  ] = useState<UserRole>(UserRole.FINANCE_VIEWER);

  /**
   * Roles offered when editing a member: the signed-in admin's own role + the
   * invitable roles, plus the member's current role so it always has a matching
   * option. The admin entry is omitted for anyone who can't invite, so a
   * non-admin reaching this page doesn't see e.g. "Dispatcher - Full access".
   */
  const editRoleOptions: RoleOption[] = [
    ...(canInviteUsers && currentRole
      ? [
          {
            value: currentRole, label: `${getRoleLabel(currentRole)} - Full access`,
          },
        ]
      : []),
    ...inviteRoleOptions,
  ];
  if (!editRoleOptions.some(o => o.value === editRole)) {
    editRoleOptions.push({
      value: editRole, label: getRoleLabel(editRole),
    });
  }

  // Remove user state
  const [
    isRemoveDialogOpen,
    setIsRemoveDialogOpen,
  ] = useState(false);
  const [
    removingUser,
    setRemovingUser,
  ] = useState<TenantUser | null>(null);

  const organizationUsersQuery = useQuery({
    ...getOrganizationUsersQueryOptions(),
    enabled: activeTab === "users",
  });
  const inviteUserMutation = useInviteUser();
  const updateUserMutation = useUpdateOrganizationUser();
  const changeRoleMutation = useChangeRole();
  const deleteUserMutation = useDeleteOrganizationUser();
  const updateStatusMutation = useUpdateOrganizationUserStatus();
  const resendInviteMutation = useResendOrgInvite();

  const tenantUsers: TenantUser[] = (organizationUsersQuery.data?.data.users ?? []).map(
    (organizationUser: OrganizationUser) => ({
      id: organizationUser.userId,
      name: organizationUser.profile?.fullName || organizationUser.email,
      email: organizationUser.email,
      role: organizationUser.role,
      status:
        organizationUser.accountStatus === "disabled"
          ? "disabled"
          : organizationUser.status,
      lastActive: formatRelative(
        organizationUser.lastActiveAt,
        "Never",
      ),
      accountStatus: organizationUser.accountStatus,
    }),
  );
  const isLoadingUsers = organizationUsersQuery.isLoading;
  const isInviting = inviteUserMutation.isPending;
  const isUpdatingUser = updateUserMutation.isPending || changeRoleMutation.isPending;
  const isRemovingUser = deleteUserMutation.isPending;

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }
    inviteUserMutation.mutate(
      {
        data: {
          email: inviteEmail.trim(),
          role: inviteRole,
        },
      },
      {
        onSuccess: () => {
          toast.success("Invitation sent");
          setInviteEmail("");
          setIsInviteDialogOpen(false);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  // Open edit dialog for a user
  const handleEditUser = (tenantUser: TenantUser) => {
    setEditingUser(tenantUser);
    setEditName(tenantUser.name);
    setEditRole(tenantUser.role);
    setIsEditDialogOpen(true);
  };

  // Save user changes
  const handleSaveUser = async () => {
    if (!editingUser)
      return;
    const nextRole = editRole;
    const currentRole = editingUser.role;

    try {
      const updates: Promise<unknown>[] = [];
      if (editName.trim() !== editingUser.name) {
        updates.push(
          updateUserMutation.mutateAsync({
            id: editingUser.id,
            data: { fullName: editName.trim() },
          }),
        );
      }
      if (nextRole !== currentRole) {
        updates.push(
          changeRoleMutation.mutateAsync({
            data: {
              targetUserId: editingUser.id, newRole: nextRole,
            },
          }),
        );
      }
      await Promise.all(updates);
      toast.success(updates.length ? "User updated" : "No changes to save");
      setIsEditDialogOpen(false);
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update user");
    }
  };

  // Open remove confirmation dialog
  const handleOpenRemoveDialog = (tenantUser: TenantUser) => {
    setRemovingUser(tenantUser);
    setIsRemoveDialogOpen(true);
  };

  // Remove user
  const handleRemoveUser = async () => {
    if (!removingUser)
      return;
    deleteUserMutation.mutate(
      { id: removingUser.id },
      {
        onSuccess: () => {
          toast.success("User removed");
          setIsRemoveDialogOpen(false);
          setRemovingUser(null);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleToggleUserStatus = (tenantUser: TenantUser) => {
    const accountStatus = tenantUser.accountStatus === "disabled" ? "enabled" : "disabled";
    updateStatusMutation.mutate(
      {
        id: tenantUser.id, data: { accountStatus },
      },
      {
        onSuccess: () => toast.success(`User ${accountStatus}`),
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleResendInvite = (tenantUser: TenantUser) => {
    resendInviteMutation.mutate(
      { data: { email: tenantUser.email } },
      {
        onSuccess: () => toast.success("Invitation resent"),
        onError: error => toast.error(error.message),
      },
    );
  };

  const roleColors: Partial<Record<UserRole, string>> = {
    SUPER_ADMIN: "bg-primary/20 text-primary border-primary/30",
    SYSTEM_ADMIN: "bg-primary/20 text-primary border-primary/30",
    PLATFORM_ADMIN: "bg-primary/20 text-primary border-primary/30",
    ENTERPRISE_ADMIN: "bg-primary/20 text-primary border-primary/30",
    FLEET_ADMIN: "bg-primary/20 text-primary border-primary/30",
    AGGREGATOR_ADMIN: "bg-primary/20 text-primary border-primary/30",
    OWNER_OPERATOR: "bg-primary/20 text-primary border-primary/30",
    OPERATIONS_MANAGER: "bg-accent/20 text-accent border-accent/30",
    DISPATCHER: "bg-success/20 text-success border-success/30",
    FINANCE_VIEWER: "bg-muted text-muted-foreground border-muted",
  };

  const statusColors: Record<string, string> = {
    active: "bg-success/20 text-success border-success/30",
    invited: "bg-warning/20 text-warning border-warning/30",
    suspended: "bg-destructive/20 text-destructive border-destructive/30",
    disabled: "bg-destructive/20 text-destructive border-destructive/30",
  };

  // Team members table toolbar state
  const [
    teamSearch,
    setTeamSearch,
  ] = useState("");
  const [
    teamStatus,
    setTeamStatus,
  ] = useState("all");
  const [
    teamFilters,
    setTeamFilters,
  ] = useState<FilterValues>({});

  const teamFilterFields: FilterField[] = [
    {
      type: "select",
      key: "role",
      label: "Role",
      // ponytail: offer only the roles actually present in this org
      options: [...new Set(tenantUsers.map(u => u.role))].map(role => ({
        value: role,
        label: getRoleLabel(role),
      })),
    },
    {
      type: "select",
      key: "lastActive",
      label: "Last Active",
      options: [
        {
          value: "today", label: "Today",
        },
        {
          value: "week", label: "This week",
        },
        {
          value: "older", label: "Older",
        },
      ],
    },
  ];

  const filteredTenantUsers = tenantUsers.filter((u) => {
    const q = teamSearch.trim().toLowerCase();
    if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q))
      return false;
    if (teamStatus !== "all" && u.status !== teamStatus)
      return false;
    const roleF = teamFilters.role;
    if (roleF?.enabled && roleF.value && u.role !== roleF.value)
      return false;
    const laF = teamFilters.lastActive;
    if (laF?.enabled && laF.value) {
      const la = (u.lastActive || "").toLowerCase();
      const isToday = /min|hour|today/.test(la);
      const isWeek = isToday || /day|yesterday/.test(la);
      if (laF.value === "today" && !isToday)
        return false;
      if (laF.value === "week" && !isWeek)
        return false;
      if (laF.value === "older" && isWeek)
        return false;
    }
    return true;
  });

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="space-y-6"
    >
      <TabsList className="bg-muted/50 flex flex-wrap gap-1 h-auto p-1">
        <TabsTrigger
          value="organization"
          className="flex items-center gap-2"
        >
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Organization</span>
        </TabsTrigger>
        <TabsTrigger
          value="subscription"
          className="flex items-center gap-2"
        >
          <CreditCard className="h-4 w-4" />
          <span className="hidden sm:inline">Subscription</span>
        </TabsTrigger>
        <TabsTrigger
          value="storage"
          className="flex items-center gap-2"
        >
          <HardDrive className="h-4 w-4" />
          <span className="hidden sm:inline">Storage</span>
        </TabsTrigger>
        <TabsTrigger
          value="invoicing"
          className="flex items-center gap-2"
        >
          <Receipt className="h-4 w-4" />
          <span className="hidden sm:inline">Invoicing</span>
        </TabsTrigger>
        <TabsTrigger
          value="kyc"
          className="flex items-center gap-2"
        >
          <FileCheck className="h-4 w-4" />
          <span className="hidden sm:inline">KYC</span>
        </TabsTrigger>
        <TabsTrigger
          value="fleet"
          className="flex items-center gap-2"
        >
          <Wrench className="h-4 w-4" />
          <span className="hidden sm:inline">Fleet</span>
        </TabsTrigger>
        <TabsTrigger
          value="ai"
          className="flex items-center gap-2"
        >
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">AI Matching</span>
        </TabsTrigger>
        <TabsTrigger
          value="ai-usage"
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">AI Usage</span>
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className="flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications</span>
        </TabsTrigger>
        <TabsTrigger
          value="communication"
          className="flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Communication</span>
        </TabsTrigger>
        <TabsTrigger
          value="users"
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Users</span>
        </TabsTrigger>
        <TabsTrigger
          value="branding"
          className="flex items-center gap-2"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Branding</span>
        </TabsTrigger>
        <TabsTrigger
          value="integrations"
          className="flex items-center gap-2"
        >
          <Plug className="h-4 w-4" />
          <span className="hidden sm:inline">Connections</span>
        </TabsTrigger>
      </TabsList>

      {/* Organization Tab */}
      <TabsContent
        value="organization"
        className="space-y-6"
      >
        <OrganizationSettingsForm />
      </TabsContent>

      {/* KYC Verification Tab */}
      <TabsContent
        value="kyc"
        className="space-y-6"
      >
        <TenantKYCVerification tenantId={user?.tenantId || ""} />
      </TabsContent>

      <TabsContent
        value="invoicing"
        className="space-y-6"
      >
        <TenantInvoiceConfigPanel />
      </TabsContent>

      {/* Fleet Tab */}
      <TabsContent
        value="fleet"
        className="space-y-6"
      >
        <MaintenanceConfigPanel />
      </TabsContent>

      {/* AI Matching Tab */}
      <TabsContent
        value="ai"
        className="space-y-6"
      >
        <TenantAIConfigPanel tenantId={user?.tenantId || ""} />
      </TabsContent>

      {/* AI Usage Tab */}
      <TabsContent
        value="ai-usage"
        className="space-y-6"
      >
        <AIUsageAnalyticsPanel />
      </TabsContent>

      {/* Notifications Tab */}
      <TabsContent
        value="notifications"
        className="space-y-6"
      >
        <NotificationPreferencesPanel />
      </TabsContent>

      {/* Communication Settings Tab */}
      <TabsContent
        value="communication"
        className="space-y-6"
      >
        <TenantCommunicationSettings />
      </TabsContent>

      {/* Users Tab */}
      <TabsContent
        value="users"
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Team Members</h3>
            <p className="text-sm text-muted-foreground">Manage who has access to your organization</p>
          </div>
          {canInviteUsers
            ? (
                <Dialog
                  open={isInviteDialogOpen}
                  onOpenChange={setIsInviteDialogOpen}
                >
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
                          onChange={e => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inviteRole">Role</Label>
                        <Select
                          value={inviteRole}
                          onValueChange={v => setInviteRole(v as UserRole)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {inviteRoleOptions.map(opt => (
                              <SelectItem
                                key={opt.value}
                                value={opt.value}
                              >
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsInviteDialogOpen(false)}
                        disabled={isInviting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="gradient"
                        onClick={handleInviteUser}
                        disabled={isInviting}
                      >
                        {isInviting ? "Sending..." : "Send Invitation"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )
            : (
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
                {
                  value: "all", label: "All statuses",
                },
                {
                  value: "active", label: "Active",
                },
                {
                  value: "invited", label: "Invited",
                },
                {
                  value: "disabled", label: "Disabled",
                },
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
              {isLoadingUsers
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Loading users...
                      </TableCell>
                    </TableRow>
                  )
                : organizationUsersQuery.isError
                  ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8"
                        >
                          <p className="text-destructive">Unable to load team members.</p>
                          <Button
                            variant="link"
                            className="mt-1"
                            onClick={() => organizationUsersQuery.refetch()}
                          >
                            Try again
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  : filteredTenantUsers.length === 0
                    ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-muted-foreground"
                          >
                            {tenantUsers.length === 0 ? "No team members yet. Invite someone to get started." : "No team members match your filters."}
                          </TableCell>
                        </TableRow>
                      )
                    : filteredTenantUsers.map(tenantUser => (
                        <TableRow
                          key={tenantUser.id}
                          className="border-border/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xs">
                                  {getInitials(tenantUser.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{tenantUser.name}</p>
                                <p className="text-sm text-muted-foreground">{tenantUser.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={roleColors[tenantUser.role]}>
                              {getRoleLabel(tenantUser.role)}
                            </Badge>
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditUser(tenantUser)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                {tenantUser.status === "invited" && (
                                  <DropdownMenuItem
                                    onClick={() => handleResendInvite(tenantUser)}
                                    disabled={resendInviteMutation.isPending}
                                  >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Resend Invite
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleToggleUserStatus(tenantUser)}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  {tenantUser.accountStatus === "disabled"
                                    ? (
                                        <UserCheck className="h-4 w-4 mr-2" />
                                      )
                                    : (
                                        <UserX className="h-4 w-4 mr-2" />
                                      )}
                                  {tenantUser.accountStatus === "disabled" ? "Enable User" : "Disable User"}
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
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        >
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
                  onChange={e => setEditName(e.target.value)}
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
                <Select
                  value={editRole}
                  onValueChange={v => setEditRole(v as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {editRoleOptions.map(opt => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdatingUser}
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                onClick={handleSaveUser}
                disabled={isUpdatingUser}
              >
                {isUpdatingUser ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Remove User Confirmation Dialog */}
        <Dialog
          open={isRemoveDialogOpen}
          onOpenChange={setIsRemoveDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove User</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove
                {" "}
                {removingUser?.name}
                {" "}
                from your organization?
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

      {/* Branding Tab */}
      <TabsContent
        value="branding"
        className="space-y-6"
      >
        <TenantBrandingPanel />
      </TabsContent>

      {/* Integrations Tab - External Services */}
      <TabsContent
        value="integrations"
        className="space-y-6"
      >
        {/* Accounting Integration */}
        <AccountingIntegrationPanel />

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Connected Services</CardTitle>
            <CardDescription>Manage third-party integrations and external services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                id: "whatsapp", name: "WhatsApp Business", icon: WhatsAppIcon, connected: true, description: "Send messages and notifications via WhatsApp",
              },
              {
                id: "sms", name: "SMS Gateway", icon: Phone, connected: true, description: "Send SMS notifications to drivers",
              },
              {
                id: "gmail", name: "Gmail", icon: Mail, connected: false, description: "Send emails using your Gmail account",
              },
              {
                id: "outlook", name: "Outlook", icon: Mail, connected: false, description: "Send emails using Microsoft Outlook",
              },
              {
                id: "maps", name: "Google Maps", icon: MapPin, connected: true, description: "Route optimization and live tracking",
              },
            ].map(integration => (
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
                      {integration.connected
                        ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )
                        : (
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
      <TabsContent
        value="subscription"
        className="space-y-6"
      >
        <Tabs
          defaultValue="plan"
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="plan">Subscription</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>
          <TabsContent
            value="plan"
            className="space-y-6"
          >
            <TenantSubscriptionCard />
          </TabsContent>
          <TabsContent
            value="invoices"
            className="space-y-6"
          >
            <SubscriptionInvoicesPanel />
          </TabsContent>
        </Tabs>
      </TabsContent>

      {/* Storage Tab */}
      <TabsContent
        value="storage"
        className="space-y-6"
      >
        <StoragePanel />
      </TabsContent>

    </Tabs>
  );
}
