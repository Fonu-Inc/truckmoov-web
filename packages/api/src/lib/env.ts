/// <reference path="../vite-env.d.ts" />

// Runtime configuration shared by every app that consumes @truckmoov/api.
// The Vite apps (main, admin, installer) set VITE_BACKEND_URL; the Next.js landing page sets
// NEXT_PUBLIC_BACKEND_URL. Next inlines it at build time only when it sees the literal
// `process.env.NEXT_PUBLIC_BACKEND_URL` expression, so those reads must stay spelled out.

function nextBackendUrl(): string | undefined {
  try {
    // @ts-ignore -- `process` is typed only where @types/node is loaded (the Next app).
    return process.env.NEXT_PUBLIC_BACKEND_URL
  }
  catch {
    // `process` does not exist in Vite browser bundles.
    return undefined
  }
}

function nextIsDev(): boolean {
  try {
    // @ts-ignore -- see nextBackendUrl.
    return process.env.NODE_ENV === 'development'
  }
  catch {
    return false
  }
}

/** Backend origin, e.g. "https://dev-api.truckmoov.com/". Empty when unset. */
export const BACKEND_URL: string = import.meta.env?.VITE_BACKEND_URL ?? nextBackendUrl() ?? ''

/** True in local development builds. */
export const IS_DEV: boolean = Boolean((import.meta.env as { DEV?: unknown } | undefined)?.DEV) || nextIsDev()

/** The backend URL, or a clear error when it is missing. Call at first use, not at import. */
export function requireBackendUrl(): string {
  if (!BACKEND_URL)
    throw new Error('[truckmoov/api] Backend URL is not set. Add VITE_BACKEND_URL (Vite apps) or NEXT_PUBLIC_BACKEND_URL (landing page) to your .env file.')
  return BACKEND_URL
}
