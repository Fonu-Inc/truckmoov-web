export type ActivityLogQuery = {
  params?: {
    search?: string
    status?: string
    page?: number
  }
}

export type UpdateInvitedUserPayload = {
  id: string
  data: {
    role: string
    email: string
  }
}

export type DeleteUserPayload = {
  id: string
}

export type InvitedUser = {
  id: string
  email: string
  role: string
  createdAt?: string
}

export type ActivityLogEntry = {
  id: string
  action: string
  userId?: string
  createdAt: string
  metadata?: Record<string, unknown>
}
