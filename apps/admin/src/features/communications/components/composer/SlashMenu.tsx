import type { MessagingCannedReply } from "@truckmoov/api/notification";

type Props = {
  replies: MessagingCannedReply[];
  onPick: (reply: MessagingCannedReply) => void;
};

export function SlashMenu({ replies, onPick }: Props) {
  if (replies.length === 0)
    return null;
  return (
    <div role="listbox" aria-label="Quick replies" className="mb-2 max-h-44 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md">
      {replies.map(reply => (
        <button
          key={reply.id}
          type="button"
          role="option"
          aria-selected={false}
          className="flex w-full flex-col rounded-md px-2 py-1.5 text-left hover:bg-muted"
          onClick={() => onPick(reply)}
        >
          <span className="text-xs font-medium text-foreground">
            /
            {reply.shortcut}
            {" "}
            <span className="font-normal text-muted-foreground">{reply.title}</span>
          </span>
          <span className="line-clamp-1 text-xs text-muted-foreground">{reply.body}</span>
        </button>
      ))}
    </div>
  );
}
