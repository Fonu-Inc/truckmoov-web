import { Check, CheckCheck, Clock, XCircle } from "lucide-react";
import type { TickState } from "../messagingLogic";

const LABEL: Record<Exclude<TickState, "none">, string> = {
  clock: "Sending",
  one: "Sent",
  two: "Delivered",
  "two-blue": "Read",
  failed: "Not sent",
};

export function DeliveryTicks({ state }: { state: TickState }) {
  if (state === "none")
    return null;
  const label = LABEL[state];
  const icon = {
    clock: <Clock className="h-3 w-3 opacity-70" />,
    one: <Check className="h-3 w-3 opacity-70" />,
    two: <CheckCheck className="h-3 w-3 opacity-70" />,
    "two-blue": <CheckCheck className="h-3 w-3 text-info" />,
    failed: <XCircle className="h-3 w-3 text-destructive" />,
  }[state];
  return (
    <span className="inline-flex items-center gap-1" title={label} aria-label={label}>
      {icon}
    </span>
  );
}
