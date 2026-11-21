import { AccountSecurityCard } from "@/features/settings/components/ui/AccountSecurityCard";
import { PlatformAdminInvitesPanel } from "@/features/settings/components/ui/PlatformAdminInvitesPanel";
import { PlatformAdminsPanel } from "@/features/settings/components/ui/PlatformAdminsPanel";
import { PlatformRolesCard } from "@/features/settings/components/ui/PlatformRolesCard";
import { PlatformRolesMatrix } from "@/features/settings/components/ui/PlatformRolesMatrix";

/**
 * `/settings/team` — Team & Access, fleetflow's `PlatformTeamManagement`
 * (Platform Team, Pending Invitations, Roles, the role matrix) followed by
 * `AccountSecurityCard`, exactly as fleetflow's tab.
 *
 * Team and invitations are live (`@truckmoov/api/auth`). Roles, the matrix and
 * per-user grants are the local roles store — ponytail: no roles API yet.
 */
export default function TeamSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <PlatformAdminsPanel />
        <PlatformAdminInvitesPanel />
        <PlatformRolesCard />
        <PlatformRolesMatrix />
      </div>
      <AccountSecurityCard />
    </div>
  );
}
