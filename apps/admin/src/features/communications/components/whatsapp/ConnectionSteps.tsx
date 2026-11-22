import type { WhatsAppConnectionStep } from "@truckmoov/api/notification";
import {
  CheckCircle2, Loader2, MinusCircle, XCircle,
} from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";
import { stepLabel } from "./accountHealth";

const PENDING_STEPS: WhatsAppConnectionStep["name"][] = [
  "token",
  "profile",
  "subscribed",
  "registered",
];

function StepIcon({ status }: { status: WhatsAppConnectionStep["status"] | "pending" }) {
  if (status === "pending")
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (status === "ok")
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (status === "skipped")
    return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
}

type RetryAction = {
  label: string;
  onClick: () => void;
  loading: boolean;
};

type ConnectionStepsProps = {
  steps?: WhatsAppConnectionStep[];
  /** Show every step as running, while the server links the number. */
  pending?: boolean;
  retry?: Partial<Record<WhatsAppConnectionStep["name"], RetryAction>>;
};

export function ConnectionSteps({
  steps, pending, retry,
}: ConnectionStepsProps) {
  const rows = pending
    ? PENDING_STEPS.map(name => ({
        name, status: "pending" as const, error: undefined,
      }))
    : (steps ?? []);
  return (
    <ul className="space-y-3">
      {rows.map((step) => {
        const action = step.status === "failed" ? retry?.[step.name] : undefined;
        return (
          <li
            key={step.name}
            className="flex items-start gap-3"
          >
            <span className="mt-0.5"><StepIcon status={step.status} /></span>
            <div className="min-w-0 flex-1">
              <p className={cn(
                "text-sm font-medium",
                step.status === "failed" && "text-destructive",
              )}
              >
                {stepLabel(step.name)}
                {step.status === "skipped" && " (not needed)"}
              </p>
              {step.error && <p className="text-xs text-muted-foreground">{step.error}</p>}
            </div>
            {action && (
              <Button
                size="sm"
                variant="outline"
                onClick={action.onClick}
                loading={action.loading}
              >
                {action.label}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
