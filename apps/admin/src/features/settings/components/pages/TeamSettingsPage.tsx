import { Link } from "react-router";
import { PlatformAdminInvitesPanel } from "@/features/settings/components/ui/PlatformAdminInvitesPanel";
import { PlatformAdminsPanel } from "@/features/settings/components/ui/PlatformAdminsPanel";
import { PlatformRolesCard } from "@/features/settings/components/ui/PlatformRolesCard";
import { PlatformRolesMatrix } from "@/features/settings/components/ui/PlatformRolesMatrix";

/**
 * `/settings/team` — Team & Access, fleetflow's `PlatformTeamManagement` order:
 * Platform Team, Pending Invitations, Roles, then the role matrix.
 *
 * Team and invitations are live (`@truckmoov/api/auth`). Roles, the matrix and
 * per-user grants are the local roles store — ponytail: no roles API yet.
 */
export default function TeamSettingsPage() {
  return (
    <div className="space-y-6">
      <PlatformAdminsPanel />
      <PlatformAdminInvitesPanel />
      <PlatformRolesCard />
      <PlatformRolesMatrix />
      <p className="text-sm text-muted-foreground">
        Audit viewing and exporting are handled under
        {" "}
        <Link
          to="/audit-compliance"
          className="font-medium text-primary hover:underline"
        >
          Audit &amp; Compliance
        </Link>
        .
      </p>
    </div>
  );
}
