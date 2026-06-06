import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

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
  const [isAnalyzing] = useState(false);

  const analyzeTheftConfidence = async (_anomalyId: string) => null;

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
