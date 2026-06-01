// ─── Public auth ─────────────────────────────────────────────────────────────

export type RegisterPayload = {
  data: {
    email: string
    password: string
    firstName: string
    lastName: string
    organizationName: string
  }
}

export type LoginPayload = {
  data: {
    email: string
    password: string
  }
}

export type SystemLoginPayload = {
  data: {
    email: string
    password: string
  }
}

export type RefreshPayload = {
  data: {
    refreshToken: string
  }
}

export type ForgotPasswordPayload = {
  data: {
    identifier: string
  }
}

export type ResetPasswordPayload = {
  data: {
    token: string
    newPassword: string
  }
}

export type CompleteProfilePayload = {
  data: {
    token: string
    fullName: string
    password: string
  }
}

export type VerifyEmailPayload = {
  data: {
    token: string
  }
}

export type VerifyResetPayload = {
  data: {
    token: string
  }
}

export type ValidateInviteQuery = {
  params: {
    token: string
  }
}

// ─── Profile & preferences ───────────────────────────────────────────────────

export type UpdateProfilePayload = {
  data: {
    fullName?: string
    phoneNumber?: string
    address?: string
    profilePictureUrl?: string
  }
}

export type UpdateNotifPrefsPayload = {
  data: Record<string, unknown>
}

export type UpdateDispatchPrefsPayload = {
  data: Record<string, unknown>
}

// ─── Organization admin ───────────────────────────────────────────────────────

export type InviteUserPayload = {
  data: {
    email: string
    role: string
  }
}

export type ChangeRolePayload = {
  data: {
    targetUserId: string
    newRole: string
  }
}

export type LogoutPayload = {
  data: {
    refreshToken: string
  }
}

export type UpdateOrgUserPayload = {
  id: string
  data: Record<string, unknown>
}

export type UpdateUserStatusPayload = {
  id: string
  data: {
    status: string
  }
}

export type UpdateOrgSettingsPayload = {
  data: {
    branding?: Record<string, unknown>
    defaults?: Record<string, unknown>
  }
}

// ─── Activity log ─────────────────────────────────────────────────────────────

export type ActivityLogQuery = {
  params?: {
    service?: string
    entityType?: string
    entityId?: string
    action?: string
    actorId?: string
    limit?: number
  }
}

// ─── System admin — admins & invites ─────────────────────────────────────────

export type CreateSystemAdminPayload = {
  data: {
    fullName: string
    email: string
    password: string
  }
}

export type UpdateAdminStatusPayload = {
  id: string
  data: {
    status: string
  }
}

export type CreateSystemAdminInvitePayload = {
  data: Record<string, unknown>
}

// ─── System admin — tenants ───────────────────────────────────────────────────

export type SystemTenantsQuery = {
  params?: {
    search?: string
    status?: 'active' | 'pending' | 'suspended' | 'inactive'
    plan?: 'starter' | 'professional' | 'enterprise'
  }
}

export type CreateTenantPayload = {
  data: {
    company: Record<string, unknown>
    subscription: Record<string, unknown>
    deviceProvisioning?: Record<string, unknown>
    simAssignment?: Record<string, unknown>
    features?: Record<string, unknown>
  }
}

export type UpdateTenantPayload = {
  id: string
  data: Record<string, unknown>
}

export type UpdateTenantStatusPayload = {
  id: string
  data: {
    status: string
  }
}

// ─── System admin — devices ───────────────────────────────────────────────────

export type CreateDeviceCatalogPayload = {
  data: Record<string, unknown>
}

export type UpdateDeviceCatalogPayload = {
  id: string
  data: Record<string, unknown>
}

// ─── System admin — SIMs ──────────────────────────────────────────────────────

export type ApproveSIMRequestPayload = {
  id: string
}

export type RejectSIMRequestPayload = {
  id: string
  data: {
    reason: string
  }
}

export type RetrySimBatchPayload = {
  id: string
}

// ─── System admin — feature flags ────────────────────────────────────────────

export type UpdateFeatureFlagPayload = {
  key: string
  data: Record<string, unknown>
}

// ─── System admin — settings ──────────────────────────────────────────────────

export type UpdateSystemSettingsPayload = {
  data: Record<string, unknown>
}

// ─── System admin — support tickets ──────────────────────────────────────────

export type UpdateTicketStatusPayload = {
  id: string
  data: {
    status: string
  }
}

export type EscalateTicketPayload = {
  id: string
}

export type CreateTicketMessagePayload = {
  id: string
  data: {
    content: string
  }
}

export type SystemChangePasswordPayload = {
  data: Record<string, unknown>
}
