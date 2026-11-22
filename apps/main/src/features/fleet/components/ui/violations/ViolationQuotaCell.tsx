import type { ViolationSubject } from "@truckmoov/api/fleet";
import { Progress } from "@/components/shadcn/progress";
import { quotaText } from "@/features/fleet/components/ui/violations/violationsUi";

/** Quota use of the rule the subject last broke, as in the design app's Violations tab. */
export function ViolationQuotaCell({ quota }: { quota: ViolationSubject["quota"] }) {
  if (!quota)
    return <>—</>;
  return (
    <div className="w-28 space-y-1">
      <div className="flex justify-between text-xs">
        <span>{quotaText(quota)}</span>
        {quota.exceeded && <span className="text-destructive font-medium">Exceeded</span>}
      </div>
      <Progress
        value={quota.quota > 0 ? Math.min(
          100,
          (quota.used / quota.quota) * 100,
        ) : 100}
        className="h-1.5"
      />
    </div>
  );
}
