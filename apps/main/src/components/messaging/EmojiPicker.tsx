import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Smile, Search } from "lucide-react";
import { TooltipWrapper } from "@/components/shadcn/tooltip-wrapper";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const emojiCategories = {
  "Smileys": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥"],
  "Gestures": ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🦾"],
  "Objects": ["📦", "🚚", "🚛", "🚗", "🚕", "🏭", "📍", "📱", "💻", "⌚", "📷", "🔋", "💡", "🔧", "🔨", "⚙️", "🔩", "📋", "📝", "✅", "❌", "⚠️", "🔔", "📢", "💰", "💵", "📊", "📈", "📉", "🗓️"],
  "Symbols": ["✅", "❌", "⚠️", "❗", "❓", "💯", "🔴", "🟢", "🟡", "🔵", "⭐", "🌟", "💫", "✨", "⚡", "🔥", "💥", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💕", "💖", "💗", "💘"],
  "Transport": ["🚚", "🚛", "🚗", "🚕", "🚙", "🚌", "🚐", "🏎️", "🚓", "🚑", "🚒", "🛻", "🚜", "🛵", "🏍️", "🚲", "✈️", "🚀", "🛳️", "⛴️", "🚢", "⛽", "🛣️", "🛤️", "🚦", "🚥", "🗺️", "🧭", "⏰", "🕐"],
};

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filteredEmojis = search
    ? Object.entries(emojiCategories).reduce((acc, [category, emojis]) => {
        const filtered = emojis.filter(() => category.toLowerCase().includes(search.toLowerCase()));
        if (filtered.length > 0) acc[category] = filtered;
        return acc;
      }, {} as Record<string, string[]>)
    : emojiCategories;

  const handleSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipWrapper content="Add emoji">
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="icon" className="h-8 w-8">
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
      </TooltipWrapper>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emojis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="p-2 space-y-3">
            {Object.entries(filteredEmojis).map(([category, emojis]) => (
              <div key={category}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{category}</p>
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji, idx) => (
                    <button
                      key={`${emoji}-${idx}`}
                      type="button"
                      className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted transition-colors text-lg"
                      onClick={() => handleSelect(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
