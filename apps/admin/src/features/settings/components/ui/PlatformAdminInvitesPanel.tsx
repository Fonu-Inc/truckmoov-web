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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

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
          {invitesQuery.isLoading
            ? (
                <div className="space-y-3">
                  {[
                    1,
                    2,
                  ].map(i => (
                    <Skeleton
                      key={i}
                      className="h-10 w-full"
                    />
                  ))}
                </div>
              )
            : invitesQuery.isError
              ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm text-destructive">Failed to load invitations.</p>
                  </div>
                )
              : invites.length === 0
                ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No pending invitations</p>
                      <p className="text-sm">Invites you send from the Admins tab will appear here.</p>
                    </div>
                  )
                : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invites.map(invite => (
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
                                  ? formatDate(invite.expiresAt)
                                  : "—"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
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
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
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
