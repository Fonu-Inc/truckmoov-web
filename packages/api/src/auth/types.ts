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

export type ResendOrgInvitePayload = {
  data: {
    email: string
  }
}

export type RegisterInvitedPayload = {
  data: {
    inviteToken: string
    fullName: string
    password: string
  }
}

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
    accountStatus: string
  }
}

export type CreateSystemAdminInvitePayload = {
  data: Record<string, unknown>
}

// ─── System admin — devices & SIMs ───────────────────────────────────────────

export type SystemDevicesQuery = {
  params?: {
    search?: string
    manufacturer?: string
    status?: string
    lifecycleStatus?: string
  }
}

export type SystemSimsQuery = {
  params?: {
    search?: string
    status?: string
    carrier?: string
    tenantId?: string
  }
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

// ─── Response entity types ────────────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'SYSTEM_ADMIN'
  | 'ENTERPRISE_ADMIN'
  | 'AGGREGATOR_ADMIN'
  | 'OWNER_OPERATOR'
  | 'PLATFORM_ADMIN'
  | 'FLEET_ADMIN'
  | 'OPERATIONS_MANAGER'
  | 'DISPATCHER'
  | 'FINANCE_VIEWER'

export type AuthUser = {
  id: string
  email: string
  role: UserRole
  tenantId: string
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: AuthUser
}

export type UserProfile = {
  userId?: string
  firstName?: string
  lastName?: string
  fullName?: string
  email?: string
  phoneNumber?: string
  avatarUrl?: string
}

export type OrganizationUser = {
  userId: string
  email: string
  tenantId: string
  role: UserRole
  accountStatus: string
  status: string
  lastActiveAt: string
  profile: UserProfile
}

export type SystemDeviceCatalogModel = {
  id: string
  manufacturer: string
  model: string
  protocolType: string
  defaultPort: number
  supportedFeatures: string[]
  status: string
  configurationInstructions?: string
  createdAt: string
  updatedAt: string
}

export type UploadedMedia = {
  url: string
  key?: string
}

export type AuthSystemSettings = {
  platformName?: string
  supportEmail?: string
  defaults?: {
    timezone?: string
    language?: string
  }
  features?: {
    allowNewTenantRegistration?: boolean
    maintenanceMode?: boolean
    enableBetaFeatures?: boolean
  }
  retention?: {
    gpsDataRetentionDays?: number
    logRetentionDays?: number
    backupFrequency?: string
  }
  updatedAt?: string
  updatedByUserId?: string | null
}

import type { ServerResponse } from '../lib/types'

// ─── Entity types ─────────────────────────────────────────────────────────────

export type SubscriptionPlan = {
  code: string
  tier: 'starter' | 'professional' | 'enterprise'
  name: string
  description: string
  monthlyPriceNgn: number | null
  yearlyMonthlyEquivalentNgn: number | null
  yearlyDiscountPercent: number | null
  maxActiveVehicles: number | null
  customPricing: boolean
  trialDays: number | null
  badge: string | null
  ctaLabel: string
  features: string[]
}

export type SystemTenant = {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  address: string | null
  billingEmail: string | null
  plan: 'starter' | 'professional' | 'enterprise'
  planCode: string | null
  status: 'active' | 'pending' | 'trial' | 'suspended' | 'inactive' | 'terminated'
  organizationType: string | null
  vehicleCount: number
  driverCount: number
  deviceCount: number
  simCount: number
  features: Record<string, boolean>
  createdAt: string
  monthlyRevenueNgn: number
  lastActiveAt: string | null
  primaryContactName?: string | null
  organizationTypes?: string[]
  businessInfo?: {
    companyName?: string
    registrationNumber?: string | null
    taxId?: string | null
    businessType?: string | null
    industry?: string | null
    addressLine1?: string | null
    addressLine2?: string | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    country?: string | null
    verificationStatus?: string | null
    verifiedAt?: string | null
    yearEstablished?: number | null
  }
  invitationStatus?: {
    hasPendingInvitation?: boolean
    invitationAccepted?: boolean
  }
}

export type SystemTenantsSummary = {
  totalTenants: number
  activeTenants: number
  monthlyRevenueNgn: number
  totalVehicles: number
  generatedAt: string
}

// ─── Response envelopes ───────────────────────────────────────────────────────

export type AuthTokenResponse = ServerResponse<AuthSession>
export type MeResponse = ServerResponse<Record<string, unknown>>
export type ProfileResponse = ServerResponse<Record<string, unknown>>
export type OrganizationUserResponse = ServerResponse<OrganizationUser>
export type OrganizationUsersResponse = ServerResponse<OrganizationUser[]>
export type RemoveOrganizationUserResponse = ServerResponse<Record<string, unknown>>
export type OrganizationSettingsResponse = ServerResponse<Record<string, unknown>>
export type NotificationPreferencesResponse = ServerResponse<Record<string, unknown>>
export type DispatcherPreferencesResponse = ServerResponse<Record<string, unknown>>
export type ActivityLogResponse = ServerResponse<Record<string, unknown>>
export type UploadedMediaResponse = ServerResponse<UploadedMedia>
export type StandardApiResponse = ServerResponse<unknown>
export type InviteActionResponse = ServerResponse<Record<string, unknown>>
export type AuthSystemSettingsResponse = ServerResponse<AuthSystemSettings>
export type SystemDashboardResponse = ServerResponse<Record<string, unknown>>
export type SystemTenantsListResponse = ServerResponse<{ total: number; tenants: SystemTenant[]; generatedAt: string }>
export type SystemTenantsSummaryResponse = ServerResponse<SystemTenantsSummary>
export type SystemTenantDetailResponse = ServerResponse<Record<string, unknown>>
export type SystemTenantDeleteResponse = ServerResponse<Record<string, unknown>>
export type SystemTenantOnboardingResponse = ServerResponse<Record<string, unknown>>
export type SystemTenantOnboardingReferenceDataResponse = ServerResponse<Record<string, unknown>>
export type SystemTenantInviteActionResponse = ServerResponse<Record<string, unknown>>
export type SystemDeviceCatalogListResponse = ServerResponse<SystemDeviceCatalogModel[]>
export type SystemDeviceCatalogModelResponse = ServerResponse<SystemDeviceCatalogModel>
export type SystemDeviceCatalogDeleteResponse = ServerResponse<Record<string, unknown>>
export type SystemDeviceCatalogReferenceDataResponse = ServerResponse<Record<string, unknown>>
export type SystemDeviceInventoryListResponse = ServerResponse<Record<string, unknown>[]>
export type SystemDeviceSummaryResponse = ServerResponse<Record<string, unknown>>
export type SystemSimsListResponse = ServerResponse<Record<string, unknown>[]>
export type SystemSimSummaryResponse = ServerResponse<Record<string, unknown>>
export type SystemSimRequestsListResponse = ServerResponse<Record<string, unknown>[]>
export type SystemSimBatchesListResponse = ServerResponse<Record<string, unknown>[]>
export type SystemSubscriptionPlansResponse = ServerResponse<{ plans: SubscriptionPlan[]; generatedAt: string }>
export type SystemFeatureFlagsResponse = ServerResponse<Record<string, unknown>[]>
export type SystemFeatureFlagResponse = ServerResponse<Record<string, unknown>>
export interface AdminInvite {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export type SystemAdminInvitesResponse = ServerResponse<{
  total: number;
  invites: AdminInvite[];
  generatedAt: string;
}>
export type SystemAdminInviteResponse = ServerResponse<Record<string, unknown>>
export type SystemAdminInviteCancelResponse = ServerResponse<Record<string, unknown>>
