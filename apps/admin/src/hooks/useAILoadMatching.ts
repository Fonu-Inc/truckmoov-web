import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Job, Vehicle, Driver } from '@/types';
import { toast } from 'sonner';

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
  const [matches, setMatches] = useState<AIMatchResult[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [overallConfidence, setOverallConfidence] = useState<number | null>(null);
  const [requiresApproval, setRequiresApproval] = useState(true);

  const runMatching = async (job: Job, vehicles: Vehicle[], drivers: Driver[], tenantId?: string) => {
    setIsMatching(true);
    setMatchProgress(0);
    setMatches([]);
    setAnalysis(null);
    setProvider(null);
    setModel(null);
    setOverallConfidence(null);

    try {
      // Simulate progress while AI is working
      const progressInterval = setInterval(() => {
        setMatchProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const { data, error } = await supabase.functions.invoke('ai-load-matching', {
        body: {
          tenant_id: tenantId,
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
        },
      });

      clearInterval(progressInterval);
      setMatchProgress(100);

      if (error) {
        console.error('AI matching error:', error);
        toast.error('AI matching failed', {
          description: error.message || 'Please try again',
        });
        return;
      }

      if (data?.error) {
        toast.error('AI matching error', {
          description: data.error,
        });
        return;
      }

      if (data?.matches && Array.isArray(data.matches)) {
        // Map the response back to full Vehicle/Driver objects
        const enrichedMatches: AIMatchResult[] = data.matches.map((match: any) => {
          const vehicle = vehicles.find(v => v.id === match.vehicle?.id) || match.vehicle;
          const driver = drivers.find(d => d.id === match.driver?.id) || match.driver;
          
          return {
            vehicle,
            driver,
            matchScore: match.matchScore,
            estimatedTime: match.estimatedTime,
            distance: match.distance,
            reasons: match.reasons,
          };
        });

        setMatches(enrichedMatches);
        setAnalysis(data.analysis || null);
        setProvider(data.provider || null);
        setModel(data.model || null);
        setOverallConfidence(data.overallConfidence || null);
        setRequiresApproval(data.requiresApproval !== false);

        if (enrichedMatches.length > 0) {
          toast.success('AI matching complete', {
            description: `Found ${enrichedMatches.length} optimal matches`,
          });
        } else {
          toast.info('No matches found', {
            description: 'No suitable vehicles or drivers available',
          });
        }
      }
    } catch (err) {
      console.error('AI matching exception:', err);
      toast.error('AI matching failed', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsMatching(false);
    }
  };

  const reset = () => {
    setMatches([]);
    setIsMatching(false);
    setMatchProgress(0);
    setAnalysis(null);
    setProvider(null);
    setModel(null);
    setOverallConfidence(null);
    setRequiresApproval(true);
  };

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



