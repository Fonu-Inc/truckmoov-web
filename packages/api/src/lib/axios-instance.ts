import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

import type { AuthSession } from '../auth'
import { useAuthStore } from './auth-store'
import { BACKEND_URL, requireBackendUrl } from './env'
import { normalizeError } from './http-errors'
import type { ServerErrorResponse, ServerResponse } from './types'

export const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request interceptor: inject access token ─────────────────────────────────

axiosInstance.interceptors.request.use((config) => {
  requireBackendUrl()
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ─── 401 refresh queue ────────────────────────────────────────────────────────

const refreshClient = axios.create({ baseURL: BACKEND_URL, timeout: 15000 })

let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: ServerErrorResponse) => void
}> = []

function flushQueue(error: ServerErrorResponse | null, token: string | null = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  pendingQueue = []
}

function redirectToLogin() {
  if (typeof window === 'undefined') return
  if (window.location.pathname.startsWith('/auth')) return
  window.location.assign('/auth')
}

// Every tab of the app shares one refresh token, and the server spends it on use: one tab at a time.
async function withRefreshLock<T>(refresh: () => Promise<T>): Promise<T> {
  return typeof navigator !== 'undefined' && navigator.locks
    ? await navigator.locks.request('truckmoov-auth-refresh', refresh)
    : await refresh()
}

/** The new access token, or null when another tab has signed out meanwhile. */
async function refreshSession(staleRefreshToken: string): Promise<string | null> {
  await useAuthStore.persist.rehydrate()
  const { accessToken, refreshToken, setSession } = useAuthStore.getState()
  if (!refreshToken) return null
  if (refreshToken !== staleRefreshToken && accessToken) return accessToken

  const { data: res } = await refreshClient.post<ServerResponse<AuthSession>>(
    '/auth/refresh',
    { refreshToken },
  )
  setSession(res.data)
  return res.data.accessToken
}

const DEAD_SESSION_STATUSES = [400, 401, 403]

if (typeof window !== 'undefined') {
  // Picks up another tab's refresh or sign-out, which this tab's store would otherwise never see.
  window.addEventListener('storage', (event) => {
    if (event.key !== 'truckmoov_auth' && event.key !== null) return
    const before = useAuthStore.getState()
    void Promise.resolve(useAuthStore.persist.rehydrate()).then(() => {
      const after = useAuthStore.getState()
      if (before.refreshToken && !after.refreshToken) redirectToLogin()
      else if (before.user && after.user && before.user.id !== after.user.id) window.location.reload()
    })
  })
}

// ─── Response interceptor: normalize errors + 401 refresh ─────────────────────

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<unknown>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // A sign-in 401 is the answer ("Invalid credentials", "This sign-in has expired"), not a
    // stale session — refreshing would replay the password against whoever was signed in before.
    const isSignIn = /^\/?auth\/(system\/|installer\/)?login(\/two-factor)?$/.test(originalRequest.url ?? '')

    if (error.response?.status !== 401 || originalRequest._retry || isSignIn) {
      return Promise.reject(normalizeError(error))
    }

    const { refreshToken, logout } = useAuthStore.getState()

    if (!refreshToken) {
      logout()
      redirectToLogin()
      return Promise.reject(normalizeError(error))
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest._retry = true
        originalRequest.headers.Authorization = `Bearer ${token}`
        return axiosInstance(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const accessToken = await withRefreshLock(() => refreshSession(refreshToken))
      if (!accessToken) throw new Error('signed out in another tab')
      flushQueue(null, accessToken)
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return axiosInstance(originalRequest)
    } catch (refreshFailure) {
      // Offline, a timeout or a 5xx says nothing about the session: keep it and let the caller retry.
      if (axios.isAxiosError(refreshFailure) && !DEAD_SESSION_STATUSES.includes(refreshFailure.response?.status ?? 0)) {
        const transient = normalizeError(refreshFailure)
        flushQueue(transient, null)
        return Promise.reject(transient)
      }
      const refreshError: ServerErrorResponse = {
        error: 'TOKEN_REFRESH_FAILED',
        message: 'Session expired. Please log in again.',
        statusCode: 401,
      }
      logout()
      flushQueue(refreshError, null)
      redirectToLogin()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
