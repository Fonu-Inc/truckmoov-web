// Admin create/delete test: an SMS template named k6-test-* is created and
// deleted in the same run. No SMS is sent ("Send a test" is never clicked).
// Needs the admin.messaging.manage permission.

import { browser } from "k6/browser";
import { login } from "./lib/auth.js";
import { byText, navigateViaSidebar, step, waitVisible } from "./lib/checks.js";
import { credentialsFor, smokeOptions, URLS } from "./lib/config.js";
import { testName } from "./lib/data.js";
import { deleteTemplate, searchTemplates, templateMenuButton, templateVisible } from "./lib/sms-templates.js";
import { requireApps } from "./lib/preflight.js";

const BASE = URLS.admin;
const CREDS = credentialsFor("ADMIN");

export const options = smokeOptions(BASE);

export function setup() {
  requireApps(URLS, "admin");
}

export default async function () {
  const page = await browser.newPage();
  const name = testName("sms");
  let created = false;
  let deleted = false;
  try {
    if (!(await step(page, "login", () => login(page, BASE, CREDS)))) return;

    created = await step(page, "AW1 create SMS template", async () => {
      await navigateViaSidebar(page, "/sms-templates", "SMS Templates", "Communications");
      const newButton = byText("New template", { tag: "button" });
      await waitVisible(page, newButton, 15000).catch(() => {
        throw new Error("no \"New template\" button — the account lacks admin.messaging.manage");
      });
      await page.locator(newButton).first().click();
      await waitVisible(page, "#sms-name");
      await page.locator("#sms-name").fill(name);
      await page.locator("#sms-content").fill("k6 automated test template. Safe to delete.");
      await page.locator("//*[@role=\"dialog\"]//button[normalize-space(.)=\"Save\"]").click();
      await waitVisible(page, templateMenuButton(name));
    });

    if (created) {
      deleted = await step(page, "AW1 delete SMS template", async () => {
        await searchTemplates(page, name);
        await deleteTemplate(page, name);
      });
    }
  }
  finally {
    if (created && !deleted) {
      try {
        await page.goto(`${BASE}/sms-templates`, { waitUntil: "domcontentloaded" });
        await searchTemplates(page, name);
        if (await templateVisible(page, name)) await deleteTemplate(page, name);
        console.warn(`cleaned up template ${name}`);
      }
      catch (e) {
        console.error(`could not clean up ${name} — run test:k6:cleanup (${e})`);
      }
    }
    await page.close();
  }
}
