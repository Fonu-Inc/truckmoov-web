export type ServerResponse<T> = {
  status: boolean
  message: string
  data: T
}

export type ServerErrorResponse = {
  error: string
  message: string
  statusCode: number
  /** Every problem, e.g. each validation failure; `message` is the one to show. */
  errors?: string[]
  field?: string
  retryAfterSeconds?: number
  /** Onboarding 409s: which identity detail is already on another application. */
  claimTypes?: string[]
}
