import { MessagingAccessGate } from "@/features/communications/components/MessagingAccessGate";
import { EmailPanel } from "@/features/communications/email/EmailPanel";

export default function PlatformMessagingCenter() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Email</h1>
        <p className="text-sm text-muted-foreground">The platform mailbox: read, reply and send, and connect the mail server it runs on.</p>
      </div>
      <MessagingAccessGate what="platform email">
        {({ canManage }) => <EmailPanel canManage={canManage} />}
      </MessagingAccessGate>
    </div>
  );
}
