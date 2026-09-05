import type { AxiosError } from 'axios'

import type { ServerErrorResponse } from './types'

export function isServerErrorResponse(value: unknown): value is ServerErrorResponse {
  if (!value || typeof value !== 'object') return false

  const response = value as Partial<ServerErrorResponse>

  return (
    typeof response.error === 'string' &&
    typeof response.message === 'string' &&
    typeof response.statusCode === 'number'
  )
}

export function normalizeError(error: AxiosError<unknown>): ServerErrorResponse {
  if (isServerErrorResponse(error.response?.data)) {
    return error.response.data
  }

  return {
    error: error.code ?? 'REQUEST_ERROR',
    message: error.message || 'Request failed.',
    statusCode: error.response?.status ?? 0,
  }
}
