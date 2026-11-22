import { Smile } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";

const EMOJI = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😅",
  "😂",
  "🙂",
  "😉",
  "😊",
  "😇",
  "😍",
  "😘",
  "😋",
  "🤔",
  "😐",
  "🙄",
  "😬",
  "😢",
  "😭",
  "😡",
  "👍",
  "👎",
  "👌",
  "✌️",
  "🤝",
  "🙏",
  "👏",
  "🙌",
  "💪",
  "👋",
  "✅",
  "❌",
  "⚠️",
  "❗",
  "❓",
  "🔔",
  "📍",
  "📦",
  "🚚",
  "🚛",
  "⛽",
  "🛣️",
  "🚦",
  "🗺️",
  "📋",
  "📝",
  "📞",
  "📱",
  "📷",
  "💰",
  "📊",
  "⏰",
  "🗓️",
  "🔧",
  "⚙️",
  "🔋",
  "⭐",
  "🔥",
  "💯",
  "❤️",
];

type Props = {
  disabled?: boolean;
  onPick: (emoji: string) => void;
};

export function EmojiPicker({
  disabled, onPick,
}: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Add emoji"
          disabled={disabled}
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-2"
        align="start"
      >
        <div className="grid grid-cols-8 gap-1">
          {EMOJI.map(emoji => (
            <button
              key={emoji}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded text-lg transition-colors hover:bg-muted"
              onClick={() => onPick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
