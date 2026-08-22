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

## Adding a function

1. Write it in `general-utils.ts`, with a comment saying **when to reach for it**.
2. Never throw on missing input — return a sensible stand-in.
3. Add it to the section above.
4. Add the subpath to `packages/app-core/package.json` **only** if you create a
   new file — the `exports` block is explicit per file, and an import will not
   resolve without an entry.
