import { useQuery } from "@tanstack/react-query";
import type { MessagingCannedReply } from "@truckmoov/api/notification";
import { Lock, Send, StickyNote } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { Textarea } from "@/components/shadcn/textarea";
import { cn } from "@/lib/utils";
import {
  ATTACHMENT_ACCEPT,
  attachmentProblem,
  composerDisabledReason,
  noteDisabledReason,
  restSendDisabledReason,
} from "../composerState";
import type { MessagingConnection } from "../useMessagingSocket";
import { cannedRepliesOptions } from "../messagingQueries";
import { AttachmentChip } from "./composer/AttachmentChip";
import { ComposerToolbar } from "./composer/ComposerToolbar";
import { SchedulePopover } from "./composer/SchedulePopover";
import { SlashMenu } from "./composer/SlashMenu";
import { useComposerText } from "./composer/useComposerText";

const MAX_LENGTH = 4096;

type Mode = "reply" | "note";

type Props = {
  conversationId: string;
  locked: boolean;
  canManage: boolean;
  connection: MessagingConnection;
  busy: { media: boolean; schedule: boolean; note: boolean };
  onSend: (text: string) => void;
  onNote: (text: string) => Promise<boolean>;
  onMedia: (file: File, caption: string) => Promise<boolean>;
  onSchedule: (text: string, sendAtIso: string) => Promise<boolean>;
  onOpenTemplates: () => void;
  onManageReplies: () => void;
};

function matching(replies: MessagingCannedReply[], query: string | null) {
  if (query === null)
    return [];
  return replies
    .filter(r => r.shortcut.startsWith(query) || r.title.toLowerCase().includes(query))
    .slice(0, 6);
}

export function Composer(props: Props) {
  const { conversationId, locked, canManage, connection, busy } = props;
  const replyReason = composerDisabledReason({ is_locked: locked }, canManage, connection);
  const restReason = restSendDisabledReason(locked, canManage);
  const noteReason = noteDisabledReason(canManage);
  const composer = useComposerText(conversationId);
  const [mode, setMode] = useState<Mode>("reply");
  const [file, setFile] = useState<File | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const replies = useQuery(cannedRepliesOptions());
  const suggestions = useMemo(() => matching(replies.data ?? [], composer.slash), [replies.data, composer.slash]);

  const noting = mode === "note";
  const reason = noting ? noteReason : replyReason;
  const lockBanner = locked && !noting && canManage;
  const text = composer.text.trim();
  const canSubmit = !reason && (noting ? Boolean(text) : Boolean(text) || Boolean(file));

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    const problem = picked ? attachmentProblem(picked) : null;
    if (problem)
      toast.error(problem);
    else if (picked)
      setFile(picked);
  };

  const submit = async () => {
    if (!canSubmit)
      return;
    const sent = noting
      ? await props.onNote(text)
      : file ? await props.onMedia(file, text) : (props.onSend(text), true);
    if (sent) {
      composer.clear();
      setFile(null);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing)
      return;
    e.preventDefault();
    if (suggestions.length > 0 && !noting)
      composer.expand(suggestions[0].body);
    else
      void submit();
  };

  return (
    <div className={cn("border-t border-border/50 p-3", noting && "bg-warning/5")}>
      <div className="mb-2 flex gap-1" role="tablist" aria-label="Message type">
        <Button size="sm" role="tab" aria-selected={!noting} variant={noting ? "ghost" : "secondary"} onClick={() => setMode("reply")}>
          <Send className="h-3.5 w-3.5" />
          Reply
        </Button>
        <Button size="sm" role="tab" aria-selected={noting} variant={noting ? "secondary" : "ghost"} onClick={() => setMode("note")}>
          <StickyNote className="h-3.5 w-3.5" />
          Private note
        </Button>
      </div>

      {lockBanner && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-warning/40 bg-warning/10 p-2">
          <p className="flex items-center gap-2 text-xs text-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            The 24-hour window has closed. Only an approved template can be sent now.
          </p>
          <Button size="sm" onClick={props.onOpenTemplates}>
            Send template
          </Button>
        </div>
      )}
      {reason && !lockBanner && <p className="mb-2 text-xs text-muted-foreground">{reason}</p>}

      {!noting && <SlashMenu replies={suggestions} onPick={reply => composer.expand(reply.body)} />}
      {file && !noting && <AttachmentChip file={file} onRemove={() => setFile(null)} />}

      <ComposerToolbar
        disabled={Boolean(reason)}
        attachDisabled={noting || Boolean(restReason)}
        onFormat={composer.format}
        onEmoji={composer.insert}
        onAttach={() => picker.current?.click()}
        onManageReplies={props.onManageReplies}
      >
        {!noting && (
          <SchedulePopover
            disabled={Boolean(restReason) || !text || Boolean(file)}
            busy={busy.schedule}
            onSchedule={sendAt => void props.onSchedule(text, sendAt).then(ok => ok && composer.clear())}
          />
        )}
      </ComposerToolbar>
      <input ref={picker} type="file" hidden accept={ATTACHMENT_ACCEPT} onChange={choose} />

      <div className="flex items-end gap-2">
        <Textarea
          ref={composer.ref}
          aria-label={noting ? "Private note" : "Message"}
          className="min-h-[40px] resize-none"
          rows={2}
          maxLength={MAX_LENGTH}
          placeholder={noting ? "Visible to staff only. Never sent to the customer." : file ? "Add a caption" : "Type a message, or / for quick replies"}
          value={composer.text}
          disabled={Boolean(reason)}
          onChange={e => composer.setText(e.target.value, e.target.selectionStart)}
          onSelect={e => composer.setText(e.currentTarget.value, e.currentTarget.selectionStart)}
          onKeyDown={onKeyDown}
        />
        <Button
          size="icon"
          aria-label={noting ? "Save note" : "Send message"}
          disabled={!canSubmit}
          loading={busy.media || busy.note}
          onClick={() => void submit()}
        >
          {noting ? <StickyNote className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
