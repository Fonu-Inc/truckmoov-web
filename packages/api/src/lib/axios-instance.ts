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

const refreshClient = axios.create({ baseURL: BACKEND_URL })

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

    const { refreshToken, setSession, logout } = useAuthStore.getState()

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
      const { data: res } = await refreshClient.post<ServerResponse<AuthSession>>(
        '/auth/refresh',
        { refreshToken },
      )
      setSession(res.data)
      flushQueue(null, res.data.accessToken)
      originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`
      return axiosInstance(originalRequest)
    } catch {
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
