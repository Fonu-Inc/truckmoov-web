import { daysBetween } from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/shadcn/button";

/**
 * US-E01-008 — Trial banner shown to tenants in trial status.
 * Displays days remaining in the 30-day trial period and a CTA to upgrade.
 * Auto-hides for non-trial tenants and on platform/aggregator routes.
 */
export function TrialBanner() {
  const tenant: {
    id: string;
    status: string;
    created_at: string;
  } | null = null;

  if (!tenant || tenant.status !== "trial")
    return null;

  // Default 30-day trial period from creation
  const TRIAL_LENGTH_DAYS = 30;
  const created = tenant.created_at ? new Date(tenant.created_at) : new Date();
  const elapsed = daysBetween(
    created,
    new Date(),
  );
  const daysRemaining = Math.max(
    0,
    TRIAL_LENGTH_DAYS - elapsed,
  );

  const tone
    = daysRemaining <= 3
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : daysRemaining <= 7
        ? "border-warning/40 bg-warning/10 text-warning"
        : "border-primary/40 bg-primary/10 text-primary";

  return (
    <div className={`mx-6 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-2.5 ${tone}`}>
      <div className="flex items-center gap-2 text-sm">
        <Sparkles className="h-4 w-4" />
        <span className="font-semibold">Trial active</span>
        <span className="text-foreground/80 inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {daysRemaining === 0
            ? "Trial ends today"
            : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`}
        </span>
      </div>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-8 gap-1.5"
      >
        <Link to="/settings/billing">
          Upgrade now
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}
