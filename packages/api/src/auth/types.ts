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

export type DeleteSystemAdminPayload = {
  id: string
}

// ─── System admin — devices & SIMs ───────────────────────────────────────────

export type SystemDevicesQuery = {
  params?: {
    search?: string
    manufacturer?: string
    status?: 'registered' | 'configured' | 'assigned' | 'active' | 'faulty' | 'decommissioned'
    lifecycleStatus?: 'registered' | 'config_pending' | 'configured' | 'verified_online' | 'assignable' | 'assigned' | 'faulty' | 'decommissioned'
  }
}

export type ActivityLog = {
  id: string
  tenantId: string
  service: string
  action: string
  entityType: string
  entityId: string
  summary: string
  actorId: string
  actorRole: string
  metadata: Record<string, unknown>
  occurredAt: string
  recordedAt: string
}

export type SystemDeviceCatalogQuery = {
  params?: {
    search?: string
    status?: 'supported' | 'deprecated' | 'blocked'
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

export type UpdateSystemSimPayload = {
  id: string
  data: {
    plan: string
    carrier: string
    dataLimitMb: number
    smsLimit: number
  }
}

export type ReassignSystemSimPayload = {
  id: string
  data: {
    tenantId: string
    deviceId: string
  }
}

export type SuspendSystemSimPayload = {
  id: string
  data: {
    suspend: boolean
  }
}

// ─── System admin — tenants ───────────────────────────────────────────────────

export type SystemTenantsQuery = {
  params?: {
    search?: string
    status?: 'active' | 'pending' | 'suspended' | 'inactive'
    plan?: 'starter' | 'professional' | 'enterprise'
    organizationType?: 'fleet_provider' | 'enterprise' | 'aggregator' | 'owner_operator'
    kycStatus?: 'not_submitted' | 'pending' | 'under_review' | 'verified' | 'rejected'
    revenueFrom?: number
    revenueTo?: number
    lastActiveFrom?: string
    lastActiveTo?: string
  }
}

export type CreateTenantPayload = {
  data: {
    company: {
      "companyName": string,
      "contactName": string
      "email": string,
      "phoneNumber": string,
      "billingEmail": string,
      "organizationType": string
    }
    subscription?: {
      planCode: string
      billingCycle: 'monthly' | 'yearly'
    }
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
  data: {
    manufacturer: string
    model: string
    protocolType: string
    defaultPort?: number
    supportedFeatures: string[]
    status: string
    configurationInstructions?: string
  }
}

export type UpdateDeviceCatalogPayload = {
  id: string
  data: Partial<CreateDeviceCatalogPayload['data']>
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

export type SystemSimRequestsQuery = {
  params?: {
    status?: 'pending' | 'approved' | 'rejected'
    search?: string
    organisation?: string
    carrier?: string
    useCase?: string
  }
}

export type SystemSimBatchesQuery = {
  params?: {
    status?: string
    search?: string
    operator?: string
    mode?: string
  }
}

export type GetSimBatchPayload = {
  id: string
}

export type SystemSimBatchesSummary = {
  pendingActivation: number
  inProgress: number
  totalSimsQueued: number
  needsAttention: number
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
  data: {
    escalatedTo: string
    referenceId?: string
    notes?: string
  }
}

export type CreateTicketMessagePayload = {
  id: string
  data: {
    message: string
    isInternal: boolean
  }
}

export type SystemSupportTicketsQuery = {
  params?: {
    status?: string
    category?: string
    search?: string
  }
}

export type SystemDeviceSetupStatus = 'pending_review' | 'in_progress' | 'assigned' | 'rejected'

export type SystemDeviceSetupRequestsQuery = {
  params?: {
    search?: string
    status?: SystemDeviceSetupStatus
    manufacturer?: string
    dateFrom?: string
    dateTo?: string
  }
}

export type SystemDeviceSetupRequestPayload = {
  id: string
}

export type RejectSystemDeviceSetupRequestPayload = {
  id: string
  data: {
    reason: string
  }
}

export type SystemDeviceSetupRequest = {
  id: string
  imei: string
  manufacturer: string
  model: string
  connectionType: string
  requesterName: string
  needsSim: boolean
  vehiclePlate: string
  location: string
  tenantId: string
  status: SystemDeviceSetupStatus | string
  assignedTo?: string
  notes?: string
  preferredInstallDate?: string
  rejectedReason?: string
  createdAt: string
  updatedAt: string
}

export type SystemDeviceSetupRequestsList = {
  total: number
  requests: SystemDeviceSetupRequest[]
}

export type SystemSupportTicketSummary = {
  open: number
  inProgress: number
  escalated: number
  waitingOnTenant: number
  resolved: number
  closed: number
  resolvedToday: number
  byCategory: Record<string, number>
  topTenants: Record<string, unknown>[]
}

export type SystemChangePasswordPayload = {
  data: Record<string, unknown>
}

// ─── Response entity types ────────────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'SYSTEM_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'ENTERPRISE_ADMIN'
  | 'AGGREGATOR_ADMIN'
  | 'OWNER_OPERATOR'
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

export type SystemDeviceCatalogList = {
  total: number
  models: SystemDeviceCatalogModel[]
  generatedAt: string
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

export type SystemDashboard = {
  totalTenants: number
  totalVehicles: number
  totalDrivers: number
  totalSensors: number
  totalSimCards: number
  dataUsageTodayMb: number
  sensorGpsMessagesPerHour: number
  unavailableMetrics: string[]
  generatedAt: string
}

export type SystemHealthService = {
  name: string
  status: string
  latencyMs: number
  uptime: number
}

export type SystemHealth = {
  overall: string
  services: SystemHealthService[]
  generatedAt: string
}

export type SystemSupportDashboard = {
  open: number
  inProgress: number
  escalated: number
  waitingOnTenant: number
  resolved: number
  closed: number
  resolvedToday: number
  byCategory: Record<string, number>
  topTenants: Record<string, unknown>[]
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
  suspendedTenants: number
  totalVehicles: number
  totalSims: number
  overdueInvoices: number | null
  monthlyRevenueNgn: number
  generatedAt: string
}

export type SystemDevicesSummary = {
  totalDevices: number
  registeredDevices: number
  configuredDevices: number
  verifiedActiveDevices: number
  pendingConfigDevices: number
  onlineNowDevices: number
  assignableDevices: number
  assignedDevices: number
  activeDevices: number
  faultyDevices: number
  totalCatalogModels: number
  supportedCatalogModels: number
  deprecatedCatalogModels: number
  blockedCatalogModels: number
  generatedAt: string
}

export type SystemSimsSummary = {
  total: number
  active: number
  unassigned: number
  carriers: number
  byStatus: Record<string, number>
  byCarrier: Record<string, number>
  pendingRequests: number
}

export type SystemSimItem = {
  id: string
  iccid: string
  imsi: string | null
  msisdn: string | null
  carrier: string
  plan: string
  status: string
  tenantId: string | null
  deviceId: string | null
  dataUsageMb: number
  dataLimitMb: number
  smsUsage: number
  smsLimit: number
  monthlyCostNgn: number
  activationDate: string | null
  signalStrength: number | null
  networkType: string | null
  roaming: boolean
  fonuStatus: string | null
  createdAt: string
  updatedAt: string
}

export type SystemSimsList = {
  total: number
  sims: SystemSimItem[]
}

export type SystemSimRequest = {
  id: string
  tenantId: string
  tenantName: string
  requestType: string
  numberOfSims: number
  preferredOperator: string
  requestedPlan: string
  requestedDataLimitMb: number
  deploymentTimeline: string | null
  useCase: string | null
  status: string
  approvedBy: string | null
  approvedByName: string | null
  approvedAt: string | null
  rejectedReason: string | null
  createdAt: string
  updatedAt: string
}

export type SystemSimRequestsList = {
  total: number
  requests: SystemSimRequest[]
}

export type SystemSimRequestsSummary = {
  totalRequested: number
  pendingApproval: number
  approvedThisMonth: number
  rejectedThisMonth: number
}

export type SystemSimBatch = {
  id: string
  requestId: string | null
  tenantId: string
  tenantName: string
  activationMode: string
  quantity: number
  operator: string
  requestedPlan: string
  dataLimitGb: number
  status: string
  simsActivated: number
  simsFailed: number
  createdBy: string | null
  createdByName: string | null
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export type SystemSimBatchesList = {
  total: number
  batches: SystemSimBatch[]
}

export type SystemFeatureFlag = {
  id: string
  scope: 'platform' | 'tenant'
  tenantId: string | null
  featureKey: string
  featureName: string
  featureDescription: string
  isEnabled: boolean
  rolloutPercentage: number
  category: string
  phase: string
  createdAt: string
  updatedAt: string
}

export type SystemFeatureFlagsList = {
  total: number
  flags: SystemFeatureFlag[]
  generatedAt: string
}

export type SystemDeviceInventoryItem = {
  id: string
  imei: string
  manufacturer: string
  model: string
  tenantId: string | null
  tenantName: string | null
  lifecycleStatus: string
  operationalStatus: string
  signalStrength: number | null
  batteryLevel?: number | null
  lastSeen: string | null
  vehicleId: string | null
  assignedAt: string | null
  firmwareVersion?: string | null
  protocol?: string | null
  createdAt: string
  updatedAt: string
}

export type SystemDeviceInventoryList = {
  total: number
  devices: SystemDeviceInventoryItem[]
  generatedAt: string
}

export type SystemDeviceDetail = {
  id: string
  imei: string
  manufacturer: string
  model: string
  firmwareVersion: string | null
  tenantId: string
  tenantName: string
  lifecycleStatus: string
  operationalStatus: string
  protocol: string | null
  signalStrength: number | null
  batteryLevel: number | null
  lastSeen: string | null
  vehicleId: string | null
  assignedAt: string | null
  createdAt: string
  updatedAt: string
}

export type RemoveOrganizationUserData = {
  message: string
  userId: string
  email: string
}

// ─── Response envelopes ───────────────────────────────────────────────────────

export type AuthTokenResponse = ServerResponse<AuthSession>
export type MeResponse = ServerResponse<Record<string, unknown>>
export type ProfileResponse = ServerResponse<Record<string, unknown>>
export type OrganizationUserResponse = ServerResponse<OrganizationUser>
export type OrganizationUsersResponse = ServerResponse<OrganizationUser[]>
export type RemoveOrganizationUserResponse = ServerResponse<RemoveOrganizationUserData>
export type OrgSettingsData = {
  tenantId: string
  branding?: {
    organizationName?: string
    contactEmail?: string
    phoneNumber?: string
    address?: string
    logoUrl?: string
    profilePictureUrl?: string
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    successColor?: string
    warningColor?: string
    destructiveColor?: string
    sidebarBackground?: string
    sidebarText?: string
    sidebarAccent?: string
  }
  defaults?: {
    timezone?: string
    language?: string
    currency?: string
    dateFormat?: string
    weekStartsOn?: string
  }
}

export type OrganizationSettingsResponse = ServerResponse<OrgSettingsData>
export type NotificationPreferencesResponse = ServerResponse<Record<string, unknown>>
export type DispatcherPreferencesResponse = ServerResponse<Record<string, unknown>>
export type ActivityLogResponse = ServerResponse<ActivityLog[]>
export type UploadedMediaResponse = ServerResponse<UploadedMedia>
export type StandardApiResponse = ServerResponse<unknown>
export type InviteActionResponse = ServerResponse<Record<string, unknown>>
export type AuthSystemSettingsResponse = ServerResponse<AuthSystemSettings>
export type SystemDashboardResponse = ServerResponse<SystemDashboard>
export type SystemHealthResponse = ServerResponse<SystemHealth>
export type SystemSupportDashboardResponse = ServerResponse<SystemSupportDashboard>
export type SystemSupportTicketSummaryResponse = ServerResponse<SystemSupportTicketSummary>
export type SystemDeviceSetupRequestsListResponse = ServerResponse<SystemDeviceSetupRequestsList>
export type SystemDeviceSetupRequestResponse = ServerResponse<SystemDeviceSetupRequest>
export type SystemTenantsListResponse = ServerResponse<{ total: number; tenants: SystemTenant[]; generatedAt: string }>
export type SystemTenantsSummaryResponse = ServerResponse<SystemTenantsSummary>
export type SystemTenantDetailResponse = ServerResponse<Record<string, unknown>>
export type SystemTenantDeleteResponse = ServerResponse<Record<string, unknown>>
export type SystemTenantOnboardingResponse = ServerResponse<Record<string, unknown>>
export type SystemTenantOnboardingReferenceDataResponse = ServerResponse<Record<string, unknown>>
export type SystemTenantInviteActionResponse = ServerResponse<Record<string, unknown>>
export type SystemDeviceCatalogListResponse = ServerResponse<SystemDeviceCatalogList>
export type SystemDeviceCatalogModelResponse = ServerResponse<SystemDeviceCatalogModel>
export type SystemDeviceCatalogDeleteResponse = ServerResponse<Record<string, unknown>>
export type SystemDeviceCatalogReferenceDataResponse = ServerResponse<Record<string, unknown>>
export type SystemDeviceInventoryListResponse = ServerResponse<SystemDeviceInventoryList>
export type SystemDeviceDetailResponse = ServerResponse<SystemDeviceDetail>
export type SystemDeviceSummaryResponse = ServerResponse<SystemDevicesSummary>
export type SystemSimsListResponse = ServerResponse<SystemSimsList>
export type SystemSimResponse = ServerResponse<SystemSimItem>
export type SystemSimSummaryResponse = ServerResponse<SystemSimsSummary>
export type SystemSimRequestsListResponse = ServerResponse<SystemSimRequestsList>
export type SystemSimRequestsSummaryResponse = ServerResponse<SystemSimRequestsSummary>
export type SystemSimBatchesListResponse = ServerResponse<SystemSimBatchesList>
export type SystemSimBatchResponse = ServerResponse<SystemSimBatch>
export type SystemSimBatchesSummaryResponse = ServerResponse<SystemSimBatchesSummary>
export type SystemSubscriptionPlansResponse = ServerResponse<{ plans: SubscriptionPlan[]; generatedAt: string }>
export type SystemFeatureFlagsResponse = ServerResponse<SystemFeatureFlagsList>
export type SystemFeatureFlagResponse = ServerResponse<SystemFeatureFlag>
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
