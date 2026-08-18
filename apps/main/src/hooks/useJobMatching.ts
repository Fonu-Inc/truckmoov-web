import { useState } from "react";

type MatchResult = any;

type UseJobMatchingReturn = {
  matches: MatchResult[];
  isMatching: boolean;
  matchProgress: number;
  analysis: string | null;
  provider: string | null;
  model: string | null;
  overallConfidence: number;
  requiresApproval: boolean;
  runMatching: (job: any, vehicles: any[], drivers: any[], mode?: string) => void;
  reset: () => void;
  error: string | null;
  effectiveMode: string;
  modeDowngraded: boolean;
  isSimulationMode: boolean;
  isLiveMode: boolean;
  canSendOffers: boolean;
  canTriggerMessaging: boolean;
  canAssign: boolean;
  canRunAIMatching: boolean;
  canViewAIResults: boolean;
  canRequestLiveMode: boolean;
  defaultMode: string;
  eligibleVehicleCount: number;
  eligibleDriverCount: number;
};

export function useJobMatching(): UseJobMatchingReturn {
  const [
    matches,
    setMatches,
  ] = useState<MatchResult[]>([]);
  const [
    isMatching,
    setIsMatching,
  ] = useState(false);
  const [
    matchProgress,
    setMatchProgress,
  ] = useState(0);
  const [
    analysis,
    setAnalysis,
  ] = useState<string | null>(null);
  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const runMatching = async (job: any, vehicles: any[], drivers: any[], _mode?: string) => {
    setIsMatching(true);
    setMatchProgress(0);
    setError(null);

    try {
      // Stub: simulate progress and return top 3 vehicle/driver pairs
      for (const pct of [
        30,
        60,
        90,
        100,
      ]) {
        await new Promise(r => setTimeout(
          r,
          300,
        ));
        setMatchProgress(pct);
      }

      const availableVehicles = vehicles.filter(v => v.status === "active").slice(
        0,
        3,
      );
      const availableDrivers = drivers.filter(d => d.status === "available" || d.status === "active");

      const stubMatches = availableVehicles.map((vehicle, i) => ({
        vehicle,
        driver: availableDrivers[i % availableDrivers.length] || availableDrivers[0],
        matchScore: 95 - i * 5,
        confidence: 0.9 - i * 0.05,
        estimatedTime: `${30 + i * 10} min`,
        distance: 15 + i * 5,
        reasons: [
          "Available",
          "Capacity match",
        ],
      }));

      setMatches(stubMatches);
      setAnalysis("AI matching complete. Top candidates identified based on proximity and capacity.");
    }
    catch {
      setError("AI matching unavailable. Please select manually.");
    }
    finally {
      setIsMatching(false);
    }
  };

  const reset = () => {
    setMatches([]);
    setIsMatching(false);
    setMatchProgress(0);
    setAnalysis(null);
    setError(null);
  };

  return {
    matches,
    isMatching,
    matchProgress,
    analysis,
    provider: "internal",
    model: "stub",
    overallConfidence: 0.85,
    requiresApproval: false,
    runMatching,
    reset,
    error,
    effectiveMode: "simulation",
    modeDowngraded: false,
    isSimulationMode: true,
    isLiveMode: false,
    canSendOffers: false,
    canTriggerMessaging: false,
    canAssign: false,
    canRunAIMatching: true,
    canViewAIResults: true,
    canRequestLiveMode: false,
    defaultMode: "simulation",
    eligibleVehicleCount: 0,
    eligibleDriverCount: 0,
  };
}
