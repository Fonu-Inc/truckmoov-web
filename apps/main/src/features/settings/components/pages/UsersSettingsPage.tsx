import type { ColumnDef } from "@tanstack/react-table";
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
import {
  debounce, getInitials,
} from "@truckmoov/app-core/utils/general-utils";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  Clock, Mail, MoreHorizontal, Pencil, Plus, Trash2, UserCheck, UserX,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import {
  Avatar, AvatarFallback,
} from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardHeader,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
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
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { getRoleLabel } from "@/features/auth/utils/role-label";
import { RolePermissionsMatrix } from "@/features/settings/components/ui/RolePermissionsMatrix";
import { canManageOrganizationUsers } from "@/features/settings/utils/userManagementPermissions";

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
 * Who each admin role may invite. `/settings` is admin-only (see sidebarNav),
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
  inactive: "bg-destructive/20 text-destructive border-destructive/30",
};

/**
 * `/settings/users` — team members. The route is the gate now: the members
 * query fires when this page mounts, where it used to hang off the active tab.
 */
export default function UsersSettingsPage() {
  const user = useAuthStore(s => s.user);
  // ponytail: the signed-in role IS the org context here — /settings is admin-only
  // and each admin role maps 1:1 to an org type, so there is nothing to look up.
  const currentRole = user?.role;
  const canManage = canManageOrganizationUsers(currentRole);
  const inviteRoleOptions = (currentRole && INVITE_ROLES_BY_ADMIN_ROLE[currentRole]) || [];
  const canInviteUsers = canManage && inviteRoleOptions.length > 0;
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

  // Team members table toolbar state. Declared here so the query below can key
  // off it — server-side search / status / role filter.
  const [
    teamSearch,
    setTeamSearch,
  ] = useState("");
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  const [
    teamStatus,
    setTeamStatus,
  ] = useState<string>("all");
  const [
    teamFilters,
    setTeamFilters,
  ] = useState<FilterValues>({});

  // Debounce the search input so keystrokes don't fan out to a request each.
  // Cancel a pending trailing call on unmount / re-run.
  const debouncedSetSearch = useMemo(
    () => debounce(
      (v: string) => setDebouncedSearch(v.trim()),
      300,
    ),
    [],
  );
  useEffect(
    () => () => debouncedSetSearch.cancel(),
    [debouncedSetSearch],
  );
  useEffect(
    () => {
      debouncedSetSearch(teamSearch);
    },
    [
      teamSearch,
      debouncedSetSearch,
    ],
  );

  const roleFilter = teamFilters.role;
  const activeRoleFilter
    = roleFilter?.enabled && roleFilter.value ? (roleFilter.value as UserRole) : undefined;
  const organizationUsersQuery = useQuery(
    getOrganizationUsersQueryOptions({
      params: {
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(teamStatus === "active" || teamStatus === "inactive" || teamStatus === "invited"
          ? { status: teamStatus }
          : {}),
        ...(activeRoleFilter ? { role: activeRoleFilter } : {}),
      },
    }),
  );
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
          ? "inactive"
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

  const columns: ColumnDef<TenantUser>[] = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const tenantUser = row.original;
        return (
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
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge className={roleColors[row.original.role]}>{getRoleLabel(row.original.role)}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={statusColors[row.original.status]}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: "lastActive",
      header: "Last Active",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {row.original.lastActive}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: { className: "w-[60px]" },
      cell: ({ row }) => {
        const tenantUser = row.original;
        if (!canManage)
          return null;
        return (
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
                  ? <UserCheck className="h-4 w-4 mr-2" />
                  : <UserX className="h-4 w-4 mr-2" />}
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
        );
      },
    },
  ];

  // Role filter offers every tenant-facing role — a stable option list, so the
  // dropdown doesn't reshape as the current page's results narrow. Admin roles
  // (SUPER/SYSTEM/PLATFORM) are backend-only and never appear as tenant users.
  const teamFilterFields: FilterField[] = [
    {
      type: "select",
      key: "role",
      label: "Role",
      options: (Object.values(UserRole) as UserRole[])
        .filter(
          r => r !== UserRole.SUPER_ADMIN && r !== UserRole.SYSTEM_ADMIN && r !== UserRole.PLATFORM_ADMIN,
        )
        .map(role => ({
          value: role, label: getRoleLabel(role),
        })),
    },
  ];

  return (
    <div className="space-y-6">
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
              <span className="text-xs text-muted-foreground max-w-xs text-right">
                You have view-only access to team members. Ask an Enterprise
                Admin to make changes.
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
                value: "inactive", label: "Inactive",
              },
              {
                value: "invited", label: "Invited",
              },
            ]}
            filterEntity="team members"
            filterFields={teamFilterFields}
            filterValues={teamFilters}
            onFiltersApply={setTeamFilters}
          />
        </CardHeader>
        <DataTable
          columns={columns}
          data={tenantUsers}
          isLoading={isLoadingUsers}
          isError={organizationUsersQuery.isError}
          errorMessage="Unable to load team members."
          onRetry={() => organizationUsersQuery.refetch()}
          hasActiveFilters={!!debouncedSearch || teamStatus !== "all" || !!activeRoleFilter}
          emptyState="No team members yet. Invite someone to get started."
          filteredEmptyState="No team members match your filters."
        />
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
    </div>
  );
}
