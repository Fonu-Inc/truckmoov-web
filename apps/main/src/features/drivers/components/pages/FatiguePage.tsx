import type { ReactNode } from "react";
import { useDriverFatigueSummary } from "@truckmoov/api/fleet";
import {
  Activity, AlertTriangle, Brain, Coffee, Eye,
} from "lucide-react";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Skeleton } from "@/components/shadcn/skeleton";
import { FatigueAnalysisCard } from "@/features/drivers/components/ui/fatigue/FatigueAnalysisCard";

/** Scores come back as decimals; the design app shows whole-ish numbers out of 10. */
function formatScore(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : Number(value.toFixed(1));
}

/** Radix Progress, as plain markup so the rendered classes match the design app. */
function ScoreBar({
  value, className,
}: {
  value: number | null | undefined; className?: string;
}) {
  const percent = Math.min(
    100,
    Math.max(
      0,
      (value ?? 0) * 10,
    ),
  );
  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-secondary mt-2 h-2${className ? ` ${className}` : ""}`}>
      <div
        className="h-full w-full flex-1 transition-all duration-300 bg-primary"
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </div>
  );
}

/** `/drivers/fatigue` — the design app's Fatigue tab, backed by GET /fleet/drivers/fatigue/summary. */
export default function FatiguePage() {
  const summaryQuery = useDriverFatigueSummary();
  const summary = summaryQuery.data?.data;
  const isLoading = summaryQuery.isLoading && !summaryQuery.data;
  const recent = summary?.recent ?? [];
  const value = (render: () => ReactNode) => (isLoading || !summary ? "-" : render());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">Driver Fatigue Detection</h2>
          <p className="text-muted-foreground mt-1">Recorded driving patterns and rest compliance</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl surface-sleek text-card-foreground bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Average Fatigue Score
            </p>
          </div>
          <div className="p-6 pt-0">
            <div className="text-3xl font-bold">{value(() => `${formatScore(summary?.averageScore)}/10`)}</div>
            <ScoreBar value={summary?.averageScore} />
          </div>
        </div>
        <div className="rounded-2xl surface-sleek text-card-foreground bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Coffee className="h-4 w-4" />
              Average Rest Compliance
            </p>
          </div>
          <div className="p-6 pt-0">
            <div className="text-3xl font-bold">{value(() => `${formatScore(summary?.averageRestCompliance)}/10`)}</div>
            <ScoreBar
              value={summary?.averageRestCompliance}
              className="[&>div]:bg-green-500"
            />
          </div>
        </div>
        <div className="rounded-2xl surface-sleek text-card-foreground bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Alerts
            </p>
          </div>
          <div className="p-6 pt-0">
            <div className="text-3xl font-bold text-red-400">{value(() => summary?.criticalAlerts ?? 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">{`+ ${value(() => summary?.highRiskAlerts ?? 0)} high risk alerts`}</p>
          </div>
        </div>
        <div className="rounded-2xl surface-sleek text-card-foreground bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Total Analyses
            </p>
          </div>
          <div className="p-6 pt-0">
            <div className="text-3xl font-bold">{value(() => summary?.totalAnalyses ?? 0)}</div>
            <div className="flex gap-2 mt-2">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-border text-xs bg-green-500/10 text-green-400">
                {`${value(() => summary?.byRisk?.low ?? 0)} low`}
              </div>
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-border text-xs bg-yellow-500/10 text-yellow-400">
                {`${value(() => summary?.byRisk?.medium ?? 0)} med`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl surface-sleek text-card-foreground">
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Recent Fatigue Analyses
          </h3>
          <p className="text-sm text-muted-foreground">Recorded fatigue alerts and rest compliance</p>
        </div>
        <div className="p-6 pt-0">
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton
                      // eslint-disable-next-line react/no-array-index-key -- static placeholders
                      key={i}
                      className="h-40 w-full rounded-2xl"
                    />
                  ))
                : summaryQuery.isError
                  ? <p className="text-center py-8 text-muted-foreground">Failed to load fatigue analyses.</p>
                  : recent.length === 0
                    ? <p className="text-center py-8 text-muted-foreground">No fatigue analyses recorded yet.</p>
                    : recent.map(analysis => (
                        <FatigueAnalysisCard
                          key={analysis.id}
                          analysis={analysis}
                        />
                      ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
