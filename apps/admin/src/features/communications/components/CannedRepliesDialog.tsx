import type { MessagingCannedReply } from "@truckmoov/api/notification";
import { useQuery } from "@tanstack/react-query";
import {
  Pencil, Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Textarea } from "@/components/shadcn/textarea";
import { cannedRepliesOptions } from "../messagingQueries";
import { useCannedReplyActions } from "../useCannedReplyActions";

type Props = {
  open: boolean;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
};

const EMPTY = {
  shortcut: "", title: "", body: "",
};

function ReplyForm({
  editing, onDone,
}: {
  editing: MessagingCannedReply | null; onDone: () => void;
}) {
  const [
    form,
    setForm,
  ] = useState(editing ? {
    shortcut: editing.shortcut, title: editing.title, body: editing.body,
  } : EMPTY);
  const { save } = useCannedReplyActions(onDone);
  const complete = form.shortcut.trim() && form.title.trim() && form.body.trim();
  const field = (key: keyof typeof EMPTY) => (value: string) => setForm(current => ({
    ...current, [key]: value,
  }));

  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="canned-shortcut">Shortcut</Label>
          <Input
            id="canned-shortcut"
            placeholder="eta"
            maxLength={32}
            value={form.shortcut}
            onChange={e => field("shortcut")(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="canned-title">Title</Label>
          <Input
            id="canned-title"
            placeholder="Asking for an ETA"
            maxLength={80}
            value={form.title}
            onChange={e => field("title")(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="canned-body">Reply</Label>
        <Textarea
          id="canned-body"
          rows={3}
          maxLength={4096}
          value={form.body}
          onChange={e => field("body")(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDone}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!complete}
          loading={save.isPending}
          onClick={() => save.mutate({
            ...form, id: editing?.id,
          })}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

export function CannedRepliesDialog({
  open, canManage, onOpenChange,
}: Props) {
  const replies = useQuery({
    ...cannedRepliesOptions(), enabled: open,
  });
  const [
    editing,
    setEditing,
  ] = useState<MessagingCannedReply | "new" | null>(null);
  const { remove } = useCannedReplyActions();

  const close = (next: boolean) => {
    if (!next)
      setEditing(null);
    onOpenChange(next);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Quick replies</DialogTitle>
          <DialogDescription>Type / in the message box and a shortcut to insert one.</DialogDescription>
        </DialogHeader>
        {replies.isLoading && <Skeleton className="h-20 w-full" />}
        {replies.isError && <p className="text-sm text-destructive">Could not load quick replies.</p>}
        {replies.data?.length === 0 && editing === null && (
          <p className="text-sm text-muted-foreground">No quick replies yet.</p>
        )}
        <ul className="space-y-2">
          {replies.data?.map(reply => (
            <li
              key={reply.id}
              className="flex items-start gap-2 rounded-lg border border-border/60 p-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  /
                  {reply.shortcut}
                  <span className="ml-2 font-normal text-muted-foreground">{reply.title}</span>
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{reply.body}</p>
              </div>
              {canManage && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${reply.title}`}
                    onClick={() => setEditing(reply)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${reply.title}`}
                    loading={remove.isPending && remove.variables === reply.id}
                    onClick={() => remove.mutate(reply.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
        {editing !== null && (
          <ReplyForm
            key={editing === "new" ? "new" : editing.id}
            editing={editing === "new" ? null : editing}
            onDone={() => setEditing(null)}
          />
        )}
        {canManage && editing === null && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing("new")}
          >
            New quick reply
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
