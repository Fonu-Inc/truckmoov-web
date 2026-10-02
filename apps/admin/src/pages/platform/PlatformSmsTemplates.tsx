import { MessagingAccessGate } from "@/features/communications/components/MessagingAccessGate";
import { SmsTemplatesPanel } from "@/features/communications/sms/SmsTemplatesPanel";

export default function PlatformSmsTemplates() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">SMS Templates</h1>
        <p className="text-sm text-muted-foreground">Texts you send often, ready to use in campaigns. WhatsApp templates live on the WhatsApp Setup page.</p>
      </div>
      <MessagingAccessGate what="SMS templates">
        {({ canManage }) => <SmsTemplatesPanel canManage={canManage} />}
      </MessagingAccessGate>
    </div>
  );
}
