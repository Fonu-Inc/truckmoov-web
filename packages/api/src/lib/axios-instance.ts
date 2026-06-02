import axios from 'axios'
import type { AxiosError } from 'axios'

import type { ServerErrorResponse } from './types'

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

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<unknown>) => {
    if (isServerErrorResponse(error.response?.data)) {
      return Promise.reject(error.response.data)
    }

    const fallback: ServerErrorResponse = {
      error: error.code ?? 'REQUEST_ERROR',
      message: error.message || 'Request failed.',
      statusCode: error.response?.status ?? 0,
    }

    return Promise.reject(fallback)
  },
)

