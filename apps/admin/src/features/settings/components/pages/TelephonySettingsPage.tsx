import { PhoneNumberManagement } from "@/features/settings/components/ui/PhoneNumberManagement";
import { SenderIdApprovalQueue } from "@/features/settings/components/ui/SenderIdApprovalQueue";
import { TelephonySettings } from "@/features/settings/components/ui/TelephonySettings";

/** `/settings/telephony` — three panels, so this tab keeps a page. */
export default function TelephonySettingsPage() {
  return (
    <div className="space-y-6">
      <TelephonySettings />
      <PhoneNumberManagement />
      <SenderIdApprovalQueue />
    </div>
  );
}
