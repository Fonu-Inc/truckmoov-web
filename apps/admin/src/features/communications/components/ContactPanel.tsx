import type {
  MessagingConversation,
  MessagingConversationPriority,
  MessagingConversationUpdate,
} from "@truckmoov/api/notification";
import { X } from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/shadcn/sheet";
import {
  conversationTitle, PRIORITY_LABEL, windowLabel,
} from "../messagingLogic";
import { useStaffDirectory } from "../useStaffDirectory";
import { LinkedAccounts } from "./LinkedAccounts";

type Props = {
  conversation: MessagingConversation;
  open: boolean;
  canManage: boolean;
  locked: boolean;
  secondsLeft: number;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (change: MessagingConversationUpdate) => void;
};

function Row({
  label, children,
}: {
  label: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function NameField({
  conversation, canManage, onUpdate,
}: Pick<Props, "conversation" | "canManage" | "onUpdate">) {
  const [
    name,
    setName,
  ] = useState(conversation.driver_name ?? "");
  useEffect(
    () => setName(conversation.driver_name ?? ""),
    [conversation.driver_name],
  );
  const changed = name.trim() !== (conversation.driver_name ?? "");

  return (
    <div className="space-y-1">
      <Label
        htmlFor="contact-name"
        className="text-xs text-muted-foreground"
      >
        Name
      </Label>
      <div className="flex gap-2">
        <Input
          id="contact-name"
          value={name}
          maxLength={120}
          disabled={!canManage}
          placeholder="Add a name"
          onChange={e => setName(e.target.value)}
        />
        {changed && (
          <Button
            size="sm"
            onClick={() => onUpdate({ name: name.trim() })}
          >
            Save
          </Button>
        )}
      </div>
    </div>
  );
}

function TagEditor({
  conversation, canManage, onUpdate,
}: Pick<Props, "conversation" | "canManage" | "onUpdate">) {
  const [
    draft,
    setDraft,
  ] = useState("");
  const add = () => {
    const tag = draft.trim().toLowerCase();
    setDraft("");
    if (tag && !conversation.tags.includes(tag)) {
      onUpdate({
        tags: [
          ...conversation.tags,
          tag,
        ],
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {conversation.tags.length === 0 && <span className="text-sm text-muted-foreground">No tags</span>}
        {conversation.tags.map(tag => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1"
          >
            {tag}
            {canManage && (
              <button
                type="button"
                aria-label={`Remove tag ${tag}`}
                onClick={() => onUpdate({ tags: conversation.tags.filter(t => t !== tag) })}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      {canManage && (
        <Input
          aria-label="Add tag"
          placeholder="Add a tag and press Enter"
          maxLength={32}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
      )}
    </div>
  );
}

export function ContactPanel(props: Props) {
  const {
    conversation, open, canManage, locked, secondsLeft, onOpenChange, onUpdate,
  } = props;
  const { nameOf } = useStaffDirectory();

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent className="w-full space-y-5 overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{conversationTitle(conversation)}</SheetTitle>
          <SheetDescription>Contact details and conversation settings.</SheetDescription>
        </SheetHeader>
        <NameField
          conversation={conversation}
          canManage={canManage}
          onUpdate={onUpdate}
        />
        <Row label="Phone">{conversation.driver_phone}</Row>
        <Row label="First message">{new Date(conversation.first_seen_at).toLocaleString()}</Row>
        <Row label="Reply window">
          {windowLabel(
            locked,
            secondsLeft,
          )}
        </Row>
        <Row label="Assigned to">{nameOf(conversation.assignee_user_id)}</Row>
        <Row label="Priority">
          <Select
            value={conversation.priority}
            disabled={!canManage}
            onValueChange={priority => onUpdate({ priority: priority as MessagingConversationPriority })}
          >
            <SelectTrigger aria-label="Priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(PRIORITY_LABEL) as MessagingConversationPriority[]).map(priority => (
                <SelectItem
                  key={priority}
                  value={priority}
                >
                  {PRIORITY_LABEL[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row label="Tags">
          <TagEditor
            conversation={conversation}
            canManage={canManage}
            onUpdate={onUpdate}
          />
        </Row>
        <LinkedAccounts conversationId={conversation.id} />
      </SheetContent>
    </Sheet>
  );
}
