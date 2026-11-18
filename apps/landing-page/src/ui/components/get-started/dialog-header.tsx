import {
  Rocket,
  X,
} from "lucide-react";
import {
  DialogClose,
  DialogDescription,
  DialogTitle,
} from "@/ui/shadcn/dialog";

// Wizard header: yellow rocket tile, title + subtitle, close X (Figma "Frame 1160464637").
export function DialogHeader({ onClose }: { onClose: () => void }) {
  return (
    <header className="relative flex shrink-0 items-center gap-[15px] border-b border-border-field px-7 py-9 pr-20">
      <span className="flex size-[60px] shrink-0 items-center justify-center rounded-[15px] bg-brand-tint">
        <Rocket
          className="size-6 text-brand-deep"
          strokeWidth={2}
        />
      </span>
      <div className="min-w-0 space-y-[7px]">
        <DialogTitle className="text-[20px] leading-[25px] font-medium text-heading">Get Started</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Start Your Fleet Journey With Us By Following These Simple Steps.
        </DialogDescription>
      </div>
      <DialogClose
        className="absolute top-[38px] right-9 cursor-pointer rounded-sm text-foreground transition-opacity hover:opacity-70"
        onClick={onClose}
      >
        <X
          className="size-6"
          strokeWidth={2}
        />
        <span className="sr-only">Close</span>
      </DialogClose>
    </header>
  );
}
