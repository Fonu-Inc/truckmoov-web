import { useIsOwnerOperatorAccount } from "@/features/auth/hooks/useOrganizationType";
import { OrganizationSettingsForm } from "@/features/settings/components/forms/OrganizationSettingsForm";
import { TelecomMasterPanel } from "@/features/settings/components/ui/TelecomMasterPanel";

/** `/settings` — the tab bar's first entry, so it is the index route. */
export default function OrganizationSettingsPage() {
  const isOwnerOperator = useIsOwnerOperatorAccount();
  return (
    <>
      <OrganizationSettingsForm />
      {!isOwnerOperator && <TelecomMasterPanel />}
    </>
  );
}
