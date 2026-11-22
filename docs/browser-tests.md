# Browser tests (Grafana k6)

End-to-end smoke, Web Vitals, write, payment and load tests for the frontend apps live in
`tests/k6/`. They drive a real Chromium through k6's `k6/browser` module against a **running**
app — they do not import app code. Unit tests stay in Vitest next to the code they test.

## Install

k6 is a standalone binary, not an npm dependency.

```sh
winget install GrafanaLabs.k6     # Windows
brew install k6                   # macOS
```

Chrome or Chromium must be installed. Set `K6_BROWSER_HEADLESS=false` to watch a run.

## Run

Start the app(s) first (`pnpm dev:main`, `pnpm dev:admin`, `pnpm dev:installer`,
`pnpm dev:landing`), then:

| Script | File(s) | What it does |
|---|---|---|
| `pnpm test:k6:main` | `main.test.js` | Login page, logged-out redirect, wrong password, public pages (forgot/reset password, invite, verify email, complete profile without tokens, `/apply`, an unknown `/track/:token`); then **per tenant role** (ENTERPRISE_ADMIN, OWNER_OPERATOR, DISPATCHER, OPERATIONS_MANAGER, FINANCE_VIEWER): login lands on the role's home, every sidebar page renders with its role label, every Fleet / Data Bundles / Settings tab the role is shown opens cleanly (plus nested Financials / Subscription tabs), a forbidden page shows 403, and logout ends the session. Plus server pagination and 404 (enterprise admin) |
| `pnpm test:k6:admin` | `admin.test.js` | Login page, redirect, login, sidebar walk, tenant details dialog, pagination |
| `pnpm test:k6:installer` | `installer.test.js` | Login page, redirect, login, jobs list, job detail, other pages |
| `pnpm test:k6:landing` | `landing.test.js` | Home, product, stakeholder, role, solution and resource pages, header nav, Get Started dialog via "Apply for Account Creation" (opened only) |
| `pnpm test:k6:writes` | `main.writes.test.js`, `admin.writes.test.js` | Vehicle create → delete, driver form validation, SMS template create → delete |
| `pnpm test:k6:payments` | `main.payments.test.js` | `/onboarding` payment dialog, Paystack redirect, MoMo USSD code. The API only creates onboarding intents for a tenant **without a plan** (409 "already has a plan" otherwise), so the Paystack and MoMo steps are skipped with that reason when the account is subscribed; the dialog check still runs. Any other API error fails the step and is printed |
| `pnpm test:k6:cleanup` | `cleanup.test.js` | Deletes `k6-test-*` vehicles and SMS templates left by a crashed run |
| `pnpm test:k6:load` | `load.test.js` | Opt-in load test (see below) |

Screenshots of failed steps go to `tests/k6/screenshots/` (gitignored).

Every suite's `setup()` calls `requireApps()` (`lib/preflight.js`), which stops the run with
one message naming the `pnpm dev:*` command when an app it needs isn't reachable. k6's HTTP
client connects over IPv4, so every app's Vite config must set `server.host: "::"` (all
interfaces). The landing page does the same with `next dev -p 3000 -H ::` in its `dev` script.
A server bound to `::1` only works in the browser and fails this check.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `MAIN_URL`, `ADMIN_URL`, `INSTALLER_URL`, `LANDING_URL` | `http://localhost:3001` / `3002` / `3003` / `3000` | App under test |
| `MAIN_EMAIL` / `MAIN_PASSWORD` | from `credential.md` (ENTERPRISE_ADMIN) | Main app account (writes, payments, load; ENTERPRISE_ADMIN role in `main.test.js`) |
| `<ROLE>_EMAIL` / `<ROLE>_PASSWORD` | from `credential.md`; password falls back to `MAIN_PASSWORD` | Per-role accounts for `main.test.js`: `OWNER_OPERATOR`, `DISPATCHER`, `OPERATIONS_MANAGER`, `FINANCE_VIEWER` |
| `MAIN_ROLES` | all five | Comma list to run only some roles, e.g. `MAIN_ROLES=DISPATCHER,FINANCE_VIEWER` |
| `MAIN_TABS` | on | `0` skips the Fleet / Data Bundles / Settings tab walk (much faster) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | from `credential.md` (SUPER_ADMIN) | Admin app account |
| `INSTALLER_EMAIL` / `INSTALLER_PASSWORD` | from `credential.md` (INSTALLER) | Installer account |
| `MOMO_TEST_PHONE` | from `credential.md` (`MoMo test phone:` line) | MoMo payment test; the test is skipped when unset |
| `K6_ALLOW_LOAD` | unset | Must be `1` for `load.test.js` to start |
| `CREDENTIALS_FILE` | `credential.md` at the repo root | Alternative credentials file |
| `K6_SCREENSHOT_DIR` | `tests/k6/screenshots` | Where failure screenshots go |

Credentials come from the gitignored `credential.md` at the repo root
(`lib/config.js` parses its password line and `| ROLE | email |` table). Env vars win over the
file. Never put credentials in a test file, and never log them.

Accounts must not have 2FA enabled (or be forced into 2FA enrolment) — the login helper stops
with a clear message if they do.

## Safety rules

The apps talk to the shared dev API, which auto-blocks IPs under heavy traffic.

- Smoke, write and payment suites run **1 browser user, 1 iteration**, and log in once
  (`main.test.js` logs in once per role).
- The block is real: about eight logins in three minutes from one machine got the IP blocked
  ("This IP address is blocked" toast; the login helper reports it by name). Don't run
  every suite back to back, and stop as soon as you see that message — retrying extends it.
  Once a suite sees the block (on M3 or any login) it makes no further login attempts, so
  `main.test.js` skips the remaining roles instead of failing each one. Failure screenshots
  showing the "This IP address is blocked" toast mean the block, not a broken test.
- Wrong-password tests make exactly one bad login.
- Writes only create records named `k6-test-<timestamp>…` and delete them in the same run,
  with a best-effort retry in `finally`. Drivers cannot be deleted in the app (only
  suspended), so the driver test checks validation only and never submits a valid driver.
- Payment tests stop at the Paystack hosted checkout page / the MoMo USSD code. They create
  pending payment intents on the dev API; no money moves. Never add card details.
- The landing "Get Started" wizard calls real APIs: tests open and close it only.
- `load.test.js` refuses to start without `K6_ALLOW_LOAD=1` and should target deployed or
  production builds (`vite preview` for the Vite apps, `next start` for the landing page), not
  the dev servers (those serve hundreds of unbundled modules and compile routes on first hit).
  Its HTTP scenario fetches static HTML/JS/CSS only; two browser users add light API traffic.

## Thresholds

A run fails when any of these break:

- `checks` — every step must pass (`rate==1.0`).
- `page_ready_ms` p95 < 8 s — navigation start until the page's ready marker shows.
- Web Vitals p75: LCP < 4 s and CLS < 0.25 on `localhost` dev servers; LCP < 2.5 s and
  CLS < 0.1 on any other URL and always for the landing page. The payments suite skips vitals
  limits because the Paystack page is third-party.
- Load: `http_req_failed` < 1% and `http_req_duration` p95 < 1.5 s on the assets scenario.

## Writing tests

- The apps have no `data-testid`. Locate by `name`, label, `aria-label`, placeholder, or text
  via the XPath helpers in `lib/checks.js` (`byText`). Do not use `data-lov-*` attributes —
  they encode file positions and change with every edit.
- The dashboard header `<h1>` equals the sidebar label for the current role
  (`resolveLabel(matchNavEntry(pathname))`), so `navigateViaSidebar(page, href, heading)`
  clicks `nav a[href]` and waits for that heading.
- Wrap every test in `step(page, "ID description", fn)`: it records a k6 check, screenshots on
  failure, and lets the suite continue. Use `skip()` when there is nothing to test (e.g. one
  page of data) rather than failing.
- Only one browser context can be open at a time — close a page before opening another.
- `tests/k6/lib/main-roles.js` mirrors `apps/main/src/features/dashboard/utils/sidebarNav.ts`
  (which pages each role sees, and the `labelByRole` header title) and
  `features/auth/utils/authRedirect.ts` (each role's home). **When you change the main
  sidebar or a role's home, update that table** or `main.test.js` will fail.
- Route-tab bars are always `<nav aria-label="<Name> sections">` of NavLinks, and only list
  the tabs the role may open. `tabHrefs` / `openTab` / `tabBarLabels` in `lib/checks.js`
  read the bar at runtime, so tab tests need no per-role list — keep that `aria-label`
  convention when adding a tab bar. A tab passes when it becomes `aria-current="page"`
  and shows no 403, 404 or table error state.
- Collapsible sidebar groups (e.g. Communications) don't render their links until opened;
  pass the group label as `navigateViaSidebar`'s fourth argument.
- Name created records with `testName()` from `lib/data.js` and teach `cleanup.test.js` how to
  find them.

## Local only

These suites run locally only. There is no GitHub Actions workflow for them, and none should
be added.
