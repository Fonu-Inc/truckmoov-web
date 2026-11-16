// Shared configuration for every k6 suite.
//
// URLs default to the local dev servers and are overridden with MAIN_URL /
// ADMIN_URL / INSTALLER_URL / LANDING_URL.
//
// Credentials come from env vars first, then from the gitignored
// `credential.md` at the repo root. Nothing secret is
// ever written to this repo or printed to the console.

const trimSlash = url => url.replace(/\/+$/, "");

export const URLS = {
  main: trimSlash(__ENV.MAIN_URL || "http://localhost:3001"),
  admin: trimSlash(__ENV.ADMIN_URL || "http://localhost:3002"),
  installer: trimSlash(__ENV.INSTALLER_URL || "http://localhost:3003"),
  landing: trimSlash(__ENV.LANDING_URL || "http://localhost:3000"),
};

// --- credential.md ---------------------------------------------------------

function readCredentialFile() {
  const candidates = [
    __ENV.CREDENTIALS_FILE,
    import.meta.resolve("../../../credential.md"),
  ].filter(Boolean);
  for (const path of candidates) {
    try {
      return open(path);
    }
    catch {
      // try the next candidate
    }
  }
  return "";
}

function parseCredentialFile(text) {
  const password = (text.match(/Password for every account below: `([^`]+)`/) || [])[1] || "";
  const momoPhone = (text.match(/MoMo test phone: `([^`]+)`/) || [])[1] || "";
  const emails = {};
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split("|").map(c => c.trim());
    // | ROLE | email |  -> ["", ROLE, email, ""]
    if (cells.length >= 4 && /^[A-Z_]+$/.test(cells[1]) && cells[2].includes("@") && !emails[cells[1]]) {
      emails[cells[1]] = cells[2];
    }
  }
  return { password, momoPhone, emails };
}

const file = parseCredentialFile(readCredentialFile());

const ROLE_FOR_APP = {
  MAIN: "ENTERPRISE_ADMIN",
  ADMIN: "SUPER_ADMIN",
  INSTALLER: "INSTALLER",
};

/**
 * Returns { email, password } for MAIN | ADMIN | INSTALLER.
 * Throws a readable error (without leaking values) when neither the env vars
 * nor credential.md provide them.
 */
export function credentialsFor(app) {
  const email = __ENV[`${app}_EMAIL`] || file.emails[ROLE_FOR_APP[app]] || "";
  const password = __ENV[`${app}_PASSWORD`] || file.password || "";
  if (!email || !password) {
    throw new Error(
      `No ${app} credentials: set ${app}_EMAIL / ${app}_PASSWORD, or add the `
      + `${ROLE_FOR_APP[app]} account to credential.md at the repo root.`,
    );
  }
  return { email, password };
}

/**
 * Returns { email, password } for a main-app role (OWNER_OPERATOR, ...).
 * Env: <ROLE>_EMAIL / <ROLE>_PASSWORD; the password falls back to
 * MAIN_PASSWORD (every dev tenant account shares one), then credential.md.
 * ENTERPRISE_ADMIN also accepts MAIN_EMAIL. Throws when nothing is found.
 */
export function credentialsForRole(role) {
  const email = __ENV[`${role}_EMAIL`]
    || (role === "ENTERPRISE_ADMIN" ? __ENV.MAIN_EMAIL : "")
    || file.emails[role] || "";
  const password = __ENV[`${role}_PASSWORD`] || __ENV.MAIN_PASSWORD || file.password || "";
  if (!email || !password) {
    throw new Error(
      `No ${role} credentials: set ${role}_EMAIL (and ${role}_PASSWORD or MAIN_PASSWORD), `
      + `or add the ${role} account to credential.md at the repo root.`,
    );
  }
  return { email, password };
}

export const MOMO_TEST_PHONE = __ENV.MOMO_TEST_PHONE || file.momoPhone || "";

// --- thresholds -----------------------------------------------------------

export const isLocal = url => /\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url);

/**
 * Web Vitals limits: Google's "needs improvement" bound on unbundled dev
 * servers, the "good" bound on built/deployed URLs and the public site.
 */
export function vitalThresholds(url, { strict = false } = {}) {
  const good = strict || !isLocal(url);
  return {
    browser_web_vital_lcp: [good ? "p(75)<2500" : "p(75)<4000"],
    browser_web_vital_cls: [good ? "p(75)<0.1" : "p(75)<0.25"],
  };
}

/** One browser, one iteration: gentle on the shared dev API. */
export function smokeOptions(url, { strict = false, extraThresholds = {}, maxDuration = "10m" } = {}) {
  return {
    scenarios: {
      ui: {
        executor: "shared-iterations",
        vus: 1,
        iterations: 1,
        maxDuration,
        options: { browser: { type: "chromium" } },
      },
    },
    thresholds: {
      checks: ["rate==1.0"],
      page_ready_ms: ["p(95)<8000"],
      ...vitalThresholds(url, { strict }),
      ...extraThresholds,
    },
  };
}
