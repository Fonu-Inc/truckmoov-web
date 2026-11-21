import type { ColumnDef } from "@tanstack/react-table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemAdminsQueryOptions,
  useCreateSystemAdminInvite,
  useDeleteSystemAdmin,
  useUpdateSystemAdminStatus,
} from "@truckmoov/api/auth";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import {
  KeyRound, MoreHorizontal, Plus, Search, Shield, SlidersHorizontal, Users,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { UserPermissionsDialog } from "@/features/settings/components/ui/UserPermissionsDialog";
import { usePlatformRolesStore } from "@/features/settings/stores/platformRolesStore";
import { useAuthStore } from "@/stores/authStore";

type AdminUser = {
  userId: string;
  email: string;
  role: string;
  accountStatus: "enabled" | "disabled" | string;
  status: "active" | "inactive" | string;
  profile?: {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    profilePictureUrl?: string | null;
  };
};

const inviteSchema = z.object({ email: z.string().trim().email("Enter a valid email address.") });
type InviteFormValues = z.infer<typeof inviteSchema>;

function getAdminDisplayName(admin: AdminUser): string {
  return admin.profile?.fullName || admin.email;
}

/**
 * The API has one platform-admin role, so "Platform Admin" heads the picker and
 * is every admin's fallback. The other roles come from the local roles store
 * (fleetflow parity port) and are recorded per email in `userRoles`.
 * ponytail: local only — the invite request still sends just the email.
 */
const PLATFORM_ADMIN_ROLE = {
  value: "platform_admin",
  label: "Platform Admin",
  description: "Platform admins have full access to all platform features and tenant management.",
};

export function PlatformAdminsPanel() {
  const { user } = useAuthStore();
  const roles = usePlatformRolesStore(s => s.roles);
  const userGrants = usePlatformRolesStore(s => s.userGrants);
  const userRoles = usePlatformRolesStore(s => s.userRoles);
  const setUserRole = usePlatformRolesStore(s => s.setUserRole);
  const platformRoles = [
    PLATFORM_ADMIN_ROLE,
    ...roles.map(r => ({
      value: r.key, label: r.label, description: r.description,
    })),
  ];
  const roleKeyFor = (admin: AdminUser) => userRoles[admin.email.toLowerCase()] ?? PLATFORM_ADMIN_ROLE.value;
  const roleLabel = (admin: AdminUser) =>
    admin.role === "SUPER_ADMIN"
      ? "Super Admin"
      : platformRoles.find(r => r.value === roleKeyFor(admin))?.label ?? PLATFORM_ADMIN_ROLE.label;

  const adminsQuery = useQuery(getSystemAdminsQueryOptions());
  const rawAdmins = adminsQuery.data?.data as { users?: AdminUser[] } | undefined;
  const admins: AdminUser[] = rawAdmins?.users ?? [];

  const createInvite = useCreateSystemAdminInvite();
  const deleteAdmin = useDeleteSystemAdmin();
  const updateStatus = useUpdateSystemAdminStatus();

  const [
    isInviteDialogOpen,
    setIsInviteDialogOpen,
  ] = useState(false);
  const [
    userToRemove,
    setUserToRemove,
  ] = useState<AdminUser | null>(null);
  const [
    teamSearch,
    setTeamSearch,
  ] = useState("");
  const [
    teamRoleFilter,
    setTeamRoleFilter,
  ] = useState<string[]>([]);
  const [
    inviteRole,
    setInviteRole,
  ] = useState<string>(PLATFORM_ADMIN_ROLE.value);
  const [
    permissionsUser,
    setPermissionsUser,
  ] = useState<AdminUser | null>(null);

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  const filteredAdmins = admins.filter((admin) => {
    const q = teamSearch.trim().toLowerCase();
    const name = getAdminDisplayName(admin).toLowerCase();
    if (q && !(name.includes(q) || admin.email.toLowerCase().includes(q)))
      return false;
    if (teamRoleFilter.length > 0 && !teamRoleFilter.includes(roleKeyFor(admin)))
      return false;
    return true;
  });

  const handleInvitePlatformAdmin = (values: InviteFormValues) => {
    createInvite.mutate(
      { data: { email: values.email } },
      {
        onSuccess: () => {
          setUserRole(
            values.email,
            inviteRole,
          );
          toast.success(`Invitation sent to ${values.email} as ${platformRoles.find(r => r.value === inviteRole)?.label ?? PLATFORM_ADMIN_ROLE.label}`);
          inviteForm.reset();
          setInviteRole(PLATFORM_ADMIN_ROLE.value);
          setIsInviteDialogOpen(false);
        },
        onError: e => toast.error(e.message),
      },
    );
  };

  const handleToggleStatus = (admin: AdminUser) => {
    const nextStatus = admin.accountStatus === "enabled" ? "disabled" : "enabled";
    updateStatus.mutate(
      {
        id: admin.userId,
        data: { accountStatus: nextStatus },
      },
      {
        onSuccess: () => toast.success("Admin status updated"),
        onError: e => toast.error(e.message),
      },
    );
  };

  const handleRemoveUser = (admin: AdminUser) => {
    deleteAdmin.mutate(
      { id: admin.userId },
      {
        onSuccess: (res) => {
          toast.success(res.message || "Admin deleted");
          setUserToRemove(null);
        },
        onError: e => toast.error(e.message),
      },
    );
  };

  const isLoading = adminsQuery.isLoading;

  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: "email",
      header: "User",
      cell: ({ row }) => {
        const displayName = getAdminDisplayName(row.original);
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-medium text-primary-foreground">
              {getInitials(displayName)}
            </div>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const extra = userGrants[row.original.userId]?.length ?? 0;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="border-primary/30 text-primary"
            >
              <Shield className="h-3 w-3 mr-1" />
              {roleLabel(row.original)}
            </Badge>
            {extra > 0 && (
              <Badge
                variant="secondary"
                className="rounded-full text-[10px] font-normal"
              >
                +
                {extra}
                {" "}
                extra
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "accountStatus",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.accountStatus === "enabled" ? "default" : "secondary"}>
          {row.original.accountStatus === "enabled" ? "Enabled" : "Disabled"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => {
        const admin = row.original;
        const isSelf = admin.userId === user?.id;
        const permissionsButton = (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => setPermissionsUser(admin)}
          >
            <KeyRound className="h-4 w-4" />
            Permissions
          </Button>
        );
        if (isSelf || admin.role === "SUPER_ADMIN") {
          return (
            <div className="flex items-center justify-end gap-1">
              {permissionsButton}
              <span className="text-xs text-muted-foreground">{isSelf ? "You" : "Protected"}</span>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-end gap-1">
            {permissionsButton}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleToggleStatus(admin)}>
                  {admin.accountStatus === "enabled" ? "Disable Admin" : "Enable Admin"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setUserToRemove(admin)}
                >
                  Delete Admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Platform Team
              </CardTitle>
              <CardDescription>
                Manage internal platform administrators and support staff
              </CardDescription>
            </div>
            <Dialog
              open={isInviteDialogOpen}
              onOpenChange={(open) => {
                setIsInviteDialogOpen(open);
                if (!open)
                  inviteForm.reset();
              }}
            >
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to a member of the platform team and choose what they can administer.
                  </DialogDescription>
                </DialogHeader>
                <Form {...inviteForm}>
                  <form
                    onSubmit={inviteForm.handleSubmit(handleInvitePlatformAdmin)}
                    className="space-y-4 py-4"
                  >
                    <FormField
                      control={inviteForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="name@truckmoov.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <FormLabel>Role</FormLabel>
                      <Select
                        value={inviteRole}
                        onValueChange={setInviteRole}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {platformRoles.map(r => (
                            <SelectItem
                              key={r.value}
                              value={r.value}
                            >
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {platformRoles.find(r => r.value === inviteRole)?.description}
                      </p>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsInviteDialogOpen(false)}
                        disabled={createInvite.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="gradient"
                        disabled={createInvite.isPending}
                      >
                        {createInvite.isPending ? "Sending..." : "Send Invitation"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!isLoading && admins.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search team by name or email..."
                  className="pl-10"
                  value={teamSearch}
                  onChange={e => setTeamSearch(e.target.value)}
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter
                    {teamRoleFilter.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-5 px-1.5 text-xs"
                      >
                        {teamRoleFilter.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-72 space-y-4"
                >
                  <div>
                    <p className="text-xs font-medium mb-2">Only show team members by...</p>
                    <p className="text-xs text-muted-foreground mb-1">Role</p>
                    <div className="space-y-1">
                      {platformRoles.map(r => (
                        <label
                          key={r.value}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={teamRoleFilter.includes(r.value)}
                            onChange={e =>
                              setTeamRoleFilter(prev =>
                                e.target.checked ? [
                                  ...prev,
                                  r.value,
                                ] : prev.filter(x => x !== r.value))}
                          />
                          {r.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTeamRoleFilter([])}
                    >
                      Show All
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          <DataTable
            columns={columns}
            data={filteredAdmins}
            isLoading={isLoading}
            isError={adminsQuery.isError}
            errorMessage="Failed to load platform admins."
            onRetry={() => adminsQuery.refetch()}
            hasActiveFilters={!!teamSearch.trim() || teamRoleFilter.length > 0}
            emptyState={(
              <div className="text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No platform administrators found</p>
                <p className="text-sm">Invite your first admin to get started</p>
              </div>
            )}
            filteredEmptyState="No platform admins match your filters."
          />
        </CardContent>
      </Card>

      {permissionsUser && (
        <UserPermissionsDialog
          open={!!permissionsUser}
          onOpenChange={o => !o && setPermissionsUser(null)}
          userId={permissionsUser.userId}
          userName={getAdminDisplayName(permissionsUser)}
          roleKey={roleKeyFor(permissionsUser)}
        />
      )}

      <AlertDialog
        open={!!userToRemove}
        onOpenChange={() => setUserToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Platform Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove
              {" "}
              <strong>{userToRemove ? getAdminDisplayName(userToRemove) : ""}</strong>
              {" "}
              from the platform admin team. They will lose all platform-level access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => userToRemove && handleRemoveUser(userToRemove)}
              disabled={deleteAdmin.isPending}
            >
              {deleteAdmin.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
