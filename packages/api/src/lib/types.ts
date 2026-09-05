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
}
