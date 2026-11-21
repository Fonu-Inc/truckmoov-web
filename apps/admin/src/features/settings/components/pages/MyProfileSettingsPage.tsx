import { MyProfileCard } from "@/features/settings/components/ui/MyProfileCard";

/**
 * `/settings` (index) — My Profile. Fleetflow's tab holds only the personal
 * profile card; Account & Security (Two-Factor, session timeout, Change
 * Password) sits on Team & Access, as in fleetflow.
 */
export default function MyProfileSettingsPage() {
  return (
    <div className="space-y-6">
      <MyProfileCard />
    </div>
  );
}
