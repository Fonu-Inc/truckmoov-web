# ClickUp comments — how to work on them

Guide for writing ClickUp comments when the user asks you to test an endpoint
(or a spec section) and post a comment on the results. The MCP server used is
`mcp__clickup__*`, and the browser used to hit dev-api is `mcp__playwright__*`.

## The workflow

1. **Probe first.** Never write a comment from the spec alone — the whole point
   is to compare the spec against what dev-api actually does. Use Playwright's
   `browser_evaluate` with `fetch(...)` from a signed-in origin
   (`http://localhost:3001`); the browser inherits the tenant's Bearer token
   from `localStorage.truckmoov_auth` (`state.accessToken`).
2. **Probe every claim in the section.** If the spec has three endpoints, hit
   all three. If it names five request fields, send all five. If it describes
   an error case (400 on invalid X), trigger it. Discover-mode probes are OK
   too: empty PUT to see if a whitelist accepts anything, garbage prop to force
   an error message that lists valid props.
3. **Post one comment per spec section**, targeting the same task the user is
   working on. Use `mcp__clickup__clickup_create_comment` with
   `entity_type: "task"` and `entity_id: <task-id>`.
4. **The comment is for bugs the backend has to fix.** If a probe passes,
   don't mention it. If a probe fails, name the endpoint, the request, the
   response, and what the spec expected instead.

## Getting credentials

Local dev credentials live at
`C:\Users\festu\Documents\github\Telconix-limited\credential.md`. Prefer
`ENTERPRISE_ADMIN` (`festusolaleyef@gmail.com`) unless the section is
role-specific — it has the widest access. Password is the same for every
account in that file.

If the session expired in the Playwright browser, sign in via a JS submit
against the login form (native React inputs need the `value` setter dispatched
manually):

```js
() => {
  const email = document.querySelector('input[type="email"], input[placeholder*="@"]');
  const pw = document.querySelector('input[type="password"]');
  const btn = [...document.querySelectorAll('button')].find(b => /sign in/i.test(b.textContent));
  const set = (el, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  set(email, 'festusolaleyef@gmail.com');
  set(pw, '12345678');
  btn.click();
};
```

Then check `JSON.parse(localStorage.truckmoov_auth).state.accessToken` before
firing probes.

## Comment structure

Copy this scaffold. Trim to the actual failures — no filler, no summaries of
things that worked.

```markdown
**Re: § N — <section title from the task description>**

**Title:** <one-line summary of what's broken>

**Type:** Bug / <not-yet-deployed | silent no-op | DTO gap | missing validation | wrong shape | ...>

**Priority:** Blocker for <the FE surface this blocks>

### Summary
Two or three sentences. What is broken, what still works, and whether the
endpoint even exists.

### Probes (dev-api, `ENTERPRISE_ADMIN`, YYYY-MM-DD)

**a) `<METHOD> /path`** → **<status>**
```json
<request or params>

→ <status>
<response body verbatim, trimmed if enormous>
```
One sentence of inline commentary only if the failure needs interpretation.

**b) …** (repeat per probe)

For tabular results (e.g. filter matrices) use a table:

| Request | Expected | Actual |
|---|---|---|
| `?issuedFrom=2099-01-01` | 0 rows | **1 row** |

### What needs to happen
- Bullet per fix. Name the endpoint, name the DTO field, name the missing
  validation. No vague "the endpoint should work".
```

### Rules

- **Probes go in first.** If you couldn't verify a claim, say so — don't wave
  it away and don't paper over it.
- **Include the request AND the response** for anything non-obvious. The
  backend dev shouldn't have to guess what you sent.
- **Absolute dates** in the probes header (`2026-09-09`, not "today").
- **Don't include "Frontend status" / "Impact" / "Verify" boilerplate.** The
  user has explicitly asked to strip those — the comment is only for endpoints
  with issues and what the error is.
- **Don't include probes that passed** unless the passing probe is what proves
  a *different* claim is broken (e.g. "empty PUT succeeds → so the endpoint
  exists → so the missing fields in the whitelist are the real bug").
- **Never invent field names.** If the spec says `wageAllocationMethod`, probe
  that. If the DTO rejects it, probe snake_case too so you can rule out casing,
  then report the finding.
- **Trim monster JSON.** Keep the first ~10 keys, or the specific keys that
  matter. Full listings live on the server; the comment is a diff, not a mirror.
- **Group the "What needs to happen" bullets by fix, not by symptom.** One
  bullet per code change the backend has to make.

## Finding the right task

```
mcp__clickup__clickup_search
  keywords: <slug or partial title>
  filters: { asset_types: ["task"] }
```

The task in this project so far is `TRU-FE-2 — Implement the My Vehicles tabs
against the updated fleet endpoints`, id `123qmzqxvtp`. Others in the same
list share the `TRU-FE-<n>` naming.

To read the spec sections you're commenting against:

```
mcp__clickup__clickup_get_task
  task_id: <id>
  include: ["description"]
```

## Editing / reassigning

- **Trim a posted comment:** `mcp__clickup__clickup_update_comment` with the
  `comment_id` returned from create. Only used when the user says a section
  passed and asks to remove it — never rewrite silently.
- **Reassign the task after all comments land:** typical flow is FE →
  backend dev. `mcp__clickup__clickup_update_task` with `assignees:
  [<userId>]` and `status: "be bugs"` (the list has both `fe bugs` and `be
  bugs` statuses). Resolve names to IDs with
  `mcp__clickup__clickup_resolve_assignees`.

## What NOT to do

- Don't create a new task for a bug that belongs on the existing one.
- Don't post one giant comment covering multiple spec sections — one section,
  one comment.
- Don't recommend frontend work in the comment. That's for the FE ticket, not
  the backend dev's inbox.
- Don't send `@` mentions unless the user asks — ClickUp switches the comment
  to plain text and drops all Markdown formatting.
- Don't quote the whole spec section back. The backend dev has the task open.
