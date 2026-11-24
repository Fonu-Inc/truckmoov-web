import type {
  DriverBehaviorBand, DriverBehaviorRankingItem,
} from "@truckmoov/api/fleet";
import { Phone } from "lucide-react";
import { CARD_CLASS } from "@/features/fleet/components/ui/violations/violationsUi";

const BADGE_BASE_CLASS = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent shadow-sm hover:bg-primary/90";
const GAUGE_PATH = "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";

const BAND_BADGE: Record<DriverBehaviorBand, {
  label: string; className: string;
}> = {
  excellent: {
    label: "Excellent", className: "bg-success text-success-foreground",
  },
  strong: {
    label: "Good", className: "bg-primary text-primary-foreground",
  },
  fair: {
    label: "Fair", className: "bg-warning text-warning-foreground",
  },
  poor: {
    label: "Poor", className: "bg-destructive text-destructive-foreground",
  },
  unscored: {
    label: "Unscored", className: "bg-muted text-muted-foreground",
  },
};

function ScoreGauge({
  score, label,
}: {
  score: number | null; label: string;
}) {
  const scoreColor = score === null
    ? "text-muted-foreground"
    : score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";
  return (
    <div className="text-center space-y-2">
      <div className="relative w-20 h-20 mx-auto">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 36 36"
        >
          <path
            d={GAUGE_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/20"
          />
          <path
            d={GAUGE_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${score ?? 0}, 100`}
            className={scoreColor}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${scoreColor}`}>{score ?? "-"}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/** One ranked driver on the Behavior Ranking sub-tab. */
export function BehaviourScoreCard({
  score, phone,
}: {
  score: DriverBehaviorRankingItem; phone: string;
}) {
  const badge = BAND_BADGE[score.band] ?? BAND_BADGE.poor;
  const { scores } = score;

  return (
    <div className={`${CARD_CLASS} hover:border-primary/50 transition-colors`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
              {score.rank === null ? "-" : `#${score.rank}`}
            </div>
            <div>
              <p className="font-semibold">{score.driverName}</p>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {phone}
              </p>
              <p className="text-xs text-muted-foreground">{`${score.eventsRecorded} events recorded`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* The design app shows a trend arrow here; the ranking API has no trend field. */}
            <span className="text-muted-foreground">-</span>
            <div className={`${BADGE_BASE_CLASS} ${badge.className}`}>{badge.label}</div>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-4 rounded-xl border border-border/50 bg-background/40 p-4 sm:flex-row sm:items-center">
          <ScoreGauge
            score={scores.overall}
            label="Overall"
          />
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-2xl font-semibold">Driving behavior Score</p>
            <p className="text-sm text-muted-foreground">The driving behavior score combines the driver&apos;s braking, acceleration, cornering, and speed performance to assess overall driving behavior.</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <ScoreGauge
            score={scores.braking}
            label="Braking"
          />
          <ScoreGauge
            score={scores.acceleration}
            label="Accel"
          />
          <ScoreGauge
            score={scores.cornering}
            label="Cornering"
          />
          <ScoreGauge
            score={scores.speed}
            label="Speed"
          />
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-destructive/10">
            <p className="font-semibold text-destructive">{scores.counts.hardBrake}</p>
            <p className="text-muted-foreground">Hard Brake</p>
          </div>
          <div className="p-2 rounded-lg bg-warning/10">
            <p className="font-semibold text-warning">{scores.counts.hardAccel}</p>
            <p className="text-muted-foreground">Hard Accel</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <p className="font-semibold text-primary">{scores.counts.sharpTurn}</p>
            <p className="text-muted-foreground">Sharp Turn</p>
          </div>
          <div className="p-2 rounded-lg bg-accent/10">
            <p className="font-semibold text-accent">{scores.counts.speeding}</p>
            <p className="text-muted-foreground">Speeding</p>
          </div>
        </div>
      </div>
    </div>
  );
}
