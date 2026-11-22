import {
  Signal,
  SignalLow,
  SignalZero,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import {
  EMPTY_VALUE,
  STATUS_LABELS,
} from "./simInventoryShared";

export function SimStatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  switch (status) {
    case "active":
      return <Badge className="bg-success/10 text-success border-success/30">{label}</Badge>;
    case "assigned":
      return <Badge variant="secondary">{label}</Badge>;
    case "suspended":
      return <Badge variant="destructive">{label}</Badge>;
    case "unassigned":
      return <Badge className="bg-warning/10 text-warning border-warning/30">{label}</Badge>;
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
}

export function SimSignalIcon({
  strength,
  status,
}: {
  strength: number | null;
  status: string;
}) {
  if (status !== "active" || strength === null)
    return <SignalZero className="h-4 w-4 text-muted-foreground" />;
  if (strength >= 70)
    return <Signal className="h-4 w-4 text-success" />;
  if (strength >= 30)
    return <SignalLow className="h-4 w-4 text-warning" />;
  return <SignalZero className="h-4 w-4 text-destructive" />;
}

export function EmptyCell() {
  return <span className="text-muted-foreground">{EMPTY_VALUE}</span>;
}
