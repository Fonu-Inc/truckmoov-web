// Main app create/delete tests. Writes to the ENTERPRISE_ADMIN account's
// tenant on the dev API. Every record is named k6-test-* and removed in the
// same run; `cleanup.test.js` removes leftovers from a crashed run.
//
// Drivers cannot be deleted in the app (only suspended), so the driver test
// checks form validation and never submits a valid driver.

import { browser } from "k6/browser";
import { login } from "./lib/auth.js";
import { byText, isVisible, navigateViaSidebar, step, waitVisible } from "./lib/checks.js";
import { credentialsFor, smokeOptions, URLS } from "./lib/config.js";
import { digits, testName } from "./lib/data.js";
import { deleteVehicleRow, searchVehicles, vehicleRowVisible } from "./lib/vehicles.js";
import { requireApps } from "./lib/preflight.js";

const BASE = URLS.main;
const CREDS = credentialsFor("MAIN");

export const options = smokeOptions(BASE);

const DIALOG = "[role=\"dialog\"]";

export function setup() {
  requireApps(URLS, "main");
}

export default async function () {
  const page = await browser.newPage();
  try {
    if (!(await step(page, "login", () => login(page, BASE, CREDS)))) return;

    // --- W2: vehicle create → find → delete ---------------------------------
    const vehicle = {
      plateNumber: `K6-${digits(6)}`,
      registrationNumber: `K6T${digits(8)}`,
      vin: `K6TEST${digits(11)}`,
      make: "K6Test",
      model: testName("vehicle"),
    };
    let created = false;
    let deleted = false;
    try {
      created = await step(page, "W2 add vehicle", async () => {
        await navigateViaSidebar(page, "/fleet", "My Vehicles");
        await page.locator(byText("Add Vehicle", { tag: "button" })).first().click();
        await waitVisible(page, `${DIALOG} input[name="plateNumber"]`);
        for (const [name, value] of Object.entries(vehicle)) {
          await page.locator(`${DIALOG} input[name="${name}"]`).fill(value);
        }
        await page.locator(`${DIALOG} button[type="submit"]`).click();
        await waitVisible(page, byText("Vehicle added", { exact: false }));
      });

      if (created) {
        await step(page, "W2 new vehicle is listed", async () => {
          await searchVehicles(page, vehicle.registrationNumber);
          await waitVisible(page, `//tr[contains(normalize-space(.), "${vehicle.registrationNumber}")]`);
        });
        deleted = await step(page, "W2 delete vehicle", () =>
          deleteVehicleRow(page, vehicle.registrationNumber));
      }
    }
    finally {
      // Best-effort removal if the add went through but a later step failed.
      if (!deleted) {
        try {
          await page.goto(`${BASE}/fleet`, { waitUntil: "domcontentloaded" });
          await searchVehicles(page, vehicle.registrationNumber);
          if (await vehicleRowVisible(page, vehicle.registrationNumber)) {
            await deleteVehicleRow(page, vehicle.registrationNumber);
            console.warn(`cleaned up vehicle ${vehicle.model}`);
          }
        }
        catch (e) {
          console.error(`could not clean up ${vehicle.model} — run test:k6:cleanup (${e})`);
        }
      }
    }

    // --- W3: driver form validation (nothing is created) --------------------
    await step(page, "W3 empty driver form shows validation errors", async () => {
      await navigateViaSidebar(page, "/drivers", "My Drivers");
      await page.locator(byText("Add Driver", { tag: "button" })).first().click();
      await waitVisible(page, `${DIALOG} input[name="firstName"]`);
      await page.locator(`${DIALOG} button[type="submit"]`).click();
      await waitVisible(page, byText("First name required", { exact: false }));
      await waitVisible(page, byText("License number required", { exact: false }));
      if (await isVisible(page, byText("Driver added", { exact: false }))) {
        throw new Error("a driver was created from an empty form");
      }
      await page.keyboard.press("Escape");
    });
  }
  finally {
    await page.close();
  }
}
