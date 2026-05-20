import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Job, Vehicle, Driver } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useAIConfigPermissions } from '@/hooks/useAIConfigPermissions';
import { toast } from 'sonner';

// ============ TYPES ============

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
  /** Default mode for matching - will be enforced by backend based on role */
  defaultMode?: MatchingMode;
}

// ============ ROLE-BASED MODE DETERMINATION ============

// Roles that should default to SIMULATION mode (ADMIN roles)
const SIMULATION_ONLY_ROLES = ['platform_admin', 'tenant_admin'];

// Roles that can request LIVE mode
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

// ============ HOOK ============

export function useJobMatching(options: UseJobMatchingOptions = {}) {
  const { user } = useAuthStore();
  const { canRunAIMatching, canViewAIResults, role } = useAIConfigPermissions();
  
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [overallConfidence, setOverallConfidence] = useState<number | null>(null);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mode state
  const [effectiveMode, setEffectiveMode] = useState<MatchingMode>(
    options.defaultMode || getDefaultModeForRole(role)
  );
  const [modeDowngraded, setModeDowngraded] = useState(false);
  
  // Execution capabilities
  const [canSendOffers, setCanSendOffers] = useState(false);
  const [canTriggerMessaging, setCanTriggerMessaging] = useState(false);
  const [canAssign, setCanAssign] = useState(false);
  
  // Eligibility stats
  const [eligibleVehicleCount, setEligibleVehicleCount] = useState(0);
  const [eligibleDriverCount, setEligibleDriverCount] = useState(0);

  /**
   * Run job matching with mode control
   * Mode will be enforced server-side based on caller role
   */
  const runMatching = useCallback(async (
    job: Job,
    vehicles: Vehicle[],
    drivers: Driver[],
    requestedMode?: MatchingMode
  ): Promise<MatchingResponse | null> => {
    if (!canRunAIMatching) {
      setError('Your role does not have permission to run AI matching');
      toast.error('Permission denied', { description: 'AI matching is not available for your role' });
      return null;
    }

    setIsMatching(true);
    setMatchProgress(0);
    setMatches([]);
    setAnalysis(null);
    setProvider(null);
    setModel(null);
    setOverallConfidence(null);
    setError(null);

    // Determine the mode to request
    const modeToRequest = requestedMode || getDefaultModeForRole(role);

    try {
      // Simulate progress while AI is working
      const progressInterval = setInterval(() => {
        setMatchProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const { data, error: invokeError } = await supabase.functions.invoke('ai-load-matching', {
        body: {
          tenant_id: user?.tenantId,
          job: {
            ...job,
            deadline: job.deadline instanceof Date ? job.deadline.toISOString() : job.deadline,
          },
          vehicles: vehicles.map(v => ({
            id: v.id,
            registrationNumber: v.registrationNumber,
            make: v.make,
            model: v.model,
            type: v.type,
            status: v.status,
            capacity: v.capacity,
            fuelLevel: v.fuelLevel,
            location: v.location ? { lat: v.location.lat, lng: v.location.lng } : undefined,
          })),
          drivers: drivers.map(d => ({
            id: d.id,
            name: d.name,
            phone: d.phone,
            status: d.status,
            rating: d.rating,
            totalTrips: d.totalTrips,
            currentVehicle: d.currentVehicle,
          })),
          // NEW: Mode control
          mode: modeToRequest,
          requested_by_role: role,
          user_id: user?.id,
        },
      });

      clearInterval(progressInterval);
      setMatchProgress(100);

      if (invokeError) {
        console.error('AI matching error:', invokeError);
        setError(invokeError.message || 'AI matching failed');
        toast.error('AI matching failed', { description: invokeError.message });
        return null;
      }

      if (data?.error) {
        setError(data.error);
        toast.error('AI matching error', { description: data.error });
        return null;
      }

      // Extract response data
      const response: MatchingResponse = {
        matches: [],
        analysis: data?.analysis || null,
        provider: data?.provider || null,
        model: data?.model || null,
        overallConfidence: data?.overallConfidence || null,
        requiresApproval: data?.requiresApproval !== false,
        mode: data?.mode || 'SIMULATION',
        modeDowngraded: data?.modeDowngraded || false,
        canSendOffers: data?.canSendOffers || false,
        canTriggerMessaging: data?.canTriggerMessaging || false,
        canAssign: data?.canAssign || false,
        eligibleVehicleCount: data?.eligibleVehicleCount || 0,
        eligibleDriverCount: data?.eligibleDriverCount || 0,
        candidatesConsidered: data?.candidatesConsidered || 0,
      };

      // Map matches back to full Vehicle/Driver objects
      if (data?.matches && Array.isArray(data.matches)) {
        response.matches = data.matches.map((match: any) => {
          const vehicle = vehicles.find(v => v.id === match.vehicle?.id) || match.vehicle;
          const driver = drivers.find(d => d.id === match.driver?.id) || match.driver;
          
          return {
            vehicle,
            driver,
            matchScore: match.matchScore,
            confidence: match.confidence || 0.75,
            estimatedTime: match.estimatedTime,
            distance: match.distance,
            reasons: match.reasons,
          };
        });
      }

      // Update state
      setMatches(response.matches);
      setAnalysis(response.analysis);
      setProvider(response.provider);
      setModel(response.model);
      setOverallConfidence(response.overallConfidence);
      setRequiresApproval(response.requiresApproval);
      setEffectiveMode(response.mode);
      setModeDowngraded(response.modeDowngraded);
      setCanSendOffers(response.canSendOffers);
      setCanTriggerMessaging(response.canTriggerMessaging);
      setCanAssign(response.canAssign);
      setEligibleVehicleCount(response.eligibleVehicleCount);
      setEligibleDriverCount(response.eligibleDriverCount);

      // Notify user of mode downgrade
      if (response.modeDowngraded) {
        toast.info('Running in simulation mode', {
          description: 'Your role is restricted to simulation-only matching',
        });
      }

      if (response.matches.length > 0) {
        toast.success('AI matching complete', {
          description: `Found ${response.matches.length} optimal matches (${response.mode} mode)`,
        });
      } else {
        toast.info('No matches found', {
          description: 'No suitable vehicles or drivers available',
        });
      }

      return response;
    } catch (err) {
      console.error('AI matching exception:', err);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      toast.error('AI matching failed', { description: message });
      return null;
    } finally {
      setIsMatching(false);
    }
  }, [canRunAIMatching, role, user?.tenantId, user?.id]);

  const reset = useCallback(() => {
    setMatches([]);
    setIsMatching(false);
    setMatchProgress(0);
    setAnalysis(null);
    setProvider(null);
    setModel(null);
    setOverallConfidence(null);
    setRequiresApproval(true);
    setError(null);
    setEffectiveMode(getDefaultModeForRole(role));
    setModeDowngraded(false);
    setCanSendOffers(false);
    setCanTriggerMessaging(false);
    setCanAssign(false);
    setEligibleVehicleCount(0);
    setEligibleDriverCount(0);
  }, [role]);

  return {
    // Core matching
    matches,
    isMatching,
    matchProgress,
    runMatching,
    reset,
    error,
    
    // AI info
    analysis,
    provider,
    model,
    overallConfidence,
    requiresApproval,
    
    // Mode control
    effectiveMode,
    modeDowngraded,
    isSimulationMode: effectiveMode === 'SIMULATION',
    isLiveMode: effectiveMode === 'LIVE',
    
    // Execution capabilities (from server)
    canSendOffers,
    canTriggerMessaging,
    canAssign,
    
    // Role-based permissions (client-side for UI hints)
    canRunAIMatching,
    canViewAIResults,
    canRequestLiveMode: canRequestLiveMode(role),
    defaultMode: getDefaultModeForRole(role),
    
    // Eligibility stats
    eligibleVehicleCount,
    eligibleDriverCount,
  };
}
