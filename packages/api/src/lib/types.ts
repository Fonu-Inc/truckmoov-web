export type ServerResponse<T> = {
  status: boolean
  message: string
  data: T
}

export type ServerErrorResponse = {
  error: string
  message: string
  statusCode: number
  field?: string
  retryAfterSeconds?: number
  /** Onboarding 409s: which identity detail is already on another application. */
  claimTypes?: string[]
}
