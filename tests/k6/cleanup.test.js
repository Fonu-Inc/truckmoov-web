// Removes any k6-test-* records a crashed run left behind:
//   main  → vehicles whose model starts with k6-test-
//   admin → SMS templates whose name starts with k6-test-
// Safe to run any time; reports how many it deleted.

import { browser } from "k6/browser";
import { login } from "./lib/auth.js";
import { navigateViaSidebar, step } from "./lib/checks.js";
import { credentialsFor, URLS } from "./lib/config.js";
import { TEST_PREFIX } from "./lib/data.js";
import { deleteTemplate, listedTemplateNames, searchTemplates } from "./lib/sms-templates.js";
import { deleteVehicleRow, searchVehicles, vehicleRowVisible } from "./lib/vehicles.js";
import { requireApps } from "./lib/preflight.js";

export const options = {
  scenarios: {
    cleanup: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 1,
      maxDuration: "10m",
      options: { browser: { type: "chromium" } },
    },
  },
  thresholds: { checks: ["rate==1.0"] },
};

const MAX_DELETES = 50; // guard against an endless loop

export function setup() {
  requireApps(URLS, "main", "admin");
}

// k6 allows one browser context at a time, so each app gets its own page in turn.
export default async function () {
  await cleanupMain();
  await cleanupAdmin();
}

async function cleanupMain() {
  const page = await browser.newPage();
  try {
    await step(page, "cleanup main vehicles", async () => {
      await login(page, URLS.main, credentialsFor("MAIN"));
      await navigateViaSidebar(page, "/fleet", "My Vehicles");
      let n = 0;
      await searchVehicles(page, TEST_PREFIX);
      while (n < MAX_DELETES && await vehicleRowVisible(page, TEST_PREFIX)) {
        await deleteVehicleRow(page, TEST_PREFIX);
        n++;
        await searchVehicles(page, TEST_PREFIX);
      }
      console.log(`main: deleted ${n} k6-test vehicle(s)`);
    });
  }
  finally {
    await page.close();
  }
}

async function cleanupAdmin() {
  const page = await browser.newPage();
  try {
    await step(page, "cleanup admin SMS templates", async () => {
      await login(page, URLS.admin, credentialsFor("ADMIN"));
      await navigateViaSidebar(page, "/sms-templates", "SMS Templates", "Communications");
      await searchTemplates(page, TEST_PREFIX);
      const names = (await listedTemplateNames(page, TEST_PREFIX)).slice(0, MAX_DELETES);
      for (const name of names) await deleteTemplate(page, name);
      console.log(`admin: deleted ${names.length} k6-test template(s)`);
    });
  }
  finally {
    await page.close();
  }
}
