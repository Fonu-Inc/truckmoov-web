import { useState, useCallback } from 'react';
import { Job, Vehicle, Driver } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useAIConfigPermissions } from '@/hooks/useAIConfigPermissions';

export type MatchingMode = 'SIMULATION' | 'LIVE';

export interface MatchResult {
  vehicle: Vehicle;
  driver: Driver;
  matchScore: number;
  confidence: number;
  estimatedTime: string;
  distance: number;
  reasons: string[];
}

export interface MatchingResponse {
  matches: MatchResult[];
  analysis: string | null;
  provider: string | null;
  model: string | null;
  overallConfidence: number | null;
  requiresApproval: boolean;
  mode: MatchingMode;
  modeDowngraded: boolean;
  canSendOffers: boolean;
  canTriggerMessaging: boolean;
  canAssign: boolean;
  eligibleVehicleCount: number;
  eligibleDriverCount: number;
  candidatesConsidered: number;
}

interface UseJobMatchingOptions {
  defaultMode?: MatchingMode;
}

const SIMULATION_ONLY_ROLES = ['platform_admin', 'tenant_admin'];
const LIVE_CAPABLE_ROLES = ['dispatcher', 'supervisor', 'operations_manager'];

function getDefaultModeForRole(role: string | undefined): MatchingMode {
  if (!role) return 'SIMULATION';
  if (SIMULATION_ONLY_ROLES.includes(role)) return 'SIMULATION';
  if (LIVE_CAPABLE_ROLES.includes(role)) return 'LIVE';
  return 'SIMULATION';
}

function canRequestLiveMode(role: string | undefined): boolean {
  if (!role) return false;
  return LIVE_CAPABLE_ROLES.includes(role);
}

export function useJobMatching(options: UseJobMatchingOptions = {}) {
  const { user } = useAuthStore();
  const { canRunAIMatching, canViewAIResults, role } = useAIConfigPermissions();

  const [matches] = useState<MatchResult[]>([]);
  const isMatching = false;
  const matchProgress = 0;
  const analysis: string | null = null;
  const provider: string | null = null;
  const model: string | null = null;
  const overallConfidence: number | null = null;
  const requiresApproval = true;
  const error: string | null = null;
  const effectiveMode: MatchingMode = options.defaultMode || getDefaultModeForRole(role);
  const modeDowngraded = false;
  const canSendOffers = false;
  const canTriggerMessaging = false;
  const canAssign = false;
  const eligibleVehicleCount = 0;
  const eligibleDriverCount = 0;

  const runMatching = useCallback(async (
    _job: Job,
    _vehicles: Vehicle[],
    _drivers: Driver[],
    _requestedMode?: MatchingMode
  ): Promise<MatchingResponse | null> => null, []);

  const reset = useCallback(() => {}, []);

  return {
    matches,
    isMatching,
    matchProgress,
    runMatching,
    reset,
    error,
    analysis,
    provider,
    model,
    overallConfidence,
    requiresApproval,
    effectiveMode,
    modeDowngraded,
    isSimulationMode: effectiveMode === 'SIMULATION',
    isLiveMode: effectiveMode === 'LIVE',
    canSendOffers,
    canTriggerMessaging,
    canAssign,
    canRunAIMatching,
    canViewAIResults,
    canRequestLiveMode: canRequestLiveMode(role),
    defaultMode: getDefaultModeForRole(role),
    eligibleVehicleCount,
    eligibleDriverCount,
  };
}
