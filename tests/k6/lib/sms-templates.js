// Admin SMS template helpers (/sms-templates), shared by the writes suite and
// the cleanup script. Create/edit/delete never send an SMS; only the
// "Send a test" menu item does, and these helpers never touch it.

import { byText, waitUntil, waitVisible, isVisible } from "./checks.js";

export const SEARCH = "input[aria-label=\"Search templates\"]";

const menuButton = name => `button[aria-label="Actions for ${name}"]`;

export async function searchTemplates(page, text) {
  await waitVisible(page, SEARCH);
  await page.locator(SEARCH).fill(text);
  await new Promise(r => setTimeout(r, 500));
}

/** Names of the template cards currently listed that start with `prefix`. */
export async function listedTemplateNames(page, prefix) {
  return page.evaluate(p =>
    Array.from(document.querySelectorAll("button[aria-label^=\"Actions for \"]"))
      .map(b => b.getAttribute("aria-label").slice("Actions for ".length))
      .filter(n => n.startsWith(p)), prefix);
}

/** Delete a template through its card menu (no confirm dialog in the app). */
export async function deleteTemplate(page, name) {
  await page.locator(menuButton(name)).first().click();
  await page.locator("//*[@role=\"menuitem\"][normalize-space(.)=\"Delete\"]").first().click();
  await waitVisible(page, byText("Template deleted.", { exact: false }));
  await waitUntil(async () => !(await isVisible(page, menuButton(name))), {
    message: `template "${name}" to disappear`,
  });
}

export const templateVisible = (page, name) => isVisible(page, menuButton(name));
export const templateMenuButton = menuButton;
