# General utils

**Small, domain-free helpers shared by both apps live in one file:**

```text
packages/app-core/src/utils/general-utils.ts
```

```tsx
import { getInitials } from "@truckmoov/app-core/utils/general-utils"
```

## The rule

Same rule as [time-utils](time-utils.md):

1. **Look in `general-utils.ts` first.**
2. **If it is there, import it.** Do not write your own version next to the code
   that needs it.
3. **If it is not, add it there** — so the next person finds it instead of
   writing a second copy.

Anything about dates, times or durations belongs in `time-utils.ts` instead.

## What's already there

**`getInitials(name)`** — the initials for an avatar or fallback badge: the
first letter of each of the first two words, upper-cased. Returns `"-"` when
there is no name. Takes `string | null | undefined` and never throws.

```tsx
<AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
```

| input | output |
| --- | --- |
| `"Adaeze Okafor"` | `AO` |
| `"Adaeze"` | `A` |
| `"Adaeze Chiamaka Okafor"` | `AC` |
| `"  Adaeze   Okafor  "` | `AO` |
| `undefined` / `null` / `""` | `-` |

Every avatar in both apps reads the same, so there is no per-site fallback —
no `"U"`, `"?"`, `"TM"` or `"DR"`. Outside this file there should be no
`name.charAt(0)` or `name.split(" ").map(n => n[0])`.

**`debounce(fn, wait)`** — wrap a function so it only fires after `wait` ms of
quiet. The returned function has `.cancel()`; call it from `useEffect`
cleanup so a pending trailing call doesn't run after the component unmounts.
Reach for it whenever a keystroke/resize/filter change should not fan out to
a request or heavy work on every tick.

```tsx
const debounced = useMemo(() => debounce(setDebounced, 300), [])
useEffect(() => () => debounced.cancel(), [debounced])
onChange={e => debounced(e.target.value)}
```

**`downloadBlob(blob, filename)`** — save a Blob (an API CSV export, a generated
file) to the user's downloads. Browser-only; a no-op without `document`.

```tsx
downloadBlob(await exportInstallerJobs(params), "installation-history.csv")
```

**`formatBytes(bytes)`** — a file or storage size as `B` / `KB` / `MB` / `GB`
(1024-based). Returns `"-"` for `null`/`undefined`, so an unknown size never
reads as zero.

```tsx
formatBytes(1536) // "1.5 KB"
```

**`escapeHtml(value)`** — escape a value for hand-built HTML (Leaflet popups,
print windows written with `document.write`). Every tenant-typed value that goes
into such a string goes through it. `null`/`undefined` become `""`.

```tsx
`<td>${escapeHtml(invoice.customer_name)}</td>`
```

## Adding a function

1. Write it in `general-utils.ts`, with a comment saying **when to reach for it**.
2. Never throw on missing input — return a sensible stand-in.
3. Add it to the section above.
4. Add the subpath to `packages/app-core/package.json` **only** if you create a
   new file — the `exports` block is explicit per file, and an import will not
   resolve without an entry.
