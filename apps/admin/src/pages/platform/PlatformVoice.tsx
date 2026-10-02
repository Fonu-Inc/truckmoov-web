import { MessagingAccessGate } from "@/features/communications/components/MessagingAccessGate";
import { VoicePanel } from "@/features/communications/voice/VoicePanel";

export default function PlatformVoice() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Voice and IVR</h1>
        <p className="text-sm text-muted-foreground">The platform phone line: the spoken menu, the call log, recordings and how calls are going.</p>
      </div>
      <MessagingAccessGate what="voice and IVR">
        {({ canManage }) => <VoicePanel canManage={canManage} />}
      </MessagingAccessGate>
    </div>
  );
}
