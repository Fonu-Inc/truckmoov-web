import { WhatsAppAssistPanel } from "@/features/settings/components/ui/WhatsAppAssistPanel";
import { WhatsAppHealthDashboard } from "@/features/settings/components/ui/WhatsAppHealthDashboard";

/** `/settings/whatsapp` — two panels, so this tab keeps a page. */
export default function WhatsAppSettingsPage() {
  return (
    <div className="space-y-6">
      <WhatsAppAssistPanel />
      <WhatsAppHealthDashboard />
    </div>
  );
}
