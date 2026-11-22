import { useQuery } from "@tanstack/react-query";
import {
  getSystemAdminsQueryOptions,
  useCreateSystemAdminInvite,
  useDeleteSystemAdmin,
} from "@truckmoov/api/auth";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  KeyRound, Plus, Search, Shield, SlidersHorizontal, Trash2, Users,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
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
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { RoleBadge } from "@/features/settings/components/ui/RoleBadge";
import { UserPermissionsDialog } from "@/features/settings/components/ui/UserPermissionsDialog";
import { useStaffAccess } from "@/features/settings/hooks/useStaffAccess";
import { useAuthStore } from "@/stores/authStore";

type AdminUser = {
  userId: string;
  email: string;
  role: string;
  customRoleId?: string | null;
  accountStatus: "enabled" | "disabled" | string;
  status: "active" | "inactive" | string;
  /** Not in the typed response; read when the server sends it. */
  createdAt?: string;
  profile?: {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    profilePictureUrl?: string | null;
  };
};

/** The invite default, as on the server. */
const DEFAULT_ROLE = "SYSTEM_ADMIN";
const EMAIL_RE = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;

function getAdminDisplayName(admin: AdminUser): string {
  return admin.profile?.fullName || admin.email;
}

/**
 * Settings → Team & Access → Platform Team, fleetflow's `PlatformTeamManagement`
 * team card: search + filter (role, date added), User · Role · Added · Actions
 * (Permissions, trash), Invite Team Member dialog, Remove confirmation.
 *
 * Live: the team list with each member's staff role (`GET /auth/system/admins`),
 * invite with a predefined staff role, delete, and per-person permissions
 * (saved as their personal role). The Full Name in the invite is not stored by
 * the API. The Added column reads `createdAt` when the server sends it and
 * shows "—" otherwise; nothing is invented for real admins.
 */
export function PlatformAdminsPanel() {
  const { user } = useAuthStore();
  const {
    roles, hasPersonalRole,
  } = useStaffAccess();
  const platformRoles = roles.map(r => ({
    value: r.key, label: r.label, description: r.description,
  }));
  const inviteRoles = roles.filter(r => r.builtIn).map(r => ({
    value: r.key, label: r.label, description: r.description,
  }));
  /** A shared custom role when they hold one, else their predefined role. */
  const roleKeyFor = (admin: AdminUser) =>
    admin.customRoleId && roles.some(r => r.key === admin.customRoleId) ? admin.customRoleId : admin.role;
  const roleLabel = (role: string) =>
    platformRoles.find(r => r.value === role)?.label ?? role;
  const adminRoleLabel = (admin: AdminUser) => roleLabel(roleKeyFor(admin));

  const adminsQuery = useQuery(getSystemAdminsQueryOptions());
  const rawAdmins = adminsQuery.data?.data as { users?: AdminUser[] } | undefined;
  const platformUsers: AdminUser[] = rawAdmins?.users ?? [];
  const isLoading = adminsQuery.isLoading;

  useEffect(
    () => {
      if (adminsQuery.isError)
        toast.error("Failed to fetch platform team");
    },
    [adminsQuery.isError],
  );

  const createInvite = useCreateSystemAdminInvite();
  const deleteAdmin = useDeleteSystemAdmin();

  const [
    permissionsUser,
    setPermissionsUser,
  ] = useState<AdminUser | null>(null);
  const [
    isInviteDialogOpen,
    setIsInviteDialogOpen,
  ] = useState(false);
  const [
    inviteEmail,
    setInviteEmail,
  ] = useState("");
  const [
    inviteName,
    setInviteName,
  ] = useState("");
  const [
    inviteRole,
    setInviteRole,
  ] = useState<string>(DEFAULT_ROLE);
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
    teamDateFrom,
    setTeamDateFrom,
  ] = useState<string>("");
  const [
    teamDateTo,
    setTeamDateTo,
  ] = useState<string>("");

  const filteredPlatformUsers = platformUsers.filter((u) => {
    const q = teamSearch.trim().toLowerCase();
    const name = getAdminDisplayName(u).toLowerCase();
    if (q && !(name.includes(q) || u.email.toLowerCase().includes(q)))
      return false;
    if (teamRoleFilter.length > 0 && !teamRoleFilter.includes(roleKeyFor(u)))
      return false;
    if (teamDateFrom || teamDateTo) {
      if (!u.createdAt)
        return false;
      const created = new Date(u.createdAt).getTime();
      if (teamDateFrom && created < new Date(teamDateFrom).getTime())
        return false;
      if (teamDateTo && created > new Date(teamDateTo).getTime() + 86400000)
        return false;
    }
    return true;
  });

  const handleInvitePlatformAdmin = () => {
    if (!inviteName.trim() || !inviteEmail) {
      toast.error("Please enter the full name and email address");
      return;
    }
    if (!EMAIL_RE.test(inviteEmail.trim())) {
      toast.error("Enter a valid email address.");
      return;
    }
    const email = inviteEmail.trim();
    createInvite.mutate(
      {
        data: {
          email, role: inviteRole,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${email} as ${roleLabel(inviteRole)}`);
          setInviteEmail("");
          setInviteName("");
          setInviteRole(DEFAULT_ROLE);
          setIsInviteDialogOpen(false);
        },
        onError: () => toast.error("Failed to send invitation"),
      },
    );
  };

  const handleRemoveUser = (platformUser: AdminUser) => {
    if (platformUser.userId === user?.id) {
      toast.error("You cannot remove yourself");
      return;
    }
    deleteAdmin.mutate(
      { id: platformUser.userId },
      {
        onSuccess: () => {
          toast.success("User removed from platform team");
          setUserToRemove(null);
        },
        onError: () => toast.error("Failed to remove user"),
      },
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Platform Team
              </CardTitle>
              <CardDescription>
                Manage internal platform administrators and support staff
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Dialog
                open={isInviteDialogOpen}
                onOpenChange={setIsInviteDialogOpen}
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
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-name">Full Name</Label>
                      <Input
                        id="invite-name"
                        placeholder="e.g. Adaeze Okafor"
                        value={inviteName}
                        onChange={e => setInviteName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="name@truckmoov.com"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={setInviteRole}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {inviteRoles.map(r => (
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
                        {inviteRoles.find(r => r.value === inviteRole)?.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsInviteDialogOpen(false)}
                      disabled={createInvite.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="gradient"
                      onClick={handleInvitePlatformAdmin}
                      disabled={createInvite.isPending}
                    >
                      {createInvite.isPending ? "Sending..." : "Send Invitation"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isLoading && platformUsers.length > 0 && (
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
                    {(teamRoleFilter.length > 0 || teamDateFrom || teamDateTo) && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-5 px-1.5 text-xs"
                      >
                        {teamRoleFilter.length + (teamDateFrom ? 1 : 0) + (teamDateTo ? 1 : 0)}
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
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Date added</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={teamDateFrom}
                        onChange={e => setTeamDateFrom(e.target.value)}
                      />
                      <Input
                        type="date"
                        value={teamDateTo}
                        onChange={e => setTeamDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTeamRoleFilter([]);
                        setTeamDateFrom("");
                        setTeamDateTo("");
                      }}
                    >
                      Show All
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
          {isLoading
            ? (
                <div className="space-y-3">
                  {[
                    1,
                    2,
                    3,
                  ].map(i => (
                    <div
                      key={i}
                      className="flex items-center gap-4"
                    >
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            : platformUsers.length === 0
              ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No platform administrators found</p>
                    <p className="text-sm">Invite your first admin to get started</p>
                  </div>
                )
              : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlatformUsers.map((platformUser) => {
                        const displayName = getAdminDisplayName(platformUser);
                        const personal = hasPersonalRole(platformUser.customRoleId);
                        return (
                          <TableRow key={platformUser.userId}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-medium text-primary-foreground">
                                  {displayName
                                    .split(" ")
                                    .map(n => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">{displayName}</p>
                                  <p className="text-sm text-muted-foreground">{platformUser.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <RoleBadge
                                  roleKey={roleKeyFor(platformUser)}
                                  label={adminRoleLabel(platformUser)}
                                />
                                {personal && (
                                  <Badge
                                    variant="secondary"
                                    className="rounded-full text-[10px] font-normal"
                                  >
                                    custom permissions
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatWithPattern(
                                  platformUser.createdAt,
                                  "MMM dd, yyyy",
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5"
                                  onClick={() => setPermissionsUser(platformUser)}
                                >
                                  <KeyRound className="h-4 w-4" />
                                  Permissions
                                </Button>
                                {platformUser.userId !== user?.id
                                  ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => setUserToRemove(platformUser)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )
                                  : (
                                      <span className="text-xs text-muted-foreground">You</span>
                                    )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
        </CardContent>
      </Card>

      {permissionsUser && (
        <UserPermissionsDialog
          open={!!permissionsUser}
          onOpenChange={o => !o && setPermissionsUser(null)}
          userId={permissionsUser.userId}
          userName={getAdminDisplayName(permissionsUser)}
          roleKey={permissionsUser.role}
          customRoleId={permissionsUser.customRoleId}
        />
      )}

      {/* Remove User Confirmation */}
      <AlertDialog
        open={!!userToRemove}
        onOpenChange={() => setUserToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Platform Admin?</AlertDialogTitle>
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
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
