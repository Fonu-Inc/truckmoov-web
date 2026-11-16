// Main (tenant) app smoke + Web Vitals, for every tenant role.
// See docs/browser-tests.md.
//
// Public pages are checked once (login, auth links, /apply, /track). Then,
// for each role in lib/main-roles.js (ENTERPRISE_ADMIN, OWNER_OPERATOR,
// DISPATCHER, OPERATIONS_MANAGER, FINANCE_VIEWER), a fresh browser context
// logs in once and:
//   - lands on the role's home page with the right header title
//   - clicks through every sidebar page that role should see
//   - opens every Fleet / Data Bundles / Settings tab the role is shown
//     (and nested tab bars such as Financials and Subscription)
//   - is shown the 403 screen for a page it must not see
//   - logs out, and the session is really gone
// Limit roles with MAIN_ROLES=DISPATCHER,FINANCE_VIEWER; skip tabs with MAIN_TABS=0.
// If the API blocks the IP (rate limit), the remaining roles are not tried.
// Credentials: <ROLE>_EMAIL / <ROLE>_PASSWORD (or MAIN_PASSWORD), else credential.md.

import { browser } from "k6/browser";
import { errorToastText, expectRedirectToAuth, hasStoredToken, isIpBlocked, login } from "./lib/auth.js";
import {
  byText,
  isVisible,
  navigateViaSidebar,
  openTab,
  skip,
  step,
  tabBarLabels,
  tabHrefs,
  visit,
  waitForHeading,
  waitForPath,
  waitUntil,
  waitVisible,
} from "./lib/checks.js";
import { credentialsForRole, smokeOptions, URLS } from "./lib/config.js";
import { MAIN_ROLES, selectedRoles } from "./lib/main-roles.js";
import { requireApps } from "./lib/preflight.js";

const BASE = URLS.main;
const ROLES = selectedRoles();

export const options = smokeOptions(BASE, {
  maxDuration: "45m",
});

// Pages whose route tabs are walked: [sidebar href, its tab bar label].
const TAB_PAGES = [
  ["/fleet", "Fleet sections"],
  ["/data-bundles", "Data bundle sections"],
  ["/settings", "Settings sections"],
];

// Public pages reachable without a session. Token pages are opened without a
// token and must show their "invalid link" message rather than crash.
const PUBLIC_PAGES = [
  ["P1 forgot password", "/auth/forgot-password", byText("Reset your password", { exact: false })],
  ["P2 reset password without token", "/auth/reset-password", byText("This reset link is invalid", { exact: false })],
  ["P3 invite without token", "/auth/invite", byText("This invitation link is incomplete", { exact: false })],
  ["P4 verify email without token", "/auth/verify-email", byText("Verification link is invalid", { exact: false })],
  ["P5 complete profile without token", "/auth/complete-profile", byText("This profile link is invalid", { exact: false })],
  ["P6 apply for an account", "/apply", byText("Apply for a Fleet Pro account", { exact: false })],
  [
    "P7 unknown tracking link",
    "/track/k6-not-a-real-token",
    "//h1[contains(normalize-space(.), \"We couldn't load this tracking link\") or contains(normalize-space(.), \"no longer available\")]",
  ],
];

/** Run `fn(page)` in a fresh, logged-out browser context. */
async function withPage(fn) {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await fn(page);
  }
  finally {
    await page.close();
    await context.close();
  }
}

async function publicChecks(page) {
  const { email, password } = credentialsForRole(ROLES[0]);

  await step(page, "M1 login page renders", async () => {
    await visit(page, `${BASE}/auth`, "input[name=\"email\"]");
    await waitVisible(page, byText("Welcome back", { exact: false }));
    await waitVisible(page, "input[name=\"password\"]");
    await waitVisible(page, byText("Sign In", { tag: "button" }));
  });

  await step(page, "M2 logged-out redirect to /auth", () =>
    expectRedirectToAuth(page, BASE, "/jobs"));

  await step(page, "M3 wrong password is rejected", async () => {
    await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded" });
    await waitVisible(page, "input[name=\"email\"]");
    await page.locator("input[name=\"email\"]").fill(email);
    await page.locator("input[name=\"password\"]").fill(`${password}-wrong`);
    await page.locator("form button[type=\"submit\"]").first().click();
    await waitVisible(page, "[data-sonner-toast][data-type=\"error\"]");
    await errorToastText(page); // throws, and stops the role logins, if the IP is blocked
    await waitForPath(page, p => p.startsWith("/auth"));
  });

  for (const [name, path, ready] of PUBLIC_PAGES) {
    await step(page, `${name} (${path})`, async () => {
      await visit(page, `${BASE}${path}`, ready);
      // A public page must not bounce a logged-out visitor to /auth.
      if (!path.startsWith("/auth")) {
        await waitForPath(page, p => !p.startsWith("/auth"), 2000);
      }
    });
  }
}

/**
 * Open every tab in `bar` (as this role sees it), then any tab bar nested
 * inside a tab (Financials, Subscription). Each tab is its own check.
 */
async function walkTabs(page, role, bar, seen = new Set()) {
  seen.add(bar);
  const hrefs = await tabHrefs(page, bar);
  if (!hrefs.length) {
    skip(`${role} · ${bar}`, "no tab bar (one tab or none for this role)");
    return;
  }
  for (const href of hrefs) {
    const ok = await step(page, `${role} · tab ${href}`, () => openTab(page, bar, href));
    if (!ok) continue;
    for (const nested of await tabBarLabels(page)) {
      if (!seen.has(nested)) await walkTabs(page, role, nested, seen);
    }
  }
}

async function roleChecks(page, role) {
  const spec = MAIN_ROLES[role];
  const [homePath, homeHeading] = spec.home;

  const loggedIn = await step(page, `${role} · login lands on ${homePath} (${homeHeading})`, async () => {
    await login(page, BASE, credentialsForRole(role));
    await waitForPath(page, homePath);
    await waitForHeading(page, homeHeading);
    if (!(await hasStoredToken(page))) throw new Error("no accessToken in localStorage.truckmoov_auth");
  });
  if (!loggedIn) return;

  for (const [href, heading, group] of spec.pages) {
    await step(page, `${role} · sidebar → ${heading} (${href})`, () =>
      navigateViaSidebar(page, href, heading, group));
  }

  if (__ENV.MAIN_TABS !== "0") {
    for (const [href, bar] of TAB_PAGES) {
      const entry = spec.pages.find(([h]) => h === href);
      if (!entry) continue;
      const reached = await step(page, `${role} · open ${href} for tabs`, () =>
        navigateViaSidebar(page, href, entry[1], entry[2]));
      if (reached) await walkTabs(page, role, bar);
    }
  }

  await step(page, `${role} · ${spec.denied} is not authorized`, async () => {
    if (await isVisible(page, `nav a[href="${spec.denied}"]`)) {
      throw new Error(`sidebar shows ${spec.denied} to ${role}`);
    }
    await page.goto(`${BASE}${spec.denied}`, { waitUntil: "domcontentloaded" });
    // The guard shows the 403 screen ("You don’t have access"), at
    // /not-authorized or in place.
    await waitVisible(page, byText("You don", { tag: "h1", exact: false }));
  });

  if (role === "ENTERPRISE_ADMIN") {
    await step(page, "M6 server pagination on My Bundles", async () => {
      await page.goto(`${BASE}/data-bundles`, { waitUntil: "domcontentloaded" });
      const state = await waitUntil(async () => {
        if (await isVisible(page, "button[aria-label=\"Next page\"]")) return "paged";
        if (await isVisible(page, byText("No bundles match your filters.", { exact: false }))) return "empty";
        return null;
      }, { message: "the bundles table to load" });
      const next = page.locator("button[aria-label=\"Next page\"]");
      if (state === "empty" || await next.isDisabled()) {
        skip("M6 pagination", "only one page of bundles");
        return;
      }
      await next.click();
      await waitVisible(page, "//span[starts-with(normalize-space(.), \"Page 2 of\")]");
    });

    await step(page, "M7 unknown route shows 404", async () => {
      await page.goto(`${BASE}/this-does-not-exist`, { waitUntil: "domcontentloaded" });
      await waitVisible(page, byText("This page doesn", { tag: "h1", exact: false }));
    });
  }

  await step(page, `${role} · log out`, async () => {
    await page.goto(`${BASE}${homePath}`, { waitUntil: "domcontentloaded" });
    await waitForHeading(page, homeHeading);
    const { email } = credentialsForRole(role);
    // The profile menu trigger shows the signed-in email.
    await page.locator(`//header//button[contains(normalize-space(.), "${email}")]`).first().click();
    await page.locator("//*[@role=\"menuitem\"][normalize-space(.)=\"Log out\"]").first().click();
    await waitForPath(page, p => p.startsWith("/auth"));
    if (await hasStoredToken(page)) throw new Error("access token still stored after logout");
    // The session must really be gone: a protected page bounces to /auth.
    await page.goto(`${BASE}/jobs`, { waitUntil: "domcontentloaded" });
    await waitForPath(page, p => p.startsWith("/auth"));
  });
}

export function setup() {
  requireApps(URLS, "main");
}

export default async function () {
  await withPage(publicChecks);
  for (const role of ROLES) {
    if (isIpBlocked()) {
      console.error(`✗ skipping ${role} and the remaining roles: the API has blocked this IP`);
      break;
    }
    await withPage(page => roleChecks(page, role));
  }
}
