import { CampaignsPanel } from "@/features/communications/campaigns/CampaignsPanel";
import { MessagingAccessGate } from "@/features/communications/components/MessagingAccessGate";

export default function PlatformCampaigns() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Campaigns</h1>
        <p className="text-sm text-muted-foreground">Broadcast a notice to tenants over WhatsApp, SMS or email and follow who got it.</p>
      </div>
      <MessagingAccessGate what="campaigns">
        {({ canManage }) => <CampaignsPanel canManage={canManage} />}
      </MessagingAccessGate>
    </div>
  );
}
