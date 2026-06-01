import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { SHORTCUTS, formatShortcut } from "@/hooks/useKeyboardShortcuts";

interface ShortcutItem {
  keys: string;
  description: string;
  category: string;
}

const shortcuts: ShortcutItem[] = [
  { keys: SHORTCUTS.search.display(), description: "Open search", category: "Navigation" },
  { keys: "/", description: "Focus search field", category: "Navigation" },
  { keys: SHORTCUTS.refresh.display(), description: "Refresh data", category: "Actions" },
  { keys: SHORTCUTS.newItem.display(), description: "Create new item", category: "Actions" },
  { keys: SHORTCUTS.escape.display(), description: "Close dialog / Cancel", category: "General" },
  { keys: formatShortcut("?", { shift: true }), description: "Show keyboard shortcuts", category: "General" },
];

interface KeyboardShortcutsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open: controlledOpen, onOpenChange }: KeyboardShortcutsDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + ? to open shortcuts dialog
      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ⌨️ Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {category}
              </h4>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <span className="text-sm">{item.description}</span>
                    <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center gap-1 rounded border border-border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center pt-2">
          Press <kbd className="inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px]">Esc</kbd> to close
        </p>
      </DialogContent>
    </Dialog>
  );
}
