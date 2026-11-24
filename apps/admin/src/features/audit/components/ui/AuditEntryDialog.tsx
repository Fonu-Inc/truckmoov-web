import type { UnifiedAuditEntry } from "@/features/audit/utils/unifiedAudit";
import { Lock } from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import {
  outClass, sevClass,
} from "@/features/audit/components/ui/auditBadgeStyles";
import {
  CATEGORY_LABELS, OUTCOME_LABELS, SEVERITY_LABELS, SOURCE_LABELS,
} from "@/features/audit/utils/unifiedAudit";
import { cn } from "@/lib/utils";

type AuditEntryDialogProps = {
  entry: UnifiedAuditEntry | null;
  onClose: () => void;
  formatTimestamp: (ts: string) => string;
};

/** Full detail for one audit entry — device, failure reason, attempts and every extra field. */
export function AuditEntryDialog({
  entry: selected, onClose, formatTimestamp: fmt,
}: AuditEntryDialogProps) {
  return (
    <Dialog
      open={!!selected}
      onOpenChange={o => !o && onClose()}
    >
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        {selected && (
          <>
            <DialogHeader>
              <DialogTitle>{selected.action}</DialogTitle>
              <DialogDescription>{selected.description}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full",
                  outClass[selected.outcome],
                )}
              >
                {OUTCOME_LABELS[selected.outcome]}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full",
                  sevClass[selected.severity],
                )}
              >
                {SEVERITY_LABELS[selected.severity]}
              </Badge>
              <Badge
                variant="secondary"
                className="rounded-full"
              >
                {CATEGORY_LABELS[selected.category]}
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {([
                [
                  "Timestamp",
                  fmt(selected.timestamp),
                ],
                [
                  "Actor",
                  selected.actorEmail ? `${selected.actorName} (${selected.actorEmail})` : selected.actorName,
                ],
                [
                  "Tenant",
                  selected.tenantName,
                ],
                [
                  "Resource",
                  selected.resource,
                ],
                [
                  "IP address",
                  selected.ipAddress ?? "-",
                ],
                [
                  "Location",
                  selected.location ?? "-",
                ],
                [
                  "Device",
                  selected.device ?? "-",
                ],
                [
                  "Source",
                  SOURCE_LABELS[selected.source],
                ],
                ...Object.entries(selected.details),
              ] as [string, string][]).map(([
                k,
                v,
              ]) => (
                <div
                  key={k}
                  className="min-w-0 rounded-lg border p-3"
                >
                  <div className="text-xs text-muted-foreground">{k}</div>
                  <div className="mt-1 break-words">{v}</div>
                </div>
              ))}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              Immutable entry · retained 7 years
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
