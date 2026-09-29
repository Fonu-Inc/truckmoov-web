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

  // Some bodies drop `error`/`statusCode`: `{ message, field }`, `{ message, claimTypes }`, or a
  // ValidationPipe `message: string[]`. Keep what they say instead of a generic failure.
  const body = error.response?.data as {
    message?: unknown
    error?: unknown
    field?: unknown
    retryAfterSeconds?: unknown
    claimTypes?: unknown
  } | undefined
  if (body && (typeof body.message === 'string' || Array.isArray(body.message))) {
    return {
      error: typeof body.error === 'string' ? body.error : 'REQUEST_ERROR',
      message: Array.isArray(body.message) ? body.message.join('. ') : body.message,
      statusCode: error.response?.status ?? 0,
      ...(typeof body.field === 'string' ? { field: body.field } : {}),
      ...(typeof body.retryAfterSeconds === 'number' ? { retryAfterSeconds: body.retryAfterSeconds } : {}),
      ...(Array.isArray(body.claimTypes) ? { claimTypes: body.claimTypes as string[] } : {}),
    }
  }

  return {
    error: error.code ?? 'REQUEST_ERROR',
    message: error.message || 'Request failed.',
    statusCode: error.response?.status ?? 0,
  }
}
