export type UserRole =
  | "ENTERPRISE_ADMIN"
  | "AGGREGATOR_ADMIN"
  | "OWNER_OPERATOR"
  | "PLATFORM_ADMIN"
  | "FLEET_ADMIN"
  | "OPERATIONS_MANAGER"
  | "DISPATCHER"
  | "FINANCE_VIEWER"
  | "SUPER_ADMIN";

export type AccountStatus = "enabled" | "disabled";
export type SystemTenantStatus = "active" | "pending" | "suspended" | "inactive";
export type SystemTenantActivationStatus = "pending_activation";
export type SystemTenantPlan = "starter" | "professional" | "enterprise";
export type OrganizationType = "fleet_provider" | "enterprise" | "aggregator" | "owner_operator";
export type BillingCycle = "monthly" | "yearly";
export type DeviceManufacturer = "Teltonika" | "Queclink" | "Meitrack" | "CalAmp";
export type SimCarrier = "MTN" | "Airtel" | "Glo" | "9mobile";
export type SimDataPackage = "250MB/month" | "500MB/month" | "1GB/month" | "2GB/month";
export type OrganizationDateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type WeekStartsOn = "monday" | "sunday";
export type VerificationStatus =
  | "not_submitted"
  | "pending"
  | "under_review"
  | "verified"
  | "rejected";

export type UserProfile = {
  fullName: string;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  address: string | null;
};

export type User = {
  id: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  name?: string;
  avatar?: string;
  createdAt?: Date;
  userId?: string;
  profile?: UserProfile | null;
  accountStatus?: AccountStatus;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
};

export type Authentication = Session & {
  expiresIn: number;
  user: User;
};

export type RegisterPayload = {
  data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
  };
};

export type LoginPayload = {
  data: {
    email: string;
    password: string;
  };
};

export type GetNewAccessTokenPayload = {
  data: {
    refreshToken: string;
  };
};

export type ChangeSystemPasswordPayload = {
  data: {
    currentPassword: string;
    newPassword: string;
  };
};

export type InviteMemberPayload = {
  data: {
    email: string;
    role: UserRole;
  };
};

export type RegisterInviteMemberPayload = {
  data: {
    inviteToken: string;
    email?: string;
    fullName: string;
    password: string;
  };
};

export type CompleteProfilePayload = {
  data: {
    token: string;
    fullName: string;
    password: string;
  };
};

export type ForgetPasswordPayload = {
  data: {
    identifier: string;
  };
};

export type VerifyEmailPayload = {
  data: {
    token: string;
  };
};

export type VerifyPasswordResetPayload = {
  data: {
    token: string;
  };
};

export type VerifyPasswordResetResponse = unknown | null;
export type VerifyEmailResponse = unknown | null;

export type ResetPasswordPayload = {
  data: {
    token: string;
    newPassword: string;
  };
};

export type ChangeUserRolePayload = {
  data: {
    targetUserId: string;
    newRole: UserRole;
  };
};

export type LogoutPayload = {
  data: {
    refreshToken: string;
  };
};

export type LogOutResponse = null;

export type ProfileUser = {
  userId: string;
  email: string;
  tenantId: string;
  role: UserRole;
  accountStatus: AccountStatus;
  profile: UserProfile | null;
};

export type UpdateUserProfilePayload = {
  data: Partial<UserProfile>;
};

export type NotificationPreferences = {
  emailAlerts: boolean;
  smsAlerts: boolean;
  pushAlerts: boolean;
  incidentAlerts: boolean;
  jobUpdates: boolean;
  marketingAnnouncements: boolean;
};

export type NotificationPreferencesResponse = {
  userId: string;
  notificationPreferences: NotificationPreferences;
};

export type UpdateNotificationPreferencesPayload = {
  data: Partial<NotificationPreferences>;
};

export type DispatcherPreferences = {
  timezone: string;
  shiftStart: string;
  shiftEnd: string;
  workDays: number[];
};

export type DispatchPreferencesResponse = {
  userId: string;
  dispatcherPreferences: DispatcherPreferences;
};

export type UpdateDispatcherPreferencesPayload = {
  data: Partial<DispatcherPreferences>;
};

export type Branding = {
  organizationName: string;
  contactEmail: string | null;
  phoneNumber: string | null;
  address: string | null;
  logoUrl: string | null;
  profilePictureUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  successColor: string | null;
  warningColor: string | null;
  destructiveColor: string | null;
  sidebarBackground: string | null;
  sidebarText: string | null;
  sidebarAccent: string | null;
};

export type OrganizationSettingsDefaults = {
  timezone: string;
  language: string;
  currency: string;
  dateFormat: OrganizationDateFormat;
  weekStartsOn: WeekStartsOn;
};

export type OrganizationSettings = {
  tenantId: string;
  branding: Branding;
  defaults: OrganizationSettingsDefaults;
};

export type UpdateOrganizationsSettingsPayload = {
  data: {
    branding?: Partial<Branding>;
    defaults?: Partial<OrganizationSettingsDefaults>;
  };
};

export type UploadImageToBucketPayload = {
  files: File[];
};

export type UploadedImage = {
  key: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
};

export type SystemSubscriptionPlan = {
  code: string;
  tier: SystemTenantPlan;
  name: string;
  description: string;
  monthlyPriceNgn: number | null;
  yearlyMonthlyEquivalentNgn: number | null;
  yearlyDiscountPercent: number | null;
  maxActiveVehicles: number | null;
  customPricing: boolean;
  trialDays: number | null;
  badge: string | null;
  ctaLabel: string;
  features: string[];
};

export type SystemSubscriptionPlansResponse = {
  plans: SystemSubscriptionPlan[];
  generatedAt: string;
};

export type OrganizationUser = {
  userId: string;
  email: string;
  tenantId: string;
  role: UserRole;
  accountStatus: AccountStatus;
  profile: UserProfile;
  status: string;
  lastActiveAt: string | null;
};

export type InvitedUser = OrganizationUser;

export type InvitedUsers = {
  tenantId: string;
  users: InvitedUser[];
};

export type UpdateInvitedUserPayload = {
  userId: string;
  data: Partial<UserProfile>;
};

export type UpdateInvitedUserResponse = {
  message: string;
  user: OrganizationUser;
};

export type RemoveInvitedUserPayload = {
  userId: string;
};

export type RemoveInvitedUserResponse = {
  message: string;
  userId: string;
  email: string;
};

export type UpdateOrganizationUserStatusPayload = {
  userId: string;
  data: {
    accountStatus: AccountStatus;
  };
};

export type ResendInvitedUserMailPayload = {
  data: {
    email: string;
  };
};

export type ResendInvitedUserMailResponse = {
  message: string;
  email: string;
  role: string;
};

export type ResendInvitedUserMailRepsonse = ResendInvitedUserMailResponse;

export type CreateSystemAdminPayload = {
  data: {
    fullName: string;
    email: string;
    password: string;
  };
};

export type UpdateSystemAdminStatusPayload = {
  userId: string;
  data: {
    accountStatus: AccountStatus;
  };
};

export type ActivityLogQuery = {
  service?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  actorId?: string;
  limit?: number;
};

export type ActivityLogEntry = {
  id: string;
  tenantId: string;
  service: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  actorId: string | null;
  actorRole: string | null;
  metadata: Record<string, unknown>;
  occurredAt: string;
  recordedAt: string;
};

export type SystemDashboard = {
  totalTenants: number;
  totalVehicles: number;
  totalDrivers: number;
  totalSensors: number;
  totalSimCards: number | null;
  dataUsageTodayMb: number | null;
  sensorGpsMessagesPerHour: number | null;
  unavailableMetrics: string[];
  generatedAt: string;
};

export type SystemTenantsSummary = {
  totalTenants: number;
  activeTenants: number;
  monthlyRevenueNgn: number;
  totalVehicles: number;
  generatedAt: string;
};

export type SystemTenantFeatureFlags = {
  liveTracking: boolean;
  messaging: boolean;
  geofencing: boolean;
  routeOptimization: boolean;
  advancedAnalytics: boolean;
  apiAccess: boolean;
};

export type TenantCompanyDetails = {
  companyName: string;
  email: string;
  phoneNumber?: string | null;
  billingEmail?: string | null;
  businessAddress?: string | null;
  organizationType: OrganizationType;
};

export type UpdateTenantCompanyDetailsPayload = {
  companyName?: string;
  email?: string;
  phoneNumber?: string | null;
  billingEmail?: string | null;
  businessAddress?: string | null;
  organizationType?: OrganizationType;
};

export type TenantSubscriptionSelection = {
  planCode: string;
  billingCycle: BillingCycle;
};

export type UpdateTenantSubscriptionSelectionPayload = {
  planCode?: string;
  billingCycle?: BillingCycle;
};

export type TenantDeviceProvisioning = {
  provisionNow: boolean;
  numberOfDevices?: number | null;
  deviceManufacturer?: DeviceManufacturer | null;
};

export type UpdateTenantDeviceProvisioningPayload = {
  provisionNow?: boolean;
  numberOfDevices?: number | null;
  deviceManufacturer?: DeviceManufacturer | null;
};

export type TenantSimAssignment = {
  provisionNow: boolean;
  numberOfSims?: number | null;
  carrier?: SimCarrier | null;
  dataPackage?: SimDataPackage | null;
};

export type UpdateTenantSimAssignmentPayload = {
  provisionNow?: boolean;
  numberOfSims?: number | null;
  carrier?: SimCarrier | null;
  dataPackage?: SimDataPackage | null;
};

export type UpdateTenantFeatureFlagsPayload = Partial<SystemTenantFeatureFlags>;

export type CreateSystemTenantPayload = {
  data: {
    company: TenantCompanyDetails;
    subscription: TenantSubscriptionSelection;
    deviceProvisioning?: TenantDeviceProvisioning;
    simAssignment?: TenantSimAssignment;
    features?: Partial<SystemTenantFeatureFlags>;
  };
};

export type UpdateSystemTenantPayload = {
  tenantId: string;
  data: {
    company?: UpdateTenantCompanyDetailsPayload;
    subscription?: UpdateTenantSubscriptionSelectionPayload;
    deviceProvisioning?: UpdateTenantDeviceProvisioningPayload;
    simAssignment?: UpdateTenantSimAssignmentPayload;
    features?: UpdateTenantFeatureFlagsPayload;
  };
};

export type SystemTenantCompany = {
  companyName: string;
  email: string;
  phoneNumber: string;
  billingEmail: string;
  businessAddress: string;
  organizationType: OrganizationType;
};

export type SystemTenantSubscription = {
  planCode: string;
  billingCycle: BillingCycle;
};

export type SystemTenantDeviceProvisioning = {
  provisionNow: boolean;
  numberOfDevices: number;
  deviceManufacturer: DeviceManufacturer | null;
};

export type SystemTenantSimAssignment = {
  provisionNow: boolean;
  numberOfSims: number;
  carrier: SimCarrier | null;
  dataPackage: SimDataPackage | null;
};

export type SystemTenantOnboarding = {
  onboardingId: string;
  tenantId: string;
  status: SystemTenantActivationStatus;
  bootstrapRole: string;
  company: SystemTenantCompany;
  subscription: SystemTenantSubscription;
  deviceProvisioning: SystemTenantDeviceProvisioning;
  simAssignment: SystemTenantSimAssignment;
  features: SystemTenantFeatureFlags;
  adminInviteEmail: string;
  createdAt: string;
};

export type SystemTenantsQuery = {
  search?: string;
  status?: SystemTenantStatus;
  plan?: SystemTenantPlan;
};

export type SystemTenantInvitationStatus = {
  hasPendingInvitation: boolean;
  invitationAccepted: boolean;
};

export type SystemTenantBusinessInfo = {
  companyName: string;
  registrationNumber: string | null;
  taxId: string | null;
  businessType: string | null;
  industry: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  yearEstablished: number | null;
};

export type SystemTenantListItem = {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  address: string | null;
  billingEmail: string | null;
  plan: SystemTenantPlan;
  planCode: string | null;
  status: SystemTenantStatus;
  organizationType: OrganizationType | null;
  organizationTypes: OrganizationType[];
  vehicleCount: number;
  driverCount: number;
  deviceCount: number;
  simCount: number;
  monthlyRevenueNgn: number;
  createdAt: string;
  lastActiveAt: string | null;
  features: SystemTenantFeatureFlags;
  invitationStatus: SystemTenantInvitationStatus;
  businessInfo: SystemTenantBusinessInfo;
};

export type SystemTenantsListResponse = {
  total: number;
  tenants: SystemTenantListItem[];
  generatedAt: string;
};

export type SystemTenantFeatureOption = {
  key: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
};

export type SystemTenantOnboardingReferenceData = {
  organizationTypes: OrganizationType[];
  billingCycles: BillingCycle[];
  deviceManufacturers: DeviceManufacturer[];
  simCarriers: SimCarrier[];
  simDataPackages: SimDataPackage[];
  tenantStatuses: SystemTenantStatus[];
  tenantPlans: SystemTenantPlan[];
  featureDefaults: SystemTenantFeatureFlags;
  featureOptions: SystemTenantFeatureOption[];
  generatedAt: string;
};

export type SystemTenantDetail = {
  tenant: SystemTenantListItem;
  onboarding: SystemTenantOnboarding | null;
};

export type UpdateSystemTenantStatusPayload = {
  tenantId: string;
  data: {
    status: Extract<SystemTenantStatus, "active" | "suspended">;
  };
};

export type SystemTenantDeleteResponse = {
  tenantId: string;
  deleted: boolean;
};
