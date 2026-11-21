import { TwoFactorSetupCard } from "@truckmoov/reusables/components/auth/TwoFactorSetupCard";
import { AccountSecurityCard } from "@/features/settings/components/ui/AccountSecurityCard";
import { MyProfileCard } from "@/features/settings/components/ui/MyProfileCard";

/**
 * `/settings` (index) — My Profile. The personal profile card, then the
 * signed-in admin's own sign-in protection: two-factor (TRU-FE-23, shared with
 * the other portals; was the old Security tab) and Change Password.
 */
export default function MyProfileSettingsPage() {
  return (
    <div className="space-y-6">
      <MyProfileCard />
      <TwoFactorSetupCard />
      <AccountSecurityCard />
    </div>
  );
}
