import type { PlatformRole } from "@/features/settings/utils/platformPermissions";
import {
  ChevronDown, ChevronUp, Eye, KeyRound, Pencil, Plus, Search, Shield,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { PlatformRoleEditorDialog } from "@/features/settings/components/ui/PlatformRoleEditorDialog";
import { usePlatformRolesStore } from "@/features/settings/stores/platformRolesStore";

/**
 * The Roles card from fleetflow's `PlatformTeamManagement` ("Roles (N)", View
 * all roles / Create New Role, one card per role) plus its editor dialogs.
 * ponytail: backed by the local `usePlatformRolesStore` — no roles API yet.
 */
export function PlatformRolesCard() {
  const roles = usePlatformRolesStore(s => s.roles);
  const [
    isCreateRoleOpen,
    setIsCreateRoleOpen,
  ] = useState(false);
  const [
    roleToView,
    setRoleToView,
  ] = useState<PlatformRole | null>(null);
  const [
    roleToEdit,
    setRoleToEdit,
  ] = useState<PlatformRole | null>(null);
  const [
    rolesOpen,
    setRolesOpen,
  ] = useState(false);
  const [
    roleSearch,
    setRoleSearch,
  ] = useState("");

  const visibleRoles = roles.filter((role) => {
    const q = roleSearch.trim().toLowerCase();
    if (!q)
      return true;
    return (
      role.label.toLowerCase().includes(q)
      || (role.description ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-primary" />
                Roles (
                {roles.length}
                )
              </CardTitle>
              <CardDescription>
                Platform roles, what they do, and the permissions assigned to each.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setRolesOpen(o => !o)}
              >
                {rolesOpen
                  ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Hide roles
                      </>
                    )
                  : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        View all roles
                      </>
                    )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCreateRoleOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Role
              </Button>
            </div>
          </div>
        </CardHeader>
        {rolesOpen && (
          <CardContent>
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={roleSearch}
                onChange={e => setRoleSearch(e.target.value)}
                placeholder="Search roles..."
                className="pl-9"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {visibleRoles.map((role) => {
                const count = role.permissions.length;
                return (
                  <div
                    key={role.key}
                    className="rounded-xl border border-border/50 bg-muted/30 p-4 flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold">{role.label}</h4>
                    </div>

                    <p className="text-sm text-muted-foreground mt-1 flex-1">
                      {role.description || "No description provided."}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <KeyRound className="h-3.5 w-3.5" />
                      {`${count} permission${count === 1 ? "" : "s"}`}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setRoleToView(role)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRoleToEdit(role)}
                        aria-label={`Edit ${role.label}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      <PlatformRoleEditorDialog
        open={isCreateRoleOpen}
        onOpenChange={setIsCreateRoleOpen}
        role={null}
      />

      <PlatformRoleEditorDialog
        open={!!roleToView}
        onOpenChange={o => !o && setRoleToView(null)}
        role={roleToView}
        readOnly
      />

      <PlatformRoleEditorDialog
        open={!!roleToEdit}
        onOpenChange={o => !o && setRoleToEdit(null)}
        role={roleToEdit}
      />
    </>
  );
}
