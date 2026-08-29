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

export type NotificationPreferences = {
  smsAlerts: boolean
  pushAlerts: boolean
  incidentAlerts: boolean
  jobAssignment: boolean
  jobCompletion: boolean
  maintenanceReminders: boolean
  fuelAlerts: boolean
  geofenceAlerts: boolean
  emailDigest: boolean
}

export type NotificationPreferencesData = {
  userId: string
  notificationPreferences: NotificationPreferences
}

export type UpdateNotifPrefsPayload = {
  data: Partial<NotificationPreferences>
}

export type DispatcherPreferences = {
  timezone: string
  /** "HH:mm" */
  shiftStart: string
  /** "HH:mm" */
  shiftEnd: string
  /** 0 = Sunday, 6 = Saturday */
  workDays: number[]
}

export type DispatcherPreferencesData = {
  userId: string
  dispatcherPreferences: DispatcherPreferences
}

export type UpdateDispatchPrefsPayload = {
  data: Partial<DispatcherPreferences>
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
    role: UserRole
  }
}

export type ChangeRolePayload = {
  data: {
    targetUserId: string
    newRole: UserRole
  }
}

export type LogoutPayload = {
  data: {
    refreshToken: string
  }
}

export type UpdateOrgUserPayload = {
  id: string
  data: {
    fullName?: string
    phoneNumber?: string
    address?: string
    profilePictureUrl?: string
  }
}

export type UpdateUserStatusPayload = {
  id: string
  data: {
    accountStatus: 'enabled' | 'disabled'
  }
}

export type OrganizationBrandingSettings = {
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

export type OrganizationDefaultSettings = {
  timezone?: string
  language?: string
  currency?: string
  dateFormat?: string
  weekStartsOn?: string
}

export type UpdateOrgSettingsPayload = {
  data: {
    branding?: Partial<OrganizationBrandingSettings>
    defaults?: Partial<OrganizationDefaultSettings>
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

export type TenantOnboardingInput = {
  company: {
    companyName: string
    contactName: string
    email: string
    phoneNumber?: string
    billingEmail?: string
    businessAddress?: string
    organizationType: 'fleet_provider' | 'enterprise' | 'aggregator' | 'owner_operator'
  }
  subscription: {
    planCode: string
    billingCycle: 'monthly' | 'yearly'
  }
  deviceProvisioning?: {
    provisionNow: boolean
    numberOfDevices?: number
    deviceManufacturer?: string
    deviceModel?: string
  }
  simAssignment?: {
    provisionNow: boolean
    numberOfSims?: number
    carrier?: 'MTN' | 'Airtel' | 'Glo' | '9mobile'
    dataPackage?: '250MB/month' | '500MB/month' | '1GB/month' | '2GB/month'
  }
  features?: {
    liveTracking?: boolean
    messaging?: boolean
    geofencing?: boolean
    routeOptimization?: boolean
    advancedAnalytics?: boolean
    apiAccess?: boolean
  }
}

export type CreateTenantPayload = {
  data: TenantOnboardingInput
}

export type UpdateTenantPayload = {
  id: string
  /** PATCH accepts any subset of any group — see UpdateSystemTenantDto */
  data: { [K in keyof TenantOnboardingInput]?: Partial<TenantOnboardingInput[K]> }
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

export type SystemSupportTicketCategory =
  | 'device_tracking'
  | 'billing'
  | 'sim_connectivity'
  | 'messaging'
  | 'compliance'
  | 'onboarding'
  | 'other'

export type SystemSupportTicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_on_tenant'
  | 'escalated'
  | 'resolved'
  | 'closed'

export type SystemSupportEscalationParty =
  | 'fleetpro_internal'
  | 'fonu_connectivity'
  | 'vendor_installer'

export type SystemSupportTicketsQuery = {
  params?: {
    status?: string
    category?: SystemSupportTicketCategory
    search?: string
  }
}

export type SystemSupportTicket = {
  id: string
  tenantId: string
  subject: string
  category: string
  status: string
  priority: string
  escalatedAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SystemSupportTicketMessage = {
  id: string
  ticketId: string
  senderId: string
  senderName: string
  senderRole: string
  message: string
  isInternal: boolean
  createdAt: string
}

export type SystemSupportTicketDetail = SystemSupportTicket & {
  messages: SystemSupportTicketMessage[]
}

export type SystemSupportEscalatedTicket = SystemSupportTicket & {
  escalatedTo: string | null
  escalatedReferenceId: string | null
  escalationNotes: string | null
}

export type SystemSupportTicketsListResponse = ServerResponse<{
  total: number
  tickets: SystemSupportTicket[]
}>

export type SystemSupportTicketDetailResponse = ServerResponse<SystemSupportTicketDetail>

export type SystemSupportTicketStatusResponse = ServerResponse<{
  ticketId: string
  status: string
}>

export type SystemSupportTicketMessagesResponse = ServerResponse<{
  ticketId: string
  total: number
  messages: SystemSupportTicketMessage[]
}>

export type SystemSupportTicketMessageResponse = ServerResponse<SystemSupportTicketMessage>

export type SystemSupportEscalatedResponse = ServerResponse<{
  total: number
  parties: Array<{
    party: string
    count: number
    tickets: SystemSupportEscalatedTicket[]
  }>
}>

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
  topTenants: Array<{
    tenantId: string
    count: number
  }>
  needsAttention: Array<{
    id: string
    subject: string
    tenantId: string
    category: string
    status: string
    priority: string
  }>
  recentlyResolved: Array<{
    id: string
    subject: string
    tenantId: string
    category: string
    resolvedAt: string
  }>
}

export type SystemChangePasswordPayload = {
  data: {
    currentPassword: string
    newPassword: string
  }
}

// ─── Response entity types ────────────────────────────────────────────────────

/**
 * Backend user roles. Usable as values (`UserRole.FLEET_ADMIN`) and as a type.
 *
 * ponytail: const object rather than `enum` so existing string-literal
 * comparisons (`user.role === 'FLEET_ADMIN'`, `case 'FLEET_ADMIN':`) keep
 * compiling — a real enum is not comparable to literals and would break ~80
 * call sites. Same convention as `ORG_ROLES`.
 */
export const UserRole = {
  // Admin roles
  SUPER_ADMIN: 'SUPER_ADMIN',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  
  // Main roles
  ENTERPRISE_ADMIN: 'ENTERPRISE_ADMIN',
  AGGREGATOR_ADMIN: 'AGGREGATOR_ADMIN',
  OWNER_OPERATOR: 'OWNER_OPERATOR',
  FLEET_ADMIN: 'FLEET_ADMIN',
  OPERATIONS_MANAGER: 'OPERATIONS_MANAGER',
  DISPATCHER: 'DISPATCHER',
  FINANCE_VIEWER: 'FINANCE_VIEWER',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

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

export type OrganizationUsersData = {
  tenantId: string
  users: OrganizationUser[]
}

export type OrganizationUsersQuery = {
  params?: {
    search?: string
    status?: 'active' | 'inactive' | 'invited'
    role?: UserRole
  }
}

export type OrganizationUserMutationData = {
  message: string
  user: OrganizationUser
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
  filename?: string
  contentType?: string
  size?: number
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
  /** ponytail: not in the published schema — drop it if the server never sends it. */
  id?: string
  code: string
  tier: 'starter' | 'professional' | 'enterprise'
  name: string
  description: string
  monthlyPriceNgn: number | null
  yearlyMonthlyEquivalentNgn: number | null
  yearlyDiscountPercent: number | null
  maxActiveVehicles: number | null
  maxUsers: number | null
  customPricing: boolean
  trialDays: number | null
  badge: string | null
  ctaLabel: string
  features: string[]
}

export type OnboardingExchangeRate = {
  ngnPerUsd: number
  source: string
  fetchedAt: string
}

export type OnboardingSubscriptionCaps = {
  planCode: string
  planName: string | null
  planTier: string | null
  maxDevices: number | null
  maxSims: number | null
  maxUsers: number | null
  subscriptionActivatedAt: string | null
}

export type OnboardingStatusValue = 'pending' | 'in_progress' | 'completed' | 'rejected'

export type OnboardingStatus = {
  tenantId: string
  isOnboarded: boolean
  onboardingStatus: OnboardingStatusValue
  planCode: string | null
  subscriptionStatus: string | null
}

export type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected'

export type OnboardingBusinessInfo = {
  tenantId: string
  companyName: string
  registrationNumber: string | null
  taxId: string | null
  businessType: string | null
  industry: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  phone: string | null
  email: string | null
  billingEmail: string | null
  website: string | null
  yearEstablished: number | null
  numberOfEmployees: number | null
  verificationStatus: VerificationStatus
  updatedAt: string
}

export type UpdateOnboardingBusinessInfoPayload = {
  data: {
    companyName: string
    registrationNumber: string | null
    taxId: string | null
    businessType: string | null
    industry: string | null
    addressLine1: string | null
    addressLine2: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    country: string | null
    phone: string | null
    email: string | null
    billingEmail: string | null
    website: string | null
    yearEstablished: number | null
    numberOfEmployees: number | null
  }
}

export type OnboardingKycDocument = {
  id: string
  documentType: string
  documentName: string
  fileSize: number
  status: VerificationStatus
  createdAt: string
}

export type OnboardingKycDocumentsData = {
  documents: OnboardingKycDocument[]
}

export type UploadOnboardingKycDocumentPayload = {
  documentType: string
  file: File
}

export type DeleteOnboardingKycDocumentPayload = {
  id: string
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

export type DataBundleDashboardSummary = {
  walletBalance: number
  currency: string
  totalAmountToppedUp: number
  successfulTopUpTransactions: number
  activeAllocations: number
  expiredAllocations: number
  expiringWithinSevenDays: number
  monthlySpend: number
  topUpsThisMonth: number
  totalDataUsedGb: number
}

export type DataBundleWalletBalance = {
  balance: number
  currency: string
}

export type DataBundleWalletTopupPayload = {
  data: {
    amount: number
    mobileMoneyProvider: string
    mobileNumber: string
  }
}

export type DataBundleWalletTopup = {
  transactionId: string
  paymentReference: string
  amount: number
  status: string
  paymentProvider: string
  mobileNumber: string
  createdAt: string
}

export type DataBundleSpendingLimit = {
  enabled: boolean
  monthlyLimit: number
  spentThisMonth: number
  resetDayOfMonth: number
  alertEmail: string
  notifyAtPercentages: number[]
}

export type SaveDataBundleSpendingLimitPayload = {
  data: {
    monthlyLimit: number
    resetDayOfMonth: number
    alertEmail: string
    notifyAtPercentages: number[]
  }
}

export type DisableDataBundleSpendingLimit = {
  message: string
}

export type DataBundleAutoTopup = {
  enabled: boolean
  thresholdAmount: number
  topUpAmount: number
  paymentProvider: string
  mobileNumber: string
}

export type SaveDataBundleAutoTopupPayload = {
  data: {
    thresholdAmount: number
    topUpAmount: number
    paymentProvider: string
    mobileNumber: string
  }
}

export type DisableDataBundleAutoTopup = {
  message: string
}

export type DataBundleAllocationsQuery = {
  params?: {
    search?: string
    status?: string
    billingCycles?: string[]
    page?: number
    limit?: number
    format?: 'csv' | 'xlsx'
  }
}

export type DataBundleAllocationBundle = {
  id: string
  code: string
  name: string
  carrier: string
  dataAmountGb: number
  billingCycle: string
  price: number
}

export type DataBundleAllocation = {
  id: string
  mobileNumber: string
  bundle: DataBundleAllocationBundle | null
  dataUsedMb: number
  dataTotalMb: number
  dataUsedGb: number
  dataTotalGb: number
  usagePercentage: number
  activatedAt: string | null
  expiresAt: string | null
  daysLeft: number
  status: string
}

/** The detail route adds the remaining-data fields the list route omits. */
export type DataBundleAllocationDetail = DataBundleAllocation & {
  dataRemainingMb: number
  dataRemainingGb: number
}

export type GetDataBundleAllocationPayload = { id: string }

export type AllocateDataBundlePayload = {
  data: {
    carrierId: string
    planType: string
    bundleId: string
    mobileNumbers: string[]
  }
}

export type DataBundleAllocationResult = {
  allocationIds: string[]
  totalAmount: number
  successfulCount: number
  failedCount: number
  failures?: Array<{
    mobileNumber: string
    reason: string
  }>
}

export type AllocatableSimsQuery = {
  params: {
    search: string
    carrierId: string
  }
}

export type DataBundleAllocationsList = {
  items: DataBundleAllocation[]
  total: number
}

export type DataBundleTransactionsQuery = {
  params?: {
    search?: string
    status?: string
    carriers?: string[]
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
    format?: 'csv' | 'xlsx'
  }
}

export type DataBundleTransaction = {
  id: string
  date: string
  mobileNumber: string
  bundle: {
    id: string
    code: string
    name: string
    carrier: string
  }
  amount: number
  status: string
  paymentReference: string
  failureReason: string
}

export type DataBundleTransactionsList = {
  items: DataBundleTransaction[]
  total: number
  page?: number
  limit?: number
}

export type DataBundleAnalyticsRangeQuery = {
  params?: {
    range?: '7d' | '30d' | '90d' | 'custom'
    startDate?: string
    endDate?: string
  }
}

export type DataBundleSpendTrend = {
  trend: {
    date: string
    amount: number
  }[]
}

export type DataBundleSpendBreakdown = {
  breakdown: {
    bundleId: string
    bundleName: string
    bundleCode: string
    amount: number
    percentage: number
  }[]
}

export type DataBundleCarrierDistribution = {
  distribution: {
    carrierId: string
    amount: number
    percentage: number
  }[]
}

export type DataBundleSubscriptionUsage = {
  usage: {
    bundleId: string
    bundleCode: string
    usedMb: number
    totalMb: number
  }[]
}

export type DataBundleRatesQuery = {
  params?: {
    search?: string
    carriers?: string[]
    planType?: string
    page?: number
    limit?: number
    format?: 'csv' | 'xlsx'
  }
}

export type DataBundleRate = {
  id: string
  code: string
  name: string
  carrier: string
  dataAmountGb: number
  validityDays: number
  billingCycle: string
  price: number
  currency: string
  active: boolean
}

export type DataBundleRatesList = {
  items: DataBundleRate[]
  total: number
  page?: number
  limit?: number
}

export type DataBundleCarrier = {
  id: string
  name: string
  displayName: string
  active: boolean
}

export type DataBundleCarriersList = {
  carriers: DataBundleCarrier[]
}

export type CreateSystemCarrierPayload = {
  data: {
    id: string
    name: string
    displayName: string
  }
}

export type UpdateSystemCarrierPayload = {
  id: string
  data: {
    name?: string
    displayName?: string
    active?: boolean
  }
}

export type CreateSystemBundlePayload = {
  data: {
    id: string
    code: string
    name: string
    carrierId: string
    dataAmountGb: number
    validityDays: number
    billingCycle: string
    priceNaira: number
    currency?: string
  }
}

export type UpdateSystemBundlePayload = {
  id: string
  data: {
    name?: string
    dataAmountGb?: number
    validityDays?: number
    billingCycle?: string
    priceNaira?: number
    active?: boolean
  }
}

export type DeleteSystemBundlePayload = { id: string }

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

export type SystemSimRequestActionResult = {
  requestId: string
  batchId: string
  tenantName: string
  quantity: number
  operator: string
}

export type SystemSimBatchRetryResult = {
  batchId: string
  tenantName: string
  quantity: number
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
export type OrganizationUserResponse = ServerResponse<OrganizationUserMutationData>
export type OrganizationUsersResponse = ServerResponse<OrganizationUsersData>
export type RemoveOrganizationUserResponse = ServerResponse<RemoveOrganizationUserData>
export type OrgSettingsData = {
  tenantId: string
  branding?: OrganizationBrandingSettings
  defaults?: OrganizationDefaultSettings
}

export type OrganizationSettingsResponse = ServerResponse<OrgSettingsData>
export type NotificationPreferencesResponse = ServerResponse<NotificationPreferencesData>
export type DispatcherPreferencesResponse = ServerResponse<DispatcherPreferencesData>
export type ActivityLogResponse = ServerResponse<ActivityLog[]>
export type UploadedMediaResponse = ServerResponse<UploadedMedia>
/**
 * Only for routes whose spec really does declare a bare envelope.
 * Prefer one of the typed aliases below.
 */
export type StandardApiResponse = ServerResponse<unknown>

/** Routes whose `data` is just `{ message }`. */
export type MessageResponse = ServerResponse<{ message: string }>
/** Routes whose `data` is just `{ id }`. */
export type IdResponse = ServerResponse<{ id: string }>

export type InviteValidationResponse = ServerResponse<{
  email: string
  role: string
  tenantId: string
}>

export type ChangeSystemPasswordResponse = ServerResponse<{
  accessToken: string
  refreshToken: string
}>

export type AuthHealthResponse = ServerResponse<{
  status?: string
  service?: string
}>
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
export type DataBundleDashboardSummaryResponse = ServerResponse<DataBundleDashboardSummary>
export type DataBundleWalletBalanceResponse = ServerResponse<DataBundleWalletBalance>
export type DataBundleWalletTopupResponse = ServerResponse<DataBundleWalletTopup>
export type DataBundleSpendingLimitResponse = ServerResponse<DataBundleSpendingLimit>
export type DisableDataBundleSpendingLimitResponse = ServerResponse<DisableDataBundleSpendingLimit>
export type DataBundleAutoTopupResponse = ServerResponse<DataBundleAutoTopup>
export type DisableDataBundleAutoTopupResponse = ServerResponse<DisableDataBundleAutoTopup>
export type DataBundleAllocationsListResponse = ServerResponse<DataBundleAllocationsList>
export type DataBundleTransactionsListResponse = ServerResponse<DataBundleTransactionsList>
export type DataBundleSpendTrendResponse = ServerResponse<DataBundleSpendTrend>
export type DataBundleSpendBreakdownResponse = ServerResponse<DataBundleSpendBreakdown>
export type DataBundleCarrierDistributionResponse = ServerResponse<DataBundleCarrierDistribution>
export type DataBundleSubscriptionUsageResponse = ServerResponse<DataBundleSubscriptionUsage>
export type DataBundleRatesListResponse = ServerResponse<DataBundleRatesList>
export type DataBundleCarriersListResponse = ServerResponse<DataBundleCarriersList>
export type SystemSimRequestsListResponse = ServerResponse<SystemSimRequestsList>
export type SystemSimRequestsSummaryResponse = ServerResponse<SystemSimRequestsSummary>
export type SystemSimBatchesListResponse = ServerResponse<SystemSimBatchesList>
export type SystemSimBatchResponse = ServerResponse<SystemSimBatch>
export type SystemSimBatchesSummaryResponse = ServerResponse<SystemSimBatchesSummary>
export type SystemSubscriptionPlansResponse = ServerResponse<{ plans: SubscriptionPlan[]; generatedAt: string }>
export type OnboardingPlansResponse = ServerResponse<{ plans: SubscriptionPlan[] }>
export type OnboardingExchangeRateResponse = ServerResponse<OnboardingExchangeRate>
export type OnboardingSubscriptionCapsResponse = ServerResponse<OnboardingSubscriptionCaps>
export type OnboardingStatusResponse = ServerResponse<OnboardingStatus>
export type OnboardingBusinessInfoResponse = ServerResponse<OnboardingBusinessInfo>
export type OnboardingKycDocumentsResponse = ServerResponse<OnboardingKycDocumentsData>

export type PaymentIntentPayload = {
  data: {
    planCode: string
    billingCycle: 'monthly' | 'yearly'
    gateway: 'paystack' | 'momo'
    phone?: string
    redirectUrl?: string
  }
}

export type PaymentIntentData = {
  authorizationUrl?: string
  ussdString?: string
}

export type PaymentIntentResponse = ServerResponse<PaymentIntentData>

export type EnterpriseEnquiryPayload = {
  data: {
    name: string
    email: string
    phone: string
    companyName: string
    message: string
  }
}

export type ProvisionDevicesPayload = {
  data: {
    manufacturer: string
    model: string
    quantity: number
    useCase?: string
    requesterNotes?: string
  }
}

export type RegisterSimsPayload = {
  data: {
    sims: { iccid: string; mobileNumber: string; networkOperator: string }[]
  }
}

export type ProvisionSimsPayload = {
  data: {
    numberOfSims: number
    dataLimitGb?: number
    preferredOperator?: string
    useCase?: string
    notes?: string
    deviceMappingEnabled?: boolean
  }
}

export type CreateSimRequestPayload = {
  data: {
    quantity: number
    carrier: string
    planType: string
    dataBundlePlanId: string
    useCase?: string
    notes?: string
    deviceMappingFileId?: string
  }
}

export type CreateSimPayload = {
  data: {
    iccid: string
    mobileNumber: string
    operator: string
    dataLimitGb: number
    monthlyRentalNaira: number
    imsi?: string
    simType?: string
  }
}

export type SimDataBundlesQuery = {
  params: {
    carrierId: string
    billingCycle: string
  }
}

export type SimRequestDeviceMappingUploadResponse = ServerResponse<{
  fileId: string
}>

// ─── Tenant — SIMs ────────────────────────────────────────────────────────────

export type SimExportFormat = 'csv' | 'xlsx'

export type SimsQuery = {
  params?: {
    search?: string
    status?: string
    operators?: string[]
    page?: number
    limit?: number
    format?: SimExportFormat
  }
}

export type SimAssignedDevice = {
  id: string
  name: string
  type: string
  imei: string
  vehicleId: string | null
}

export type SimItem = {
  id: string
  iccid: string
  imsi: string
  mobileNumber: string
  operator: string
  status: string
  simType: string
  dataLimitGb: number | null
  dataUsedGb: number | null
  monthlyRentalNaira: number | null
  assignedDevice: SimAssignedDevice | null
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export type SimsList = {
  items: SimItem[]
  total: number
  page: number
  limit: number
}

export type SimsListResponse = ServerResponse<SimsList>
export type SimResponse = ServerResponse<SimItem>

export type GetSimPayload = { id: string }
export type DeleteSimPayload = { id: string }
export type ReactivateSimPayload = { id: string }
export type UnassignSimDevicePayload = { id: string }

export type UpdateSimPayload = {
  id: string
  data: {
    iccid?: string
    imsi?: string
    mobileNumber?: string
    operator?: string
    dataLimitGb?: number
    simType?: string
    monthlyRentalNaira?: number
    notes?: string
  }
}

export type SuspendSimPayload = {
  id: string
  data?: {
    reason?: string
  }
}

export type SimCarrier = {
  id: string
  name: string
  displayName: string
  active: boolean
}

export type SimCarriersResponse = ServerResponse<{ carriers: SimCarrier[] }>

/** Create / delete / suspend / reactivate / unassign all reply with `{ id }`. */
export type SimActionResponse = IdResponse

export type SimImportResponse = ServerResponse<{
  imported: number
  skipped: number
  failed: number
}>

export type SimRequestDeviceMappingProcessResponse = ServerResponse<{
  processed: number
  mapped: number
  failed: number
}>

export type CreateSimRequestResponse = ServerResponse<{ requestId: string }>

export type SimDataBundlePlan = {
  id: string
  code: string
  name: string
  carrier: string
  dataAmountGb: number
  validityDays: number
  billingCycle: string
  price: number
  currency: string
  active: boolean
}

export type SimDataBundlesResponse = ServerResponse<{
  items: SimDataBundlePlan[]
  total: number
}>

export type SimRequestTimelineEntry = {
  label: string
  at: string
  by: string | null
}

export type SimRequestDataBundlePlan = {
  id: string
  name: string
  dataLimitGb: number
}

export type SimRequestStatus = 'pending_review' | 'approved' | 'rejected' | 'fulfilled'

export type SimRequestItem = {
  id: string
  quantity: number
  organizationName: string
  requestingEmail: string
  carrier: string
  planType: string
  dataBundlePlan: SimRequestDataBundlePlan
  useCase: string
  status: SimRequestStatus
  createdAt: string
  timeline: SimRequestTimelineEntry[]
  notes?: string
}

export type SimRequestsList = {
  items: SimRequestItem[]
  total: number
}

export type SimRequestsListResponse = ServerResponse<SimRequestsList>
export type SimRequestResponse = ServerResponse<SimRequestItem>
export type GetSimRequestPayload = { id: string }

export type UpdateOnboardingFeaturesPayload = {
  data: {
    liveTracking?: boolean
    geofencing?: boolean
    routeOptimization?: boolean
    messaging?: boolean
    analytics?: boolean
    apiAccess?: boolean
  }
}

/** Note the response key is `advancedAnalytics` where the request sends `analytics`. */
export type OnboardingFeaturesResponse = ServerResponse<{
  features: {
    liveTracking?: boolean
    geofencing?: boolean
    routeOptimization?: boolean
    messaging?: boolean
    advancedAnalytics?: boolean
    apiAccess?: boolean
  }
}>

export type OnboardingCompleteResponse = ServerResponse<{ completedAt: string }>
export type OnboardingEnquiryResponse = ServerResponse<{ ticketId: string }>
export type OnboardingRequestIdResponse = ServerResponse<{ requestId: string }>
export type OnboardingSimsRegisterResponse = ServerResponse<{ registered: number }>

export type KycDocumentStatus = 'pending' | 'under_review' | 'verified' | 'rejected'

export type KycDocumentType =
  | 'certificate_of_incorporation'
  | 'memorandum_of_association'
  | 'tax_clearance'
  | 'vat_certificate'
  | 'business_license'
  | 'insurance_certificate'
  | 'proof_of_address'
  | 'director_id'
  | 'other'

export type KycDocument = {
  id: string
  documentType: string
  documentName: string
  fileSize: number
  status: KycDocumentStatus
  createdAt: string
}

export type KycDocumentsResponse = ServerResponse<{ documents: KycDocument[] }>
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

// ─── Auth (additions) ─────────────────────────────────────────────────────────

export type ResendVerificationPayload = { data: { email: string } }
// ponytail: spec ships no response schema, tighten when @ApiResponse lands
export type TenantStatusResponse = ServerResponse<unknown>
// ponytail: spec ships no response schema
export type ActivityLogVerifyResponse = ServerResponse<unknown>

// ─── Mailbox ──────────────────────────────────────────────────────────────────

export type MailServer = {
  host: string
  port: number
  username: string
  password: string
  secure?: boolean
}

export type SaveMailCredentialsPayload = {
  data: {
    emailAddress: string
    displayName?: string
    imap: MailServer
    smtp: MailServer
  }
}

// ponytail: spec ships no mailbox response schemas; typed loose until it does
export type MailboxCredentialsResponse = ServerResponse<unknown>
export type MailboxThreadsQuery = { params?: { limit?: number; offset?: number } }
export type MailboxThreadsSinceQuery = { params: { cursor: string; limit?: number } }
export type MailboxThreadPayload = { id: string }
export type MailboxAttachmentPayload = { messageId: string; index: number }
export type MailboxThreadsResponse = ServerResponse<unknown[]>
export type MailboxThreadDetailResponse = ServerResponse<unknown>
export type MailboxAttachmentLinkResponse = ServerResponse<{ url: string; expiresAt?: string }>

export type MailAddress = { address: string; name?: string | null }
export type OutgoingAttachment = { filename: string; contentType: string; content: string }
export type SendMailPayload = {
  data: {
    to: MailAddress[]
    cc?: MailAddress[]
    bcc?: MailAddress[]
    subject: string
    bodyText?: string
    bodyHtml?: string
    replyToThreadId?: string
    attachments?: OutgoingAttachment[]
  }
}
export type SendMailResponse = ServerResponse<unknown>

// ─── Platform Alerts ──────────────────────────────────────────────────────────

export type PlatformAlertChannel = 'email' | 'sms' | 'slack' | 'webhook'
export type PlatformAlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export type PlatformAlertType =
  | 'new_tenant_signup'
  | 'system_errors'
  | 'billing_alerts'
  | 'security_alerts'

// Row shape confirmed against a live GET response; the OpenAPI omits it.
// Spec types `channels` as a single string, but the server returns an array
// (e.g. ["email"]) — trust the wire over the spec.
export type PlatformAlertSetting = {
  alertType: PlatformAlertType
  enabled: boolean
  channels: PlatformAlertChannel[]
  recipients: string[]
  minSeverity: PlatformAlertSeverity
  updatedAt: string
  updatedBy: string | null
}

export type UpdateAlertSettingPayload = {
  alertType: PlatformAlertType
  data: {
    enabled?: boolean
    channels?: PlatformAlertChannel[]
    recipients?: string[]
    minSeverity?: PlatformAlertSeverity
  }
}

export type PlatformAlertSettingsResponse = ServerResponse<PlatformAlertSetting[]>
export type PlatformAlertSettingResponse = ServerResponse<PlatformAlertSetting>

// ─── Communication Pricing ────────────────────────────────────────────────────

export type CommunicationChannel = 'sms' | 'whatsapp' | 'voice' | 'ai' | 'iot_sim'

export type ChannelRate = {
  channel: CommunicationChannel
  rateKobo: number
  enabled?: boolean
  description?: string
}

export type UpdateCommunicationRatesPayload = { data: { rates: ChannelRate[] } }
export type CommunicationRateHistoryPayload = { channel: CommunicationChannel }

// ponytail: spec ships no response schemas
export type CommunicationRatesResponse = ServerResponse<unknown>
export type CommunicationRateHistoryResponse = ServerResponse<unknown[]>

// ─── Organisation Upgrades ────────────────────────────────────────────────────

export type RequestUpgradePayload = { data: { reason: string } }
export type ReviewUpgradePayload = { id: string; data: { notes?: string } }

// ponytail: spec ships no response schemas
export type OrganisationUpgradeQueueResponse = ServerResponse<unknown[]>
export type OrganisationUpgradeResponse = ServerResponse<unknown>

// ─── System Support (assign) ──────────────────────────────────────────────────

export type AssignSystemSupportTicketPayload = {
  id: string
  data: { assigneeId?: string | null }
}

// ─── System KYC ───────────────────────────────────────────────────────────────

export type KycReviewDocumentStatus = 'pending' | 'under_review' | 'verified' | 'rejected'

export type KycReviewDocument = {
  id: string
  tenantId: string
  documentType: string
  documentName: string
  fileSize: number
  status: KycReviewDocumentStatus
  reviewedBy: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}

export type SystemKycReviewQueueQuery = {
  params?: {
    status?: KycReviewDocumentStatus
    tenantId?: string
    page?: number
    limit?: number
  }
}

export type SystemKycReviewQueueResponse = ServerResponse<{
  items: KycReviewDocument[]
  total: number
}>
export type SystemKycReviewDocumentResponse = ServerResponse<KycReviewDocument>
export type RejectKycDocumentPayload = { id: string; data: { reason: string } }

// ─── Data Bundles (ledger) ────────────────────────────────────────────────────

export type DataBundleLedgerQuery = { params?: { page?: number; limit?: number } }
// ponytail: spec ships no ledger row schema
export type DataBundleLedgerResponse = ServerResponse<unknown[]>

// ─── Platform Wallets ─────────────────────────────────────────────────────────

export type PlatformWalletsQuery = {
  params?: { query?: string; status?: string }
}

export type PlatformWalletLedgerQuery = {
  params?: {
    query?: string
    tenantId?: string
    category?: string
    direction?: string
    page?: number
    limit?: number
  }
}

export type PlatformTopUpPayload = {
  tenantId: string
  data: { amount: number; reason: string }
}

export type PlatformWalletCreditSettingsPayload = {
  tenantId: string
  data: {
    creditEnabled: boolean
    creditLimit?: number | null
    lowBalanceThreshold: number
  }
}

// ponytail: spec ships no response schema — tighten when @ApiResponse lands
export type PlatformWalletsResponse = ServerResponse<unknown>
export type PlatformWalletLedgerResponse = ServerResponse<unknown>
export type PlatformTopUpResponse = ServerResponse<unknown>
export type PlatformWalletCreditSettingsResponse = ServerResponse<unknown>
