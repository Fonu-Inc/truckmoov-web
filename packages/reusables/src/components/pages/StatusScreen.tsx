import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusScreenProps = {
  /** HTTP-style code, set as the large mono readout. */
  code: string;
  /** Log-line classification above the headline, e.g. "NO ROUTE · HTTP 404". */
  eyebrow: string;
  title: string;
  description: string;
  /** Accent for the left rail and the code. Defaults to destructive. */
  tone?: "primary" | "destructive";
  /** A single fact the reader needs — the requested path, the failing route. */
  detail?: { label: string; value: string };
  /** The action row. One button. */
  children: ReactNode;
  /** Slot between the body and the action row (the dev-only error block). */
  extra?: ReactNode;
};

/**
 * Full-bleed status screen: the platform reporting on itself in the same
 * diagnostic voice it uses for a vehicle. The 2px accent rail is the sidebar's
 * active-item device; the code is a flat mono readout, not a hero number.
 *
 * Presentational only — no router, no stores. The caller owns the action so
 * this stays usable from both apps and from inside an ErrorBoundary.
 */
export function StatusScreen({
  code,
  eyebrow,
  title,
  description,
  tone = "destructive",
  detail,
  children,
  extra,
}: StatusScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div
        className={cn(
          "w-full max-w-xl animate-fade-in rounded-lg border border-l-2 border-border/50 bg-card p-6 shadow-sm sm:p-8 motion-reduce:animate-none",
          tone === "primary" ? "border-l-primary" : "border-l-destructive",
        )}
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-baseline sm:gap-5">
          <span
            aria-hidden="true"
            className={cn(
              "font-mono text-[64px] leading-[0.85] tracking-tighter tabular-nums sm:text-[80px]",
              tone === "primary" ? "text-primary" : "text-destructive",
            )}
          >
            {code}
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:mt-0">
            {title}
          </h1>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {description}
        </p>

        {detail && (
          <div className="mt-6 flex flex-col gap-1 rounded-md border border-border/50 bg-background/60 px-3 py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {detail.label}
            </span>
            <span className="break-all font-mono text-xs text-foreground">
              {detail.value}
            </span>
          </div>
        )}

        {extra}

        <div className="mt-8">
          {children}
        </div>
      </div>
    </div>
  );
}
