import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmojiPicker } from "./EmojiPicker";
import { Bold, Italic, Link2, Image, Strikethrough, Code } from "lucide-react";

interface FormattingToolbarProps {
  onFormat: (type: string, value?: string) => void;
  onEmojiSelect: (emoji: string) => void;
  activeFormats?: string[];
}

export function FormattingToolbar({ onFormat, onEmojiSelect, activeFormats = [] }: FormattingToolbarProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageOpen, setImageOpen] = useState(false);

  const handleInsertLink = () => {
    if (linkUrl) {
      onFormat("link", linkUrl);
      setLinkUrl("");
      setLinkOpen(false);
    }
  };

  const handleInsertImage = () => {
    if (imageUrl) {
      onFormat("image", imageUrl);
      setImageUrl("");
      setImageOpen(false);
    }
  };

  const formatButtons = [
    { type: "bold", icon: Bold, label: "Bold (*text*)", shortcut: "Ctrl+B" },
    { type: "italic", icon: Italic, label: "Italic (_text_)", shortcut: "Ctrl+I" },
    { type: "strikethrough", icon: Strikethrough, label: "Strikethrough (~text~)", shortcut: "" },
    { type: "code", icon: Code, label: "Code (`text`)", shortcut: "" },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 flex-wrap">
        {formatButtons.map(({ type, icon: Icon, label, shortcut }) => (
          <Tooltip key={type}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={activeFormats.includes(type) ? "secondary" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onFormat(type)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{label}</p>
              {shortcut && <p className="text-xs text-muted-foreground">{shortcut}</p>}
            </TooltipContent>
          </Tooltip>
        ))}

        <Popover open={linkOpen} onOpenChange={setLinkOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="h-8 w-8">
                  <Link2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Insert link</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-2">
              <p className="text-sm font-medium">Insert Link</p>
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInsertLink()}
              />
              <Button size="sm" className="w-full" onClick={handleInsertLink}>
                Insert
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={imageOpen} onOpenChange={setImageOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="h-8 w-8">
                  <Image className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Insert image (WhatsApp/Email only)</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-2">
              <p className="text-sm font-medium">Insert Image URL</p>
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInsertImage()}
              />
              <p className="text-xs text-muted-foreground">Note: Images work on WhatsApp and Email only</p>
              <Button size="sm" className="w-full" onClick={handleInsertImage}>
                Insert
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-6 w-px bg-border mx-1" />

        <EmojiPicker onEmojiSelect={onEmojiSelect} />
      </div>
    </TooltipProvider>
  );
}



