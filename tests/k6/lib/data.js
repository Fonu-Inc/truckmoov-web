// Helpers for suites that create data. Every record a test creates carries
// TEST_PREFIX so `cleanup.test.js` can find leftovers from a crashed run.

export const TEST_PREFIX = "k6-test-";

/** A unique, recognisable name such as `k6-test-1731760000000-driver`. */
export const testName = suffix => `${TEST_PREFIX}${Date.now()}${suffix ? `-${suffix}` : ""}`;

/** A short random digit string (phone numbers, plate numbers, licence ids). */
export const digits = (n) => {
  let out = "";
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10);
  return out;
};
