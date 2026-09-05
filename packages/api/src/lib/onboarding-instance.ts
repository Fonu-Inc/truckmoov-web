// Public onboarding-applications flow uses no JWT.
// POST /auth/onboarding/applications returns applicationToken once; every later
// call sends it as X-Application-Token. Wrong or missing token returns 404
// deliberately — do NOT surface 404 as "not found" to the applicant.

import axios from 'axios'
import type { AxiosError } from 'axios'

import { normalizeError } from './http-errors'

const BASE_URL = import.meta.env.VITE_BACKEND_URL

if (!BASE_URL) {
  throw new Error('[truckmoov/api] VITE_BACKEND_URL is not set. Add it to your .env file.')
}

export const ONBOARDING_TOKEN_STORAGE_KEY = 'truckmoov_onboarding_token'

let inMemoryToken: string | null = null

export function getOnboardingToken(): string | null {
  if (inMemoryToken) return inMemoryToken
  if (typeof window === 'undefined') return null
  const stored = window.sessionStorage.getItem(ONBOARDING_TOKEN_STORAGE_KEY)
  if (stored) inMemoryToken = stored
  return stored
}

export function setOnboardingToken(token: string | null): void {
  inMemoryToken = token
  if (typeof window === 'undefined') return
  if (token) {
    window.sessionStorage.setItem(ONBOARDING_TOKEN_STORAGE_KEY, token)
  } else {
    window.sessionStorage.removeItem(ONBOARDING_TOKEN_STORAGE_KEY)
  }
}

export const onboardingInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

onboardingInstance.interceptors.request.use((config) => {
  const token = getOnboardingToken()
  if (token) {
    config.headers['X-Application-Token'] = token
  }
  return config
})

onboardingInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<unknown>) => Promise.reject(normalizeError(error)),
)
