// Public onboarding-applications flow uses no JWT.
// POST /auth/onboarding/applications returns applicationToken once; every later
// call sends it as X-Application-Token. Wrong or missing token returns 404
// deliberately — do NOT surface 404 as "not found" to the applicant.

import axios from 'axios'
import type { AxiosError } from 'axios'

import { BACKEND_URL, requireBackendUrl } from './env'
import { normalizeError } from './http-errors'

// A missing URL throws on the first request (requireBackendUrl), not at import, so the
// Next.js landing page can prerender pages that import this module.
const BASE_URL = BACKEND_URL

export const ONBOARDING_TOKEN_STORAGE_KEY = 'truckmoov_onboarding_token'

let inMemoryToken: string | null = null

export type OnboardingTokenStorage = 'session' | 'local'

// The main app keeps the draft token per tab (sessionStorage). The landing page keeps it in
// localStorage so "Apply as Returning Customer" can resume in a new tab or days later.
let tokenStorage: OnboardingTokenStorage = 'session'

function storage(): Storage {
  return tokenStorage === 'local' ? window.localStorage : window.sessionStorage
}

/** Choose where the draft token is kept. Call once, before the first onboarding request. */
export function setOnboardingTokenStorage(kind: OnboardingTokenStorage): void {
  tokenStorage = kind
  inMemoryToken = null
}

export function getOnboardingToken(): string | null {
  if (inMemoryToken) return inMemoryToken
  if (typeof window === 'undefined') return null
  const stored = storage().getItem(ONBOARDING_TOKEN_STORAGE_KEY)
  if (stored) inMemoryToken = stored
  return stored
}

export function setOnboardingToken(token: string | null): void {
  inMemoryToken = token
  if (typeof window === 'undefined') return
  if (token) {
    storage().setItem(ONBOARDING_TOKEN_STORAGE_KEY, token)
  } else {
    storage().removeItem(ONBOARDING_TOKEN_STORAGE_KEY)
  }
}

export const onboardingInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

onboardingInstance.interceptors.request.use((config) => {
  requireBackendUrl()
  const token = getOnboardingToken()
  if (token && !config.headers.has('X-Application-Token')) {
    config.headers['X-Application-Token'] = token
  }
  return config
})

onboardingInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<unknown>) => Promise.reject(normalizeError(error)),
)
