import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Plus, Mail, Shield, Trash2, Clock, CheckCircle, XCircle, Search, SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { format } from "date-fns";

interface PlatformUser {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

export function PlatformTeamManagement() {
  const { user } = useAuthStore();
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [userToRemove, setUserToRemove] = useState<PlatformUser | null>(null);
  const [invitationToCancel, setInvitationToCancel] = useState<PendingInvitation | null>(null);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamRoleFilter, setTeamRoleFilter] = useState<string[]>([]);
  const [teamDateFrom, setTeamDateFrom] = useState<string>("");
  const [teamDateTo, setTeamDateTo] = useState<string>("");

  const filteredPlatformUsers = platformUsers.filter((u) => {
    const q = teamSearch.trim().toLowerCase();
    if (q && !(u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) return false;
    if (teamRoleFilter.length > 0 && !teamRoleFilter.includes(u.role)) return false;
    const created = new Date(u.createdAt).getTime();
    if (teamDateFrom && created < new Date(teamDateFrom).getTime()) return false;
    if (teamDateTo && created > new Date(teamDateTo).getTime() + 86400000) return false;
    return true;
  });

  const fetchPlatformTeam = async () => {
    setIsLoading(true);
    try {
      // Fetch platform admins from user_roles joined with profiles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .eq("role", "platform_admin");

      if (rolesError) throw rolesError;

      // For each role, get the profile
      const users: PlatformUser[] = [];
      for (const role of rolesData || []) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("user_id", role.user_id)
          .single();

        if (profileData) {
          users.push({
            id: role.id,
            userId: role.user_id,
            email: profileData.email,
            fullName: profileData.full_name,
            role: role.role,
            createdAt: role.created_at,
          });
        }
      }
      // Demo fallback so the team table is always populated
      const DEMO_USERS: PlatformUser[] = [
        { id: "du-1", userId: "du-1", email: "platform@truckmoov.com", fullName: "Adaeze Okafor", role: "platform_admin", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 240).toISOString() },
        { id: "du-2", userId: "du-2", email: "kwame.mensah@truckmoov.com", fullName: "Kwame Mensah", role: "platform_admin", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString() },
        { id: "du-3", userId: "du-3", email: "zanele.dlamini@truckmoov.com", fullName: "Zanele Dlamini", role: "platform_admin", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 95).toISOString() },
        { id: "du-4", userId: "du-4", email: "ibrahim.bello@truckmoov.com", fullName: "Ibrahim Bello", role: "platform_admin", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 42).toISOString() },
        { id: "du-5", userId: "du-5", email: "amina.cisse@truckmoov.com", fullName: "Aminata Cissé", role: "platform_admin", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString() },
      ];
      setPlatformUsers(users.length > 0 ? users : DEMO_USERS);

      // Fetch pending invitations for platform_admin role (no tenant_id)
      const { data: invitationsData, error: invitationsError } = await supabase
        .from("user_invitations")
        .select("id, email, role, expires_at, created_at")
        .eq("role", "platform_admin")
        .is("tenant_id", null)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString());

      if (invitationsError) throw invitationsError;

      const mappedInvites = (invitationsData || []).map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
      }));
      const DEMO_INVITES: PendingInvitation[] = [
        { id: "di-1", email: "tunde.ade@truckmoov.com", role: "platform_admin", expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
        { id: "di-2", email: "naledi.khumalo@truckmoov.com", role: "platform_admin", expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString(), createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
      ];
      setPendingInvitations(mappedInvites.length > 0 ? mappedInvites : DEMO_INVITES);
    } catch (err) {
      console.error("Error fetching platform team:", err);
      toast.error("Failed to fetch platform team");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformTeam();
  }, []);

  const handleInvitePlatformAdmin = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setIsInviting(true);
    try {
      const response = await supabase.functions.invoke("user-invitation", {
        body: {
          email: inviteEmail,
          role: "platform_admin",
          inviterName: user?.name || "Platform Admin",
          organizationName: "FleetPro Platform",
          // No tenant_id for platform admins
        },
      });

      if (response.error) throw response.error;

      toast.success("Invitation sent successfully");
      setInviteEmail("");
      setIsInviteDialogOpen(false);
      fetchPlatformTeam();
    } catch (err) {
      console.error("Error sending invitation:", err);
      toast.error("Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveUser = async (platformUser: PlatformUser) => {
    try {
      // Don't allow removing yourself
      if (platformUser.userId === user?.id) {
        toast.error("You cannot remove yourself");
        return;
      }

      // Delete the role
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", platformUser.id);

      if (error) throw error;

      toast.success("User removed from platform team");
      setUserToRemove(null);
      fetchPlatformTeam();
    } catch (err) {
      console.error("Error removing user:", err);
      toast.error("Failed to remove user");
    }
  };

  const handleCancelInvitation = async (invitation: PendingInvitation) => {
    try {
      const { error } = await supabase
        .from("user_invitations")
        .delete()
        .eq("id", invitation.id);

      if (error) throw error;

      toast.success("Invitation cancelled");
      setInvitationToCancel(null);
      fetchPlatformTeam();
    } catch (err) {
      console.error("Error cancelling invitation:", err);
      toast.error("Failed to cancel invitation");
    }
  };

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
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
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
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="admin@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
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
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={isInviting}>
                    Cancel
                  </Button>
                  <Button variant="gradient" onClick={handleInvitePlatformAdmin} disabled={isInviting}>
                    {isInviting ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                  onChange={(e) => setTeamSearch(e.target.value)}
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter
                    {(teamRoleFilter.length > 0 || teamDateFrom || teamDateTo) && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {teamRoleFilter.length + (teamDateFrom ? 1 : 0) + (teamDateTo ? 1 : 0)}
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
                                e.target.checked ? [...prev, r] : prev.filter((x) => x !== r)
                              )
                            }
                          />
                          Platform Admin
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Date added</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" value={teamDateFrom} onChange={(e) => setTeamDateFrom(e.target.value)} />
                      <Input type="date" value={teamDateTo} onChange={(e) => setTeamDateTo(e.target.value)} />
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
          ) : platformUsers.length === 0 ? (
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
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlatformUsers.map((platformUser) => (
                  <TableRow key={platformUser.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-medium text-primary-foreground">
                          {platformUser.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{platformUser.fullName}</p>
                          <p className="text-sm text-muted-foreground">{platformUser.email}</p>
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
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(platformUser.createdAt), "MMM dd, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {platformUser.userId !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setUserToRemove(platformUser)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {platformUser.userId === user?.id && (
                        <span className="text-xs text-muted-foreground">You</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
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
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{invitation.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(invitation.expiresAt), "MMM dd, yyyy")}
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

      {/* Remove User Confirmation */}
      <AlertDialog open={!!userToRemove} onOpenChange={() => setUserToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Platform Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{userToRemove?.fullName}</strong> from the platform admin team. They will lose all platform-level access.
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

      {/* Cancel Invitation Confirmation */}
      <AlertDialog open={!!invitationToCancel} onOpenChange={() => setInvitationToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the invitation sent to <strong>{invitationToCancel?.email}</strong>. They will no longer be able to join using that link.
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
