// Page helpers shared by every browser suite.
//
// The apps have no data-testid attributes, so locators use name/label/aria
// attributes, the page <h1> (it mirrors the sidebar label) and XPath text
// matching.

import { check, fail } from "k6";
import { Trend } from "k6/metrics";

/** Time from navigation start until the page's ready marker is visible. */
export const pageReady = new Trend("page_ready_ms", true);

const DEFAULT_TIMEOUT = 20000;

/** XPath literal that survives quotes in the text. */
const xpathLiteral = (s) => {
  if (!s.includes("\"")) return `"${s}"`;
  if (!s.includes("'")) return `'${s}'`;
  return `concat("${s.split("\"").join("\", '\"', \"")}")`;
};

/** XPath for an element whose normalised text equals (or contains) `text`. */
export const byText = (text, { tag = "*", exact = true } = {}) =>
  exact
    ? `//${tag}[normalize-space(.)=${xpathLiteral(text)}]`
    : `//${tag}[contains(normalize-space(.), ${xpathLiteral(text)})]`;

/** Poll `fn` until it returns truthy or the timeout passes. */
export async function waitUntil(fn, { timeout = DEFAULT_TIMEOUT, interval = 250, message = "condition" } = {}) {
  const end = Date.now() + timeout;
  let lastError;
  while (Date.now() < end) {
    try {
      const value = await fn();
      if (value) return value;
    }
    catch (e) {
      lastError = e;
    }
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`Timed out waiting for ${message}${lastError ? `: ${lastError}` : ""}`);
}

export const waitVisible = (page, selector, timeout = DEFAULT_TIMEOUT) =>
  page.locator(selector).first().waitFor({ state: "visible", timeout });

export async function isVisible(page, selector) {
  try {
    return await page.locator(selector).first().isVisible();
  }
  catch {
    return false;
  }
}

export const pathOf = url => url.replace(/^https?:\/\/[^/]+/, "").replace(/[?#].*$/, "") || "/";

/** Wait until the URL path matches a string, RegExp or predicate. */
export const waitForPath = (page, matcher, timeout = DEFAULT_TIMEOUT) =>
  waitUntil(
    () => {
      const path = pathOf(page.url());
      if (typeof matcher === "string") return path === matcher;
      if (typeof matcher === "function") return matcher(path);
      return matcher.test(path);
    },
    { timeout, message: `URL path ${matcher}` },
  ).catch((e) => {
    throw new Error(`${e.message} (ended on ${pathOf(page.url())})`);
  });

/** Wait for the dashboard header <h1> to read `text`. */
export const waitForHeading = (page, text, timeout = DEFAULT_TIMEOUT) =>
  waitVisible(page, byText(text, { tag: "h1" }), timeout);

/** Fails when a DataTable rendered its error state. */
export async function assertNoErrorState(page) {
  if (await isVisible(page, byText("Try again", { tag: "button" }))) {
    throw new Error("page shows the table error state (\"Try again\")");
  }
}

let failureCount = 0;
const SCREENSHOT_DIR = __ENV.K6_SCREENSHOT_DIR || "tests/k6/screenshots";

/**
 * Run one named test step. A thrown error marks the check as failed, saves a
 * screenshot and lets the suite carry on with the next step.
 * Returns true when the step passed.
 */
export async function step(page, name, fn) {
  let ok = true;
  try {
    await fn();
  }
  catch (e) {
    ok = false;
    console.error(`✗ ${name}: ${e && e.message ? e.message : e}`);
    if (page) {
      const file = `${SCREENSHOT_DIR}/${String(++failureCount).padStart(2, "0")}-${name.replace(/[^a-z0-9]+/gi, "-").slice(0, 60)}.png`;
      try {
        await page.screenshot({ path: file, fullPage: true });
      }
      catch {
        // screenshot is best effort
      }
    }
  }
  check(null, { [name]: () => ok });
  return ok;
}

/** A step that decided not to run (e.g. no data to paginate) — passes, logs why. */
export function skip(name, reason) {
  console.warn(`↷ ${name}: skipped — ${reason}`);
  check(null, { [`${name} (skipped)`]: () => true });
}

/** Navigate with a full page load and time it until `readySelector` shows. */
export async function visit(page, url, readySelector) {
  const started = Date.now();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  if (readySelector) await waitVisible(page, readySelector);
  pageReady.add(Date.now() - started);
}

/**
 * Click a sidebar link (client-side navigation) and wait for its heading.
 * `group` names the collapsible sidebar group holding the link; it is opened
 * first because closed groups do not render their children.
 */
/**
 * Expand a collapsible sidebar group until `href` shows. The group's open
 * state follows the route until toggled by hand, so a click can land while it
 * is re-rendering and not stick — retry a few times before giving up.
 */
async function openSidebarGroup(page, group, href) {
  const linkSel = `nav a[href="${href}"]`;
  const trigger = page.locator(`//nav//button[contains(normalize-space(.), "${group}")]`).first();
  for (let attempt = 0; attempt < 3; attempt++) {
    if (await isVisible(page, linkSel)) return;
    await trigger.waitFor({ state: "visible", timeout: DEFAULT_TIMEOUT });
    await trigger.click();
    try {
      await page.locator(linkSel).first().waitFor({ state: "visible", timeout: 3000 });
      return;
    }
    catch {
      // closed again or not yet open — try once more
    }
  }
  throw new Error(`sidebar group "${group}" did not show a link to ${href} — the account may lack the permission for it`);
}

export async function navigateViaSidebar(page, href, heading, group) {
  const started = Date.now();
  const link = page.locator(`nav a[href="${href}"]`).first();
  if (group) await openSidebarGroup(page, group, href);
  await link.waitFor({ state: "visible", timeout: DEFAULT_TIMEOUT });
  await link.click();
  await waitForPath(page, path => path === href || path.startsWith(`${href}/`));
  if (heading) await waitForHeading(page, heading);
  await assertNoErrorState(page);
  pageReady.add(Date.now() - started);
}

// --- Tab bars ----------------------------------------------------------------
// Every route-tab bar in the apps is `<nav aria-label="<Name> sections">` of
// NavLinks (docs/design.md: tabs are routes). The bar only lists the tabs the
// signed-in role may open, so reading it at runtime gives each role's tabs
// without a hand-kept list.

const tabBar = label => `nav[aria-label="${label}"]`;

/** Labels of every tab bar currently on the page ("Fleet sections", ...). */
export const tabBarLabels = page => page.evaluate(() =>
  Array.from(document.querySelectorAll("nav[aria-label$=\" sections\"]"))
    .map(n => n.getAttribute("aria-label")));

/** The hrefs of a tab bar, or [] when the bar is absent (e.g. one tab only). */
export async function tabHrefs(page, label, timeout = 5000) {
  try {
    await page.locator(`${tabBar(label)} a`).first().waitFor({ state: "visible", timeout });
  }
  catch {
    return [];
  }
  return page.evaluate(sel =>
    Array.from(document.querySelectorAll(sel)).map(a => a.getAttribute("href")), `${tabBar(label)} a`);
}

/** Click one tab and check it became the active route and rendered cleanly. */
export async function openTab(page, label, href) {
  const started = Date.now();
  await page.locator(`${tabBar(label)} a[href="${href}"]`).first().click();
  await waitForPath(page, href);
  await waitVisible(page, `${tabBar(label)} a[href="${href}"][aria-current="page"]`);
  if (await isVisible(page, byText("You don", { tag: "h1", exact: false }))) {
    throw new Error("tab is listed but shows the 403 screen");
  }
  if (await isVisible(page, byText("This page doesn", { tag: "h1", exact: false }))) {
    throw new Error("tab is listed but shows the 404 screen");
  }
  await assertNoErrorState(page);
  pageReady.add(Date.now() - started);
}

export function requireOrFail(value, message) {
  if (!value) fail(message);
  return value;
}
