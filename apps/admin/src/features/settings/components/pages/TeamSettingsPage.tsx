import { PlatformAdminInvitesPanel } from "@/features/settings/components/ui/PlatformAdminInvitesPanel";
import { PlatformAdminsPanel } from "@/features/settings/components/ui/PlatformAdminsPanel";

/**
 * `/settings/team` — matches fleetflow's single-page shape: Platform Team on
 * top, Pending Invitations underneath. Sub-routed NavLink tabs dropped.
 *
 * ponytail: /settings/team/invitations still resolves via the child route
 * for URL compatibility, but nothing links there anymore.
 */
export default function TeamSettingsPage() {
  return (
    <div className="space-y-6">
      <PlatformAdminsPanel />
      <PlatformAdminInvitesPanel />
    </div>
  );
}
