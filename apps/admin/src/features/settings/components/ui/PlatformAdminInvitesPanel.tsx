import type { AdminInvite } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemAdminInvitesQueryOptions,
  useDeleteSystemAdminInvite,
} from "@truckmoov/api/auth";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  Clock, Mail, XCircle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

/**
 * Settings → Team & Access → Pending Invitations, fleetflow's card from
 * `PlatformTeamManagement`: Email · Expires · Cancel. Live from
 * `GET /auth/system/admin-invites`; Cancel calls the delete endpoint. Shown
 * only while there are pending invitations, as in fleetflow.
 */
export function PlatformAdminInvitesPanel() {
  const invitesQuery = useQuery(getSystemAdminInvitesQueryOptions());
  const pendingInvitations: AdminInvite[] = invitesQuery.data?.data?.invites ?? [];
  const deleteInvite = useDeleteSystemAdminInvite();

  const [
    invitationToCancel,
    setInvitationToCancel,
  ] = useState<AdminInvite | null>(null);

  const handleCancelInvitation = (invitation: AdminInvite) => {
    deleteInvite.mutate(
      { id: invitation.id },
      {
        onSuccess: () => {
          toast.success("Invitation cancelled");
          setInvitationToCancel(null);
        },
        onError: () => toast.error("Failed to cancel invitation"),
      },
    );
  };

  return (
    <>
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-warning" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map(invitation => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{invitation.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatWithPattern(
                          invitation.expiresAt,
                          "MMM dd, yyyy",
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setInvitationToCancel(invitation)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Cancel Invitation Confirmation */}
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
