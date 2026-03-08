import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [geoCache, setGeoCache] = useState<Map<string, IPGeolocation>>(new Map());

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

  // Fetch IP geolocation
  const getIPGeolocation = useCallback(async (ipAddress: string): Promise<IPGeolocation | null> => {
    // Check cache first
    if (geoCache.has(ipAddress)) {
      return geoCache.get(ipAddress)!;
    }

    try {
      const { data, error } = await supabase.functions.invoke('ip-geolocation', {
        body: { ip_address: ipAddress }
      });

      if (error) throw error;

      const geolocation = data?.geolocation as IPGeolocation;
      
      if (geolocation) {
        setGeoCache(prev => new Map(prev).set(ipAddress, geolocation));
      }

      return geolocation || null;
    } catch (err) {
      console.error('Error fetching IP geolocation:', err);
      return null;
    }
  }, [geoCache]);

  // Check if an IP should be auto-blocked based on failed attempts
  const checkAutoBlock = useCallback(async (
    ipAddress: string,
    failedAttempts: number,
    firstAttemptTime: Date,
    blockIPFn: (ip: string, reason: string, options?: { expiresAt?: string; isPermanent?: boolean }) => Promise<boolean>
  ): Promise<boolean> => {
    const enabledRules = rules.filter(r => r.enabled);
    const now = new Date();

    for (const rule of enabledRules) {
      const windowStart = new Date(now.getTime() - rule.timeWindowMinutes * 60 * 1000);
      
      // Check if attempts are within the time window
      if (firstAttemptTime >= windowStart && failedAttempts >= rule.maxAttempts) {
        setIsProcessing(true);
        
        try {
          const expiresAt = rule.blockDurationHours 
            ? new Date(now.getTime() + rule.blockDurationHours * 60 * 60 * 1000).toISOString()
            : undefined;

          const reason = `Auto-blocked: ${failedAttempts} failed login attempts in ${rule.timeWindowMinutes} minutes (${rule.name})`;
          
          const success = await blockIPFn(ipAddress, reason, {
            expiresAt,
            isPermanent: !rule.blockDurationHours
          });

          if (success) {
            toast.warning(`IP ${ipAddress} has been automatically blocked`, {
              description: rule.name
            });
            return true;
          }
        } catch (error) {
          console.error('Error auto-blocking IP:', error);
        } finally {
          setIsProcessing(false);
        }
      }
    }

    return false;
  }, [rules]);

  // Batch fetch geolocation for multiple IPs
  const batchGetGeolocation = useCallback(async (ipAddresses: string[]): Promise<Map<string, IPGeolocation>> => {
    const results = new Map<string, IPGeolocation>();
    const uncachedIPs = ipAddresses.filter(ip => !geoCache.has(ip));

    // Get cached results
    ipAddresses.forEach(ip => {
      if (geoCache.has(ip)) {
        results.set(ip, geoCache.get(ip)!);
      }
    });

    // Fetch uncached IPs (with rate limiting)
    for (const ip of uncachedIPs.slice(0, 10)) { // Limit to 10 at a time
      const geo = await getIPGeolocation(ip);
      if (geo) {
        results.set(ip, geo);
      }
    }

    return results;
  }, [geoCache, getIPGeolocation]);

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
