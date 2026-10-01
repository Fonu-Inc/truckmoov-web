import { Send } from "lucide-react";
import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/shadcn/button";
import { Textarea } from "@/components/shadcn/textarea";

const MAX_LENGTH = 4096;

type Props = {
  disabledReason: string | null;
  onSend: (text: string) => void;
};

export function Composer({ disabledReason, onSend }: Props) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const text = draft.trim();
    if (!text || disabledReason)
      return;
    onSend(text);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing)
      return;
    e.preventDefault();
    submit();
  };

  return (
    <div className="border-t border-border/50 p-3">
      {disabledReason && (
        <p className="mb-2 text-xs text-muted-foreground">{disabledReason}</p>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          aria-label="Message"
          className="min-h-[40px] resize-none"
          rows={2}
          maxLength={MAX_LENGTH}
          placeholder="Type a message"
          value={draft}
          disabled={Boolean(disabledReason)}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button
          size="icon"
          aria-label="Send message"
          disabled={Boolean(disabledReason) || !draft.trim()}
          onClick={submit}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
