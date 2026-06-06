import { useState } from 'react';
import { Job, Vehicle, Driver } from '@/types';

export interface AIMatchResult {
  vehicle: Vehicle;
  driver: Driver;
  matchScore: number;
  estimatedTime: string;
  distance: number;
  reasons: string[];
}

interface UseAILoadMatchingReturn {
  matches: AIMatchResult[];
  isMatching: boolean;
  matchProgress: number;
  analysis: string | null;
  provider: string | null;
  model: string | null;
  overallConfidence: number | null;
  requiresApproval: boolean;
  runMatching: (job: Job, vehicles: Vehicle[], drivers: Driver[], tenantId?: string) => Promise<void>;
  reset: () => void;
}

export function useAILoadMatching(): UseAILoadMatchingReturn {
  const [matches] = useState<AIMatchResult[]>([]);
  const [isMatching] = useState(false);
  const [matchProgress] = useState(0);
  const [analysis] = useState<string | null>(null);
  const [provider] = useState<string | null>(null);
  const [model] = useState<string | null>(null);
  const [overallConfidence] = useState<number | null>(null);
  const [requiresApproval] = useState(true);

  const runMatching = async (_job: Job, _vehicles: Vehicle[], _drivers: Driver[], _tenantId?: string) => {};

  const reset = () => {};

  return {
    matches,
    isMatching,
    matchProgress,
    analysis,
    provider,
    model,
    overallConfidence,
    requiresApproval,
    runMatching,
    reset,
  };
}
