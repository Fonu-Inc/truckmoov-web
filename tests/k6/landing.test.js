// Landing page smoke + Web Vitals (strict "good" limits: it is the public
// site). No login. The "Get Started" wizard calls real APIs, so it is only
// opened and closed, never filled in.

import { browser } from "k6/browser";
import { byText, step, visit, waitForPath, waitVisible } from "./lib/checks.js";
import { smokeOptions, URLS } from "./lib/config.js";
import { requireApps } from "./lib/preflight.js";

const BASE = URLS.landing;

export const options = smokeOptions(BASE, { strict: true });

const h1 = text => byText(text, { tag: "h1" });

const PRODUCTS = [
  ["/product/fleet-management", "Fleet Management"],
  ["/product/live-tracking", "Live Tracking"],
  ["/product/dispatch-management", "Dispatch Management"],
  ["/product/ai-optimisation", "AI Optimization"],
  ["/product/analytics-reporting", "Analytics & Reporting"],
  ["/product/iot-sims-devices", "IoT SIMs & Devices"],
];

// The route segment really is spelled "stalkholder".
const STAKEHOLDERS = [
  ["/stalkholder/fleet-provider", "Fleet Provider"],
  ["/stalkholder/enterprise-admin", "Enterprise"],
  ["/stalkholder/owner-operator", "Owner Operator"],
  ["/stalkholder/aggregator-admin", "Aggregator"],
];

// Role, solution and resource pages share the stakeholder / solution / resource templates.
const OTHER_PAGES = [
  ["/roles/operations-manager", "Operations Manager"],
  ["/roles/driver", "Driver"],
  ["/solutions/enterprise-logistics", "Enterprise Logistics"],
  ["/solutions/ai-logistics-operations", "AI Logistics Operations"],
  ["/resources/documentation", "Documentation"],
  ["/resources/faqs", "FAQs"],
  ["/resources/help-articles", "Help Articles"],
];

export function setup() {
  requireApps(URLS, "landing");
}

export default async function () {
  const page = await browser.newPage();
  try {
    await step(page, "L1 home hero renders", () =>
      visit(page, `${BASE}/`, h1("Modern Fleet Management Built for Africa")));

    for (const [path, title] of PRODUCTS) {
      await step(page, `L2 product page ${path}`, () => visit(page, `${BASE}${path}`, h1(title)));
    }

    for (const [path, title] of STAKEHOLDERS) {
      await step(page, `L3 stakeholder page ${path}`, () => visit(page, `${BASE}${path}`, h1(title)));
    }

    for (const [path, title] of OTHER_PAGES) {
      await step(page, `L3 page ${path}`, () => visit(page, `${BASE}${path}`, h1(title)));
    }

    await step(page, "L4 header nav reaches a product page and home", async () => {
      await visit(page, `${BASE}/`, h1("Modern Fleet Management Built for Africa"));
      await page.locator(byText("Products", { tag: "a" })).first().hover();
      const link = page.locator("a[href=\"/product/live-tracking\"]").first();
      await link.waitFor({ state: "visible", timeout: 10000 });
      await link.click();
      await waitForPath(page, "/product/live-tracking");
      await waitVisible(page, h1("Live Tracking"));
      await page.locator("a[aria-label=\"Go to home\"]").first().click();
      await waitForPath(page, "/");
      await waitVisible(page, h1("Modern Fleet Management Built for Africa"));
    });

    await step(page, "L4 Apply for Account Creation opens the Get Started dialog", async () => {
      await page.locator(byText("Apply for Account Creation", { tag: "button", exact: false })).first().click();
      await waitVisible(page, "[role=\"dialog\"]");
      await page.keyboard.press("Escape");
    });
  }
  finally {
    await page.close();
  }
}
