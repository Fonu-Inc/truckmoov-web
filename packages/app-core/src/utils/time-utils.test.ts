import { expect, it } from 'vitest'
import { atHour, formatWithPattern, startOfWeek } from './time-utils'

it('uses Monday boundaries and non-overlapping hourly report buckets', () => {
  const sunday = '2026-09-27T12:00:00'
  expect(formatWithPattern(startOfWeek(sunday), 'yyyy-MM-dd HH:mm')).toBe('2026-09-21 00:00')
  expect(formatWithPattern(atHour(sunday, 10), 'HH:mm:ss.SSS')).toBe('10:00:00.000')
  expect(formatWithPattern(atHour(sunday, 10, true), 'HH:mm:ss.SSS')).toBe('09:59:59.999')
  expect(formatWithPattern(atHour(sunday, 24, true), 'yyyy-MM-dd HH:mm:ss.SSS')).toBe('2026-09-27 23:59:59.999')
  expect(startOfWeek('invalid')).toBeNull()
  expect(atHour(null, 10)).toBeNull()
  expect(atHour(sunday, Number.NaN)).toBeNull()
})
