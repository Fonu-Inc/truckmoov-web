// Fail fast, with one clear message, when the app under test isn't running.
// Without this a stopped dev server shows up as a dozen confusing
// "localhost refused to connect" step failures.

import { fail } from "k6";
import http from "k6/http";

const START_COMMAND = {
  main: "pnpm dev:main",
  admin: "pnpm dev:admin",
  installer: "pnpm dev:installer",
  landing: "pnpm dev:landing",
};

/** Call from a suite's `setup()` with the app keys it uses, e.g. requireApps(URLS, "main"). */
export function requireApps(urls, ...apps) {
  for (const app of apps) {
    const url = urls[app];
    const res = http.get(url, { timeout: "10s", tags: { name: "preflight" } });
    if (res.status === 0 || res.status >= 500) {
      fail(`${app} app is not reachable at ${url} (${res.error || `HTTP ${res.status}`}) — start it with \`${START_COMMAND[app]}\` and run again`);
    }
  }
}
