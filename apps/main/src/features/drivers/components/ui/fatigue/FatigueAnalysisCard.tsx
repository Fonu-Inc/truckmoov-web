import type {
  DriverFatigueAnalysis, DriverFatigueRiskLevel,
} from "@truckmoov/api/fleet";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  ChevronDown, ChevronUp, Clock, Coffee,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";

/** The design app's per-risk colours: card gradient, score/ring text, badge. */
const riskStyles: Record<DriverFatigueRiskLevel, {
  gradient: string; text: string; badge: string;
}> = {
  critical: {
    gradient: "from-red-500/10",
    text: "text-red-400",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  high: {
    gradient: "from-orange-500/10",
    text: "text-orange-400",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  medium: {
    gradient: "from-yellow-500/10",
    text: "text-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  low: {
    gradient: "from-green-500/10",
    text: "text-green-400",
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
  },
};

/** Circumference of the r=40 score ring, as the design app rounds it. */
const RING = 251;

export function FatigueAnalysisCard({ analysis }: { analysis: DriverFatigueAnalysis }) {
  const [
    expanded,
    setExpanded,
  ] = useState(false);
  const style = riskStyles[analysis.riskLevel] ?? riskStyles.low;
  const score = Math.min(
    10,
    Math.max(
      0,
      analysis.score,
    ),
  );

  return (
    <div className={cn(
      "rounded-2xl surface-sleek text-card-foreground bg-gradient-to-r to-transparent border-border/50",
      style.gradient,
    )}
    >
      <div className="flex flex-col space-y-1.5 p-6 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-32 h-32">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/30"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${(score / 10) * RING} ${RING}`}
                  className={style.text}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn(
                  "text-2xl font-bold",
                  style.text,
                )}
                >
                  {analysis.score}
                </span>
                <span className="text-xs text-muted-foreground">/10</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold tracking-tight text-foreground font-display text-lg flex items-center gap-2">
                {analysis.driverName || "-"}
                <div className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  style.badge,
                )}
                >
                  {analysis.riskLevel}
                </div>
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {`${analysis.drivingMinutes ?? "-"} min driving`}
                </span>
                <span className="flex items-center gap-1">
                  <Coffee className="h-3 w-3" />
                  {`Rest compliance: ${analysis.restCompliance ?? "-"}/10`}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatWithPattern(
                  analysis.analyzedAt,
                  "MMM d, yyyy, h:mm:ss a",
                )}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label={expanded ? "Hide details" : "Show details"}
            aria-expanded={expanded}
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {/* The capture only shows collapsed cards; this panel's markup is ours. */}
      {expanded && (
        <div className="p-6 pt-0 space-y-3 text-sm">
          <p className="text-muted-foreground">{analysis.analysis || "-"}</p>
          <div>
            <p className="font-medium mb-1">Indicators</p>
            {analysis.indicators.length
              ? (
                  <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
                    {analysis.indicators.map(item => <li key={item}>{item}</li>)}
                  </ul>
                )
              : <p className="text-muted-foreground">-</p>}
          </div>
          <div>
            <p className="font-medium mb-1">Recommendations</p>
            {analysis.recommendations.length
              ? (
                  <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
                    {analysis.recommendations.map(item => <li key={item}>{item}</li>)}
                  </ul>
                )
              : <p className="text-muted-foreground">-</p>}
          </div>
        </div>
      )}
    </div>
  );
}
