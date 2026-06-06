import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface AutoBlockingRule {
  id: string;
  name: string;
  enabled: boolean;
  maxAttempts: number;
  timeWindowMinutes: number;
  blockDurationHours: number | null; // null = permanent
  description: string;
}

export interface IPGeolocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp: string;
  org: string;
  threat: {
    isTor: boolean;
    isProxy: boolean;
    isVpn: boolean;
    isDatacenter: boolean;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

const DEFAULT_RULES: AutoBlockingRule[] = [
  {
    id: 'rule-1',
    name: 'Standard Protection',
    enabled: true,
    maxAttempts: 5,
    timeWindowMinutes: 15,
    blockDurationHours: 24,
    description: 'Block IP after 5 failed attempts within 15 minutes for 24 hours'
  },
  {
    id: 'rule-2',
    name: 'Aggressive Protection',
    enabled: false,
    maxAttempts: 3,
    timeWindowMinutes: 10,
    blockDurationHours: 72,
    description: 'Block IP after 3 failed attempts within 10 minutes for 72 hours'
  },
  {
    id: 'rule-3',
    name: 'Brute Force Prevention',
    enabled: true,
    maxAttempts: 10,
    timeWindowMinutes: 60,
    blockDurationHours: null,
    description: 'Permanently block IP after 10 failed attempts within 1 hour'
  }
];

const STORAGE_KEY = 'auto_blocking_rules';

export function useAutoIPBlocking() {
  const [rules, setRules] = useState<AutoBlockingRule[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_RULES;
  });
  const [isProcessing] = useState(false);
  const [geoCache] = useState<Map<string, IPGeolocation>>(new Map());

  // Persist rules to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  }, [rules]);

  const updateRule = useCallback((ruleId: string, updates: Partial<AutoBlockingRule>) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
    toast.success('Rule updated successfully');
  }, []);

  const toggleRule = useCallback((ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  }, []);

  const addRule = useCallback((rule: Omit<AutoBlockingRule, 'id'>) => {
    const newRule: AutoBlockingRule = {
      ...rule,
      id: `rule-${Date.now()}`
    };
    setRules(prev => [...prev, newRule]);
    toast.success('New rule added');
  }, []);

  const deleteRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    toast.success('Rule deleted');
  }, []);

  const resetToDefaults = useCallback(() => {
    setRules(DEFAULT_RULES);
    toast.success('Rules reset to defaults');
  }, []);

  const getIPGeolocation = useCallback(async (_ipAddress: string): Promise<IPGeolocation | null> => {
    return null;
  }, []);

  const checkAutoBlock = useCallback(async (
    _ipAddress: string,
    _failedAttempts: number,
    _firstAttemptTime: Date,
    _blockIPFn: (ip: string, reason: string, options?: { expiresAt?: string; isPermanent?: boolean }) => Promise<boolean>
  ): Promise<boolean> => {
    return false;
  }, []);

  const batchGetGeolocation = useCallback(async (_ipAddresses: string[]): Promise<Map<string, IPGeolocation>> => {
    return new Map();
  }, []);

  return {
    rules,
    isProcessing,
    updateRule,
    toggleRule,
    addRule,
    deleteRule,
    resetToDefaults,
    checkAutoBlock,
    getIPGeolocation,
    batchGetGeolocation,
    geoCache
  };
}
