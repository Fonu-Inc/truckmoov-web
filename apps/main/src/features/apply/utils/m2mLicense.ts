/**
 * End-to-End M2M licence plans.
 *
 * The customer picks a plan (Standard / Advance) during the application. The plan
 * behaves like a subscription: it runs for one year and bundles the device,
 * connectivity and platform licence.
 *
 * Ported from the design app (`fleetflow-pro-main/src/lib/m2mLicense.ts`). Prices
 * are the published figures — there is no public pricing endpoint on the
 * onboarding API yet.
 */

export type M2MLicensePlan = "standard" | "advance";

export type M2MLicensePlanInfo = {
  plan: M2MLicensePlan;
  /** Chargeable item id used by the platform billing catalogue. */
  itemId: string;
  label: string;
  description: string;
  /** Bundled price per device for the first year. */
  yearOnePrice: number;
  /** Bundled price per device on renewal. */
  renewalPrice: number;
  durationLabel: string;
  /** What the plan covers, listed on the quotation. */
  inclusions: string[];
};

export const M2M_LICENSE_PLANS: M2MLicensePlanInfo[] = [
  {
    plan: "standard",
    itemId: "ci-m2m-standard-1y",
    label: "M2M Standard License",
    description: "Suitable for standard fleet management requirements.",
    yearOnePrice: 77000,
    renewalPrice: 75000,
    durationLabel: "1 year",
    inclusions: [
      "M2M data plan supporting the device for 12 months",
      "Tracking hardware device (manufacturer supplied)",
      "IoT SIM card and connectivity activation",
      "Platform license — fleet tracking access",
      "Standard reporting, alerts and support",
    ],
  },
  {
    plan: "advance",
    itemId: "ci-m2m-advance-1y",
    label: "Advance M2M License",
    description: "Designed for customers with more advanced fleet management requirements.",
    yearOnePrice: 124000,
    renewalPrice: 80000,
    durationLabel: "1 year",
    inclusions: [
      "M2M data plan supporting the device for 12 months",
      "Advanced tracking hardware device (manufacturer supplied)",
      "IoT SIM card and connectivity activation",
      "Platform license — fleet tracking access",
      "Driver behaviour, fuel and maintenance analytics",
      "Priority support and advanced reporting",
    ],
  },
];

/** Accepts the local key (`standard`) or the server plan code (`m2m_standard`). */
export function findM2MPlan(plan?: string | null) {
  const key = plan?.replace(
    /^m2m_/,
    "",
  );
  return M2M_LICENSE_PLANS.find(entry => entry.plan === key);
}

/**
 * The plan *cards* on the details step title the advance plan "M2M Advance
 * License", while the quotation and review screens use `label`
 * ("Advance M2M License"). The design app does this deliberately — keep both.
 */
export function planCardTitle(plan: M2MLicensePlan) {
  return plan === "standard" ? "M2M Standard License" : "M2M Advance License";
}
