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

// TRU-FE-18 — installer portal sign-in. The password step answers with a session,
// or a challenge when the installer turned two-factor on.
export type InstallerLoginPayload = LoginPayload

/** Lasts five minutes and works once; 401 "This sign-in has expired; start again" means re-run the password step. */
export type TwoFactorChallenge = {
  twoFactorRequired: true
  step: 'code'
  challengeToken: string
}

/**
 * TRU-FE-23 — admin portal only, once the platform requires two-factor: an admin who never set
 * it up is enrolled at sign-in. The first code goes to `/auth/system/login/two-factor`, which
 * then also returns the recovery codes.
 */
export type TwoFactorEnrolmentChallenge = {
  twoFactorRequired: true
  step: 'enrolment'
  challengeToken: string
  enrolment: TwoFactorEnrolment
}

export type LoginResult = AuthSession | TwoFactorChallenge
export type SystemLoginResult = AuthSession | TwoFactorChallenge | TwoFactorEnrolmentChallenge

/** `code` is six authenticator digits or a recovery code. The same body on every portal. */
export type LoginTwoFactorPayload = {
  data: {
    challengeToken: string
    code: string
  }
}
export type InstallerLoginTwoFactorPayload = LoginTwoFactorPayload

export const INSTALLER_CAPABILITIES = [
  'tracker_installation_wiring',
  'sim_installation_activation',
  'device_configuration_provisioning',
  'fuel_sensor_installation_calibration',
  'camera_accessory_installation',
  'diagnostics_repairs_troubleshooting',
  'device_replacement_deinstallation',
  'onsite_customer_training_handover',
] as const
export type InstallerCapability = (typeof INSTALLER_CAPABILITIES)[number]

// TRU-FE-19 — installer portal dashboard. Every timestamp is an ISO UTC instant; show it in
// the installer's Display Preferences time zone, not a fixed one.
export type InstallerJobStatus =
  | 'unassigned'
  | 'assigned'
  | 'scheduled'
  | 'in_progress'
  | 'overdue'
  | 'issue_reported'
  | 'completed'
  | 'cancelled'

export type DashboardJob = {
  jobId: string
  jobNumber: string
  companyName: string
  siteContactName: string
  siteContactPhone: string
  siteContactEmail: string | null
  address: string
  city: string
  state: string
  scheduledAt: string
  scheduledUntil: string
  status: InstallerJobStatus
}

/** `items` is the first 5, soonest first; `total` is how many match in all. */
export type DashboardSection = { items: DashboardJob[], total: number }

export type InstallerDashboard = {
  /** `total` excludes offers not yet accepted; `successRate` is a whole percentage. */
  counters: { total: number, completed: number, pending: number, successRate: number }
  /** `assigned` jobs waiting for Accept or Reject. */
  offers: DashboardSection
  todaysJobs: DashboardSection
  upcomingJobs: DashboardSection
  /** The last 6 months, oldest first; `month` is "YYYY-MM". */
  activityOverTime: { month: string, completed: number, inProgress: number, scheduled: number }[]
  /** The last 10 events, newest first. */
  recentActivity: {
    type: 'offered' | 'accepted' | 'started' | 'issue_reported' | 'completed' | 'cancelled'
    jobId: string
    jobNumber: string
    occurredAt: string
  }[]
}

// Confirmed on dev 2026-09-30 (e.g. type "support_ticket_updated").
export type InstallerNotification = {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
  jobId: string | null
  jobNumber: string | null
}

export type InstallerNotificationsPage = {
  unreadCount: number
  items: InstallerNotification[]
  page: number
  limit: number
  total: number
}

export type InstallerOptionItem = { key: string, label: string }

export type InstallerOptions = {
  checklist: { key: string, label: string, items: (InstallerOptionItem & { gated?: string })[] }[]
  evidenceCategories: InstallerOptionItem[]
  // `chips` keys go out as `issueCode`; required when non-empty (dev answers 400 otherwise).
  supportCategories: (InstallerOptionItem & { description?: string, chips?: InstallerOptionItem[] })[]
  fieldTips: string[]
  priorities: InstallerOptionItem[]
  ticketStatuses: InstallerOptionItem[]
}

// TRU-FE-22 — installer support tickets. Every status change arrives as a notification.
// ponytail: Swagger documents no response bodies for these routes — the ticket, page and detail
// shapes follow the jobs envelope and job `issues[]`; confirm once dev can be signed into.
export type InstallerSupportTicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_on_tenant'
  | 'escalated'
  | 'resolved'
  | 'closed'

// Confirmed on dev 2026-10-01: the list carries `title` (built server-side from category and chip)
// and `message`; only the detail carries `description`.
export type InstallerSupportTicket = {
  id: string
  /** e.g. "#tkt-1000" */
  displayId: string
  title: string
  message: string
  reporter: string
  channel: string
  category: string
  categoryLabel: string
  priority: SupportTicketPriority
  status: InstallerSupportTicketStatus
  statusLabel: string
  createdAt: string
}

export type InstallerSupportTicketsPage = {
  /** `closed` counts resolved and closed. */
  counts: { total: number, open: number, inProgress: number, escalated: number, closed: number }
  items: InstallerSupportTicket[]
  page: number
  limit: number
  total: number
}

export type InstallerSupportTicketDetail = Omit<InstallerSupportTicket, 'message'> & {
  description: string
  issueCode?: string | null
  callbackPhone?: string | null
  relatedJob: { id: string, jobNumber: string } | null
  attachments: { id: string, fileName: string, size: number, createdAt: string }[]
}

export type InstallerSupportTicketsQuery = {
  params?: {
    status?: InstallerSupportTicketStatus
    category?: string
    priority?: SupportTicketPriority
    /** Ticket id (#tkt-1000), title or description. */
    search?: string
    page?: number
    limit?: number
  }
}

export type CreateInstallerSupportTicketPayload = {
  data: {
    category: InstallerIssueType
    /** Required from the category's chips when it has any. */
    issueCode?: string
    /** One of the installer's own jobs. */
    relatedJobId?: string
    priority: SupportTicketPriority
    /** At most 4000 characters. */
    description: string
    callbackPhone: string
  }
}

export type InstallerDisplayPreferences = {
  /** IANA name, e.g. "Africa/Lagos" — the default until the installer changes it. */
  timezone: string
  defaultTimeRange: 'today' | 'last_7_days' | 'last_30_days' | 'last_90_days'
}

// TRU-FE-21 — installer settings.
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River',
  'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
] as const
export type NigerianState = (typeof NIGERIAN_STATES)[number]

export type InstallerProfile = {
  personal: {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    state: NigerianState | null
    city: string | null
    /** Signed link that expires after about five minutes; null without a photo. */
    photoUrl: string | null
  }
  /** Read-only; the platform admin sets it. */
  record: {
    code: string
    status: 'invited' | 'active' | 'suspended'
    serviceAreas: string[]
    createdAt: string
  }
}
export type UpdateInstallerProfilePayload = {
  data: Partial<{ firstName: string, lastName: string, phoneNumber: string, state: NigerianState, city: string }>
}
export type UpdateInstallerDisplayPreferencesPayload = { data: Partial<InstallerDisplayPreferences> }

/** Alerts go by email and to the in-platform inbox only — there is no SMS channel. */
export type InstallerNotificationPreferences = {
  newInstallationOffers: boolean
  scheduleReminders: boolean
  jobAndIssueUpdates: boolean
  supportTicketUpdates: boolean
  emailAlerts: boolean
  inPlatformAlerts: boolean
}
export type UpdateInstallerNotificationPreferencesPayload = { data: Partial<InstallerNotificationPreferences> }

export type InstallerWorkPreferences = {
  /** unavailable: offered no new jobs. */
  availability: 'available' | 'unavailable'
  /** HH:MM, 24-hour, Lagos time; start before end. */
  workingHours: { start: string, end: string }
  preferredPeriods: 'weekdays' | 'weekends' | 'all_days'
  /** Read-only; the platform admin sets it. */
  serviceAreas: string[]
}
export type UpdateInstallerWorkPreferencesPayload = {
  data: Partial<Omit<InstallerWorkPreferences, 'serviceAreas'>>
}
/** Ends every session; the response carries the new token pair. */
export type ChangeInstallerPasswordPayload = { data: { currentPassword: string, newPassword: string } }

/** A rejected offer goes to the next installer and never returns to this one. */
export type RejectInstallerJobPayload = { jobId: string, data: { reason: string } }

// TRU-FE-20 — installer jobs list, job detail and job work.

export type InstallerJobListItem = {
  id: string
  jobNumber: string
  siteContactName: string
  siteContactPhone: string
  firstVehicle: { registrationNumber: string, make: string, model: string } | null
  firstDevice: { manufacturer: string, model: string } | null
  vehicleCount: number
  deviceCount: number
  /** The booked Lagos day, "YYYY-MM-DD". */
  scheduledDate: string
  scheduledAt: string
  scheduledUntil: string
  status: InstallerJobStatus
  /** When it was completed or cancelled. */
  completedAt: string | null
  /** Empty when the application is gone. */
  companyName: string
  address: string
  city: string
  state: string
}

/** `total` excludes offers (assigned); overdue is included. */
export type InstallerJobCounters = {
  total: number
  scheduled: number
  inProgress: number
  overdue: number
  completed: number
  cancelled: number
  issueReported: number
  unassigned: number
}

export type InstallerJobsPage = {
  counters: InstallerJobCounters
  items: InstallerJobListItem[]
  page: number
  limit: number
  total: number
}

export type InstallerJobsQuery = {
  /** active (default): every status but completed and cancelled; history: completed. */
  scope?: 'active' | 'history'
  status?: InstallerJobStatus
  search?: string
  /** "YYYY-MM-DD" */
  completedFrom?: string
  completedTo?: string
  page?: number
  /** Default 20, at most 100. */
  limit?: number
}

export type InstallerJobsExportQuery = Pick<InstallerJobsQuery, 'search' | 'completedFrom' | 'completedTo'> & {
  /** IANA zone the CSV's completion date/time are written in, so they match the screen. */
  timezone?: string
}

export type InstallerChecklistItem = {
  key: string
  label: string
  checked: boolean
  checkedAt: string | null
  /** Can only be ticked once devices communicate / evidence exists — the server enforces it. */
  gated?: 'device_communicating' | 'evidence'
}

export type InstallerJobDetail = {
  id: string
  jobNumber: string
  status: InstallerJobStatus
  customer: {
    customerName: string
    customerType: 'Enterprise' | 'Owner operator' | null
    phone: string
    email: string | null
    address: string
    scheduledDate: string
    scheduledAt: string
    scheduledUntil: string
  }
  units: {
    index: number
    vehicle: {
      registrationNumber: string
      vehicleType: string
      make: string
      model: string
      year: number | null
      engineNumber: string | null
      chassisNumber: string | null
      colour: string | null
      engineCapacity: string | null
      odometer: number | null
    } | null
    /** Null until bound, or when fleet cannot answer. */
    device: {
      id: string
      name: string | null
      imei: string
      manufacturer: string
      model: string
      status: string
      statusLabel: string
      deviceType: string | null
      verificationStatus: string | null
    } | null
    sim: {
      iccid: string
      imsi: string | null
      msisdn: string | null
      carrier: string
      activationStatus: string
      network: string | null
    } | null
  }[]
  checklist: {
    groups: { key: string, label: string, items: InstallerChecklistItem[] }[]
    completed: number
    total: number
  }
  evidence: { id: string, category: string, label: string, fileName: string, size: number, createdAt: string }[]
  notes: string | null
  completion: {
    customer: string
    vehicle: string | null
    device: string | null
    vehicles: string
    devices: string
    installationDate: string
    installer: string
    checklist: string
    evidenceCount: number
    notes: string | null
  }
  /** Drive every button from these — never infer them from `status`. */
  actions: {
    canAccept: boolean
    canStart: boolean
    canComplete: boolean
    canEditNotes: boolean
    canUploadEvidence: boolean
    canTick: boolean
  }
  issues: { ticketId: string, displayId: string, status: string, createdAt: string }[]
}

export const INSTALLER_ISSUE_TYPES = [
  'device_hardware',
  'configuration_setup',
  'sim_connectivity',
  'job_scheduling',
  'site_access_safety',
  'account_tools',
] as const
export type InstallerIssueType = (typeof INSTALLER_ISSUE_TYPES)[number]

export type SetInstallerChecklistItemPayload = { jobId: string, itemKey: string, data: { checked: boolean } }
export type SaveInstallerJobNotesPayload = { jobId: string, data: { notes: string | null } }
/** JPG, PNG or WebP, up to 10 MB. */
export type UploadInstallerEvidencePayload = { jobId: string, category: string, file: File }
export type ReportInstallerJobIssuePayload = {
  jobId: string
  issueType: InstallerIssueType
  description: string
  photo?: File
}

/** POST /auth/system/installers — creates the installer and emails their portal invite. */
export type CreateSystemInstallerPayload = {
  data: {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    state?: string
    city?: string
    serviceAreas: string[]
    capabilities: InstallerCapability[]
    maxActiveJobs?: number
  }
}

export type SystemInstallerStatus = 'invited' | 'active' | 'suspended'
export type SystemInstallerAvailability = 'not_onboarded' | 'unavailable' | 'at_capacity' | 'available'

/** One row of GET /auth/system/installers. */
export type SystemInstaller = {
  id: string
  code: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phoneNumber: string
  state: string
  city: string
  serviceAreas: string[]
  capabilities: InstallerCapability[]
  availability: SystemInstallerAvailability
  status: SystemInstallerStatus
  activeJobs: number
  maxActiveJobs: number
  jobsCompleted: number
  createdAt: string
  lastActivityAt: string | null
}

export type SystemInstallersQuery = {
  search?: string
  status?: SystemInstallerStatus
  page?: number
  limit?: number
}

export type SystemInstallersResponse = ServerResponse<{
  summary: { total: number, active: number, invited: number, suspended: number }
  items: SystemInstaller[]
  page: number
  limit: number
  total: number
}>

/** The email cannot change. */
export type UpdateSystemInstallerPayload = {
  id: string
  data: Partial<Omit<CreateSystemInstallerPayload['data'], 'email'>>
}

export type SystemInstallerActionPayload = { id: string }

/** One row of GET /auth/system/installation-orders. */
export type SystemInstallationJob = {
  id: string
  jobNumber: string
  tenantId: string
  /** Organisation name, empty when the application is gone. */
  customer: string
  customerEmail: string | null
  /** enterprise or owner_operator; null when the application is gone. */
  tenantType: 'enterprise' | 'owner_operator' | string | null
  siteContactName: string
  siteContactPhone: string
  firstVehicle: { registrationNumber: string, make: string, model: string } | null
  firstDevice: { manufacturer: string, model: string } | null
  location: { city: string, state: string }
  vehicleCount: number
  deviceCount: number
  /** The booked Lagos day, "YYYY-MM-DD". */
  scheduledDate: string
  scheduledAt: string
  scheduledUntil: string
  status: InstallerJobStatus
  createdAt: string
  /** When the installer started work; null until then. */
  startedAt: string | null
  /** When it was completed or cancelled. */
  completedAt: string | null
  installer: { id: string, code: string, fullName: string } | null
  /** Newest issue report, only while status is issue_reported. */
  issueTicket: { id: string, displayId: string } | null
}

export type SystemInstallationJobUnit = {
  index: number
  vehicle: {
    registrationNumber: string
    vehicleType: string | null
    make: string
    model: string
    year: number | null
    engineNumber: string | null
    chassisNumber: string | null
    colour: string | null
    engineCapacity: string | null
    odometer: number | null
  } | null
  device: {
    id: string
    name: string | null
    imei: string
    manufacturer: string
    model: string
    status: string
    statusLabel: string
    deviceType: string | null
    verificationStatus: string | null
  } | null
  sim: {
    iccid: string
    imsi: string
    msisdn: string
    carrier: string
    activationStatus: string
    network: string | null
  } | null
}

export type SystemInstallationChecklistItem = {
  key: string
  label: string
  checked: boolean
  checkedAt: string | null
  gated?: string
}

export type SystemInstallationJobDetail = {
  id: string
  jobNumber: string
  status: InstallerJobStatus
  customer: {
    customerName: string
    customerType: string | null
    phone: string
    email: string | null
    address: string
    scheduledDate: string
    scheduledAt: string
    scheduledUntil: string
  }
  installer: {
    id: string
    code: string
    fullName: string
  } | null
  units: SystemInstallationJobUnit[]
  checklist: {
    groups: Array<{
      key: string
      label: string
      items: SystemInstallationChecklistItem[]
    }>
    completed: number
    total: number
  }
  evidence: Array<{
    id: string
    category: string
    label: string
    fileName: string
    size: number
    createdAt: string
  }>
  notes: string | null
  completion: {
    customer: string
    vehicle: string | null
    device: string | null
    vehicles: string[]
    devices: string[]
    installationDate: string
    installer: string
    checklist: string
    evidenceCount: number
    notes: string | null
  }
  actions: {
    canAccept: boolean
    canStart: boolean
    canComplete: boolean
    canEditNotes: boolean
    canUploadEvidence: boolean
    canTick: boolean
  }
  offerRejections: Array<{
    installerId: string
    installerName: string | null
    reason: string
    rejectedAt: string
  }>
}

export type SystemInstallationJobDetailResponse = ServerResponse<SystemInstallationJobDetail>

export type SystemInstallationJobsQuery = {
  /** One status, or several comma-separated. */
  status?: string
  installerId?: string
  search?: string
  tenantType?: 'enterprise' | 'owner_operator'
  assignment?: 'assigned' | 'unassigned'
  /** Inclusive YYYY-MM-DD bounds. */
  scheduledFrom?: string
  scheduledTo?: string
  startedFrom?: string
  startedTo?: string
  completedFrom?: string
  completedTo?: string
  createdFrom?: string
  createdTo?: string
  sort?: 'newest' | 'scheduled' | 'completion'
  page?: number
  limit?: number
}

export type SystemInstallationJobsResponse = ServerResponse<{
  items: SystemInstallationJob[]
  page: number
  limit: number
  total: number
  /** Jobs per status under the same filters, status aside. */
  countsByStatus: Record<InstallerJobStatus, number>
}>

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
    /** Not needed for an installer: the invited name is used. */
    fullName?: string
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
    status?: 'registered' | 'configured' | 'assigned' | 'active' | 'suspended' | 'faulty' | 'decommissioned'
    lifecycleStatus?: 'registered' | 'config_pending' | 'configured' | 'verified_online' | 'assignable' | 'assigned' | 'suspended' | 'faulty' | 'decommissioned'
  }
}

export type ActivityLog = {
  id: string
  tenantId: string
  tenantName?: string | null
  service: string
  action: string
  entityType: string
  entityId: string
  summary: string
  actorId: string
  actorName?: string | null
  actorEmail?: string | null
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
    page?: number
    limit?: number
  }
}

export type UpdateSystemSimPayload = {
  id: string
  data: {
    iccid?: string
    msisdn?: string
    imsi?: string | null
    plan?: string
    carrier?: string
    dataLimitMb?: number
    smsLimit?: number
  }
}

export type ReassignSystemSimPayload = {
  id: string
  data: {
    tenantId: string | null
    deviceId?: string | null
  }
}

export type CreateSystemSimPayload = {
  iccid: string
  msisdn: string
  imsi?: string | null
  carrier: string
  plan?: string
  dataLimitMb?: number
  smsLimit?: number
}

export type ImportSystemSimRow = {
  iccid: string
  msisdn: string
  imsi?: string | null
  carrier?: string | null
}

export type ImportSystemSimsPayload = {
  rows: ImportSystemSimRow[]
}

export type DeleteSystemSimPayload = { id: string }

export type ActivateSystemSimPayload = { id: string }

export type SystemSimStatusAction = 'activate' | 'suspend' | 'reinstate'

export type BulkSystemSimStatusPayload = {
  ids: string[]
  action: SystemSimStatusAction
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
    status?: 'active' | 'pending' | 'suspended' | 'inactive' | 'terminated'
    plan?: 'starter' | 'professional' | 'enterprise'
    planCode?: string
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
    /** 5..500 chars. Required for any status other than 'active'; optional on reinstate. */
    reason?: string
  }
}

// ─── System admin — devices ───────────────────────────────────────────────────

// Server enums (validated, 2026-09-23).
export const DEVICE_CATALOG_PROTOCOLS = ['TCP', 'HTTP', 'MQTT', 'UDP', 'WEBSOCKET', 'SDK'] as const
export type DeviceCatalogProtocol = typeof DEVICE_CATALOG_PROTOCOLS[number]
export type DeviceCatalogFeature = 'obd2' | 'fuel' | 'sos'
export type DeviceCatalogStatus = 'supported' | 'deprecated' | 'blocked'

export type CreateDeviceCatalogPayload = {
  data: {
    manufacturer: string
    model: string
    protocolType: DeviceCatalogProtocol
    defaultPort?: number
    supportedFeatures: DeviceCatalogFeature[]
    status: DeviceCatalogStatus
    /** "" clears it (server stores null). */
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
  completed: number
  totalSimsQueued: number
  needsAttention: number
}

// ─── System admin — feature flags ────────────────────────────────────────────

export type UpdateFeatureFlagPayload = {
  key: string
  data: Record<string, unknown>
}

// ─── System admin — settings ──────────────────────────────────────────────────

// TRU-FE-7 § A — PATCH is section-wise. Send only the section you're editing; the
// server leaves the other sections untouched (verified 2026-09-09).
export type UpdateSystemSettingsPayload = {
  data: Partial<Pick<AuthSystemSettings, 'platformName' | 'supportEmail' | 'profile' | 'support' | 'defaults' | 'features' | 'retention' | 'security'>>
}

// ─── TRU-FE-7 § B — AI governance / usage / requests ─────────────────────────

export type AIProviderKey = 'openai' | 'anthropic' | 'lovable'
export type AIRequestStatusFilter = 'all' | 'success' | 'failed'

export type AIProviderConfig = {
  provider: AIProviderKey
  label: string
  description: string
  enabled: boolean
  allowedModels: string[]
  defaultModel: string
  allowedTools: string[]
}

export type AIRateLimits = {
  maxTokensPerRequest: number
  maxRequestsPerMinute: number
  maxTokensPerDayPerTenant: number
}

export type AIDataProtection = {
  redactPhoneNumbers: boolean
  redactDriverNames: boolean
  redactVehiclePlates: boolean
  storePromptsAndResponses: boolean
}

export type AIGovernance = {
  matchingEnabled: boolean
  providers: AIProviderConfig[]
  rateLimits: AIRateLimits
  dataProtection: AIDataProtection
  availableTools: string[]
  updatedAt: string
  updatedByUserId: string | null
}

/** PATCH is partial — send only what you change. Providers are patched by key
 *  (§ B: sending one provider leaves the others untouched). */
export type UpdateAIGovernancePayload = {
  data: {
    matchingEnabled?: boolean
    providers?: Array<Partial<AIProviderConfig> & { provider: AIProviderKey }>
    rateLimits?: Partial<AIRateLimits>
    dataProtection?: Partial<AIDataProtection>
  }
}

export type AIUsageProviderStat = {
  provider: AIProviderKey
  requests: number
  tokens: number
  percentOfTotal: number
}

export type AIUsageTenantStat = {
  tenantId: string
  tenantName?: string | null
  requests: number
  tokens: number
  percentOfTotal: number
}

export type AIUsage = {
  totalRequests: number
  totalTokens: number
  /** null before anything has run — render a dash, not zero. */
  successRate: number | null
  /** null before anything has run — render a dash, not zero. */
  averageLatencyMs: number | null
  byProvider: AIUsageProviderStat[]
  byTenant: AIUsageTenantStat[]
  generatedAt: string
}

export type AIUsageQuery = {
  params?: {
    from?: string
    to?: string
  }
}

export type AIRequestItem = {
  id: string
  createdAt: string
  tenantId: string
  tenantName?: string | null
  provider: AIProviderKey
  model: string
  feature: string
  tokens: number
  latencyMs: number
  succeeded: boolean
  errorMessage: string | null
}

export type AIRequestsList = {
  total: number
  items: AIRequestItem[]
}

export type AIRequestsQuery = {
  params?: {
    search?: string
    provider?: AIProviderKey
    status?: AIRequestStatusFilter
    limit?: number
  }
}

// ─── § B — OpenRouter credential ──────────────────────────────────────────────
export type UpdateOpenRouterCredentialPayload = {
  data: {
    category: 'ai'
    enabled: boolean
    /** Rotates on send; omit to leave the current secret in place. Never comes back on read. */
    secret?: string
  }
}

export type SupportTicketCategory =
  | 'device_tracking'
  | 'sim_connectivity'
  | 'messaging'
  | 'billing'
  | 'billing_subscription'
  | 'account_access'
  | 'compliance'
  | 'onboarding'
  | 'other'

export type SupportTicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_on_tenant'
  | 'escalated'
  | 'resolved'
  | 'closed'

export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'critical'

export type SupportTicketChannel = 'device' | 'sim' | 'vehicle' | 'messaging' | 'billing' | 'other'

export type SupportTicketsQuery = {
  params?: {
    /** One status or a comma-separated list. */
    status?: string
    category?: string
    priority?: SupportTicketPriority
    search?: string
    createdBy?: 'me'
    /** Matches channel, or otherChannel case-insensitively. */
    channel?: string
    /** Omit page and limit to get up to 500 tickets. */
    page?: number
    limit?: number
  }
}

export type CreateSupportTicketPayload = {
  data: {
    subject: string
    description: string
    category: SupportTicketCategory
    channel?: SupportTicketChannel
    otherChannel?: string
    priority?: SupportTicketPriority
    // TRU-FE-10 §D: server reads and stores the snapshot from these ids.
    // Never send a client-supplied `contextSnapshot` — it is ignored.
    contextType?: SupportTicketContextType
    contextId?: string
  }
}

export type AttachSupportTicketFilesPayload = {
  id: string
  data: File[]
  messageId?: string
}

export type SupportTicket = {
  id: string
  ticketNumber: number
  /** The number people quote, e.g. "#tkt-1000". */
  displayId: string
  /** The reporter's full name, else their email; null when the user is gone. */
  reporterName: string | null
  tenantId: string
  category: string
  subject: string
  description: string
  status: SupportTicketStatus
  priority: SupportTicketPriority
  channel: SupportTicketChannel | null
  otherChannel: string | null
  contextType: string
  contextId: string | null
  contextSnapshot: Record<string, unknown> | null
  escalatedTo: string | null
  escalatedReferenceId: string | null
  escalationNotes: string | null
  escalatedAt: string | null
  escalatedBy: string | null
  assignedTo: string | null
  createdBy: string
  resolvedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SupportTicketCountsByStatus = Record<SupportTicketStatus, number>

export type SupportTicketsListResponse = ServerResponse<{
  tickets: SupportTicket[]
  countsByStatus: SupportTicketCountsByStatus
  total: number
  page?: number
  limit?: number
}>

export type SupportTicketResponse = ServerResponse<SupportTicket>

export type SupportTicketMessage = {
  id: string
  ticketId: string
  senderId: string
  senderName: string
  senderRole: string
  message: string
  isInternal?: boolean
  createdAt: string
}

export type SupportTicketAttachment = {
  id: string
  ticketId: string
  tenantId: string
  messageId: string | null
  key: string
  filename: string
  contentType: string
  sizeBytes: number
  uploadedBy: string
  createdAt: string
}

export type SupportTicketDetail = {
  ticket: SupportTicket
  messages: SupportTicketMessage[]
  attachments: SupportTicketAttachment[]
}

export type SupportTicketDetailResponse = ServerResponse<SupportTicketDetail>

export type SupportTicketReplyResponse = ServerResponse<{
  message: SupportTicketMessage
  ticketStatus: SupportTicketStatus
}>

/** A signed download link; it expires a few minutes after it is issued. */
export type SupportTicketAttachmentLink = {
  id: string
  fileName: string
  size: number
  mimeType: string
  url: string
  expiresAt: string
}
export type SupportTicketAttachmentLinkResponse = ServerResponse<SupportTicketAttachmentLink>

export type SupportTicketCsat = {
  rating: number
  comment: string | null
  wouldRecommend: boolean | null
  userId: string
  createdAt: string
}
export type SupportTicketCsatResponse = ServerResponse<SupportTicketCsat | null>
export type SubmitSupportTicketCsatPayload = {
  id: string
  data: { rating: number, comment?: string, wouldRecommend?: boolean }
}

/** GET /auth/capabilities — what the signed-in user may do, organisation grants included. */
export type Capabilities = { portal: string, permissions: string[] }
export type CapabilitiesResponse = ServerResponse<Capabilities>

// TRU-FE-10 §A — Tenant summary cards
export type SupportTicketsSummary = {
  total: number
  open: number
  inProgress: number
  escalated: number
  awaitingResponse: number   // waiting_on_tenant
  closed: number             // resolved + closed
}
export type SupportTicketsSummaryResponse = ServerResponse<SupportTicketsSummary>

// TRU-FE-10 §B — Server-driven dropdowns
export type SupportTicketOption = { value: string; label: string }
export type SupportTicketOptions = {
  categories: SupportTicketOption[]
  channels: SupportTicketOption[]
  priorities: SupportTicketOption[]
  contextTypes: SupportTicketOption[]
}
export type SupportTicketOptionsResponse = ServerResponse<SupportTicketOptions>

// TRU-FE-10 §C — Context auto-attach
export type SupportTicketContextType = 'device' | 'vehicle' | (string & {})

export type SupportTicketContextDeviceSnapshot = {
  imei: string | null
  manufacturer: string | null
  model: string | null
  status: string | null
  lifecycleStatus: string | null
  healthStatus: 'online' | 'offline' | 'never_reported'
  lastSeen: string | null
}

// ponytail: vehicle snapshot shape unknown from batch 9 doc — leave generic until
// the field-by-field reference in new-endpoints.md is available.
export type SupportTicketContext<TSnapshot = unknown> = {
  available: boolean
  contextType: SupportTicketContextType
  contextId: string
  snapshot: TSnapshot | null
}
export type SupportTicketContextResponse<TSnapshot = unknown> =
  ServerResponse<SupportTicketContext<TSnapshot>>

export type SupportTicketContextPayload = {
  contextType: SupportTicketContextType
  contextId: string
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

// Tenant categories (from /auth/support-tickets/options) plus the admin-only enquiry type seen in byCategory.
export type SystemSupportTicketCategory = SupportTicketCategory | 'enterprise_enquiry'

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

// Full ticket row — list, detail, escalated and the dashboard lists all return it (probed 2026-09-23).
// The dashboard's needsAttention/recentlyResolved carry the id/subject/tenant/category/status/priority
// core plus the timestamps only, so the rest is optional.
export type SystemSupportTicket = {
  id: string
  displayId?: string
  reporterName?: string | null
  relatedJob?: { id: string; jobNumber: string } | null
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
  description?: string
  channel?: string | null
  otherChannel?: string | null
  contextType?: string | null
  contextId?: string | null
  contextSnapshot?: Record<string, unknown> | null
  escalatedTo?: string | null
  escalatedReferenceId?: string | null
  escalationNotes?: string | null
  escalatedBy?: string | null
  assignedTo?: string | null
  createdBy?: string
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
  attachments: SupportTicketAttachment[]
  /** The tenant's rating, read-only; null until they give one. */
  csat?: SupportTicketCsat | null
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

// TRU-FE-5 § 2 — new status vocabulary: pending_review → approved → in_progress → provisioned → assigned; rejected/cancelled at any point.
export type SystemDeviceSetupStatus = 'pending_review' | 'approved' | 'in_progress' | 'provisioned' | 'assigned' | 'rejected' | 'cancelled'

export type SystemDeviceSetupKycStatus = 'verified' | 'pending' | 'rejected' | null

export type SystemDeviceSetupTimelineEntry = {
  status: SystemDeviceSetupStatus
  at: string
  note?: string | null
}

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

// TRU-FE-5 § 4 — Approve. Optional note; only valid on pending_review.
export type ApproveSystemDeviceSetupRequestPayload = {
  id: string
  data?: {
    note?: string
  }
}

// TRU-FE-5 § 3 — Approval Queue cards. `devicesRequested` counts devices, not requests
// (one request for 8 trackers = 8 devices). `approved` also counts in_progress / provisioned / assigned.
export type SystemDeviceSetupSummary = {
  pendingApproval: number
  approved: number
  rejected: number
  devicesRequested: number
}

// TRU-FE-5 § 2 — reshaped per spec. `organisationName` / `requestingEmail` /
// `kycStatus` can be null on rows with no onboarding on file — fall back to
// `tenantId` in the UI; do not render null kycStatus as Verified.
export type SystemDeviceSetupRequest = {
  id: string
  tenantId: string
  organisationName: string | null
  requestingEmail: string | null
  manufacturer: string
  model: string
  trackerType: string
  quantity: number
  simRequired: boolean
  vehicleId: string | null
  state: string | null
  city: string | null
  preferredInstallDate: string | null
  useCase: string | null
  notes: string | null
  status: SystemDeviceSetupStatus
  kycStatus: SystemDeviceSetupKycStatus
  assignedTo: string | null
  decidedBy: string | null
  decidedAt: string | null
  decisionReason: string | null
  timeline: SystemDeviceSetupTimelineEntry[]
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
    displayId?: string
    subject: string
    tenantId: string
    category: string
    status: string
    priority: string
  }>
  recentlyResolved: Array<{
    id: string
    displayId?: string
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
 * Backend user roles. Usable as values (`UserRole.OWNER_OPERATOR`) and as a type.
 *
 * ponytail: const object rather than `enum` so existing string-literal
 * comparisons (`user.role === 'OWNER_OPERATOR'`, `case 'OWNER_OPERATOR':`) keep
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
  OPERATIONS_MANAGER: 'OPERATIONS_MANAGER',
  DISPATCHER: 'DISPATCHER',
  FINANCE_VIEWER: 'FINANCE_VIEWER',
  INSTALLER: 'INSTALLER',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export type AuthUser = {
  id: string
  email: string
  role: UserRole
  tenantId: string
  /** The account's type, so an owner operator's staff can be told from an enterprise's. Absent on sessions issued before it existed; null when unknown. */
  organizationType?: 'fleet_provider' | 'enterprise' | 'aggregator' | 'owner_operator' | null
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: AuthUser
}

// TRU-FE-7 § D — per-account TOTP two-factor.
export type TwoFactorState = {
  /** True only after `enrol/confirm` succeeds. Scanning the QR alone doesn't count. */
  enrolled: boolean
  /** True after `enrol` but before a valid confirm code lands. Log-in still works normally. */
  pendingConfirmation: boolean
  /** Reflects the platform-wide `security.requireTwoFactor` on the caller's tenant/scope. */
  requiredByPlatform: boolean
  recoveryCodesRemaining: number
}

/** Returned by `POST /auth/two-factor/enrol`. `secret` is shown ONCE. */
export type TwoFactorEnrolment = {
  secret: string
  otpauthUri: string
}

/** Returned by `POST /auth/two-factor/enrol/confirm`. Eight single-use codes, shown ONCE. */
export type TwoFactorRecoveryCodes = {
  recoveryCodes: string[]
}

export type ConfirmTwoFactorPayload = { data: { code: string } }
export type DisableTwoFactorPayload = { data: { code: string } }

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
  /** Staff only: a custom or personal role that overrides `role`'s permissions. */
  customRoleId?: string | null
  accountStatus: string
  status: string
  lastActiveAt: string
  profile: UserProfile
}

// ─── Staff roles (admin portal) ───────────────────────────────────────────────

export type StaffRoleName = 'SUPER_ADMIN' | 'SYSTEM_ADMIN' | 'PLATFORM_ADMIN' | 'GOVERNANCE_OFFICER'
export type PredefinedStaffRole = { role: StaffRoleName, permissions: string[], editable: false }
export type CustomStaffRole = {
  id: string
  name: string
  description: string | null
  permissions: string[]
  editable: true
  createdAt: string
  updatedAt: string
}
/** One staff member's own permission set, stored as a role only they hold. */
export type PersonalStaffRole = { id: string, userId: string, permissions: string[] }
export type StaffRolesResponse = ServerResponse<{
  predefined: PredefinedStaffRole[]
  custom: CustomStaffRole[]
  personal: PersonalStaffRole[]
}>
export type StaffPermission = { key: string, description: string }
export type StaffPermissionsResponse = ServerResponse<{ permissions: StaffPermission[] }>
export type StaffRoleBody = { name: string, description?: string, permissions: string[] }
export type StaffRoleResponse = ServerResponse<CustomStaffRole>
export type SetStaffMemberRolePayload = { userId: string, role: StaffRoleName }
export type SetStaffMemberCustomRolePayload = { userId: string, customRoleId: string | null }
export type SetStaffMemberPermissionsPayload = { userId: string, permissions: string[] }
export type StaffMemberAccessResponse = ServerResponse<{ userId: string, customRoleId?: string | null, role?: string, permissions?: string[] }>

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
  protocolType: DeviceCatalogProtocol
  defaultPort: number
  supportedFeatures: DeviceCatalogFeature[]
  status: DeviceCatalogStatus
  configurationInstructions?: string | null
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

// TRU-FE-7 § A — one of six documented keys; unknown values are ignored on read.
export type SystemDefaultTimeRange
  = | 'today'
    | 'yesterday'
    | 'last_7_days'
    | 'last_30_days'
    | 'last_90_days'
    | 'this_month'
    | 'this_year'

// TRU-FE-7 § C — enforced (session-timeout is checked on every refresh); one of 15|30|60|120|480.
export type SystemSessionTimeoutMinutes = 15 | 30 | 60 | 120 | 480

export type SystemDateFormat = 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd' | 'd MMM yyyy'
export type SystemTimeFormat = '12h' | '24h'
export type SupportResponseHours = 4 | 24 | 48

export type AuthSystemSettings = {
  platformName?: string
  supportEmail?: string
  profile?: {
    contactPhone?: string
    contactAddress?: string
    logoUrl?: string | null
  }
  support?: {
    phone?: string
    responseTimeHours?: SupportResponseHours
  }
  defaults?: {
    timezone?: string
    language?: string
    dateFormat?: SystemDateFormat
    timeFormat?: SystemTimeFormat
    defaultTimeRange?: SystemDefaultTimeRange
    complianceReminderDays?: number
    walletTopUpMinKobo?: number
    walletTopUpMaxKobo?: number
    platformCurrency?: string
  }
  features?: {
    allowNewTenantRegistration?: boolean
    maintenanceMode?: boolean
    /** ⚠️ Placebo. Spec § A: not read anywhere on the platform — do NOT put a toggle on the page. */
    enableBetaFeatures?: boolean
    internationalCurrency?: boolean
  }
  /** ⚠️ Not yet enforced. Spec § A: no sweep, no deletion, no backup job keyed off these (TD-6). */
  retention?: {
    gpsDataRetentionDays?: number
    logRetentionDays?: number
    backupFrequency?: string
  }
  security?: {
    requireTwoFactor?: boolean
    sessionTimeoutMinutes?: SystemSessionTimeoutMinutes
    auditLogging?: boolean
  }
  updatedAt?: string
  updatedByUserId?: string | null
}

export type SystemDashboardChanges = {
  totalTenants: number | null
  activeTenants: number | null
  totalVehicles: number | null
  totalDrivers: number | null
  totalDevices: number | null
}

export type SystemDashboard = {
  totalTenants: number
  totalVehicles: number
  totalDrivers: number
  totalSensors: number
  totalSimCards: number | null
  dataUsageTodayMb: number | null
  sensorGpsMessagesPerHour: number | null
  /** Month-over-month percentage change; null when there is no previous-month base. */
  changes?: SystemDashboardChanges
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
  // Probed 2026-09-23: { tenantId, count } — no name.
  topTenants: Array<{ tenantId: string, count: number }>
  needsAttention: SystemSupportTicket[]
  recentlyResolved: SystemSupportTicket[]
  // TRU-FE-10 §F — rate cards
  activeWorkload: number
  criticalHigh: number
  slaBreaching: number
  firstResponseBacklog: number
  awaitingTenant: number
  // ⚠️ null (not zero) when nothing has resolved. Zero reads as instant.
  avgResolutionHours: number | null
  resolvedLast7Days: number
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
  maxUsers: number | null
  customPricing: boolean
  trialDays: number | null
  badge: string | null
  ctaLabel: string
  features: string[]
}

// PATCH /auth/system/subscription-plans/{id}. Both price fields optional;
// omit either to leave it unchanged. `id` is the plan's `code`.
export type UpdateSubscriptionPlanPricePayload = {
  id: string
  data: {
    monthlyPriceNgn?: number
    yearlyMonthlyEquivalentNgn?: number
  }
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

export type OnboardingDeviceRequestSummary = {
  id: string
  quantity: number
  useCase: string
  notes: string | null
}

export type OnboardingInstallationSummary = {
  orderNumber: string
  status: string
  scheduledDate: string | null
  timeSlot: string | null
  timeSlotLabel: string | null
}

/** The customer's own onboarding application, as shown alongside fleet requests. */
export type OnboardingApplicationSummary = {
  id: string
  reference: string
  status: OnboardingApplicationStatus
  stage: OnboardingApplicationStage
  submittedAt: string | null
  createdAt: string
  vehicleCount: number
  requestedDevices: number
  deviceRequests: OnboardingDeviceRequestSummary[]
  installation: OnboardingInstallationSummary | null
}

export type OnboardingStatus = {
  tenantId: string
  isOnboarded: boolean
  onboardingStatus: OnboardingStatusValue
  planCode: string | null
  subscriptionStatus: string | null
  application: OnboardingApplicationSummary | null
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

export type SystemTenantQuotas = {
  vehicles: number | null
  drivers: number | null
  devices: number | null
  sims: number | null
}

export type SystemTenantSuspension = {
  suspendedAt: string | null
  suspendedByName: string | null
  suspensionReason: string | null
}

export type SystemTenant = SystemTenantSuspension & {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  address: string | null
  billingEmail: string | null
  plan: 'starter' | 'professional' | 'enterprise'
  planCode: string | null
  planName: string | null
  /** False means no plan: null quota limits are then not unlimited. */
  planAssigned: boolean
  /** Prepaid/postpaid, from the tenant's plan entitlements. Null when unknown. */
  billingModel?: 'prepaid' | 'postpaid' | null
  /** Overdue invoices for this tenant, counted at read time. */
  overdueInvoices?: number
  status: 'active' | 'pending' | 'trial' | 'suspended' | 'inactive' | 'terminated'
  organizationType: string | null
  vehicleCount: number
  driverCount: number
  deviceCount: number
  simCount: number
  /** What applies today: the plan limit, or the tenant override when one is set. */
  quotas: SystemTenantQuotas
  /** The plan's own limits. */
  planQuotas: SystemTenantQuotas
  /** Limits set for this tenant by staff; null means the plan limit applies. */
  quotaOverrides: SystemTenantQuotas
  features: Record<string, boolean>
  createdAt: string
  /** Cash collected this Africa/Lagos month, in naira. */
  collectedThisMonthNgn: number
  /** @deprecated use collectedThisMonthNgn */
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
  terminatedTenants: number
  inactiveTenants: number
  pendingTenants: number
  totalVehicles: number
  totalSims: number
  overdueInvoices: number | null
  inGraceTenants?: number
  pastGraceTenants?: number
  monthlyRevenueNgn: number
  generatedAt: string
}

export type SystemTelecomMasterNumberType = 'existing' | 'new'

export type SystemTelecomMasterStatus =
  | 'not_selected'
  | 'pending_verification'
  | 'verified'
  | 'allocation_pending'
  | 'allocated'
  | 'verification_failed'
  | 'allocation_failed'

export type SystemTelecomMasterRequest = {
  id: string
  tenantId: string | null
  organizationName: string
  contactEmail: string
  applicationId: string | null
  applicationReference: string
  msisdn: string | null
  simSerial: string | null
  numberType: SystemTelecomMasterNumberType
  status: SystemTelecomMasterStatus
  mtnReference: string | null
  failureReason: string | null
  createdAt: string
  updatedAt: string
}

export type SystemTelecomMasterEvent = {
  id: string
  requestId: string
  action: string
  detail: string | null
  fromStatus: SystemTelecomMasterStatus | null
  toStatus: SystemTelecomMasterStatus | null
  actorId: string | null
  createdAt: string
}

export type TelecomMasterOutcome = 'verified' | 'verification_failed' | 'allocated' | 'allocation_failed'

export type ResolveSystemTelecomMasterPayload = {
  id: string
  data: {
    outcome: TelecomMasterOutcome
    msisdn?: string
    simSerial?: string
    mtnReference?: string
    failureReason?: string
  }
}

export type TenantTelecomMasterResponse = ServerResponse<{ request: SystemTelecomMasterRequest | null }>

export type SubmitTenantTelecomMasterPayload = {
  data: { numberType: SystemTelecomMasterNumberType, msisdn?: string }
}

export type SystemTelecomMasterListResponse = ServerResponse<{
  requests: SystemTelecomMasterRequest[]
  total: number
  generatedAt: string
}>

export type SystemTelecomMasterDetailResponse = ServerResponse<{
  request: SystemTelecomMasterRequest
  events: SystemTelecomMasterEvent[]
}>

export type SystemDevicesSummary = {
  totalDevices: number
  registeredDevices: number
  configuredDevices: number
  /** TRU-FE-5 § 8 — includes assigned; use `activeDevices` (excludes assigned) for the Active card. */
  verifiedActiveDevices: number
  pendingConfigDevices: number
  onlineNowDevices: number
  assignableDevices: number
  assignedDevices: number
  /** TRU-FE-5 § 8 — Active card. Excludes assigned so it doesn't double-count with Assigned. */
  activeDevices: number
  /** TRU-FE-5 § 8 — added. Devices with `vehicleId === null`. */
  unassignedDevices: number
  /** TRU-FE-5 § 8 — added. `provisionStatus != "registered"` (upstream telemetry platform), not the lifecycle `registered`. */
  unregisteredDevices: number
  /** TRU-FE-5 § 8 — added. Anything out of service for any reason — faulty, suspended or decommissioned. */
  inactiveDevices: number
  /** TRU-FE-5 § 8 — added. Real lifecycle state now. */
  suspendedDevices: number
  faultyDevices: number
  totalCatalogModels: number
  supportedCatalogModels: number
  deprecatedCatalogModels: number
  blockedCatalogModels: number
  generatedAt: string
}

// TRU-FE-5 § 7 — Suspend and reinstate a device.
// POST /auth/system/devices/:deviceId/suspend  — optional { reason }
// POST /auth/system/devices/:deviceId/reinstate — no body
// ⚠️ On reinstate the device returns to the lifecycle state it was in before
// suspension, EXCEPT it comes back assignable (not assigned) — the vehicle link
// was released on suspension and may since have been taken by another device.
export type SuspendSystemDevicePayload = {
  id: string
  data?: { reason?: string }
}

export type ReinstateSystemDevicePayload = {
  id: string
}

export type SystemDeviceActionResponse = ServerResponse<{ id: string }>

export type SystemSimCarrierBreakdown = {
  period: SystemSnapshotPeriod
  byCarrier: Record<string, number>
  generatedAt: string
}

export type SystemSimsSummary = {
  total: number
  active: number
  assigned: number
  suspended: number
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
  expiringWithinThirtyDays: number
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
  /** Hosted checkout to send the customer to; null when the top-up settled at once. */
  authorizationUrl?: string | null
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
    idempotencyKey?: string
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
    /** Defaults to the code. */
    id?: string
    code: string
    name: string
    /** Defaults to MTN. */
    carrierId?: string
    dataAmountGb: number
    validityDays: number
    billingCycle: string
    priceNaira: number
    currency?: string
    /** Inactive bundles are hidden from tenants; defaults to true. */
    active?: boolean
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
  tenantName?: string | null
  deviceId: string | null
  deviceImei: string | null
  suspensionReason: string | null
  dataUsageMb: number
  dataLimitMb: number
  smsUsage: number
  smsLimit: number
  monthlyCostNgn: number
  activationDate: string | null
  expiryDate: string | null
  lastActivity: string | null
  signalStrength: number | null
  networkType: string | null
  roaming: boolean
  fonuStatus: string | null
  createdAt: string
  updatedAt: string
}

export type SystemSimImportOutcome = 'imported' | 'skipped' | 'failed'

export type SystemSimImportRowResult = {
  row: number
  iccid: string
  outcome: SystemSimImportOutcome
  reason: string | null
  simId: string | null
}

export type SystemSimImportResult = {
  imported: number
  skipped: number
  failed: number
  results: SystemSimImportRowResult[]
}

export type SystemSimStatusItemResult = {
  id: string
  iccid: string | null
  outcome: 'changed' | 'skipped' | 'failed'
  reason: string | null
  status: string | null
}

export type SystemSimBulkStatusResult = {
  action: SystemSimStatusAction
  changed: number
  skipped: number
  failed: number
  results: SystemSimStatusItemResult[]
}

export type SystemSimDeleteResult = {
  id: string
  iccid: string
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

export type SystemDeviceUpdate = {
  manufacturer?: string
  model?: string
  firmwareVersion?: string
  protocol?: string
  lifecycleStatus?: string
  status?: string
}

export type UpdateSystemDevicePayload = {
  id: string
  data: SystemDeviceUpdate
}

export type AssignSystemDevicesPayload = {
  data: {
    tenantId: string
    deviceIds: string[]
    notes?: string
  }
}

export type SystemDeviceWriteResult = {
  updated?: number
  tenantId?: string
} & Record<string, unknown>

export type SystemDeviceWriteResponse = ServerResponse<SystemDeviceWriteResult>

export type AssignSystemInstallationPayload = {
  id: string
  data: {
    installerId: string
  }
}

export type SystemInstallationAssignment = {
  id: string
  jobNumber: string
  status: string
  installer: {
    id: string
    code: string
    fullName: string
  }
}

export type SystemInstallationAssignmentResponse = ServerResponse<SystemInstallationAssignment>

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
export type InstallerLoginResponse = ServerResponse<LoginResult>
export type LoginResponse = ServerResponse<LoginResult>
export type SystemLoginResponse = ServerResponse<SystemLoginResult>
/** ponytail: `recoveryCodes` only comes back after the admin enrolment step; Swagger doesn't show it yet. */
export type SystemLoginTwoFactorResponse = ServerResponse<AuthSession & { recoveryCodes?: string[] }>
export type InstallerDashboardResponse = ServerResponse<InstallerDashboard>
/** Accept, start, checklist, notes, issue and complete all answer with the whole job. */
export type InstallerJobResponse = ServerResponse<InstallerJobDetail>
export type InstallerJobsResponse = ServerResponse<InstallerJobsPage>
// ponytail: Swagger documents no body for the evidence upload (201) or link (200); the upload is
// read back through the job refetch, and the link is read from `url` — confirm once dev has a job.
export type InstallerEvidenceLinkResponse = ServerResponse<{ url: string, expiresAt?: string }>
/** The job is no longer the caller's, so only its identity comes back. */
export type RejectedOfferResponse = ServerResponse<{ id: string, jobNumber: string, rejectedAt: string }>
export type InstallerNotificationsResponse = ServerResponse<InstallerNotificationsPage>
export type InstallerSupportTicketsResponse = ServerResponse<InstallerSupportTicketsPage>
export type InstallerSupportTicketResponse = ServerResponse<InstallerSupportTicketDetail>
export type InstallerOptionsResponse = ServerResponse<InstallerOptions>
export type InstallerDisplayPreferencesResponse = ServerResponse<InstallerDisplayPreferences>
export type InstallerProfileResponse = ServerResponse<InstallerProfile>
export type InstallerNotificationPreferencesResponse = ServerResponse<InstallerNotificationPreferences>
export type InstallerWorkPreferencesResponse = ServerResponse<InstallerWorkPreferences>
export type SystemInstallerResponse = ServerResponse<Record<string, unknown> & { id: string, code?: string }>
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
  /** The name an installer was invited under; null for every other role. */
  fullName: string | null
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
// TRU-FE-7 § B — AI envelopes.
export type AIGovernanceResponse = ServerResponse<AIGovernance>
export type AIUsageResponse = ServerResponse<AIUsage>
export type AIRequestsListResponse = ServerResponse<AIRequestsList>
// TRU-FE-7 § D — 2FA envelopes.
export type TwoFactorStateResponse = ServerResponse<TwoFactorState>
export type TwoFactorEnrolmentResponse = ServerResponse<TwoFactorEnrolment>
export type TwoFactorRecoveryCodesResponse = ServerResponse<TwoFactorRecoveryCodes>
export type SystemDashboardResponse = ServerResponse<SystemDashboard>
export type SystemHealthResponse = ServerResponse<SystemHealth>
export type SystemSupportDashboardResponse = ServerResponse<SystemSupportDashboard>
export type SystemSupportTicketSummaryResponse = ServerResponse<SystemSupportTicketSummary>
export type SystemDeviceSetupRequestsListResponse = ServerResponse<SystemDeviceSetupRequestsList>
export type SystemDeviceSetupRequestResponse = ServerResponse<SystemDeviceSetupRequest>
export type SystemDeviceSetupSummaryResponse = ServerResponse<SystemDeviceSetupSummary>
export type SystemTenantsListResponse = ServerResponse<{ total: number; tenants: SystemTenant[]; generatedAt: string }>
export type SystemTenantsSummaryResponse = ServerResponse<SystemTenantsSummary>
export type SystemTenantDetailResponse = ServerResponse<Record<string, unknown> & Partial<SystemTenantSuspension>>
export type SystemTenantBilling = {
  tenantId: string
  plan: { code: string; name: string | null } | null
  licence: { status: 'active' | 'renewed' | 'ended'; periodStart: string; validUntil: string } | null
  openInvoice: {
    id: string
    number: string
    dueDate: string
    status: string
    isRenewal: boolean
    amountOwedNgn: number
  } | null
  totalOwedNgn: number
  lastPayment: { amountNgn: number; paidAt: string; method: string | null } | null
  enforcement: {
    stage: 'current' | 'in_grace' | 'past_grace'
    dueDate: string
    graceEndsOn: string
    owedNgn: number
    suspended: boolean
    suspensionCause: 'manual' | 'non_payment' | null
  } | null
  wallet: { balanceNgn: number; status: 'healthy' | 'low' | 'negative' } | null
  collectedThisMonthNgn: number
  billingModel: {
    kind: 'per_device_licence' | 'subscription' | null
    paymentModel: 'prepaid' | 'postpaid' | null
    billingCycle: 'monthly' | 'yearly' | null
    deviceCount: number | null
  }
  trial: SystemTenantTrial | null
}
export type SystemTenantTrial = {
  startedAt: string
  endsAt: string
  daysRemaining: number
  expired: boolean
  extendedCount: number
  converted: boolean
  convertedAt: string | null
  convertedPlanCode: string | null
}
export type SystemTenantBillingResponse = ServerResponse<SystemTenantBilling>
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

export type SystemSnapshotPeriod = '7d' | '30d' | '90d' | 'all'

export type SystemDeviceManufacturers = {
  period: SystemSnapshotPeriod
  manufacturers: { manufacturer: string; count: number }[]
  generatedAt: string
}

export type SystemDeviceManufacturersResponse = ServerResponse<SystemDeviceManufacturers>

export type SystemRevenueByMonth = {
  /** Oldest first. `month` is an Africa/Lagos calendar month, `YYYY-MM`. */
  months: { month: string; collectedNgn: number }[]
  generatedAt: string
}

export type SystemRevenueByMonthResponse = ServerResponse<SystemRevenueByMonth>

export type SystemTenantGrowth = {
  /** Oldest first. `tenants` is the cumulative count at the end of that Africa/Lagos month. */
  months: { month: string; tenants: number }[]
  generatedAt: string
}

export type SystemTenantGrowthResponse = ServerResponse<SystemTenantGrowth>

export type SystemSimDataUsage = {
  /** Oldest first. `day` is an Africa/Lagos calendar day, `YYYY-MM-DD`. */
  days: { day: string; usageMb: number }[]
  todayMb: number
  totalBoughtMb: number
  generatedAt: string
}

export type SystemSimDataUsageResponse = ServerResponse<SystemSimDataUsage>

export type SystemDeviceMessageRate = {
  gateReachable: boolean
  countsSince: string | null
  lastHour: number | null
  /** Last 24 UTC hours, oldest first. */
  hours: { hourStart: string; count: number }[]
  generatedAt: string
}

export type SystemDeviceMessageRateResponse = ServerResponse<SystemDeviceMessageRate>

export type StillReportingDevice = {
  deviceId: string | null
  imei: string
  deviceName: string
  tenantId: string
  companyName: string
  blockedReason: 'tenant' | 'device'
  suspendedAt: string | null
  lastSeenAt: string
  droppedToday: number
  droppedTotal: number
}

export type StillReportingDevices = {
  gateReachable: boolean
  countsSince: string | null
  devices: StillReportingDevice[]
  generatedAt: string
}

export type StillReportingDevicesResponse = ServerResponse<StillReportingDevices>

export type UnrecognisedDeviceStatus = 'active' | 'dismissed' | 'blocked'

export type UnrecognisedDevice = {
  imei: string
  firstSeenAt: string
  lastSeenAt: string
  messageCount: number
  status: UnrecognisedDeviceStatus
  handledAt?: string
}

export type UnrecognisedDeviceAction = 'dismiss' | 'block' | 'unblock'

export type UnrecognisedDeviceActionPayload = {
  imei: string
  action: UnrecognisedDeviceAction
  data: { reason: string }
}

export type UnrecognisedDeviceActionResponse = ServerResponse<{ imei: string, status: UnrecognisedDeviceStatus }>

export type UnrecognisedDevices = {
  trackingReachable: boolean
  devices: UnrecognisedDevice[]
  generatedAt: string
}

export type UnrecognisedDevicesResponse = ServerResponse<UnrecognisedDevices>
export type SystemSimsListResponse = ServerResponse<SystemSimsList>
export type SystemSimImportResponse = ServerResponse<SystemSimImportResult>
export type SystemSimBulkStatusResponse = ServerResponse<SystemSimBulkStatusResult>
export type SystemSimDeleteResponse = ServerResponse<SystemSimDeleteResult>
export type SystemSimResponse = ServerResponse<SystemSimItem>
export type SystemSimSummaryResponse = ServerResponse<SystemSimsSummary>
export type SystemSimCarrierBreakdownResponse = ServerResponse<SystemSimCarrierBreakdown>
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
export type OnboardingSubscriptionCapsResponse = ServerResponse<OnboardingSubscriptionCaps>
export type OnboardingStatusResponse = ServerResponse<OnboardingStatus>
export type OnboardingBusinessInfoResponse = ServerResponse<OnboardingBusinessInfo>
export type OnboardingKycDocumentsResponse = ServerResponse<OnboardingKycDocumentsData>

export interface TenantStorageUsage {
  /** bytes counted against the plan, across every source of tenant files */
  usedBytes: number
  planName: string | null
  /** null when the plan sets no storage limit */
  limitBytes: number | null
  kyc: { files: number, bytes: number }
}
export type TenantStorageUsageResponse = ServerResponse<TenantStorageUsage>

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
  /** True when the server settled the payment without a hosted checkout. */
  paid?: boolean
  message?: string
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

export type SimImportRowIssue = { row: number, field: string, message: string }

export type SimImportResult = {
  importedCount: number
  skippedCount: number
  failedCount: number
  /** Rows that could not be read, such as a missing ICCID. */
  errors?: SimImportRowIssue[]
  /** Rows left out because the SIM could not be added, such as an ICCID already registered. */
  skipped?: SimImportRowIssue[]
}

export type SimImportResponse = ServerResponse<SimImportResult>
export type OnboardingSimImportResponse = ServerResponse<{ imported: number, skipped: number }>

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

export type SimRequestsQuery = { params?: { page?: number, limit?: number } }
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
export type OnboardingSimsRegisterResponse = ServerResponse<{
  registered: number
  created: { id: string, iccid: string }[]
  skipped: { iccid: string, reason: string }[]
}>

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

/** `in_app` shows in the admin notification centre and needs no recipient. */
export type PlatformAlertChannel = 'email' | 'sms' | 'slack' | 'webhook' | 'in_app'
export type PlatformAlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export type PlatformAlertType =
  | 'new_tenant_signup'
  | 'system_errors'
  | 'billing_alerts'
  | 'security_alerts'
  | 'installation_issues'

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

export type SendTestAlertPayload = { data?: { alertType?: PlatformAlertType } }
export type SendTestAlertResponse = ServerResponse<{ alertType: PlatformAlertType, channels: PlatformAlertChannel[] }>

/** A platform alert in the admin notification centre; `readAt` is the caller's own. */
export type AdminNotification = {
  id: string
  alertType: PlatformAlertType
  severity: PlatformAlertSeverity
  title: string
  body: string
  createdAt: string
  readAt: string | null
}
export type AdminNotificationsQuery = { params?: { unreadOnly?: boolean, page?: number, limit?: number } }
export type AdminNotificationsResponse = ServerResponse<{
  items: AdminNotification[]
  total: number
  unread: number
  page: number
  limit: number
}>
export type AdminNotificationReadResponse = ServerResponse<{ unread: number }>

// ─── Communication Pricing ────────────────────────────────────────────────────

export type CommunicationChannel = 'sms' | 'whatsapp' | 'voice' | 'ai' | 'iot_sim'

export type CommunicationRateUnit =
  | 'per_message'
  | 'per_minute'
  | 'per_request'
  | 'recurring_monthly'

export type ChannelRate = {
  channel: CommunicationChannel
  rateKobo: number
  enabled?: boolean
  description?: string
}

export type UpdateCommunicationRatesPayload = { data: { rates: ChannelRate[] } }
export type CommunicationRateHistoryPayload = { channel: CommunicationChannel }

// Server row (spec ships descriptions only — shape observed from live response).
export type CommunicationRate = {
  id: string
  channel: CommunicationChannel
  unit: CommunicationRateUnit
  rateKobo: number
  enabled: boolean
  description: string | null
  effectiveFrom: string
  createdBy: string | null
}

export type CommunicationRatesResponse = ServerResponse<CommunicationRate[]>
export type CommunicationRateHistoryResponse = ServerResponse<CommunicationRate[]>

// ─── Organisation Upgrades ────────────────────────────────────────────────────

export type RequestUpgradePayload = { data: { reason: string } }
export type ReviewUpgradePayload = { id: string; data: { notes?: string } }

// ponytail: row shape observed from the server, not the spec — narrow further when auth.json publishes it
export type OrganisationUpgradeRequest = {
  id: string
  tenantId: string
  fromOrganisationType: string
  toOrganisationType: string
  reason: string | null
  statedVehicleCount: number | null
  status: 'pending' | 'approved' | 'rejected'
  requestedBy: string
  requestedAt: string
  reviewedBy: string | null
  reviewedAt: string | null
  reviewerNotes: string | null
  vehicleCountAtReview: number | null
  currentVehicleCount: number | null
}

export type OrganisationUpgradeQueueResponse = ServerResponse<{
  pending: OrganisationUpgradeRequest[]
  history: OrganisationUpgradeRequest[]
  pendingCount: number
}>
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

export type DataBundleLedgerFilters = {
  category?: string
  direction?: 'debit' | 'credit'
  /** ISO 8601 instants, inclusive. */
  from?: string
  to?: string
}
export type DataBundleLedgerQuery = { params?: DataBundleLedgerFilters & { page?: number; limit?: number } }
export type DataBundleLedgerEntry = {
  id: string
  direction: 'debit' | 'credit'
  category: string
  amount: number
  balanceAfter: number
  unitRate: number
  quantity: number
  reason: string
  reference: string | null
  createdAt: string
}
export type DataBundleLedgerResponse = ServerResponse<{ items: DataBundleLedgerEntry[], total: number }>

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

export type PlatformWalletStatus = 'healthy' | 'low' | 'negative'

/** GET /auth/system/wallets row. Amounts are kobo (divide by 100 for naira). No tenant name: join on tenantId. */
export type PlatformWalletRow = {
  tenantId: string
  balanceKobo: number
  currency: string
  updatedAt: string
  creditEnabled: boolean
  creditLimitKobo: number | null
  lowBalanceThresholdKobo: number
  status: PlatformWalletStatus
}

export type PlatformWalletsData = {
  summary: {
    totalWallets: number
    totalBalanceKobo: number
    lowBalance: number
    negativeBalance: number
  }
  wallets: PlatformWalletRow[]
}

export type PlatformWalletsResponse = ServerResponse<unknown>
export type SystemWalletsResponse = ServerResponse<PlatformWalletsData>
export type PlatformWalletLedgerResponse = ServerResponse<unknown>
export type PlatformTopUpResponse = ServerResponse<unknown>
export type PlatformWalletCreditSettingsResponse = ServerResponse<unknown>

export type SystemSecurityOverview = {
  failedLoginsToday: number
  successfulLoginsToday: number
  activeBlocks: number
  criticalEventsToday: number
  highEventsToday: number
}

export type SystemSecurityOverviewResponse = ServerResponse<SystemSecurityOverview>

// ponytail: item shape not in swagger and dev returns []; fields kept optional to match whatever the API ships
export type SystemFailedLogin = {
  id: string
  email?: string | null
  ipAddress?: string | null
  location?: string | null
  reason?: string | null
  attempts?: number | null
  blocked?: boolean | null
  userAgent?: string | null
  createdAt?: string | null
  timestamp?: string | null
}

export type SystemFailedLoginsQuery = {
  params?: {
    offset?: number
    limit?: number
    from?: string
    to?: string
    search?: string
    ipAddress?: string
  }
}

export type SystemFailedLoginsResponse = ServerResponse<{
  items: SystemFailedLogin[]
  total: number
}>

export type SystemAuthEvent = {
  id: string
  tenantId?: string | null
  userId?: string | null
  email?: string | null
  eventType?: 'login' | 'logout' | 'refresh' | string | null
  status?: 'success' | 'failed' | string | null
  failureReason?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  occurredAt?: string | null
}

// ponytail: extra filter params (tenant/event/location/device) not documented; add when swagger publishes
export type SystemAuthEventsQuery = {
  params?: {
    offset?: number
    limit?: number
    search?: string
    status?: 'success' | 'failed'
    eventType?: string
    from?: string
    to?: string
  }
}

export type SystemAuthEventsResponse = ServerResponse<{
  items: SystemAuthEvent[]
  total: number
}>

export type SystemAutoBlockRule = {
  id: string
  name: string
  enabled: boolean
  maxAttempts: number
  windowMinutes: number
  /** null = permanent block */
  blockDurationHours: number | null
  precedence: number
  updatedAt?: string | null
  updatedBy?: string | null
}

export type SystemAutoBlockRulesResponse = ServerResponse<SystemAutoBlockRule[]>

export type UpdateSystemAutoBlockRulePayload = {
  id: string
  data: {
    enabled?: boolean
    maxAttempts?: number
    windowMinutes?: number
    blockDurationHours?: number | null
    precedence?: number
  }
}

export type UpdateSystemAutoBlockRuleResponse = ServerResponse<SystemAutoBlockRule>

export type SystemSecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical'

export type SystemSecurityEvent = {
  id: string
  eventType: string
  severity?: SystemSecurityEventSeverity | string | null
  tenantId?: string | null
  summary?: string | null
  relatedEntityType?: string | null
  relatedEntityId?: string | null
  metadata?: Record<string, unknown> | null
  occurredAt?: string | null
}

export type SystemSecurityEventsQuery = {
  params?: {
    offset?: number
    limit?: number
    search?: string
    severity?: SystemSecurityEventSeverity
    eventType?: string
    tenantId?: string
    from?: string
    to?: string
  }
}

export type SystemSecurityEventsResponse = ServerResponse<{
  items: SystemSecurityEvent[]
  total: number
}>

// ─── Onboarding Applications (public, X-Application-Token) ───────────────────
// Shapes follow the dev-api Swagger, tag "Onboarding Applications" (TRU-FE-11/12/13).

export type OnboardingApplicantType = 'enterprise' | 'owner_operator'

/** Every type the server can list. `signed_indemnity_form` is generated at signing, never uploaded. */
export type OnboardingApplicationDocumentType =
  | 'customer_request_letter'
  | 'cac_document'
  | 'tax_certificate_or_tin'
  | 'signature_card'
  | 'utility_bill'
  | 'identification_card'
  | 'proof_of_ownership'
  | 'vehicle_license'
  | 'signed_indemnity_form'

export type OnboardingUploadableDocumentType = Exclude<OnboardingApplicationDocumentType, 'signed_indemnity_form'>

export type OnboardingApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'changes_requested'

export type OnboardingApplicationStage =
  | 'application'
  | 'provisioning'
  | 'payment'
  | 'installation_scheduling'
  | 'installation'
  | 'connectivity_verification'
  | 'fleet_ready'

export type OnboardingApplicationDocumentReviewStatus = 'pending' | 'approved' | 'rejected'

export type OnboardingIdentificationType = 'nin' | 'drivers_licence' | 'passport'

export type OnboardingVehicleType = 'truck' | 'van' | 'bus' | 'car' | 'suv' | 'trailer' | 'motorcycle' | 'tricycle'

export type OnboardingVehiclePurchaseType = 'outright' | 'lease' | 'hire_purchase' | 'financed' | 'other'

export type OnboardingClaimType = 'rc_number' | 'tax_identification_number' | 'identification_number' | 'document_hash'

export type OnboardingApplicationDocument = {
  id: string
  /** Set only on a `vehicle_license`. */
  vehicleId: string | null
  documentType: OnboardingApplicationDocumentType
  documentName: string
  fileSize: number
  status: OnboardingApplicationDocumentReviewStatus
  rejectionReason: string | null
  uploadedAt: string
}

export type OnboardingApplicationVehicle = {
  id: string
  registrationNumber: string
  vehicleType: OnboardingVehicleType
  make: string
  model: string
  year: number | null
  engineNumber: string | null
  chassisNumber: string | null
  color: string | null
  engineCapacity: string | null
  odometerReading: number | null
  purchaseType: OnboardingVehiclePurchaseType | null
  purchaseTypeOther: string | null
}

export type OnboardingApplicationDeviceRequest = {
  id: string
  quantity: number
  useCase: string
  notes: string | null
}

export type OnboardingVehicleMissingDocument = {
  vehicleId: string
  registrationNumber: string
  documentType: OnboardingApplicationDocumentType
}

export type OnboardingApplication = {
  id: string
  reference: string
  applicantType: OnboardingApplicantType
  status: OnboardingApplicationStatus
  stage: OnboardingApplicationStage
  organization: {
    organizationName: string
    businessEmail: string
    organizationPhone: string
    streetAddress: string
    city: string
    state: string
  }
  contact: { fullName: string, role: string | null }
  m2mPlanCode: string | null
  registry: {
    rcNumber: string | null
    taxIdentificationNumber: string | null
    identificationType: OnboardingIdentificationType | null
    identificationNumber: string | null
  }
  vehicles: OnboardingApplicationVehicle[]
  deviceRequests: OnboardingApplicationDeviceRequest[]
  requestedDevices: number
  verification: { emailVerified: boolean, phoneVerified: boolean }
  documents: OnboardingApplicationDocument[]
  missingDocuments: OnboardingApplicationDocumentType[]
  vehiclesMissingDocuments: OnboardingVehicleMissingDocument[]
  /** An existing MTN customer: only the Customer Request Letter is required. */
  returningCustomer: boolean
  fulfilment: OnboardingFulfilment | null
  decisionReason: string | null
  submittedAt: string | null
  createdAt: string
}

export type OnboardingApplicationSetupLink = {
  status: 'sent' | 'failed' | null
  sentAt: string | null
  error: string | null
  attempts: number
}

export type OnboardingApplicationDetails = {
  applicantType: OnboardingApplicantType
  /** Omitted on update keeps the saved value. */
  returningCustomer?: boolean
  organizationName: string
  businessEmail: string
  organizationPhone: string
  contactFullName: string
  contactRole?: string
  streetAddress: string
  city: string
  state: string
  m2mPlanCode?: string
  rcNumber?: string
  taxIdentificationNumber?: string
  identificationType?: OnboardingIdentificationType
  identificationNumber?: string
}

export type CreateOnboardingApplicationPayload = { data: OnboardingApplicationDetails }

/** `applicationToken` is returned here once and never again. */
export type CreateOnboardingApplicationResponse = ServerResponse<OnboardingApplication & { applicationToken: string }>

export type OnboardingApplicationResponse = ServerResponse<OnboardingApplication>

/** PATCH replaces the org and contact details, so the whole set is sent. */
export type UpdateOnboardingApplicationPayload = {
  id: string
  data: OnboardingApplicationDetails
}

export type UploadOnboardingApplicationDocumentPayload = {
  id: string
  documentType: OnboardingUploadableDocumentType
  /** Required for `vehicle_license`, refused on every other type. */
  vehicleId?: string
  file: File
}

export type DeleteOnboardingApplicationDocumentPayload = {
  id: string
  documentId: string
}

export type OnboardingApplicationVerifySendResponse = ServerResponse<{
  channel: 'email' | 'sms' | 'billing_email'
  destination: string
  expiresInSeconds: number
  resendAfterSeconds: number
}>

export type OnboardingApplicationVerifyPayload = {
  id: string
  data: { code: string }
}

/** The submit 400 body — every gate, so the UI can send the applicant to the right step. */
export type SubmitOnboardingApplicationIncomplete = {
  incomplete: true
  message: string
  emailVerified: boolean
  phoneVerified: boolean
  missingDocuments: OnboardingApplicationDocumentType[]
  vehiclesMissingDocuments: OnboardingVehicleMissingDocument[]
  vehicleCount: number
  requestedDevices: number
  /** False while devices don't equal vehicles (and no accepted shortfall covers it). */
  deviceAllocationComplete: boolean
  inventoryShortfallAccepted: boolean
  indemnitySigned: boolean
  planSelected: boolean
}

export type OnboardingAutomatedDecision = 'approve' | 'reject' | 'manual_review'

export type SubmitOnboardingApplicationResponse = ServerResponse<OnboardingApplication & {
  automatedDecision: OnboardingAutomatedDecision
}>

export type OnboardingApplicationTimelineEntry = {
  key: string
  label: string
  complete: boolean
  inProgress?: boolean
}

export type OnboardingApplicationStatusResponse = ServerResponse<{
  reference: string
  applicationStatus: OnboardingApplicationStatus
  stage: OnboardingApplicationStage
  decisionReason: string | null
  submittedAt: string | null
  timeline: OnboardingApplicationTimelineEntry[]
  documents: {
    documentType: OnboardingApplicationDocumentType
    status: OnboardingApplicationDocumentReviewStatus
    rejectionReason: string | null
  }[]
}>

export type OnboardingM2mPlan = {
  code: string
  name: string
  description: string
  perDeviceYear1Ngn: number
  perDeviceRenewalNgn: number
}
export type OnboardingM2mPlansResponse = ServerResponse<{ plans: OnboardingM2mPlan[] }>
export type OnboardingEmailAvailabilityResponse = ServerResponse<{ available: boolean }>

export type OnboardingIndemnityAgreementResponse = ServerResponse<{
  version: string
  title: string
  body: string
}>

export type SignOnboardingIndemnityPayload = {
  id: string
  signerName: string
  templateVersion: string
  method: 'drawn' | 'uploaded'
  /** PNG or JPG, at most 2MB. */
  file: Blob
}

/** Unlike most applicant routes, signing nests the application. */
export type SignOnboardingIndemnityResponse = ServerResponse<{
  signedAt: string
  templateVersion: string
  signerName: string
  application: OnboardingApplication
}>

export type ResumeOnboardingApplicationPayload = { data: { businessEmail: string } }

export type OnboardingVehicleInput = {
  registrationNumber: string
  vehicleType: OnboardingVehicleType
  make: string
  model: string
  year?: number
  engineNumber?: string
  chassisNumber?: string
  color?: string
  engineCapacity?: string
  odometerReading?: number
  purchaseType?: OnboardingVehiclePurchaseType
  purchaseTypeOther?: string
}

export type AddOnboardingVehiclePayload = { id: string, data: OnboardingVehicleInput, licence: File }
export type UpdateOnboardingVehiclePayload = { id: string, vehicleId: string, data: OnboardingVehicleInput }
export type DeleteOnboardingVehiclePayload = { id: string, vehicleId: string }
export type ImportOnboardingVehiclesPayload = { id: string, file: File }

/** Import nests the application, with the counts and the rows it couldn't read. */
export type ImportOnboardingVehiclesResponse = ServerResponse<{
  created: number
  updated: number
  skipped: { line: number, message: string }[]
  application: OnboardingApplication
}>

export type OnboardingVehicleImportColumn = {
  header: string
  required: boolean
  example: string
  note: string
}
export type OnboardingVehicleImportColumnsResponse = ServerResponse<{ columns: OnboardingVehicleImportColumn[] }>

/** The order, priced by the server from the application's own device rows (TRU-FE-14). */
export type OnboardingOrder = {
  planCode: string
  planName: string
  deviceCount: number
  perDeviceNgn: number
  devicesNgn: number
  installationNgn: number
  totalNgn: number
  renewalPerDeviceNgn: number
  // TODO(api): quotation lines the design shows; the order endpoint doesn't send them yet.
  deliveryFeeNgn?: number
  discountNgn?: number
  subtotalNgn?: number
  vatNgn?: number
}

export type OnboardingPaymentStatus = 'pending' | 'paid' | 'failed' | 'mismatch' | 'refunded' | 'requires_review'

export type OnboardingOrderResponse = ServerResponse<{
  order: OnboardingOrder
  stage: OnboardingApplicationStage
  /** True only at the `payment` stage, once provisioning is marked complete. */
  payable: boolean
  billingEmail: string | null
  billingEmailVerified: boolean
  /** Confirmation arrives by webhook — poll this, not the provider redirect. */
  payment: {
    reference: string
    status: OnboardingPaymentStatus
    paidAt: string | null
    /** Plain-language explanation when the payment needs attention, such as a wrong amount. */
    problem: string | null
  } | null
}>

export type SetOnboardingBillingEmailPayload = { id: string, data: { billingEmail: string } }
export type SetOnboardingBillingEmailResponse = ServerResponse<{ billingEmail: string, billingEmailVerified: boolean }>

export type StartOnboardingPaymentPayload = { id: string, data: { redirectUrl?: string } }
export type StartOnboardingPaymentResponse = ServerResponse<{
  reference: string
  authorizationUrl: string | null
  provider: string
  order: OnboardingOrder
  /** True when the server settled the payment without a hosted checkout. */
  paid?: boolean
}>

export type OnboardingTimeSlot = 'morning' | 'afternoon'

export type ScheduleOnboardingInstallationPayload = {
  id: string
  data: {
    /** YYYY-MM-DD, at least one day and at most 90 days ahead. */
    scheduledDate: string
    timeSlot: OnboardingTimeSlot
    addressLine: string
    city: string
    /** A Nigerian state or FCT. */
    state: string
    siteContactName: string
    siteContactPhone: string
    notes?: string
    /** One entry per paid-for device; deviceIndex starts at 1. No vehicle takes two. */
    assignments: { deviceIndex: number, vehicleId: string }[]
  }
}

export type OnboardingInstallerContact = {
  fullName: string
  team: string
  phoneNumber: string
  email: string
}

export type ScheduledOnboardingInstallation = {
  orderNumber: string
  scheduledDate: string
  timeSlot: OnboardingTimeSlot
  timeSlotLabel: string
  status: 'unassigned' | 'assigned' | 'scheduled' | 'in_progress' | 'overdue' | 'issue_reported' | 'completed' | 'cancelled'
  /** Null when nobody could be assigned yet — still a success. */
  installer: OnboardingInstallerContact | null
  /** Whether the account setup email was accepted for delivery. */
  setupLinkSent: boolean
}
export type ScheduleOnboardingInstallationResponse = ServerResponse<ScheduledOnboardingInstallation>

export type AddOnboardingDeviceRequestPayload = {
  id: string
  data: {
    quantity: number
    /** At least 10 characters. */
    useCase: string
    notes?: string
    /** Only after a shortfall: resend the same request with this set to place it anyway. */
    confirmAvailableQuantity?: boolean
  }
}

/**
 * Stock can't cover the request: nothing was saved (still a 201). Resend the same
 * request with `confirmAvailableQuantity: true` to place it anyway — devices are
 * provisioned as stock arrives.
 */
export type OnboardingDeviceRequestShortfall = {
  requestSaved: false
  requiresConfirmation: boolean
  requestedQuantity: number
  availableQuantity: number
  simAllocationQuantity: number
  message: string
}
/** A saved request returns the application plus `requestSaved: true`. */
export type OnboardingDeviceRequestSaved = OnboardingApplication & { requestSaved: true }
export type AddOnboardingDeviceRequestResponse = ServerResponse<OnboardingDeviceRequestSaved | OnboardingDeviceRequestShortfall>
export type DeleteOnboardingDeviceRequestPayload = { id: string, requestId: string }
/** Same rules and responses as adding one; the request's own devices are freed for its new quantity. */
export type UpdateOnboardingDeviceRequestPayload = AddOnboardingDeviceRequestPayload & { requestId: string }

/** An MTN Connect Store or Service Centre. `isDemo` rows are placeholders until MTN's list is loaded. */
export type PickupLocation = {
  id: string
  state: string
  area: string
  name: string
  address: string | null
  isDemo: boolean
}
export type PickupLocationsResponse = ServerResponse<PickupLocation[]>

export type OnboardingFulfilment =
  | { method: 'pickup', pickupLocationId: string }
  | { method: 'delivery', deliveryStreet: string, deliveryCity: string, deliveryState: string }
export type SetOnboardingFulfilmentPayload = { id: string, data: OnboardingFulfilment }

export type ContactEnquiryPayload = {
  data: { companyName: string, contactName: string, businessEmail: string, message: string }
}
export type ContactEnquiryResponse = ServerResponse<{ id: string }>

// ─── System Onboarding Applications (bearer) ─────────────────────────────────

export type SystemOnboardingApplicationsQuery = {
  params?: {
    status?: OnboardingApplicationStatus
    applicantType?: OnboardingApplicantType
    search?: string
    page?: number
    limit?: number
  }
}

// The review side has its own shapes (Swagger tag "System Onboarding Applications").
// `status` is the decision; `stage` is how far the customer has come.
export type SystemOnboardingStage =
  | 'application'
  | 'provisioning'
  | 'payment'
  | 'installation_scheduling'
  | 'installation'
  | 'connectivity_verification'
  | 'fleet_ready'

export type SystemOnboardingApplicationRow = {
  id: string
  reference: string
  applicantType: OnboardingApplicantType
  organizationName: string
  businessEmail: string
  organizationPhone: string
  contactFullName: string
  contactRole: string | null
  address: string
  status: OnboardingApplicationStatus
  stage: SystemOnboardingStage
  // ponytail: resolved server-side from (status, stage) — rendered as-is, never derived here.
  stageStatus: string
  emailVerified: boolean
  phoneVerified: boolean
  submittedAt: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  decisionReason: string | null
  tenantId: string | null
  setupLink: OnboardingApplicationSetupLink
  createdAt: string
  documentCount: number
  vehicleCount: number
  deviceCount: number
}

export type SystemOnboardingVerificationCheck =
  'cac_registration' | 'tax_identification' | 'identity' | 'vehicle_registration'
export type SystemOnboardingVerificationVerdict = 'match' | 'mismatch' | 'not_found' | 'unavailable'

export type SystemOnboardingVerification = {
  check: SystemOnboardingVerificationCheck
  verdict: SystemOnboardingVerificationVerdict
  summary: string
  fields: { name: string, expected: string | null, actual: string | null, matched: boolean }[]
  provider: string
  checkedAt: string
}

export type SystemOnboardingDocument = {
  id: string
  documentType:
    | 'customer_request_letter'
    | 'cac_document'
    | 'tax_certificate_or_tin'
    | 'signature_card'
    | 'utility_bill'
    | 'identification_card'
    | 'proof_of_ownership'
    | 'vehicle_license'
    | 'signed_indemnity_form'
  documentName: string
  fileSize: number
  mimeType: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  uploadedAt: string
  // Expires after five minutes — refetch the detail on click, never cache it.
  downloadUrl: string | null
}

export type SystemOnboardingPaymentOutcome = 'resolved' | 'refund_needed'

/** Present only while the latest payment was refused for a wrong amount. */
export type SystemOnboardingPaymentReview = {
  paymentId: string
  reference: string
  /** `refunded` once the money went back through the payment provider. */
  status: 'mismatch' | 'refunded'
  refundedAt: string | null
  /** Why the provider refused the last refund attempt. */
  refundError: string | null
  /** The provider has accepted a refund and has not finished it yet. */
  refundProcessing: boolean
  expectedNgn: number
  paidNgn: number | null
  currency: string | null
  reviewOutcome: SystemOnboardingPaymentOutcome | null
  reviewNote: string | null
  reviewedBy: string | null
  reviewedAt: string | null
}

export type SystemOnboardingApplicationDetail = Omit<SystemOnboardingApplicationRow, 'documentCount'> & {
  progress: { stage: SystemOnboardingStage, complete: boolean, current: boolean }[]
  paymentReview: SystemOnboardingPaymentReview | null
  /** Every wrong-amount onboarding payment, mismatched first. Each one is reviewed and refunded on its own. */
  paymentReviews: SystemOnboardingPaymentReview[]
  vehicles: { id: string, registrationNumber: string, vehicleType: string, make: string, model: string }[]
  deviceRequests: { id: string, quantity: number, useCase: string }[]
  verifications: SystemOnboardingVerification[]
  documents: SystemOnboardingDocument[]
}
export type SystemOnboardingApplicationResponse = ServerResponse<SystemOnboardingApplicationDetail>

export type SystemOnboardingDocumentLink = {
  id: string
  documentName: string
  mimeType: string
  fileSize: number
  url: string
  downloadUrl: string
  expiresInSeconds: number
}
export type SystemOnboardingDocumentLinkResponse = ServerResponse<SystemOnboardingDocumentLink>

export type SystemOnboardingTimelineEntry = {
  action: string
  summary: string
  actor: string
  at: string
}
export type SystemOnboardingTimelineResponse = ServerResponse<{
  applicationId: string
  reference: string
  entries: SystemOnboardingTimelineEntry[]
}>

export type SystemOnboardingApplicationsListResponse = ServerResponse<{
  items: SystemOnboardingApplicationRow[]
  total: number
  page: number
  limit: number
}>

export type SystemApproveOnboardingApplicationResponse = ServerResponse<{
  applicationId: string
  reference: string
  status: 'approved'
  stage: SystemOnboardingStage
  tenantId: string
  bootstrapRole: string
}>

export type SystemOnboardingDecisionResponse = ServerResponse<{
  applicationId: string
  reference: string
  status: 'rejected' | 'changes_requested'
  decisionReason: string
  /** Only on request-changes: false when the email could not be sent. */
  delivered?: boolean
}>

/** The reason is only required when device stock does not cover the order. */
export type SystemOnboardingProvisionedPayload = { id: string, data?: { reason?: string } }

export type SystemOnboardingProvisionedResponse = ServerResponse<{
  applicationId: string
  stage: SystemOnboardingStage
  confirmedWithoutStock: boolean
  reason: string | null
}>

export type SystemRefundOnboardingPaymentPayload = {
  id: string
  /** Omit to refund the newest mismatched payment. */
  paymentId?: string
  data: { note: string }
}

export type SystemRefundOnboardingPaymentResponse = ServerResponse<{
  applicationId: string
  reference: string
  paymentId: string
  refundReference: string | null
  note: string
  /** `processing` until the provider finishes; the applicant is emailed then. */
  refundStatus: 'refunded' | 'processing'
  alreadyRefunded: boolean
}>

export type SystemReviewOnboardingPaymentPayload = {
  id: string
  paymentId?: string
  data: { outcome: SystemOnboardingPaymentOutcome, note: string }
}

export type SystemReviewOnboardingPaymentResponse = ServerResponse<{
  applicationId: string
  reference: string
  outcome: SystemOnboardingPaymentOutcome
  note: string
}>

export type SystemOnboardingSetupLinkResendResponse = ServerResponse<{
  applicationId: string
  setupLinkEmail: string
  setupLinkExpiresAt: string
  resentBy: string
  resentAt: string
  setupLinkStatus: 'sent' | 'failed'
  setupLinkError: string | null
}>

export type SystemOnboardingChangesLinkResendResponse = SystemOnboardingPaymentLinkResendResponse

export type SystemOnboardingPaymentLinkResendResponse = ServerResponse<{
  applicationId: string
  reference: string
  delivered: boolean
  resentBy: string
  resentAt: string
}>

export type SystemOnboardingApplicationDocumentActionPayload = {
  id: string
  documentId: string
}

export type SystemRejectOnboardingApplicationDocumentPayload = {
  id: string
  documentId: string
  data: { reason: string }
}

export type SystemOnboardingApplicationDocumentResponse = ServerResponse<{
  documentId: string
  status: 'approved' | 'rejected'
}>

export type SystemRejectOnboardingApplicationPayload = {
  id: string
  data: { reason: string }
}

export type SystemRequestChangesOnboardingApplicationPayload = {
  id: string
  data: { reason: string }
}

// ─── Platform Integrations ───────────────────────────────────────────────────

export type PlatformIntegration = {
  serviceKey: string
  category: string
  enabled: boolean
  // ponytail: `config` shape is provider-specific — kept as Record for now.
  config?: Record<string, unknown>
  updatedAt?: string
}

export type PlatformIntegrationsResponse = ServerResponse<{
  items: PlatformIntegration[]
}>

export type UpdatePlatformIntegrationPayload = {
  serviceKey: string
  data: {
    category: string
    enabled: boolean
    secret?: string
    config?: Record<string, unknown>
  }
}

export type PlatformIntegrationResponse = ServerResponse<PlatformIntegration>

// ─── Communications Wallet ───────────────────────────────────────────────────

export type CommunicationsWalletRangeQuery = {
  params?: {
    range?: '7d' | '30d' | '90d' | 'custom'
    startDate?: string
    endDate?: string
  }
}

// ponytail: response data shapes not declared in the current spec.
export type CommunicationsWalletRatesResponse = ServerResponse<unknown>
export type CommunicationsWalletSpendTrendResponse = ServerResponse<unknown>
/** Wallet spend per channel; data_bundle is included because bundles and comms share one wallet. */
export type CommunicationsWalletSpendBreakdownResponse = ServerResponse<{
  breakdown: { channel: 'sms' | 'whatsapp' | 'voice' | 'ai' | 'data_bundle', amount: number, percentage: number }[]
  total: number
}>

// ─── System Billing — bundle adoption + bundle catalog list ──────────────────

export type BundleType = 'subscription' | 'top_up'

export type BundleAdoptionQuery = {
  params?: {
    search?: string
    /** Only tenants with a bundle of this kind. */
    bundleType?: BundleType
  }
}

/** One bundle on one mobile number. */
export type BundleAdoptionLine = {
  mobileNumber: string
  iccid: string | null
  vehicleId: string | null
  /** The vehicle's registration plate; null when there is no vehicle or fleet could not name it. */
  vehicleLabel: string | null
  bundleId: string
  bundleName: string | null
  carrier: string | null
  status: string
  dataUsedMb: number
  dataTotalMb: number
  /** The first live bundle on a number is its subscription, each one added on top a top-up; null when not live. */
  kind: BundleType | null
  priceNgn: number | null
  expiresAt: string | null
  /** Whole days left, null when there is no expiry or it has passed. */
  expiresInDays: number | null
}

export type BundleAdoptionItem = {
  tenantId: string
  tenantName: string
  simCount: number
  activeBundleCount: number
  carriers: string[]
  /** What the tenant's live bundles cost per month (yearly ones divided by 12). */
  monthlySpendNgn: number
  lines: BundleAdoptionLine[]
}

export type BundleAdoptionResponse = ServerResponse<{
  total: number
  items: BundleAdoptionItem[]
}>

/** The four figures above the M2M bundle tables. */
export type BundleSummary = {
  totalActiveBundles: number
  expiringIn7Days: number
  simsAcrossTenants: number
  monthlyBundleSpendNgn: number
}

export type BundleSummaryResponse = ServerResponse<BundleSummary>

export type BundleCatalogQuery = {
  params?: {
    carrierId?: string
    billingCycle?: string
    search?: string
    status?: 'all' | 'active' | 'inactive'
    page?: number
    limit?: number
  }
}

export type BundleCatalogItem = {
  id: string
  code: string
  name: string
  /** Catalog carrier id, e.g. "carrier-mtn". */
  carrier: string
  /** The carrier's display name; null for a carrier the catalog does not know. */
  carrierName: string | null
  dataAmountGb: number
  validityDays: number
  billingCycle: string
  /** Naira. */
  price: number
  currency: string
  active: boolean
}

export type BundleCatalogListResponse = ServerResponse<{
  items: BundleCatalogItem[]
  total: number
}>

// ─── Mailbox message flags ───────────────────────────────────────────────────

export type UpdateMailboxMessageFlagsPayload = {
  id: string
  data: {
    starred?: boolean
    addLabels?: string[]
    removeLabels?: string[]
  }
}

// ponytail: flag-update response shape not declared in the current spec.
export type MailboxMessageFlagsResponse = ServerResponse<unknown>

// ─── Support Tickets (tenant) — reply / close / reopen ───────────────────────

export type ReplySupportTicketPayload = {
  id: string
  data: { message: string }
}

export type CloseSupportTicketPayload = {
  id: string
}

export type ReopenSupportTicketPayload = {
  id: string
  data: { reason: string }
}

// ─── System Subscription Plans — entitlements ────────────────────────────────

export type SubscriptionPlanPaymentModel = 'prepaid' | 'postpaid'

export type SubscriptionPlanAvailableFor =
  | 'fleet_provider'
  | 'enterprise'
  | 'aggregator'
  | 'owner_operator'

export type UpdateSubscriptionPlanEntitlementsPayload = {
  id: string
  data: {
    paymentModel?: SubscriptionPlanPaymentModel
    // ponytail: quotas & limitBehaviour are free-form in the spec; typing
    // stricter than Record<string, unknown> would be speculation.
    quotas?: Record<string, unknown>
    limitBehaviour?: Record<string, unknown>
    features?: string[]
    allowances?: string[]
    availableFor?: SubscriptionPlanAvailableFor[]
    trialDays?: number
  }
}

// ─── System — cross-tenant audit log ─────────────────────────────────────────

export type SystemAuditLogEntry = {
  id: string
  occurredAt: string
  actorId: string | null
  actorName: string | null
  actorEmail: string | null
  actorRole: string | null
  action: string
  resourceType: string
  resourceId: string | null
  tenantId: string | null
  tenantName: string | null
  ipAddress: string | null
  source: string
  summary: string | null
  reason?: string | null
}

export type SystemAuditLogQuery = {
  params?: {
    search?: string
    tenantId?: string
    actor?: string
    action?: string
    resourceType?: string
    source?: string
    from?: string
    to?: string
    /** Default 100, capped at 500. The server has no offset — page client-side. */
    limit?: number
  }
}

// TRU-FE-8: GET /auth/system/audit-log — spec says data is `SystemAuditLogEntry[]`
// actual: data is { total: number, items: SystemAuditLogEntry[] }
export type SystemAuditLogResponse = ServerResponse<{
  total: number
  items: SystemAuditLogEntry[]
}>

// TRU-FE-8: GET /auth/system/audit-log/filters — spec says each tenant carries a
// `tenantName` string; actual response returns `tenantName: null` for every tenant.
export type SystemAuditLogFilters = {
  tenants: { tenantId: string; tenantName: string | null }[]
  actions: string[]
  resourceTypes: string[]
  services: string[]
}

export type SystemAuditLogFiltersResponse = ServerResponse<SystemAuditLogFilters>

export type SystemAuditLogVerification = {
  intact: boolean
  chainsChecked: number
  entriesChecked: number
  brokenChains: {
    tenantId: string
    firstBreak: { seq: number; id: string; reason: 'hash_mismatch' | 'broken_link' }
  }[]
  verifiedAt: string
}

export type SystemActionHistoryQuery = {
  /** Action prefixes such as 'system.sim.' or 'system.device.' */
  prefixes: string[]
  tenantId?: string
  limit?: number
}

export type SystemAuditLogVerifyResponse = ServerResponse<SystemAuditLogVerification>

// ─── System — tenant terminate ───────────────────────────────────────────────

export type TerminateSystemTenantPayload = {
  id: string
  data: { reason: string; confirmation: 'TERMINATE' }
}
export type TerminateSystemTenantResponse = ServerResponse<Record<string, unknown>>

// ─── System — tenant detail: resource tabs / documents / audit-log ───────────

export type SystemTenantResourceTab = 'vehicles' | 'drivers' | 'devices' | 'sims'

export type SystemTenantVehicleRow = {
  vehicleId: string
  registrationNumber: string
  make: string | null
  model: string | null
  status: string
}
export type SystemTenantDriverRow = {
  driverId: string
  name: string
  phone: string | null
  licenseNumber: string | null
  status: string
}
export type SystemTenantDeviceRow = {
  deviceId: string
  manufacturer: string | null
  model: string | null
  imei: string | null
  status: string
  assignedVehicleId: string | null
}
export type SystemTenantSimRow = {
  simId: string
  msisdn: string | null
  carrier: string | null
  iccid: string | null
  status: string
}

// `available: false` means the fleet service was unreachable — not empty.
export type SystemTenantResourcesResponse<TItem> = ServerResponse<{
  available: boolean
  total: number
  used: number
  limit: number | null
  items: TItem[]
}>

export type SystemTenantResourcesPayload = {
  id: string
  tab: SystemTenantResourceTab
  planCode?: string
}

export type SystemTenantDocument = {
  documentId: string
  documentType: string
  documentName: string
  fileSize: number
  mimeType: string
  status: string
  uploadedAt: string
}
export type SystemTenantDocumentsResponse = ServerResponse<{
  total: number
  items: SystemTenantDocument[]
}>

export type SystemTenantAuditLogEntry = {
  id: string
  action: string
  summary: string | null
  actorName: string | null
  actorEmail: string | null
  occurredAt: string
}
export type SystemTenantAuditLogResponse = ServerResponse<{
  total: number
  items: SystemTenantAuditLogEntry[]
}>

// ─── System — onboarding applications summary ────────────────────────────────

export type SystemOnboardingApplicationsSummary = {
  total: number
  pendingReview: number
  approved: number
  rejected: number
  changesRequested: number
}
export type SystemOnboardingApplicationsSummaryResponse =
  ServerResponse<SystemOnboardingApplicationsSummary>

// ─── System — tenant limits, trial and data export ───────────────────────────

export type SystemTenantContactDetail = {
  tenant: SystemTenant
  onboarding: {
    company: {
      companyName: string
      contactName: string | null
      email: string
      phoneNumber: string | null
      billingEmail: string | null
      businessAddress: string | null
    }
    subscription: { planCode: string; billingCycle: 'monthly' | 'yearly' }
  } | null
}

export type UpdateSystemTenantQuotasPayload = {
  id: string
  data: Partial<SystemTenantQuotas> & { reason: string }
}
export type SystemTenantQuotasResponse = ServerResponse<{
  tenantId: string
  quotas: SystemTenantQuotas
  planQuotas: SystemTenantQuotas
  quotaOverrides: SystemTenantQuotas
}>

export type SystemTenantTrialResponse = ServerResponse<{ tenantId: string; trial: SystemTenantTrial }>
export type ExtendSystemTenantTrialPayload = { id: string; data: { days: number; reason: string } }
export type ConvertSystemTenantTrialPayload = { id: string; data?: { reason?: string } }

export const SYSTEM_TENANT_EXPORT_SCOPES = ['vehicles', 'drivers', 'devices', 'sims', 'users', 'invoices', 'all'] as const
export type SystemTenantExportScope = (typeof SYSTEM_TENANT_EXPORT_SCOPES)[number]

export type SystemTenantExport = {
  id: string
  tenantId: string
  scope: SystemTenantExportScope
  status: 'pending' | 'ready' | 'failed'
  rowCounts: Record<string, number>
  fileName: string | null
  fileBytes: number | null
  error: string | null
  requestedBy: string
  requestedByName: string | null
  createdAt: string
  expiresAt: string
  expired: boolean
  downloadable: boolean
}
export type SystemTenantExportResponse = ServerResponse<SystemTenantExport>
export type SystemTenantExportsResponse = ServerResponse<{ items: SystemTenantExport[] }>
export type RequestSystemTenantExportPayload = { id: string; data: { scope: SystemTenantExportScope } }
export type DownloadSystemTenantExportPayload = { id: string; exportId: string }

/** Fonu clickToCall block from GET /auth/telephony/click-to-call-credentials. */
export type ClickToCallCredentials = {
  enabled?: boolean
  extension?: string | number
  domain?: string
  password?: string
  wss_url?: string
  destination?: string
  origin?: string | { number?: string }
  originUuid?: string
}
