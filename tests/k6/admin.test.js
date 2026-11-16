// Admin (platform) app smoke + Web Vitals. See docs/browser-tests.md.
// Account: SUPER_ADMIN (ADMIN_EMAIL / ADMIN_PASSWORD or credential.md).

import { browser } from "k6/browser";
import { expectRedirectToAuth, hasStoredToken, login } from "./lib/auth.js";
import {
  byText,
  isVisible,
  navigateViaSidebar,
  skip,
  step,
  visit,
  waitForHeading,
  waitForPath,
  waitUntil,
  waitVisible,
} from "./lib/checks.js";
import { credentialsFor, smokeOptions, URLS } from "./lib/config.js";
import { requireApps } from "./lib/preflight.js";

const BASE = URLS.admin;
const CREDS = credentialsFor("ADMIN");

export const options = smokeOptions(BASE);

const WALK = [
  ["/tenants", "Tenants"],
  ["/installers", "Installers"],
  ["/devices", "Devices"],
  ["/sims", "IoT SIMs"],
  ["/data-bundles", "M2M IoT Bundles"],
  ["/subscription", "Billing"],
  ["/security", "Security"],
  ["/compliance-audit", "Compliance & Audit"],
  ["/settings", "Settings"],
  // Children of the collapsible "Communications" sidebar group.
  ["/inbox", "Messaging Center", "Communications"],
  ["/sms-templates", "SMS Templates", "Communications"],
];

export function setup() {
  requireApps(URLS, "admin");
}

export default async function () {
  const page = await browser.newPage();
  try {
    await step(page, "A1 login page renders", async () => {
      await visit(page, `${BASE}/auth`, "input[name=\"email\"]");
      await waitVisible(page, "input[placeholder=\"admin@company.com\"]");
      await waitVisible(page, byText("Sign In", { tag: "button" }));
    });

    await step(page, "A2 logged-out redirect to /auth", () =>
      expectRedirectToAuth(page, BASE, "/tenants"));

    const loggedIn = await step(page, "A3 valid login lands on Dashboard", async () => {
      await login(page, BASE, CREDS);
      await waitForPath(page, "/");
      await waitForHeading(page, "Dashboard");
      if (!(await hasStoredToken(page))) throw new Error("no accessToken in localStorage.truckmoov_auth");
    });
    if (!loggedIn) return;

    for (const [href, heading, group] of WALK) {
      await step(page, `A4 sidebar → ${heading} (${href})`, () =>
        navigateViaSidebar(page, href, heading, group));
    }

    // Rows have no link to /tenants/:id; "View Details" opens a dialog.
    await step(page, "A5 tenant details open from the row menu", async () => {
      await navigateViaSidebar(page, "/tenants", "Tenants");
      const state = await waitUntil(async () => {
        if (await isVisible(page, "//table//tbody/tr[td[last()]//button]")) return "rows";
        if (await isVisible(page, byText("No tenants found", { exact: false }))) return "empty";
        return null;
      }, { message: "the tenants table to load" });
      if (state === "empty") {
        skip("A5 tenant details", "no tenants");
        return;
      }
      await page.locator("//table//tbody/tr[td[last()]//button]/td[last()]//button").first().click();
      await page.locator("//*[@role=\"menuitem\"][normalize-space(.)=\"View Details\"]").first().click();
      await waitVisible(page, "[role=\"dialog\"]");
      await page.keyboard.press("Escape");
    });

    await step(page, "A6 tenants pagination", async () => {
      const next = page.locator("button[aria-label=\"Next page\"]");
      if (!(await isVisible(page, "button[aria-label=\"Next page\"]")) || await next.isDisabled()) {
        skip("A6 tenants pagination", "10 tenants or fewer (one page)");
        return;
      }
      await next.click();
      await waitVisible(page, "//span[starts-with(normalize-space(.), \"Page 2 of\")]");
    });
  }
  finally {
    await page.close();
  }
}
