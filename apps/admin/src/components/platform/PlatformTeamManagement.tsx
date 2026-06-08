import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  type AdminInvite,
  getSystemAdminInvitesQueryOptions,
  getSystemAdminsQueryOptions,
  useCreateSystemAdminInvite,
  useDeleteSystemAdminInvite,
  useResendSystemAdminInvite,
  useUpdateSystemAdminStatus,
} from "@truckmoov/api/auth";

interface AdminUser {
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
}

import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Badge } from "@/components/shadcn/badge";
import { Skeleton } from "@/components/shadcn/skeleton";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Users, Plus, Mail, Shield, Clock, Search, SlidersHorizontal, MoreHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { format } from "date-fns";

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});
type InviteFormValues = z.infer<typeof inviteSchema>;

function getAdminDisplayName(admin: AdminUser): string {
  return admin.profile?.fullName || admin.email;
}

export function PlatformTeamManagement() {
  const { user } = useAuthStore();

  const adminsQuery = useQuery(getSystemAdminsQueryOptions());
  const rawAdmins = (adminsQuery.data?.data as { users?: AdminUser[] } | undefined);
  const admins: AdminUser[] = rawAdmins?.users ?? [];

  const invitesQuery = useQuery(getSystemAdminInvitesQueryOptions());
  const invites: AdminInvite[] = invitesQuery.data?.data?.invites ?? [];

  const createInvite = useCreateSystemAdminInvite();
  const deleteInvite = useDeleteSystemAdminInvite();
  const resendInvite = useResendSystemAdminInvite();
  const updateStatus = useUpdateSystemAdminStatus();

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<AdminUser | null>(null);
  const [invitationToCancel, setInvitationToCancel] = useState<AdminInvite | null>(null);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamRoleFilter, setTeamRoleFilter] = useState<string[]>([]);

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  const filteredAdmins = admins.filter((admin) => {
    const q = teamSearch.trim().toLowerCase();
    const name = getAdminDisplayName(admin).toLowerCase();
    if (q && !(name.includes(q) || admin.email.toLowerCase().includes(q))) return false;
    if (teamRoleFilter.length > 0 && !teamRoleFilter.includes(admin.role)) return false;
    return true;
  });

  const handleInvitePlatformAdmin = (values: InviteFormValues) => {
    createInvite.mutate(
      { data: { email: values.email } },
      {
        onSuccess: () => {
          toast.success("Invitation sent");
          inviteForm.reset();
          setIsInviteDialogOpen(false);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const handleToggleStatus = (admin: AdminUser) => {
    const nextStatus = admin.accountStatus === "enabled" ? "disabled" : "enabled";
    updateStatus.mutate(
      { id: admin.userId, data: { accountStatus: nextStatus } },
      {
        onSuccess: () => toast.success("Admin status updated"),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const handleRemoveUser = (admin: AdminUser) => {
    updateStatus.mutate(
      { id: admin.userId, data: { accountStatus: "disabled" } },
      {
        onSuccess: () => {
          toast.success("Admin removed");
          setUserToRemove(null);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const handleCancelInvitation = (invite: AdminInvite) => {
    deleteInvite.mutate(
      { id: invite.id },
      {
        onSuccess: () => {
          toast.success("Invitation cancelled");
          setInvitationToCancel(null);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const handleResendInvite = (invite: AdminInvite) => {
    resendInvite.mutate(
      { id: invite.id },
      {
        onSuccess: () => toast.success("Invitation resent"),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const isLoading = adminsQuery.isLoading;

  return (
    <div className="space-y-6">
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
                if (!open) inviteForm.reset();
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
                  <DialogTitle>Invite Platform Administrator</DialogTitle>
                  <DialogDescription>
                    Send an invitation to add a new platform admin. They will have full access to manage all tenants and platform settings.
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
                            <Input type="email" placeholder="admin@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <FormLabel>Role</FormLabel>
                      <Select value="platform_admin" disabled>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="platform_admin">Platform Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Platform admins have full access to all platform features and tenant management.
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
                      <Button type="submit" variant="gradient" disabled={createInvite.isPending}>
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
                  onChange={(e) => setTeamSearch(e.target.value)}
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter
                    {teamRoleFilter.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {teamRoleFilter.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 space-y-4">
                  <div>
                    <p className="text-xs font-medium mb-2">Only show team members by...</p>
                    <p className="text-xs text-muted-foreground mb-1">Role</p>
                    <div className="space-y-1">
                      {["platform_admin"].map((r) => (
                        <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={teamRoleFilter.includes(r)}
                            onChange={(e) =>
                              setTeamRoleFilter((prev) =>
                                e.target.checked ? [...prev, r] : prev.filter((x) => x !== r),
                              )
                            }
                          />
                          Platform Admin
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

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : adminsQuery.isError ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm text-destructive">Failed to load platform admins.</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No platform administrators found</p>
              <p className="text-sm">Invite your first admin to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.map((admin) => {
                  const displayName = getAdminDisplayName(admin);
                  const initials = displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  const isSelf = admin.userId === user?.id;

                  return (
                    <TableRow key={admin.userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-medium text-primary-foreground">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium">{displayName}</p>
                            <p className="text-sm text-muted-foreground">{admin.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          <Shield className="h-3 w-3 mr-1" />
                          Platform Admin
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.accountStatus === "enabled" ? "default" : "secondary"}>
                          {admin.accountStatus === "enabled" ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground">You</span>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
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
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {(invitesQuery.isLoading || invites.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-warning" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invitesQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{invite.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {invite.expiresAt
                            ? format(new Date(invite.expiresAt), "MMM dd, yyyy")
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleResendInvite(invite)}>
                              Resend Invite
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setInvitationToCancel(invite)}
                            >
                              Cancel Invite
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Remove Admin Confirmation */}
      <AlertDialog open={!!userToRemove} onOpenChange={() => setUserToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Platform Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{userToRemove ? getAdminDisplayName(userToRemove) : ""}</strong> from the platform admin team. They will lose all platform-level access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => userToRemove && handleRemoveUser(userToRemove)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invitation Confirmation */}
      <AlertDialog open={!!invitationToCancel} onOpenChange={() => setInvitationToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the invitation sent to{" "}
              <strong>{invitationToCancel?.email}</strong>. They will no longer be able to join using that link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => invitationToCancel && handleCancelInvitation(invitationToCancel)}
            >
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
