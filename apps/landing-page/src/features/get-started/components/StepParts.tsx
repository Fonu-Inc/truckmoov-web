import type { ReactNode } from "react";
import {
  CheckCircle,
  Info,
} from "@phosphor-icons/react/dist/ssr";
import { Check } from "lucide-react";
import { cn } from "@/shared/utils";

// Small building blocks shared by the wizard steps.

/**
 * One step's screen: a scrolling body above a pinned footer. Steps render their own
 * `DialogFooter` here, so each decides its own Back / Continue actions.
 */
export function StepLayout({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 sm:px-7">{children}</div>
      {footer}
    </div>
  );
}

export function StepHeading({
  title,
  description,
  className,
  descriptionClassName,
}: {
  title: string;
  description: ReactNode;
  className?: string;
  descriptionClassName?: string;
}) {
  return (
    <header className={cn(
      "space-y-1 pt-[38px]",
      className,
    )}
    >
      <h2 className="text-[20px] leading-[25px] font-semibold text-heading">{title}</h2>
      <p className={cn(
        "text-sm leading-5 text-muted-foreground",
        descriptionClassName,
      )}
      >
        {description}
      </p>
    </header>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-base leading-5 font-semibold text-heading">{title}</h3>
        {description && <p className="mt-1 text-xs leading-[17px] text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function InfoRow({
  children,
  className,
  iconClassName,
}: {
  children: ReactNode;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <p className={cn(
      "flex items-start gap-2.5 text-sm text-heading",
      className,
    )}
    >
      <Info className={cn(
        "mt-px size-[18px] shrink-0",
        iconClassName,
      )}
      />
      <span>{children}</span>
    </p>
  );
}

/** Inline message: red for errors, neutral for notices. */
export function Notice({
  children,
  tone = "error",
  className,
}: {
  children: ReactNode;
  tone?: "error" | "info" | "success";
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[15px] px-4 py-3 text-sm",
        tone === "error" && "bg-destructive/10 text-destructive",
        tone === "info" && "bg-surface text-heading",
        tone === "success" && "bg-success-soft text-success-deep",
        className,
      )}
    >
      {children}
    </div>
  );
}

type BadgeTone = "success" | "warning" | "neutral" | "danger";

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span className={cn(
      "inline-flex h-5 shrink-0 items-center rounded-full px-3 text-2xs font-semibold whitespace-nowrap",
      tone === "success" && "bg-success-soft text-success-deep",
      tone === "warning" && "bg-warning-soft text-warning",
      tone === "neutral" && "bg-surface text-heading",
      tone === "danger" && "bg-destructive/10 text-destructive",
      className,
    )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className="h-2 w-full overflow-hidden rounded-full bg-surface"
    >
      <div
        className="h-full rounded-full bg-brand-deep transition-[width]"
        style={{
          width: `${Math.min(
            100,
            Math.max(
              0,
              value,
            ),
          )}%`,
        }}
      />
    </div>
  );
}

// Filled green check used on the document and review lists.
export function PassedIcon({ className }: { className?: string }) {
  return (
    <CheckCircle
      weight="fill"
      className={cn(
        "size-[21px] shrink-0 text-success",
        className,
      )}
    />
  );
}

// 90px pale-green halo with a 60px green disc and a check (verified / submitted).
export function SuccessMark({ className }: { className?: string }) {
  return (
    <span className={cn(
      "flex size-[90px] items-center justify-center rounded-full bg-success-bright/20",
      className,
    )}
    >
      <span className="flex size-[60px] items-center justify-center rounded-full bg-success-bright">
        <Check
          className="size-7 text-success-deep"
          strokeWidth={4}
        />
      </span>
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block animate-spin rounded-full border-brand-bright/25 border-t-brand-bright",
        className,
      )}
    />
  );
}

/** Centred spinner for a step that is still loading its data. */
export function LoadingBlock() {
  return (
    <div className="flex justify-center py-20">
      <Spinner className="size-10 border-[3px]" />
    </div>
  );
}
