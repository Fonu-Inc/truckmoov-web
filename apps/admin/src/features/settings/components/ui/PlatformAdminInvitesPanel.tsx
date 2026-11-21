import type { ColumnDef } from "@tanstack/react-table";
import type { AdminInvite } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemAdminInvitesQueryOptions,
  useDeleteSystemAdminInvite,
  useResendSystemAdminInvite,
} from "@truckmoov/api/auth";
import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import {
  Clock, Mail, MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
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
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";

export function PlatformAdminInvitesPanel() {
  const invitesQuery = useQuery(getSystemAdminInvitesQueryOptions());
  const invites: AdminInvite[] = invitesQuery.data?.data?.invites ?? [];

  const deleteInvite = useDeleteSystemAdminInvite();
  const resendInvite = useResendSystemAdminInvite();

  const [
    invitationToCancel,
    setInvitationToCancel,
  ] = useState<AdminInvite | null>(null);

  const handleCancelInvitation = (invite: AdminInvite) => {
    deleteInvite.mutate(
      { id: invite.id },
      {
        onSuccess: () => {
          toast.success("Invitation cancelled");
          setInvitationToCancel(null);
        },
        onError: e => toast.error(e.message),
      },
    );
  };

  const handleResendInvite = (invite: AdminInvite) => {
    resendInvite.mutate(
      { id: invite.id },
      {
        onSuccess: () => toast.success("Invitation resent"),
        onError: e => toast.error(e.message),
      },
    );
  };

  const inviteColumns: ColumnDef<AdminInvite>[] = [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "expiresAt",
      header: "Expires",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.expiresAt ? formatDate(row.original.expiresAt) : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      meta: { className: "text-right" },
      cell: ({ row }) => {
        const invite = row.original;
        return (
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
        );
      },
    },
  ];

  // Fleetflow shows this card only while there are pending invitations.
  if (!invitesQuery.isLoading && !invitesQuery.isError && invites.length === 0)
    return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-warning" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={inviteColumns}
            data={invites}
            isLoading={invitesQuery.isLoading}
            isError={invitesQuery.isError}
            errorMessage="Failed to load invitations."
            onRetry={() => invitesQuery.refetch()}
          />
        </CardContent>
      </Card>

      <AlertDialog
        open={!!invitationToCancel}
        onOpenChange={() => setInvitationToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the invitation sent to
              {" "}
              <strong>{invitationToCancel?.email}</strong>
              . They will no longer be able to join using that link.
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
    </>
  );
}
