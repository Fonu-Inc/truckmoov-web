import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Timezone, DEFAULT_TIMEZONE } from "@truckmoov/app-core/utils/time-utils";
import type { ChartDateRange } from "@/components/shadcn/chart-date-filter";

interface PreferencesContextType {
  timezone: Timezone;
  setTimezone: (tz: Timezone) => void;
  defaultDateRange: ChartDateRange;
  setDefaultDateRange: (range: ChartDateRange) => void;
}

const STORAGE_KEY = "platform-preferences";

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [timezone, setTimezoneState] = useState<Timezone>(DEFAULT_TIMEZONE);
  const [defaultDateRange, setDefaultDateRangeState] = useState<ChartDateRange>("7d");

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.timezone) setTimezoneState(parsed.timezone);
        if (parsed.defaultDateRange) setDefaultDateRangeState(parsed.defaultDateRange);
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = (next: Partial<{ timezone: Timezone; defaultDateRange: ChartDateRange }>) => {
    try {
      const current = { timezone, defaultDateRange, ...next };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  };

  const setTimezone = (tz: Timezone) => {
    setTimezoneState(tz);
    persist({ timezone: tz });
  };

  const setDefaultDateRange = (range: ChartDateRange) => {
    setDefaultDateRangeState(range);
    persist({ defaultDateRange: range });
  };

  return (
    <PreferencesContext.Provider
      value={{ timezone, setTimezone, defaultDateRange, setDefaultDateRange }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within a PreferencesProvider");
  return ctx;
}
