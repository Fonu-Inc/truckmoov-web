export type Timezone = 'WAT' | 'UTC';

export const TIMEZONES: Record<Timezone, { name: string; offset: string; offsetHours: number }> = {
  WAT: { name: 'West Africa Time', offset: 'GMT+1', offsetHours: 1 },
  UTC: { name: 'Coordinated Universal Time', offset: 'GMT+0', offsetHours: 0 },
};

export const DEFAULT_TIMEZONE: Timezone = 'WAT';

export function formatDateInTimezone(
  date: Date | string,
  timezone: Timezone = DEFAULT_TIMEZONE,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const tzMap: Record<Timezone, string> = {
    WAT: 'Africa/Lagos',
    UTC: 'UTC',
  };
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tzMap[timezone],
    ...options,
  };
  
  return d.toLocaleString('en-NG', defaultOptions);
}

export function formatTimeInTimezone(
  date: Date | string,
  timezone: Timezone = DEFAULT_TIMEZONE
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const tzMap: Record<Timezone, string> = {
    WAT: 'Africa/Lagos',
    UTC: 'UTC',
  };
  
  return d.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tzMap[timezone],
  });
}

export function formatDateOnlyInTimezone(
  date: Date | string,
  timezone: Timezone = DEFAULT_TIMEZONE
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const tzMap: Record<Timezone, string> = {
    WAT: 'Africa/Lagos',
    UTC: 'UTC',
  };
  
  return d.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: tzMap[timezone],
  });
}

export function getCurrentTimeInTimezone(timezone: Timezone = DEFAULT_TIMEZONE): string {
  return formatDateInTimezone(new Date(), timezone);
}

export function getTimezoneLabel(timezone: Timezone): string {
  const tz = TIMEZONES[timezone];
  return `${tz.name} (${tz.offset})`;
}
