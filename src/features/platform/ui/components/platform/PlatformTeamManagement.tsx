import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { MoreHorizontal, Plus, Shield, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  getSystemAdminsQueryOptions,
  useCreateSystemAdmin,
  useUpdateSystemAdminStatus,
} from "@/features/auth/api";
import type { AccountStatus, InvitedUser } from "@/features/auth/api/types";
import AppAvatar from "@/shared/components/AppAvatar";
import StatusBadge from "@/shared/components/StatusBadge";
import { timeAgo } from "@/shared/utils/time-functions";
import { useAuthStore } from "@/stores/authStore";

const inviteSystemAdminSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type InviteSystemAdminFormValues = z.infer<typeof inviteSystemAdminSchema>;

function formatRoleLabel(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function PlatformTeamManagement() {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.userId ?? currentUser?.id;
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [statusChangeUserId, setStatusChangeUserId] = useState<string | null>(null);

  const { data, isPending: loadingSystemAdmins } = useQuery(getSystemAdminsQueryOptions());
  const { mutateAsync: createSystemAdmin, isPending: creatingSystemAdmin } = useCreateSystemAdmin();
  const { mutateAsync: updateSystemAdminStatus, isPending: updatingSystemAdminStatus } = useUpdateSystemAdminStatus();

  const form = useForm<InviteSystemAdminFormValues>({
    resolver: zodResolver(inviteSystemAdminSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const systemAdmins = useMemo(() => data?.data.users ?? [], [data]);

  function handleInviteDialogChange(open: boolean) {
    setInviteDialogOpen(open);

    if (!open) {
      form.reset();
    }
  }

  async function onInviteSubmit(values: InviteSystemAdminFormValues) {
    await createSystemAdmin(
      {
        data: values,
      },
      {
        onSuccess: () => {
          form.reset();
          setInviteDialogOpen(false);
        },
      }
    );
  }

  async function handleStatusChange(user: InvitedUser, accountStatus: AccountStatus) {
    setStatusChangeUserId(user.userId);

    await updateSystemAdminStatus(
      {
        userId: user.userId,
        data: {
          accountStatus,
        },
      },
      {
        onSettled: () => {
          setStatusChangeUserId(null);
        },
      }
    );
  }

  const columns = useMemo<ColumnDef<InvitedUser>[]>(
    () => [
      {
        accessorKey: "user",
        header: "User",
        cell: ({ row }) => {
          const admin = row.original;
          const name = admin.profile?.fullName ?? admin.email;
          const imageUrl = admin.profile?.profilePictureUrl ?? undefined;

          return (
            <div className="flex items-center gap-3">
              <AppAvatar value={name} imgUrl={imageUrl} className="h-8 w-8" />
              <div className="min-w-0">
                <p className="truncate font-medium">{name}</p>
                <p className="truncate text-sm text-muted-foreground">{admin.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm font-medium capitalize">
            <Shield className="h-4 w-4 text-primary" />
            <span>{formatRoleLabel(row.original.role)}</span>
          </div>
        ),
      },
      {
        accessorKey: "accountStatus",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.accountStatus} />,
      },
      {
        accessorKey: "lastActiveAt",
        header: "Last Active",
        cell: ({ row }) => {
          const lastActiveAt = row.original.lastActiveAt;

          return (
            <span className="text-sm text-muted-foreground">
              {lastActiveAt ? timeAgo(lastActiveAt) : "Never"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const admin = row.original;
          const isCurrentUser = admin.userId === currentUserId;
          const nextStatus: AccountStatus = admin.accountStatus === "enabled" ? "disabled" : "enabled";
          const statusActionLabel = nextStatus === "enabled" ? "Enable Admin" : "Disable Admin";
          const isUpdatingThisRow = updatingSystemAdminStatus && statusChangeUserId === admin.userId;

          if (isCurrentUser) {
            return <span className="text-xs text-muted-foreground">Current account</span>;
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Manage ${admin.email}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={updatingSystemAdminStatus}
                  onClick={() => void handleStatusChange(admin, nextStatus)}
                >
                  {nextStatus === "enabled" ? (
                    <UserCheck className="h-4 w-4 text-success" />
                  ) : (
                    <UserX className="h-4 w-4 text-destructive" />
                  )}
                  {isUpdatingThisRow ? "Updating..." : statusActionLabel}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [currentUserId, statusChangeUserId, updatingSystemAdminStatus]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Platform Team
            </CardTitle>
            <CardDescription>
              Manage internal platform administrators and control their system access.
            </CardDescription>
          </div>
          <Dialog open={inviteDialogOpen} onOpenChange={handleInviteDialogChange}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="h-4 w-4" />
                Invite Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Platform Admin</DialogTitle>
                <DialogDescription>
                  Create a new platform administrator account with access to tenant and platform-level controls.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onInviteSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Ada Lovelace" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="admin@truckmoov.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temporary Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Minimum 8 characters" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button" disabled={creatingSystemAdmin}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" variant="gradient" isLoading={creatingSystemAdmin}>
                      Create Admin
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={systemAdmins}
          isLoading={loadingSystemAdmins}
          noResultStatement="No platform administrators found."
        />
      </CardContent>
    </Card>
  );
}
