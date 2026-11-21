/**
 * time-utils — the single place in this repo that formats, parses, compares or
 * derives dates, times and durations.
 *
 * Do not write date/time logic in a component, page or hook. If something here
 * does not fit, add or widen a function here instead of writing a local copy.
 * See docs/time-utils.md.
 *
 * Conventions:
 * - Every function accepts `string | Date | null | undefined` and never throws
 *   on bad input; it returns the `fallback` (default `"—"`) or `null`.
 * - Display strings are en-NG / West Africa Time oriented, matching the rest
 *   of the product.
 * - date-fns does the heavy lifting; it is already a dependency of both apps.
 */

import {
  addDays as dfAddDays,
  addMonths as dfAddMonths,
  differenceInCalendarDays,
  differenceInMinutes,
  differenceInSeconds,
  endOfDay as dfEndOfDay,
  endOfMonth as dfEndOfMonth,
  format,
  formatDistanceToNow,
  formatDistanceToNowStrict,
  isAfter as dfIsAfter,
  isBefore as dfIsBefore,
  isValid,
  startOfDay as dfStartOfDay,
  startOfMonth as dfStartOfMonth,
  startOfWeek as dfStartOfWeek,
  subDays as dfSubDays,
  subMinutes as dfSubMinutes,
  subMonths as dfSubMonths,
} from 'date-fns'

/** Anything a caller might hand us: an ISO string from the API, a Date, or nothing. */
export type DateInput = string | Date | null | undefined

/** The default stand-in shown when a value is missing or unparseable. */
export const EMPTY_DATE_LABEL = '—'

// ─── Parsing ──────────────────────────────────────────────────────────────────

/**
 * Parse any `DateInput` into a Date, or `null` when it is missing or invalid.
 *
 * This is the guard every other function in this file goes through, and the
 * reason none of them ever render "Invalid Date". Use it directly whenever you
 * need a real Date object (sorting, arithmetic, passing to a chart library).
 */
export function toDate(value: DateInput): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return isValid(date) ? date : null
}

// ─── Absolute display formats ─────────────────────────────────────────────────

/**
 * Format with an explicit date-fns pattern. The escape hatch for one-off
 * layouts (chart axis ticks, export headers) that the named helpers below do
 * not cover. Prefer a named helper when one fits — that is what keeps dates
 * looking the same across screens.
 */
export function formatWithPattern(
  value: DateInput,
  pattern: string,
  fallback = EMPTY_DATE_LABEL,
): string {
  const date = toDate(value)
  return date ? format(date, pattern) : fallback
}

/** Standard date, e.g. "Mar 4, 2026". The default for table cells and detail rows. */
export function formatDate(value: DateInput, fallback = EMPTY_DATE_LABEL): string {
  return formatWithPattern(value, 'MMM d, yyyy', fallback)
}

/** Date + 24h time, e.g. "Mar 4, 2026 14:05". Use for audit trails and timelines. */
export function formatDateTime(value: DateInput, fallback = EMPTY_DATE_LABEL): string {
  return formatWithPattern(value, 'MMM d, yyyy HH:mm', fallback)
}

/** Time of day only, 24h, e.g. "14:05". */
export function formatTime(value: DateInput, fallback = EMPTY_DATE_LABEL): string {
  return formatWithPattern(value, 'HH:mm', fallback)
}

/**
 * Day, month and time with no year, e.g. "Mar 4, 14:05".
 *
 * The dense timestamp for activity feeds, batch queues and approval tables —
 * recent enough that the year is noise, precise enough to order events by.
 */
export function formatDayMonthTime(value: DateInput, fallback = EMPTY_DATE_LABEL): string {
  return formatWithPattern(value, 'MMM d, HH:mm', fallback)
}

/**
 * Fully spelled-out date, e.g. "March 4, 2026".
 *
 * For documents a human reads outside the app: generated letters, PDF and
 * Word export headers, printed reports.
 */
export function formatLongDate(value: DateInput, fallback = EMPTY_DATE_LABEL): string {
  return formatWithPattern(value, 'MMMM d, yyyy', fallback)
}

/**
 * Day and month with no year, e.g. "Mar 4". For chart axes and other dense
 * places where the year is already established by context.
 */
export function formatDayMonth(value: DateInput, fallback = EMPTY_DATE_LABEL): string {
  return formatWithPattern(value, 'MMM d', fallback)
}

/** Month and year, e.g. "Mar 2026". For billing periods and monthly groupings. */
export function formatMonthYear(value: DateInput, fallback = EMPTY_DATE_LABEL): string {
  return formatWithPattern(value, 'MMM yyyy', fallback)
}

// ─── Machine formats ──────────────────────────────────────────────────────────

/**
 * `yyyy-MM-dd`, the only date string that should ever leave the app.
 *
 * Use it for both `<input type="date">` values and API query params — they need
 * the same shape, so there is deliberately one function rather than two.
 * Returns `""` for a missing value, which is what an empty input expects.
 */
export function toDateParam(value: DateInput): string {
  return formatWithPattern(value, 'yyyy-MM-dd', '')
}

/**
 * `yyyy-MM-dd'T'HH:mm`, the value shape `<input type="datetime-local">` wants.
 * Returns `""` for a missing value.
 */
export function toDateTimeInputValue(value: DateInput): string {
  return formatWithPattern(value, "yyyy-MM-dd'T'HH:mm", '')
}

// ─── Relative display ────────────────────────────────────────────────────────

/**
 * Humanised time from now, e.g. "2 minutes ago", "in 3 days".
 *
 * This is the one relative formatter — "last seen", "last active", "requested",
 * "configured" and every other freshness column go through it. Pass the
 * fallback the column wants ("Never" for activity, "—" for a plain blank).
 */
export function formatRelative(value: DateInput, fallback = EMPTY_DATE_LABEL): string {
  const date = toDate(value)
  return date ? formatDistanceToNow(date, { addSuffix: true }) : fallback
}

/**
 * The bare distance from now with **no** suffix, e.g. "3 days", "2 hours".
 *
 * For places where the surrounding copy already supplies the direction —
 * `in {formatDistance(expiresAt)}`, or a chat list cell that just wants the age.
 * Using `formatRelative` there would read "in 3 days ago".
 */
export function formatDistance(value: DateInput, fallback = EMPTY_DATE_LABEL): string {
  const date = toDate(value)
  return date ? formatDistanceToNowStrict(date) : fallback
}

/**
 * Like `formatRelative` but without the hedging, e.g. "2 hours ago" rather than
 * "about 2 hours ago". Use when the exact figure matters more than readability —
 * SLA counters, queue ages.
 */
export function formatRelativeStrict(value: DateInput, fallback = EMPTY_DATE_LABEL): string {
  const date = toDate(value)
  return date ? formatDistanceToNowStrict(date, { addSuffix: true }) : fallback
}

/**
 * Terse time since, e.g. "Just now", "5 min ago", "2 hours ago", "3 days ago".
 *
 * The narrow-column alternative to `formatRelative`, which produces longer
 * prose ("about 2 hours ago", "less than a minute ago"). Use it in device and
 * telemetry tables where the cell has no room; use `formatRelative` everywhere
 * else. Only ever describes the past — future dates read as "Just now".
 */
export function formatCompactRelative(value: DateInput, fallback = EMPTY_DATE_LABEL): string {
  const date = toDate(value)
  if (!date) return fallback

  const minutes = Math.floor(Math.max(0, Date.now() - date.getTime()) / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

// ─── Durations ───────────────────────────────────────────────────────────────

/**
 * Elapsed clock time for media, e.g. 187 -> "3:07", 3725 -> "1:02:05".
 *
 * For call recordings, voice notes and any player scrubber — anywhere the
 * number is a position in a recording rather than a length of time in prose.
 */
export function formatClockDuration(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  const paddedSeconds = seconds.toString().padStart(2, '0')
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${paddedSeconds}`
  }
  return `${minutes}:${paddedSeconds}`
}

/**
 * Duration in prose, e.g. 45 -> "45 sec", 2700 -> "45 min", 8100 -> "2h 15m".
 *
 * For route ETAs, job durations and SLA timings. Takes **seconds** — callers
 * holding minutes should pass `minutes * 60` rather than adding a variant.
 */
export function formatHumanDuration(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0
  if (safe < 60) return `${Math.round(safe)} sec`
  const minutes = Math.round(safe / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

// ─── Comparisons and deadlines ───────────────────────────────────────────────

/**
 * Calendar days from today until `value`; negative when it is in the past,
 * `null` when there is no usable date.
 *
 * Drives every expiry and due-date badge — compliance documents, maintenance
 * profiles, SIM allocations. Let the caller decide the thresholds
 * (`days < 0` is expired, `days <= 30` is expiring soon).
 *
 * Counts *calendar* days, not 24-hour blocks: something due tomorrow morning is
 * 1 whether you ask tonight or at dawn, and anything due later today is 0. The
 * local copies this replaced used `differenceInDays`, which truncates — a
 * deadline three days out reported 2 because a few milliseconds had elapsed.
 */
export function daysUntil(value: DateInput): number | null {
  const date = toDate(value)
  return date ? differenceInCalendarDays(date, new Date()) : null
}

/** True when `value` is a real date in the past. Missing dates are not expired. */
export function isPast(value: DateInput): boolean {
  const date = toDate(value)
  return date ? date.getTime() < Date.now() : false
}

/** Whole calendar days from `from` to `to`. `null` if either side is unusable. */
export function daysBetween(from: DateInput, to: DateInput): number | null {
  const a = toDate(from)
  const b = toDate(to)
  return a && b ? differenceInCalendarDays(b, a) : null
}

/** Whole minutes from `from` to `to`. `null` if either side is unusable. */
export function minutesBetween(from: DateInput, to: DateInput): number | null {
  const a = toDate(from)
  const b = toDate(to)
  return a && b ? differenceInMinutes(b, a) : null
}

/** Whole seconds from `from` to `to`. `null` if either side is unusable. */
export function secondsBetween(from: DateInput, to: DateInput): number | null {
  const a = toDate(from)
  const b = toDate(to)
  return a && b ? differenceInSeconds(b, a) : null
}

/** True when `value` falls strictly before `other`. Unusable input is never before. */
export function isBefore(value: DateInput, other: DateInput): boolean {
  const a = toDate(value)
  const b = toDate(other)
  return a && b ? dfIsBefore(a, b) : false
}

/** True when `value` falls strictly after `other`. Unusable input is never after. */
export function isAfter(value: DateInput, other: DateInput): boolean {
  const a = toDate(value)
  const b = toDate(other)
  return a && b ? dfIsAfter(a, b) : false
}

/**
 * True when `value` falls inside the inclusive `[start, end]` window.
 *
 * Unlike date-fns `isWithinInterval`, this does not throw on a reversed or
 * unparseable interval — it returns false. Report filters feed it user input,
 * so throwing is never the behaviour you want.
 */
export function isWithinRange(value: DateInput, start: DateInput, end: DateInput): boolean {
  const date = toDate(value)
  const from = toDate(start)
  const to = toDate(end)
  if (!date || !from || !to || from > to) return false
  return date >= from && date <= to
}

// ─── Arithmetic and boundaries ───────────────────────────────────────────────
// Thin null-safe wrappers so feature code never imports date-fns for a shift.

/** `value` moved forward by `days`. `null` if `value` is unusable. */
export function addDays(value: DateInput, days: number): Date | null {
  const date = toDate(value)
  return date ? dfAddDays(date, days) : null
}

/** `value` moved back by `days`. `null` if `value` is unusable. */
export function subDays(value: DateInput, days: number): Date | null {
  const date = toDate(value)
  return date ? dfSubDays(date, days) : null
}

/** `value` moved back by `minutes`, e.g. a "22 minutes ago" demo timestamp. `null` if `value` is unusable. */
export function subMinutes(value: DateInput, minutes: number): Date | null {
  const date = toDate(value)
  return date ? dfSubMinutes(date, minutes) : null
}

/** `value` moved forward by `months`. `null` if `value` is unusable. */
export function addMonths(value: DateInput, months: number): Date | null {
  const date = toDate(value)
  return date ? dfAddMonths(date, months) : null
}

/** `value` moved back by `months`. `null` if `value` is unusable. */
export function subMonths(value: DateInput, months: number): Date | null {
  const date = toDate(value)
  return date ? dfSubMonths(date, months) : null
}

/** Midnight at the start of `value`'s day. For day-granular comparisons. */
export function startOfDay(value: DateInput): Date | null {
  const date = toDate(value)
  return date ? dfStartOfDay(date) : null
}

/** Last millisecond of `value`'s day. For an inclusive "to" bound on a date filter. */
export function endOfDay(value: DateInput): Date | null {
  const date = toDate(value)
  return date ? dfEndOfDay(date) : null
}

/** First moment of `value`'s month. For billing periods and monthly rollups. */
export function startOfMonth(value: DateInput): Date | null {
  const date = toDate(value)
  return date ? dfStartOfMonth(date) : null
}

/** Last moment of `value`'s month. */
export function endOfMonth(value: DateInput): Date | null {
  const date = toDate(value)
  return date ? dfEndOfMonth(date) : null
}

/** Monday at midnight, for weekly operational summaries. */
export function startOfWeek(value: DateInput): Date | null {
  const date = toDate(value)
  return date ? dfStartOfWeek(date, { weekStartsOn: 1 }) : null
}

/** Local hour boundary; inclusiveEnd selects the millisecond before that hour. */
export function atHour(value: DateInput, hour: number, inclusiveEnd = false): Date | null {
  const date = toDate(value)
  if (!date || !Number.isFinite(hour)) return null
  const result = new Date(date)
  result.setHours(hour, 0, 0, inclusiveEnd ? -1 : 0)
  return result
}

// ─── Reporting ranges ────────────────────────────────────────────────────────

/** Presets offered by the reporting and analytics date filters. */
export type DateRangePreset =
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | '3_months'
  | '6_months'
  | '1_year'

/**
 * Resolve a filter preset into a concrete `{ start, end, label }` window.
 *
 * The label is the human string for the filter chip, so the dropdown and the
 * data it produces can never drift apart. Unknown presets fall back to the last
 * 30 days rather than throwing.
 */
export function getDateRange(preset: DateRangePreset | string): {
  start: Date
  end: Date
  label: string
} {
  const now = new Date()
  switch (preset) {
    case 'this_month':
      return { start: dfStartOfMonth(now), end: now, label: 'This Month' }
    case 'last_month': {
      const lastMonth = dfSubMonths(now, 1)
      return {
        start: dfStartOfMonth(lastMonth),
        end: dfEndOfMonth(lastMonth),
        label: 'Last Month',
      }
    }
    case '3_months':
      return { start: dfSubMonths(now, 3), end: now, label: 'Last 3 Months' }
    case '6_months':
      return { start: dfSubMonths(now, 6), end: now, label: 'Last 6 Months' }
    case '1_year':
      return { start: dfSubMonths(now, 12), end: now, label: 'Last 12 Months' }
    default:
      return { start: dfSubDays(now, 30), end: now, label: 'Last 30 Days' }
  }
}

// ─── Timezones ───────────────────────────────────────────────────────────────

/** Timezones the product supports. WAT is the operating region; UTC is for raw comparison. */
export type Timezone = 'WAT' | 'UTC'

/** Display metadata for each supported timezone, used by the settings pickers. */
export const TIMEZONES: Record<Timezone, { name: string; offset: string; offsetHours: number }> = {
  WAT: { name: 'West Africa Time', offset: 'GMT+1', offsetHours: 1 },
  UTC: { name: 'Coordinated Universal Time', offset: 'GMT+0', offsetHours: 0 },
}

/** The timezone assumed when an organization has not chosen one. */
export const DEFAULT_TIMEZONE: Timezone = 'WAT'

/** IANA names for the supported timezones — what `Intl` actually needs. */
const IANA_TIMEZONES: Record<Timezone, string> = {
  WAT: 'Africa/Lagos',
  UTC: 'UTC',
}

/**
 * The zone helpers below also take a raw IANA name (e.g. a user's saved preference,
 * "America/New_York") — anything that isn't a `Timezone` key is passed to `Intl` as-is.
 */
function toIanaTimezone(timezone: Timezone | string): string {
  return timezone in IANA_TIMEZONES ? IANA_TIMEZONES[timezone as Timezone] : timezone
}

/**
 * Date + time rendered in a specific timezone, e.g. "4 Mar 2026, 14:05".
 *
 * Use this — not `formatDateTime` — whenever the exact wall-clock time in the
 * organization's timezone matters: dispatch windows, telemetry timestamps,
 * scheduled jobs. `options` is passed through to `Intl.DateTimeFormat`.
 */
export function formatDateInTimezone(
  value: DateInput,
  timezone: Timezone | string = DEFAULT_TIMEZONE,
  options: Intl.DateTimeFormatOptions = {},
  fallback = EMPTY_DATE_LABEL,
): string {
  const date = toDate(value)
  if (!date) return fallback

  // Intl throws when dateStyle/timeStyle are combined with granular fields
  // (year/month/day/...), so skip the granular defaults if the caller used either.
  const usesStyleShortcut = 'dateStyle' in options || 'timeStyle' in options
  const resolved: Intl.DateTimeFormatOptions = usesStyleShortcut
    ? { timeZone: toIanaTimezone(timezone), ...options }
    : {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: toIanaTimezone(timezone),
      ...options,
    }

  return date.toLocaleString('en-NG', resolved)
}

/** Time of day only, in a specific timezone, e.g. "14:05". */
export function formatTimeInTimezone(
  value: DateInput,
  timezone: Timezone | string = DEFAULT_TIMEZONE,
  fallback = EMPTY_DATE_LABEL,
): string {
  const date = toDate(value)
  if (!date) return fallback
  return date.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: toIanaTimezone(timezone),
  })
}

/** Date only, in a specific timezone, e.g. "4 Mar 2026". */
export function formatDateOnlyInTimezone(
  value: DateInput,
  timezone: Timezone | string = DEFAULT_TIMEZONE,
  fallback = EMPTY_DATE_LABEL,
): string {
  const date = toDate(value)
  if (!date) return fallback
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: toIanaTimezone(timezone),
  })
}

/** 12-hour time of day in a specific timezone, e.g. "9:30 AM". */
export function formatTime12InTimezone(
  value: DateInput,
  timezone: Timezone | string = DEFAULT_TIMEZONE,
  fallback = EMPTY_DATE_LABEL,
): string {
  const date = toDate(value)
  if (!date) return fallback
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: toIanaTimezone(timezone),
  })
}

/** Schedule slot in a specific timezone, e.g. "02 Oct 2026 · 9:30 AM". */
export function formatScheduleInTimezone(
  value: DateInput,
  timezone: Timezone | string = DEFAULT_TIMEZONE,
  fallback = EMPTY_DATE_LABEL,
): string {
  const date = toDate(value)
  if (!date) return fallback
  const day = date.toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: toIanaTimezone(timezone),
  })
  return `${day} · ${formatTime12InTimezone(date, timezone)}`
}

/** "Now" rendered in a timezone — for clocks and "as of" captions. */
export function getCurrentTimeInTimezone(timezone: Timezone = DEFAULT_TIMEZONE): string {
  return formatDateInTimezone(new Date(), timezone)
}

/** Label for a timezone picker option, e.g. "West Africa Time (GMT+1)". */
export function getTimezoneLabel(timezone: Timezone): string {
  const tz = TIMEZONES[timezone]
  return `${tz.name} (${tz.offset})`
}
