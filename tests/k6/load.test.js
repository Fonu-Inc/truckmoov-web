// Opt-in load test. Refuses to run unless K6_ALLOW_LOAD=1.
//
// Scenario `assets`: HTTP users fetch the main app and landing page HTML plus
//   every JS/CSS bundle they reference (static files only, no API calls).
// Scenario `browsers`: 2 browser users log in to main and walk 3 pages, so
//   Web Vitals are measured while the assets scenario is running.
//
// Point it at deployed/preview builds (MAIN_URL, LANDING_URL), not the Vite
// dev servers: dev servers serve hundreds of unbundled modules and are not
// what users hit.

import { browser } from "k6/browser";
import { check, fail } from "k6";
import http from "k6/http";
import { login } from "./lib/auth.js";
import { navigateViaSidebar, step } from "./lib/checks.js";
import { credentialsFor, URLS, vitalThresholds } from "./lib/config.js";
import { requireApps } from "./lib/preflight.js";

if (__ENV.K6_ALLOW_LOAD !== "1") {
  fail("load.test.js only runs with K6_ALLOW_LOAD=1 (it sends many requests; see docs/browser-tests.md)");
}

const CREDS = credentialsFor("MAIN");

export const options = {
  scenarios: {
    assets: {
      executor: "ramping-vus",
      exec: "assets",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 20 },
        { duration: "3m", target: 20 },
        { duration: "30s", target: 0 },
      ],
    },
    browsers: {
      executor: "per-vu-iterations",
      exec: "browsers",
      vus: 2,
      iterations: 1,
      startTime: "1m",
      maxDuration: "4m",
      options: { browser: { type: "chromium" } },
    },
  },
  thresholds: {
    "http_req_failed{scenario:assets}": ["rate<0.01"],
    "http_req_duration{scenario:assets}": ["p(95)<1500"],
    "checks": ["rate==1.0"],
    ...vitalThresholds(URLS.main),
  },
};

/** Absolute URLs of the scripts and stylesheets an HTML page references. */
function assetUrls(base, html) {
  const out = new Set();
  const re = /(?:src|href)="([^"]+\.(?:js|css))"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    out.add(/^https?:\/\//.test(m[1]) ? m[1] : `${base}${m[1].startsWith("/") ? "" : "/"}${m[1]}`);
  }
  return [...out];
}

function loadSite(base) {
  const res = http.get(`${base}/`, { tags: { name: `${base}/` } });
  check(res, { [`${base} html 200`]: r => r.status === 200 });
  const assets = assetUrls(base, res.body || "").filter(u => u.startsWith(base));
  if (assets.length) {
    const responses = http.batch(assets.map(u => ["GET", u, null, { tags: { name: "asset" } }]));
    check(responses, { [`${base} assets 200`]: rs => rs.every(r => r.status === 200) });
  }
}

export function setup() {
  requireApps(URLS, "main", "landing");
}

export function assets() {
  loadSite(URLS.main);
  loadSite(URLS.landing);
}

export async function browsers() {
  const page = await browser.newPage();
  try {
    if (!(await step(page, "load: login", () => login(page, URLS.main, CREDS)))) return;
    for (const [href, heading] of [["/jobs", "Jobs"], ["/fleet", "My Vehicles"], ["/drivers", "My Drivers"]]) {
      await step(page, `load: sidebar → ${heading}`, () => navigateViaSidebar(page, href, heading));
    }
  }
  finally {
    await page.close();
  }
}
