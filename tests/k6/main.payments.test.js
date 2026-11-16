// Main app payment flows, taken up to the point of paying and no further.
// The only gateway dialog in the app lives on /onboarding (plan picker →
// "Pay & Activate" → PaymentGatewayDialog). Each submit creates a pending
// payment intent on the dev API; no money moves.
//   P2 stops once the Paystack hosted checkout has loaded.
//   P3 stops once the MoMo USSD code is shown (needs MOMO_TEST_PHONE).

import { browser } from "k6/browser";
import { login } from "./lib/auth.js";
import { byText, isVisible, skip, step, waitUntil, waitVisible } from "./lib/checks.js";
import { credentialsFor, MOMO_TEST_PHONE, smokeOptions, URLS } from "./lib/config.js";
import { requireApps } from "./lib/preflight.js";

const BASE = URLS.main;
const CREDS = credentialsFor("MAIN");

// Paystack's checkout page is third-party, so its Web Vitals would land in
// ours: this suite enforces checks only, not vitals limits.
const base = smokeOptions(BASE);
delete base.thresholds.browser_web_vital_lcp;
delete base.thresholds.browser_web_vital_cls;
export const options = base;

const DIALOG = "//*[@role=\"dialog\"]";
const PHONE = "input[name=\"phone\"]";
const PAYMENT_ERROR = byText("Failed to initiate payment", { exact: false });

/** /onboarding → pick the first non-custom plan → open the payment dialog. */
async function openPaymentDialog(page) {
  await page.goto(`${BASE}/onboarding`, { waitUntil: "domcontentloaded" });
  await waitVisible(page, byText("Choose your plan", { exact: false }));
  const plan = page.locator("//button[.//h3][not(contains(normalize-space(.), \"Custom\"))]").first();
  await plan.waitFor({ state: "visible", timeout: 20000 });
  await plan.click();
  await page.locator(byText("Pay & Activate", { tag: "button" })).first().click();
  await waitVisible(page, `${DIALOG}//*[starts-with(normalize-space(.), "Pay for")]`);
}

const chooseGateway = (page, label) =>
  page.locator(`${DIALOG}//button[contains(normalize-space(.), "${label}")]`).first().click();

const submit = (page, label) =>
  page.locator(`${DIALOG}//button[normalize-space(.)="${label}"]`).first().click();

export function setup() {
  requireApps(URLS, "main");
}

export default async function () {
  const page = await browser.newPage();
  try {
    if (!(await step(page, "login", () => login(page, BASE, CREDS)))) return;

    await step(page, "P1 gateway dialog switches and validates", async () => {
      await openPaymentDialog(page);
      if (await isVisible(page, PHONE)) throw new Error("phone field shown for card payment");
      await chooseGateway(page, "Mobile Money (MoMo)");
      await waitVisible(page, PHONE);
      await page.locator(PHONE).fill("12");
      await submit(page, "Get USSD code");
      await waitVisible(page, byText("Enter a valid phone number", { exact: false }));
      await chooseGateway(page, "Card payment");
      await waitUntil(async () => !(await isVisible(page, PHONE)), { message: "phone field to hide" });
    });

    await step(page, "P2 Paystack redirects to hosted checkout", async () => {
      await openPaymentDialog(page);
      await chooseGateway(page, "Card payment");
      await submit(page, "Pay with card");
      const outcome = await waitUntil(async () => {
        if (/^https:\/\/checkout\.paystack\.com\//.test(page.url())) return "paystack";
        if (await isVisible(page, PAYMENT_ERROR)) return "error";
        return null;
      }, { timeout: 30000, message: "the Paystack checkout redirect" });
      if (outcome === "error") throw new Error("the app could not initiate a Paystack payment");
      await page.waitForLoadState("domcontentloaded");
      // Stop here: never fill in card details.
    });

    if (!MOMO_TEST_PHONE) {
      skip("P3 MoMo shows a USSD code", "MOMO_TEST_PHONE is not set");
      return;
    }
    await step(page, "P3 MoMo shows a USSD code", async () => {
      await openPaymentDialog(page);
      await chooseGateway(page, "Mobile Money (MoMo)");
      await page.locator(PHONE).fill(MOMO_TEST_PHONE);
      await submit(page, "Get USSD code");
      const outcome = await waitUntil(async () => {
        if (await isVisible(page, byText("Dial this USSD code", { exact: false }))) return "ussd";
        if (await isVisible(page, PAYMENT_ERROR)) return "error";
        return null;
      }, { timeout: 30000, message: "the USSD code" });
      if (outcome === "error") throw new Error("the app could not initiate a MoMo payment");
      const code = (await page.locator(`${DIALOG}//p[contains(@class, "font-mono")]`).first().textContent()) || "";
      if (!code.trim()) throw new Error("USSD code is empty");
      // Stop here: the USSD code is never dialled.
    });
  }
  finally {
    await page.close();
  }
}
