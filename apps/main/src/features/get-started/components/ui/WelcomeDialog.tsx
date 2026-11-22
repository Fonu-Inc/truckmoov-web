import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { useAuthStore } from "@/features/auth/stores/authStore";

function readSeen(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  }
  catch {
    return false;
  }
}

function markSeen(key: string) {
  try {
    localStorage.setItem(
      key,
      "1",
    );
  }
  catch { /* storage blocked: shows once per load */ }
}

/** First visit to Get Started: a one-time greeting per user before they watch the installation. */
export function WelcomeDialog() {
  const userId = useAuthStore(s => s.user?.id) ?? "anon";
  const key = `truckmoov_welcome_seen:${userId}`;
  const [
    open,
    setOpen,
  ] = useState(() => !readSeen(key));

  const close = () => {
    markSeen(key);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => !next && close()}
    >
      <DialogContent className="max-w-md overflow-hidden p-0 sm:rounded-2xl">
        <div className="relative bg-background px-8 py-10">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute -right-2 -top-2 h-28 w-28 text-primary/60"
            viewBox="0 0 160 160"
            fill="none"
          >
            <g
              stroke="currentColor"
              strokeWidth="0.8"
            >
              <line
                x1="20"
                y1="40"
                x2="60"
                y2="20"
              />
              <line
                x1="60"
                y1="20"
                x2="100"
                y2="50"
              />
              <line
                x1="100"
                y1="50"
                x2="140"
                y2="30"
              />
              <line
                x1="60"
                y1="20"
                x2="80"
                y2="70"
              />
              <line
                x1="80"
                y1="70"
                x2="130"
                y2="80"
              />
              <line
                x1="100"
                y1="50"
                x2="130"
                y2="80"
              />
            </g>
            <g fill="currentColor">
              <circle
                cx="20"
                cy="40"
                r="2.4"
              />
              <circle
                cx="60"
                cy="20"
                r="2.4"
              />
              <circle
                cx="100"
                cy="50"
                r="2.4"
              />
              <circle
                cx="140"
                cy="30"
                r="2.4"
              />
              <circle
                cx="80"
                cy="70"
                r="2.4"
              />
              <circle
                cx="130"
                cy="80"
                r="2.4"
              />
            </g>
          </svg>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-2 -left-2 h-20 w-20 text-primary/60"
            viewBox="0 0 100 100"
            fill="none"
          >
            <g
              stroke="currentColor"
              strokeWidth="0.8"
            >
              <line
                x1="10"
                y1="60"
                x2="40"
                y2="40"
              />
              <line
                x1="40"
                y1="40"
                x2="70"
                y2="70"
              />
              <line
                x1="40"
                y1="40"
                x2="30"
                y2="80"
              />
            </g>
            <g fill="currentColor">
              <circle
                cx="10"
                cy="60"
                r="2.2"
              />
              <circle
                cx="40"
                cy="40"
                r="2.2"
              />
              <circle
                cx="70"
                cy="70"
                r="2.2"
              />
              <circle
                cx="30"
                cy="80"
                r="2.2"
              />
            </g>
          </svg>
          <div className="relative z-10 flex flex-col items-center gap-5 text-center">
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome to Fleet Pro 👋
            </DialogTitle>
            <DialogDescription className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
              Complete the following tasks to get your Fleet Pro dashboard ready.
            </DialogDescription>
            <Button
              className="h-11 rounded-full px-10 text-base font-semibold shadow-md"
              onClick={close}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
