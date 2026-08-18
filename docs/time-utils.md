# Time utils

**Every function that deals with time lives in one file:**

```text
packages/app-core/src/utils/time-utils.ts
```

```tsx
import { formatDate, formatRelative } from "@truckmoov/app-core/utils/time-utils"
```

## The rule

Whenever you need to format, parse, compare, shift or measure a date, a time or
a duration:

1. **Look in `time-utils.ts` first.** It probably already has what you need.
2. **If it does, import it.** Do not write your own version next to the code
   that needs it.
3. **If it does not, add it to `time-utils.ts`** and import it from there — so
   the next person to need it finds it instead of writing a third copy.

Never write time logic anywhere else. In practice that means, outside
`time-utils.ts`, no:

- `date-fns` imports
- `new Date(...)` used for formatting or comparison
- `toLocaleDateString` / `toLocaleTimeString` / `Intl.DateTimeFormat`
- millisecond arithmetic — `Date.now() - x`, `/ 60000`, `* 24 * 60 * 60 * 1000`

This applies to human developers and to any AI agent working in this repo.

## What's already there

The file itself is the source of truth — every export has a comment saying when
to reach for it. This is the quick index:

**Parsing** — `toDate`

**Display** — `formatDate`, `formatDateTime`, `formatTime`, `formatDayMonth`,
`formatDayMonthTime`, `formatMonthYear`, `formatLongDate`, `formatWithPattern`

**Machine / form values** — `toDateParam`, `toDateTimeInputValue`

**Relative** — `formatRelative`, `formatRelativeStrict`, `formatCompactRelative`,
`formatDistance`

**Durations** — `formatClockDuration`, `formatHumanDuration`

**Comparison and deadlines** — `daysUntil`, `daysBetween`, `minutesBetween`,
`secondsBetween`, `isPast`, `isBefore`, `isAfter`, `isWithinRange`

**Arithmetic and boundaries** — `addDays`, `subDays`, `addMonths`, `subMonths`,
`startOfDay`, `startOfMonth`, `endOfMonth`

**Reporting** — `getDateRange`

**Timezones** — `TIMEZONES`, `DEFAULT_TIMEZONE`, `getTimezoneLabel`,
`formatDateInTimezone`, `formatTimeInTimezone`, `formatDateOnlyInTimezone`,
`getCurrentTimeInTimezone`

**Types and constants** — `DateInput`, `Timezone`, `DateRangePreset`,
`EMPTY_DATE_LABEL`. Use these rather than redeclaring them.

Shared behaviour, so you never have to check:

- Every function takes `string | Date | null | undefined` and **never throws**.
- Missing or unparseable input returns the `fallback` (default `"—"`) or `null` —
  never `"Invalid Date"`. Pass your own where a column wants one:
  `formatRelative(user.lastActiveAt, "Never")`.

## Adding a function

1. Write it in `time-utils.ts`, with a comment saying **when to reach for it**.
2. Take `DateInput`, go through `toDate`, and accept a `fallback` if it returns a
   display string.
3. Add its name to the index above.
4. If the logic can be got wrong (branches, rounding, boundaries), add a case to
   `packages/app-core/src/utils/time-utils.test.ts` and run
   `pnpm --filter @truckmoov/app-core test`.

Reaching for `date-fns` inside `time-utils.ts` is correct and expected — it is
the one file allowed to import it.

## Setup

`@truckmoov/app-core` depends on `date-fns`, so run `pnpm install` after pulling
this if `time-utils` fails to resolve — pnpm links dependencies per package.
