import type { ReactNode } from "react";
import type { FormatKind } from "./formatting";
import {
  Bold, Code, Italic, Paperclip, Strikethrough, Zap,
} from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { EmojiPicker } from "./EmojiPicker";

const FORMATS: {
  kind: FormatKind; label: string; icon: typeof Bold;
}[] = [
  {
    kind: "bold", label: "Bold", icon: Bold,
  },
  {
    kind: "italic", label: "Italic", icon: Italic,
  },
  {
    kind: "strike", label: "Strikethrough", icon: Strikethrough,
  },
  {
    kind: "code", label: "Monospace", icon: Code,
  },
];

type Props = {
  disabled: boolean;
  attachDisabled: boolean;
  onFormat: (kind: FormatKind) => void;
  onEmoji: (emoji: string) => void;
  onAttach: () => void;
  onManageReplies: () => void;
  children?: ReactNode;
};

export function ComposerToolbar({
  disabled, attachDisabled, onFormat, onEmoji, onAttach, onManageReplies, children,
}: Props) {
  return (
    <div className="mb-2 flex items-center gap-0.5">
      {FORMATS.map(({
        kind, label, icon: Icon,
      }) => (
        <Button
          key={kind}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          disabled={disabled}
          onClick={() => onFormat(kind)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
      <EmojiPicker
        disabled={disabled}
        onPick={onEmoji}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Attach a file"
        disabled={attachDisabled}
        onClick={onAttach}
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Quick replies"
        onClick={onManageReplies}
      >
        <Zap className="h-4 w-4" />
      </Button>
      <div className="ml-auto flex items-center gap-0.5">{children}</div>
    </div>
  );
}
