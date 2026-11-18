import {
  CheckCircle,
  Info,
} from "@phosphor-icons/react/dist/ssr";
import { Check } from "lucide-react";
import { cn } from "@/shared/utils";

// Small building blocks shared by the wizard steps.

export function StepHeading({
  title,
  description,
  className,
  descriptionClassName,
}: {
  title: string;
  description: React.ReactNode;
  className?: string;
  descriptionClassName?: string;
}) {
  return (
    <header className={cn(
      "space-y-1",
      className,
    )}
    >
      <h2 className="text-[20px] leading-[25px] font-semibold text-heading">{title}</h2>
      <p className={cn(
        "text-sm leading-5 text-heading",
        descriptionClassName,
      )}
      >
        {description}
      </p>
    </header>
  );
}

export function InfoRow({
  children,
  className,
  iconClassName,
}: {
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <p className={cn(
      "flex items-center gap-2.5 text-sm text-heading",
      className,
    )}
    >
      <Info className={cn(
        "size-[18px] shrink-0",
        iconClassName,
      )}
      />
      <span>{children}</span>
    </p>
  );
}

// Filled green check used on the document check and review lists.
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
