import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

import type { AuthSession } from '../auth'
import { useAuthStore } from './auth-store'
import type { ServerErrorResponse, ServerResponse } from './types'

const BASE_URL = import.meta.env.VITE_BACKEND_URL

if (!BASE_URL) {
  throw new Error('[truckmoov/api] VITE_BACKEND_URL is not set. Add it to your .env file.')
}

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

function isServerErrorResponse(value: unknown): value is ServerErrorResponse {
  if (!value || typeof value !== 'object') return false

  const response = value as Partial<ServerErrorResponse>

  return (
    typeof response.error === 'string' &&
    typeof response.message === 'string' &&
    typeof response.statusCode === 'number'
  )
}

function normalizeError(error: AxiosError<unknown>): ServerErrorResponse {
  if (isServerErrorResponse(error.response?.data)) {
    return error.response.data
  }

  return {
    error: error.code ?? 'REQUEST_ERROR',
    message: error.message || 'Request failed.',
    statusCode: error.response?.status ?? 0,
  }
}

// ─── Request interceptor: inject access token ─────────────────────────────────

axiosInstance.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ─── 401 refresh queue ────────────────────────────────────────────────────────

const refreshClient = axios.create({ baseURL: BASE_URL })

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

// ─── Response interceptor: normalize errors + 401 refresh ─────────────────────

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<unknown>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(normalizeError(error))
    }

    const { refreshToken, setSession, logout } = useAuthStore.getState()

    if (!refreshToken) {
      logout()
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
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
