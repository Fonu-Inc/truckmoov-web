import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export interface FuelTheftEvidence {
  previous_level: number;
  current_level: number;
  drop_percent: number;
  location_lat: number | null;
  location_lng: number | null;
  time_of_event: string;
  vehicle_was_stationary: boolean;
  corroborating_events: string[];
}

export interface FuelAnomalyWithTheft {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  anomaly_type: string;
  severity: string;
  fuel_drop_percent: number | null;
  confidence_score: number | null;
  theft_confidence_score: number | null;
  theft_evidence: FuelTheftEvidence | null;
  pattern_analysis: string | null;
  corroborating_events: string[];
  detected_at: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  notes: string | null;
}

export function useFuelTheftDetection() {
  const { user } = useAuthStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeTheftConfidence = useCallback(async (anomalyId: string) => {
    setIsAnalyzing(true);
    try {
      // Get the anomaly details
      const { data: anomaly, error } = await supabase
        .from('fuel_anomaly_events')
        .select('*')
        .eq('id', anomalyId)
        .single();

      if (error) throw error;

      // Calculate theft confidence based on evidence
      let confidenceScore = 0;
      const evidence: Partial<FuelTheftEvidence> = {};
      const corroborating: string[] = [];

      // Factor 1: Size of fuel drop (larger = more suspicious)
      if (anomaly.fuel_drop_percent) {
        if (anomaly.fuel_drop_percent >= 30) {
          confidenceScore += 30;
          corroborating.push('Large fuel drop (>30%)');
        } else if (anomaly.fuel_drop_percent >= 20) {
          confidenceScore += 20;
          corroborating.push('Significant fuel drop (>20%)');
        } else if (anomaly.fuel_drop_percent >= 15) {
          confidenceScore += 10;
          corroborating.push('Notable fuel drop (>15%)');
        }
      }

      // Factor 2: Location (if in known high-risk area - placeholder)
      if (anomaly.location_lat && anomaly.location_lng) {
        // In real implementation, check against geofences/known zones
        evidence.location_lat = anomaly.location_lat;
        evidence.location_lng = anomaly.location_lng;
      }

      // Factor 3: Time of day (night events more suspicious)
      const eventHour = new Date(anomaly.detected_at).getHours();
      if (eventHour >= 22 || eventHour <= 5) {
        confidenceScore += 15;
        corroborating.push('Event occurred at night');
      }

      // Factor 4: Existing confidence from anomaly detection
      if (anomaly.confidence_score) {
        confidenceScore += Math.round(anomaly.confidence_score * 20);
      }

      // Cap at 95% (never 100% certain without investigation)
      confidenceScore = Math.min(95, confidenceScore);

      // Update the anomaly with theft confidence
      const { error: updateError } = await supabase
        .from('fuel_anomaly_events')
        .update({
          theft_confidence_score: confidenceScore,
          theft_evidence: evidence,
          corroborating_events: corroborating,
          pattern_analysis: confidenceScore >= 60 
            ? 'Pattern suggests potential theft - recommend investigation'
            : confidenceScore >= 40
            ? 'Pattern inconclusive - may warrant review'
            : 'Pattern likely consistent with normal operations',
        })
        .eq('id', anomalyId);

      if (updateError) throw updateError;

      toast.success('Theft analysis complete', {
        description: `Confidence score: ${confidenceScore}%`,
      });

      return { confidenceScore, evidence, corroborating };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      toast.error('Theft analysis failed', { description: message });
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const getTheftRiskLevel = (confidence: number | null) => {
    if (confidence === null) return { level: 'unknown', color: 'text-muted-foreground' };
    if (confidence >= 70) return { level: 'high', color: 'text-red-600' };
    if (confidence >= 50) return { level: 'moderate', color: 'text-orange-600' };
    if (confidence >= 30) return { level: 'low', color: 'text-yellow-600' };
    return { level: 'minimal', color: 'text-green-600' };
  };

  return {
    isAnalyzing,
    analyzeTheftConfidence,
    getTheftRiskLevel,
  };
}



