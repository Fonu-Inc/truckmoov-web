// Installer portal smoke + Web Vitals. See docs/browser-tests.md.
// Account: INSTALLER (INSTALLER_EMAIL / INSTALLER_PASSWORD or credential.md).

import { browser } from "k6/browser";
import { expectRedirectToAuth, login } from "./lib/auth.js";
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

const BASE = URLS.installer;
const CREDS = credentialsFor("INSTALLER");

export const options = smokeOptions(BASE);

const VIEW_DETAILS = "//table//button[normalize-space(.)=\"View Details\"]";

export function setup() {
  requireApps(URLS, "installer");
}

export default async function () {
  const page = await browser.newPage();
  try {
    await step(page, "I1 login page renders", async () => {
      await visit(page, `${BASE}/auth`, "input[name=\"email\"]");
      await waitVisible(page, byText("Installer sign in", { exact: false }));
      await waitVisible(page, "input[placeholder=\"installer@company.com\"]");
    });

    await step(page, "I2 logged-out redirect to /auth", () =>
      expectRedirectToAuth(page, BASE, "/jobs"));

    const loggedIn = await step(page, "I3 valid login lands on Dashboard", async () => {
      await login(page, BASE, CREDS);
      await waitForPath(page, "/");
      await waitForHeading(page, "Dashboard");
    });
    if (!loggedIn) return;

    let hasJobs = false;
    await step(page, "I4 jobs list renders", async () => {
      await navigateViaSidebar(page, "/jobs", "Installation Jobs");
      const state = await waitUntil(async () => {
        if (await isVisible(page, VIEW_DETAILS)) return "rows";
        if (await isVisible(page, byText("No installation jobs", { exact: false }))) return "empty";
        return null;
      }, { message: "the installation jobs table to load" });
      hasJobs = state === "rows";
    });

    if (hasJobs) {
      await step(page, "I5 job detail opens", async () => {
        await page.locator(VIEW_DETAILS).first().click();
        await waitForPath(page, /^\/jobs\/[^/]+$/);
        await waitVisible(page, byText("Back to jobs", { tag: "button", exact: false }));
        await waitVisible(page, byText("Customer & Site Details", { exact: false }));
      });
    }
    else {
      skip("I5 job detail opens", "no installation jobs for this installer");
    }

    for (const [href, heading] of [
      ["/notifications", "Notifications"],
      ["/settings", "Settings"],
      ["/support", "Support"],
    ]) {
      await step(page, `I6 sidebar → ${heading} (${href})`, () =>
        navigateViaSidebar(page, href, heading));
    }
  }
  finally {
    await page.close();
  }
}
