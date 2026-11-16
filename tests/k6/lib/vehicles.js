// Vehicle UI helpers for the main app (/fleet), shared by the writes suite
// and the cleanup script.

import { isVisible, waitUntil, waitVisible } from "./checks.js";

export const VEHICLE_SEARCH = "input[placeholder=\"Search by registration, make, model...\"]";

const rowFor = text => `//tr[contains(normalize-space(.), "${text}")]`;
const DIALOG = "//*[@role=\"alertdialog\" or @role=\"dialog\"]";

/** Type into the server-side search and wait for the debounce + reload. */
export async function searchVehicles(page, text) {
  await waitVisible(page, VEHICLE_SEARCH);
  await page.locator(VEHICLE_SEARCH).fill(text);
  await new Promise(r => setTimeout(r, 1200));
}

export const vehicleRowVisible = (page, text) => isVisible(page, rowFor(text));

/** Delete the first row containing `text` through the row menu + confirm. */
export async function deleteVehicleRow(page, text) {
  await page.locator(`${rowFor(text)}/td[last()]//button`).first().click();
  await page.locator("//*[@role=\"menuitem\"][normalize-space(.)=\"Delete\"]").first().click();
  await waitVisible(page, `${DIALOG}//*[normalize-space(.)="Delete vehicle?"]`);
  await page.locator(`${DIALOG}//button[normalize-space(.)="Delete"]`).first().click();
  await waitUntil(async () => !(await isVisible(page, rowFor(text))), {
    timeout: 20000,
    message: `row "${text}" to disappear`,
  });
}
