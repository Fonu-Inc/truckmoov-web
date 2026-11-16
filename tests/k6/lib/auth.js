// Sign in through the real login form of main / admin / installer.

import { byText, isVisible, waitForPath, waitUntil, waitVisible } from "./checks.js";

// Set once the API answers "This IP address is blocked". Every further login
// attempt extends the block, so suites check this and stop logging in.
let ipBlocked = false;

export const isIpBlocked = () => ipBlocked;

const BLOCKED_MESSAGE = "the API has blocked this machine's IP (rate limit) — stop running suites and wait, or ask the backend team to unblock it";

/** Text of the visible error toast. Flags the IP block and throws if that is what it says. */
export async function errorToastText(page) {
  const message = ((await page.locator("[data-sonner-toast][data-type=\"error\"]").first().textContent()) || "").trim();
  if (/ip address is blocked/i.test(message)) {
    ipBlocked = true;
    throw new Error(BLOCKED_MESSAGE);
  }
  return message;
}

/**
 * Fill the email/password form at `${baseUrl}/auth` and wait until the app
 * shell (sidebar nav) is up. Throws a readable error on 2FA, a forced
 * 2FA enrolment, or a rejected login.
 */
export async function login(page, baseUrl, { email, password }) {
  if (ipBlocked) throw new Error(`not logging in: ${BLOCKED_MESSAGE}`);
  await page.goto(`${baseUrl}/auth`, { waitUntil: "domcontentloaded" });
  await waitVisible(page, "input[name=\"email\"]");
  await page.locator("input[name=\"email\"]").fill(email);
  await page.locator("input[name=\"password\"]").fill(password);
  await page.locator("form button[type=\"submit\"]").first().click();

  const outcome = await waitUntil(async () => {
    const path = page.url().replace(/^https?:\/\/[^/]+/, "");
    if (path.startsWith("/settings/security") && path.includes("enrol=required")) return "enrol";
    if (await isVisible(page, byText("Two-factor verification", { exact: false }))) return "2fa";
    if (!path.startsWith("/auth") && await isVisible(page, "nav a[href]")) return "ok";
    if (await isVisible(page, "[data-sonner-toast][data-type=\"error\"]")) return "rejected";
    return null;
  }, { timeout: 30000, message: "the app shell after login" });

  if (outcome === "2fa") throw new Error("this account has 2FA enabled — use an account without 2FA for k6");
  if (outcome === "enrol") throw new Error("the platform forces 2FA enrolment for this account — use an account without that requirement");
  if (outcome === "rejected") {
    const message = await errorToastText(page);
    throw new Error(`login was rejected: "${message}"`);
  }
}

/** True when the persisted auth store holds an access token. */
export async function hasStoredToken(page) {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem("truckmoov_auth");
      return Boolean(raw && JSON.parse(raw).state && JSON.parse(raw).state.accessToken);
    }
    catch {
      return false;
    }
  });
}

/** Visit a protected path without a session and expect the /auth redirect. */
export async function expectRedirectToAuth(page, baseUrl, path) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
  await waitForPath(page, p => p.startsWith("/auth"));
}
