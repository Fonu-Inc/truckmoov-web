import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

import { useAuthStore } from '../lib/auth-store'
import { setOnboardingToken as persistOnboardingToken } from '../lib/onboarding-instance'
import { queryClient } from '../lib/query-client'
import {
  attachSupportTicketFiles,
  approveSystemDeviceSetupRequest,
  assignSystemDeviceSetupRequest,
  getSystemDeviceSetupSummary,
  approveSIMRequest,
  changeRole,
  completeProfile,
  createDeviceCatalogEntry,
  createSupportTicket,
  createSupportTicketMessage,
  createSystemAdmin,
  createSystemAdminInvite,
  createTenant,
  deleteOnboardingKycDocument,
  deleteDeviceCatalogEntry,
  suspendSystemDevice,
  reinstateSystemDevice,
  deleteOrganizationUser,
  deleteSystemAdmin,
  deleteSystemAdminInvite,
  deleteTenant,
  disableDataBundleAutoTopup,
  disableDataBundleSpendingLimit,
  escalateSupportTicket,
  exportSystemDeviceSetupRequests,
  exportSystemDevicesCatalog,
  exportSystemDevices,
  exportSystemSims,
  exportSystemSimsRequests,
  exportSystemSupportTickets,
  exportSystemTenants,
  forgotPassword,
  getActivityLog,
  getAuthHealth,
  getDispatchPreferences,
  getMe,
  getNotificationPreferences,
  getOnboardingBusinessInfo,
  getOnboardingExchangeRate,
  getOnboardingKycDocuments,
  getOnboardingPlans,
  getOnboardingStatus,
  getOnboardingSubscriptionCaps,
  getOrganizationSettings,
  createPaymentIntent,
  submitEnterpriseEnquiry,
  getOrganizationUsers,
  getProfile,
  getSubscriptionPlans,
  getSupportTicket,
  getSupportTickets,
  getSupportTicketMessages,
  getSystemActivityLog,
  getSystemAdminInvites,
  getSystemAdmins,
  getSystemDashboard,
  getSystemDeviceSetupRequest,
  getSystemDeviceSetupRequests,
  getSystemDevice,
  getSystemDevices,
  getSystemDevicesCatalog,
  getSystemDevicesSummary,
  getSystemEscalatedSupportTickets,
  getSystemFeatureFlags,
  getSystemHealth,
  getSystemRefDataDeviceCatalog,
  getSystemRefDataTenantOnboarding,
  getSystemFailedLogins,
  getSystemAuthEvents,
  getSystemBlockedIps,
  unblockSystemIp,
  getSystemAutoBlockRules,
  updateSystemAutoBlockRule,
  getSystemSecurityEvents,
  getSystemSecurityOverview,
  blockSystemIp,
  getSystemSettings,
  getSystemSim,
  getSystemSims,
  getSystemSimsBatches,
  getSystemSimsBatchesSummary,
  exportSystemSimsBatches,
  getSystemSimBatch,
  getSystemSimsRequests,
  getSystemSimsRequestsSummary,
  getSystemSimsSummary,
  getSystemSubscriptionPlans,
  getSupportTicketContext,
  getSupportTicketOptions,
  getSupportTicketsExport,
  getSupportTicketsSummary,
  getSystemSupportDashboard,
  getSystemSupportTicketSummary,
  getSystemSupportTicket,
  getSystemSupportTickets,
  getSystemTenant,
  getSystemTenants,
  getSystemTenantsSummary,
  inviteUser,
  login,
  logout,
  refresh,
  register,
  registerInvited,
  reassignSystemSim,
  rejectSystemDeviceSetupRequest,
  rejectSIMRequest,
  resendOrgInvite,
  resendSystemAdminInvite,
  resendTenantInvite,
  resetPassword,
  retrySimBatch,
  suspendSystemSim,
  systemChangePassword,
  systemLogin,
  saveDataBundleAutoTopup,
  saveDataBundleSpendingLimit,
  topUpDataBundleWallet,
  updateDeviceCatalogEntry,
  updateDispatchPreferences,
  updateFeatureFlag,
  updateNotificationPreferences,
  updateOnboardingBusinessInfo,
  updateOrganizationSettings,
  updateOrganizationUser,
  updateOrganizationUserStatus,
  updateProfile,
  updateSubscriptionPlanPrice,
  updateSupportTicketStatus,
  updateSystemAdminStatus,
  confirmTwoFactor,
  disableTwoFactor,
  enrolTwoFactor,
  exportAIRequests,
  getAIGovernance,
  getAIRequests,
  getAIUsage,
  getTwoFactor,
  updateAIGovernance,
  updateOpenRouterCredential,
  updateSystemSettings,
  updateSystemSim,
  updateTenant,
  updateTenantStatus,
  uploadMedia,
  verifyEmail,
  verifyReset,
  provisionDevices,
  registerSims,
  importSimsFromCsv,
  downloadSimImportTemplate,
  importSims,
  downloadSimRequestDeviceMappingTemplate,
  uploadSimRequestDeviceMapping,
  createSimRequest,
  createSim,
  getSims,
  getSim,
  updateSim,
  deleteSim,
  suspendSim,
  reactivateSim,
  unassignSimDevice,
  exportSims,
  getSimCarriers,
  getSimRequests,
  getSimRequest,
  allocateDataBundle,
  createSystemBundle,
  createSystemCarrier,
  deleteSystemBundle,
  exportDataBundleAllocations,
  exportDataBundleRates,
  exportDataBundleTransactions,
  getAllocatableSims,
  getDataBundleAllocation,
  getDataBundleAllocations,
  updateSystemBundle,
  updateSystemCarrier,
  getDataBundleCarrierDistribution,
  getDataBundleSpendBreakdown,
  getDataBundleSpendTrend,
  getDataBundleSubscriptionUsage,
  getDataBundleRates,
  getDataBundleCarriers,
  getDataBundleAutoTopup,
  getDataBundleDashboardSummary,
  getDataBundleSpendingLimit,
  getDataBundleTransactions,
  getDataBundleWalletBalance,
  getSimDataBundles,
  provisionSims,
  updateOnboardingFeatures,
  uploadOnboardingKycDocument,
  completeOnboarding,
  getTenantStatus,
  resendVerification,
  verifyActivityLog,
  getMailboxCredentials,
  saveMailboxCredentials,
  deleteMailboxCredentials,
  getMailboxThreads,
  getMailboxThreadsSince,
  getMailboxThread,
  getMailboxAttachmentLink,
  sendMailboxMessage,
  getPlatformAlertSettings,
  updatePlatformAlertSetting,
  getCommunicationRates,
  updateCommunicationRates,
  getCommunicationRateHistory,
  requestOrganisationUpgrade,
  getOrganisationUpgradeQueue,
  approveOrganisationUpgrade,
  rejectOrganisationUpgrade,
  assignSystemSupportTicket,
  getSystemKycReviewQueue,
  approveSystemKycDocument,
  rejectSystemKycDocument,
  getDataBundleWalletLedger,
  getPlatformWallets,
  getPlatformWalletLedger,
  platformTopUpWallet,
  updatePlatformWalletCreditSettings,
  approveSystemOnboardingApplication,
  approveSystemOnboardingApplicationDocument,
  closeSupportTicket,
  addOnboardingDeviceRequest,
  addOnboardingVehicle,
  createOnboardingApplication,
  deleteOnboardingDeviceRequest,
  deleteOnboardingVehicle,
  getOnboardingIndemnityAgreement,
  getOnboardingOrder,
  sendOnboardingBillingEmailVerification,
  setOnboardingBillingEmail,
  startOnboardingPayment,
  scheduleOnboardingInstallation,
  verifyOnboardingBillingEmail,
  getOnboardingM2mPlans,
  getOnboardingVehicleImportColumns,
  getOnboardingVehicleImportTemplate,
  importOnboardingVehicles,
  resumeOnboardingApplication,
  signOnboardingIndemnity,
  updateOnboardingVehicle,
  deleteOnboardingApplicationDocument,
  exportBundleAdoption,
  getBundleAdoption,
  getBundleCatalog,
  getCommunicationsWalletRates,
  getCommunicationsWalletSpendBreakdown,
  getCommunicationsWalletSpendTrend,
  getOnboardingApplication,
  getOnboardingApplicationStatus,
  getPlatformIntegrations,
  getSystemOnboardingApplication,
  getSystemOnboardingApplicationTimeline,
  markSystemOnboardingApplicationProvisioned,
  getSystemOnboardingApplications,
  rejectSystemOnboardingApplication,
  rejectSystemOnboardingApplicationDocument,
  reopenSupportTicket,
  replySupportTicket,
  requestChangesSystemOnboardingApplication,
  resendSystemOnboardingApplicationSetupLink,
  sendOnboardingApplicationEmailVerification,
  sendOnboardingApplicationPhoneVerification,
  submitOnboardingApplication,
  exportSystemAuditLog,
  getSystemAuditLog,
  getSystemAuditLogFilters,
  verifySystemAuditLog,
  getSystemOnboardingApplicationsSummary,
  getSystemTenantAuditLog,
  getSystemTenantDocuments,
  getSystemTenantResources,
  terminateSystemTenant,
  updateMailboxMessageFlags,
  updateOnboardingApplication,
  updatePlatformIntegration,
  updateSubscriptionPlanEntitlements,
  uploadOnboardingApplicationDocument,
  verifyOnboardingApplicationEmail,
  verifyOnboardingApplicationPhone,
} from './requests'
import type {
  AIRequestsQuery,
  AIUsageQuery,
  ActivityLogQuery,
  CommunicationChannel,
  DataBundleLedgerQuery,
  PlatformWalletLedgerQuery,
  PlatformWalletsQuery,
  MailboxAttachmentPayload,
  MailboxThreadsQuery,
  MailboxThreadsSinceQuery,
  SystemKycReviewQueueQuery,
  OrganizationUsersQuery,
  GetSimBatchPayload,
  SystemDeviceCatalogQuery,
  SystemDeviceSetupRequestsQuery,
  SystemDevicesQuery,
  SystemSimBatchesQuery,
  SystemSimRequestsQuery,
  SystemSimsQuery,
  SystemSupportTicketsQuery,
  SupportTicketContextPayload,
  SupportTicketsQuery,
  SystemTenantsQuery,
  DataBundleAnalyticsRangeQuery,
  DataBundleAllocationsQuery,
  AllocatableSimsQuery,
  DataBundleRatesQuery,
  DataBundleTransactionsQuery,
  SimDataBundlesQuery,
  SimsQuery,
  GetSimPayload,
  GetSimRequestPayload,
  SystemFailedLoginsQuery,
  SystemAuthEventsQuery,
  SystemBlockedIpsQuery,
  SystemSecurityEventsQuery,
  BundleCatalogQuery,
  CommunicationsWalletRangeQuery,
  CreateOnboardingApplicationResponse,
  OnboardingApplicationResponse,
  SystemAuditLogQuery,
  SystemOnboardingApplicationsQuery,
  SystemTenantResourcesPayload,
} from './types'

// Every type in ./types is public — no hand-maintained list to fall out of date.
export type * from './types'

// Value + type export: UserRole is a const object, so it must not be type-only.
export { DEVICE_CATALOG_PROTOCOLS, UserRole } from './types'

export const AUTH_QUERY_KEY = {
  me: ['me'],
  profile: ['profile'],
  notificationPreferences: ['notificationPreferences'],
  dispatchPreferences: ['dispatchPreferences'],

  organizationUsers: (payload?: OrganizationUsersQuery) =>
    payload ? ['organizationUsers', payload] : ['organizationUsers'],
  organizationSettings: ['organizationSettings'],

  activityLog: (payload?: ActivityLogQuery) => ['activityLog', payload],

  supportTickets: (payload?: SupportTicketsQuery) =>
    payload ? ['supportTickets', payload] : ['supportTickets'],
  supportTicket: (id: string) => ['supportTicket', id],
  supportTicketsSummary: ['supportTicketsSummary'],
  supportTicketOptions: ['supportTicketOptions'],
  supportTicketContext: (payload: SupportTicketContextPayload) =>
    ['supportTicketContext', payload],
  supportTicketsExport: (payload?: SupportTicketsQuery) =>
    payload ? ['supportTicketsExport', payload] : ['supportTicketsExport'],

  systemAdmins: ['systemAdmins'],
  systemAdminInvites: ['systemAdminInvites'],

  systemSecurityOverview: ['systemSecurityOverview'],
  systemFailedLogins: (payload?: SystemFailedLoginsQuery) =>
    payload ? ['systemFailedLogins', payload] : ['systemFailedLogins'],
  systemAuthEvents: (payload?: SystemAuthEventsQuery) =>
    payload ? ['systemAuthEvents', payload] : ['systemAuthEvents'],
  systemBlockedIps: (payload?: SystemBlockedIpsQuery) =>
    payload ? ['systemBlockedIps', payload] : ['systemBlockedIps'],
  systemAutoBlockRules: ['systemAutoBlockRules'] as const,
  systemSecurityEvents: (payload?: SystemSecurityEventsQuery) =>
    payload ? ['systemSecurityEvents', payload] : ['systemSecurityEvents'],

  systemTenants: (payload?: SystemTenantsQuery) =>
    payload ? ['systemTenants', payload] : ['systemTenants'],
  systemTenant: (id: string) => ['systemTenant', id],
  systemTenantsSummary: ['systemTenantsSummary'],

  systemDevices: (payload?: SystemDevicesQuery) =>
    payload ? ['systemDevices', payload] : ['systemDevices'],
  systemDevice: (id: string) => ['systemDevice', id],
  systemDevicesSummary: ['systemDevicesSummary'],
  systemDevicesCatalog: (payload?: SystemDeviceCatalogQuery) =>
    payload ? ['systemDevicesCatalog', payload] : ['systemDevicesCatalog'],

  systemSims: (payload?: SystemSimsQuery) => payload ? ['systemSims', payload] : ['systemSims'],
  systemSim: (id: string) => ['systemSim', id],
  systemSimsSummary: ['systemSimsSummary'],
  systemSimsRequests: (payload?: SystemSimRequestsQuery) =>
    payload ? ['systemSimsRequests', payload] : ['systemSimsRequests'],
  systemSimsRequestsSummary: ['systemSimsRequestsSummary'],
  systemSimsBatches: (payload?: SystemSimBatchesQuery) =>
    payload ? ['systemSimsBatches', payload] : ['systemSimsBatches'],
  systemSimsBatchesSummary: ['systemSimsBatchesSummary'] as const,
  systemSimBatch: (id: string) => ['systemSimBatch', id],

  systemFeatureFlags: ['systemFeatureFlags'],
  systemSettings: ['systemSettings'],
  aiGovernance: ['aiGovernance'],
  aiUsage: (payload?: AIUsageQuery) => payload?.params ? ['aiUsage', payload.params] : ['aiUsage'],
  aiRequests: (payload?: AIRequestsQuery) => payload?.params ? ['aiRequests', payload.params] : ['aiRequests'],
  twoFactor: ['twoFactor'],

  systemDashboard: ['systemDashboard'],
  systemHealth: ['systemHealth'],
  systemActivityLog: (payload?: ActivityLogQuery) =>
    payload ? ['systemActivityLog', payload] : ['systemActivityLog'],
  systemRefDataDeviceCatalog: ['systemRefDataDeviceCatalog'],
  systemRefDataTenantOnboarding: ['systemRefDataTenantOnboarding'],
  systemSubscriptionPlans: ['systemSubscriptionPlans'],
  subscriptionPlans: ['subscriptionPlans'],
  onboardingBusinessInfo: ['onboardingBusinessInfo'],
  onboardingKycDocuments: ['onboardingKycDocuments'],
  onboardingStatus: ['onboardingStatus'],
  onboardingPlans: ['onboardingPlans'],
  onboardingExchangeRate: ['onboardingExchangeRate'],
  onboardingSubscriptionCaps: ['onboardingSubscriptionCaps'],
  simDataBundles: (payload: SimDataBundlesQuery) => ['simDataBundles', payload],
  sims: (payload?: SimsQuery) => payload ? ['sims', payload] : ['sims'],
  sim: (id: string) => ['sim', id],
  simCarriers: ['simCarriers'],
  simRequests: ['simRequests'],
  simRequest: (id: string) => ['simRequest', id],
  dataBundleAllocations: (payload?: DataBundleAllocationsQuery) => ['dataBundleAllocations', payload],
  dataBundleAllocation: (id: string) => ['dataBundleAllocation', id],
  allocatableSims: (payload: AllocatableSimsQuery) => ['allocatableSims', payload],
  dataBundleTransactions: (payload?: DataBundleTransactionsQuery) => ['dataBundleTransactions', payload],
  dataBundleSpendTrend: (payload?: DataBundleAnalyticsRangeQuery) => ['dataBundleSpendTrend', payload],
  dataBundleSpendBreakdown: (payload?: DataBundleAnalyticsRangeQuery) => ['dataBundleSpendBreakdown', payload],
  dataBundleCarrierDistribution: (payload?: DataBundleAnalyticsRangeQuery) => ['dataBundleCarrierDistribution', payload],
  dataBundleSubscriptionUsage: ['dataBundleSubscriptionUsage'],
  dataBundleRates: (payload?: DataBundleRatesQuery) => ['dataBundleRates', payload],
  dataBundleCarriers: ['dataBundleCarriers'],
  dataBundleDashboardSummary: ['dataBundleDashboardSummary'],
  dataBundleWalletBalance: ['dataBundleWalletBalance'],
  dataBundleSpendingLimit: ['dataBundleSpendingLimit'],
  dataBundleAutoTopup: ['dataBundleAutoTopup'],

  systemSupportDashboard: ['systemSupportDashboard'],
  systemSupportTicketSummary: ['systemSupportTicketSummary'],
  systemEscalatedSupportTickets: ['systemEscalatedSupportTickets'],
  systemDeviceSetupRequests: (payload?: SystemDeviceSetupRequestsQuery) =>
    payload ? ['systemDeviceSetupRequests', payload] : ['systemDeviceSetupRequests'],
  systemDeviceSetupRequest: (id: string) => ['systemDeviceSetupRequest', id],
  systemDeviceSetupSummary: ['systemDeviceSetupSummary'],
  systemSupportTickets: (payload?: SystemSupportTicketsQuery) =>
    payload ? ['systemSupportTickets', payload] : ['systemSupportTickets'],
  systemSupportTicket: (id: string) => ['systemSupportTicket', id],
  systemSupportTicketMessages: (id: string) => ['systemSupportTicketMessages', id],

  authHealth: ['authHealth'],

  tenantStatus: ['tenantStatus'],
  activityLogVerify: ['activityLogVerify'],

  mailboxCredentials: ['mailboxCredentials'],
  mailboxThreads: (payload?: MailboxThreadsQuery) =>
    payload ? ['mailboxThreads', payload] : ['mailboxThreads'],
  mailboxThreadsSince: (payload: MailboxThreadsSinceQuery) => ['mailboxThreadsSince', payload],
  mailboxThread: (id: string) => ['mailboxThread', id],
  mailboxAttachment: ({ messageId, index }: MailboxAttachmentPayload) =>
    ['mailboxAttachment', messageId, index],

  platformAlertSettings: ['platformAlertSettings'],

  communicationRates: ['communicationRates'],
  communicationRateHistory: (channel: CommunicationChannel) => ['communicationRateHistory', channel],

  organisationUpgradeQueue: ['organisationUpgradeQueue'],

  systemKycReviewQueue: (payload?: SystemKycReviewQueueQuery) =>
    payload ? ['systemKycReviewQueue', payload] : ['systemKycReviewQueue'],

  dataBundleLedger: (payload?: DataBundleLedgerQuery) => ['dataBundleLedger', payload],

  platformWallets: (payload?: PlatformWalletsQuery) => ['platformWallets', payload],
  platformWalletLedger: (payload?: PlatformWalletLedgerQuery) => ['platformWalletLedger', payload],

  onboardingApplication: (id: string) => ['onboardingApplication', id],
  onboardingApplicationStatus: (id: string) => ['onboardingApplicationStatus', id],
  onboardingOrder: (id: string) => ['onboardingOrder', id],
  onboardingM2mPlans: ['onboardingM2mPlans'],
  onboardingIndemnityAgreement: ['onboardingIndemnityAgreement'],
  onboardingVehicleImportColumns: ['onboardingVehicleImportColumns'],

  systemOnboardingApplications: (payload?: SystemOnboardingApplicationsQuery) =>
    payload ? ['systemOnboardingApplications', payload] : ['systemOnboardingApplications'],
  systemOnboardingApplication: (id: string) => ['systemOnboardingApplication', id],
  systemOnboardingApplicationTimeline: (id: string) => ['systemOnboardingApplicationTimeline', id],

  platformIntegrations: ['platformIntegrations'],

  communicationsWalletRates: ['communicationsWalletRates'],
  communicationsWalletSpendTrend: (payload?: CommunicationsWalletRangeQuery) =>
    ['communicationsWalletSpendTrend', payload],
  communicationsWalletSpendBreakdown: (payload?: CommunicationsWalletRangeQuery) =>
    ['communicationsWalletSpendBreakdown', payload],

  bundleAdoption: ['bundleAdoption'],
  bundleCatalog: (payload?: BundleCatalogQuery) =>
    payload ? ['bundleCatalog', payload] : ['bundleCatalog'],

  systemAuditLog: (payload?: SystemAuditLogQuery) =>
    payload ? ['systemAuditLog', payload] : ['systemAuditLog'],
  systemAuditLogFilters: ['systemAuditLogFilters'],
  systemAuditLogVerify: ['systemAuditLogVerify'],

  systemTenantResources: (payload: SystemTenantResourcesPayload) =>
    ['systemTenantResources', payload],
  systemTenantDocuments: (id: string) => ['systemTenantDocuments', id],
  systemTenantAuditLog: (id: string) => ['systemTenantAuditLog', id],
  systemOnboardingApplicationsSummary: ['systemOnboardingApplicationsSummary'],
} as const

// Public auth/session

export function useRegister() {
  return useMutation({ mutationFn: register })
}

export function useLogin() {
  return useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      useAuthStore.getState().setSession(res.data)
    },
  })
}

export function useSystemLogin() {
  return useMutation({
    mutationFn: systemLogin,
    onSuccess: (res) => {
      useAuthStore.getState().setSession(res.data)
    },
  })
}

export function useRefresh() {
  return useMutation({ mutationFn: refresh })
}

export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPassword })
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword })
}

export function useCompleteProfile() {
  return useMutation({ mutationFn: completeProfile })
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: verifyEmail })
}

export function useVerifyReset() {
  return useMutation({ mutationFn: verifyReset })
}

export function useRegisterInvited() {
  return useMutation({ mutationFn: registerInvited })
}

export function useLogout() {
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      useAuthStore.getState().logout()
    },
  })
}

export function useUploadMedia() {
  return useMutation({ mutationFn: uploadMedia })
}

export { uploadMedia }

// Profile and preferences

export function getMeQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.me, queryFn: getMe })
}

export function getProfileQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.profile, queryFn: getProfile })
}

export function getNotificationPreferencesQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.notificationPreferences,
    queryFn: getNotificationPreferences,
  })
}

export function getDispatchPreferencesQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dispatchPreferences,
    queryFn: getDispatchPreferences,
  })
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.profile })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.me })
    },
  })
}

export function useUpdateNotificationPreferences() {
  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.notificationPreferences })
    },
  })
}

export function useUpdateDispatchPreferences() {
  return useMutation({
    mutationFn: updateDispatchPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.dispatchPreferences })
    },
  })
}

// Organization users/settings

export function getOrganizationUsersQueryOptions(payload?: OrganizationUsersQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.organizationUsers(payload),
    queryFn: () => getOrganizationUsers(payload),
  })
}

export function getOrganizationSettingsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.organizationSettings,
    queryFn: getOrganizationSettings,
  })
}

export function useInviteUser() {
  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.organizationUsers() })
    },
  })
}

export function useResendOrgInvite() {
  return useMutation({ mutationFn: resendOrgInvite })
}

export function useChangeRole() {
  return useMutation({
    mutationFn: changeRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.organizationUsers() })
    },
  })
}

export function useUpdateOrganizationUser() {
  return useMutation({
    mutationFn: updateOrganizationUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.organizationUsers() })
    },
  })
}

export function useDeleteOrganizationUser() {
  return useMutation({
    mutationFn: deleteOrganizationUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.organizationUsers() })
    },
  })
}

export function useUpdateOrganizationUserStatus() {
  return useMutation({
    mutationFn: updateOrganizationUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.organizationUsers() })
    },
  })
}

export function useUpdateOrganizationSettings() {
  return useMutation({
    mutationFn: updateOrganizationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.organizationSettings })
    },
  })
}

// Activity log

export function getActivityLogQueryOptions(payload?: ActivityLogQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.activityLog(payload),
    queryFn: () => getActivityLog(payload),
  })
}

export function getSystemActivityLogQueryOptions(payload?: ActivityLogQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemActivityLog(payload),
    queryFn: () => getSystemActivityLog(payload),
  })
}

// System admins and admin invites

export function getSystemAdminsQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.systemAdmins, queryFn: getSystemAdmins })
}

export function getSystemSecurityOverviewQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSecurityOverview,
    queryFn: getSystemSecurityOverview,
  })
}

export function getSystemFailedLoginsQueryOptions(payload?: SystemFailedLoginsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemFailedLogins(payload),
    queryFn: () => getSystemFailedLogins(payload),
  })
}

export function getSystemAuthEventsQueryOptions(payload?: SystemAuthEventsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemAuthEvents(payload),
    queryFn: () => getSystemAuthEvents(payload),
  })
}

export function getSystemBlockedIpsQueryOptions(payload?: SystemBlockedIpsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemBlockedIps(payload),
    queryFn: () => getSystemBlockedIps(payload),
  })
}

export function useBlockSystemIp() {
  return useMutation({
    mutationFn: blockSystemIp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemFailedLogins'] })
      queryClient.invalidateQueries({ queryKey: ['systemAuthEvents'] })
      queryClient.invalidateQueries({ queryKey: ['systemBlockedIps'] })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSecurityOverview })
    },
  })
}

export function useUnblockSystemIp() {
  return useMutation({
    mutationFn: unblockSystemIp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemBlockedIps'] })
      queryClient.invalidateQueries({ queryKey: ['systemFailedLogins'] })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSecurityOverview })
    },
  })
}

export function getSystemAutoBlockRulesQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemAutoBlockRules,
    queryFn: getSystemAutoBlockRules,
  })
}

export function useUpdateSystemAutoBlockRule() {
  return useMutation({
    mutationFn: updateSystemAutoBlockRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemAutoBlockRules })
    },
  })
}

export function getSystemSecurityEventsQueryOptions(payload?: SystemSecurityEventsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSecurityEvents(payload),
    queryFn: () => getSystemSecurityEvents(payload),
  })
}

export function getSystemAdminInvitesQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemAdminInvites,
    queryFn: getSystemAdminInvites,
  })
}

export function useCreateSystemAdmin() {
  return useMutation({
    mutationFn: createSystemAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemAdmins })
    },
  })
}

export function useUpdateSystemAdminStatus() {
  return useMutation({
    mutationFn: updateSystemAdminStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemAdmins })
    },
  })
}

export function useDeleteSystemAdmin() {
  return useMutation({
    mutationFn: deleteSystemAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemAdmins })
    },
  })
}

export function useSystemChangePassword() {
  return useMutation({ mutationFn: systemChangePassword })
}

export function useCreateSystemAdminInvite() {
  return useMutation({
    mutationFn: createSystemAdminInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemAdminInvites })
    },
  })
}

export function useDeleteSystemAdminInvite() {
  return useMutation({
    mutationFn: deleteSystemAdminInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemAdminInvites })
    },
  })
}

export function useResendSystemAdminInvite() {
  return useMutation({ mutationFn: resendSystemAdminInvite })
}

// System tenants

export function getSystemTenantsQueryOptions(payload?: SystemTenantsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemTenants(payload),
    queryFn: () => getSystemTenants(payload),
  })
}

export function getSystemTenantsSummaryQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemTenantsSummary,
    queryFn: getSystemTenantsSummary,
  })
}

export function getSystemTenantQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemTenant(id),
    queryFn: () => getSystemTenant({ id }),
  })
}

export function getSystemTenantsExportQueryOptions(payload?: SystemTenantsQuery) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.systemTenants(payload), 'export'],
    queryFn: () => exportSystemTenants(payload),
  })
}

export function useCreateTenant() {
  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemTenants() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemTenantsSummary })
    },
  })
}

export function useUpdateTenant() {
  return useMutation({
    mutationFn: updateTenant,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemTenants() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemTenant(id) })
    },
  })
}

export function useDeleteTenant() {
  return useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemTenants() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemTenantsSummary })
    },
  })
}

export function useUpdateTenantStatus() {
  return useMutation({
    mutationFn: updateTenantStatus,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemTenants() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemTenant(id) })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemTenantsSummary })
    },
  })
}

export function useResendTenantInvite() {
  return useMutation({ mutationFn: resendTenantInvite })
}

// System devices and device catalog

export function getSystemDevicesQueryOptions(payload?: SystemDevicesQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemDevices(payload),
    queryFn: () => getSystemDevices(payload),
  })
}

export function getSystemDeviceQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemDevice(id),
    queryFn: () => getSystemDevice({ id }),
  })
}

export function getSystemDevicesSummaryQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemDevicesSummary,
    queryFn: getSystemDevicesSummary,
  })
}

export function getSystemDevicesCatalogQueryOptions(payload?: SystemDeviceCatalogQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemDevicesCatalog(payload),
    queryFn: () => getSystemDevicesCatalog(payload),
  })
}

export function getSystemDevicesCatalogExportQueryOptions(payload?: SystemDeviceCatalogQuery) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.systemDevicesCatalog(payload), 'export'],
    queryFn: () => exportSystemDevicesCatalog(payload),
  })
}

export function getSystemDevicesExportQueryOptions(payload?: SystemDevicesQuery) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.systemDevices(payload), 'export'],
    queryFn: () => exportSystemDevices(payload),
  })
}

export function useCreateDeviceCatalogEntry() {
  return useMutation({
    mutationFn: createDeviceCatalogEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevicesCatalog() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevicesSummary })
    },
  })
}

export function useUpdateDeviceCatalogEntry() {
  return useMutation({
    mutationFn: updateDeviceCatalogEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevicesCatalog() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevicesSummary })
    },
  })
}

export function useDeleteDeviceCatalogEntry() {
  return useMutation({
    mutationFn: deleteDeviceCatalogEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevicesCatalog() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevices() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevicesSummary })
    },
  })
}

// TRU-FE-5 § 7 — Suspend and reinstate a device.
// Do NOT optimistically update on 503 — the change did not happen and can be retried.
export function useSuspendSystemDevice() {
  return useMutation({
    mutationFn: suspendSystemDevice,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevices() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevice(id) })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevicesSummary })
    },
  })
}

export function useReinstateSystemDevice() {
  return useMutation({
    mutationFn: reinstateSystemDevice,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevices() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevice(id) })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevicesSummary })
    },
  })
}

// System SIMs

export function getSystemSimsQueryOptions(payload?: SystemSimsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSims(payload),
    queryFn: () => getSystemSims(payload),
  })
}

export function getSystemSimQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSim(id),
    queryFn: () => getSystemSim({ id }),
  })
}

export function getSystemSimsSummaryQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSimsSummary,
    queryFn: getSystemSimsSummary,
  })
}

export function getSystemSimsRequestsQueryOptions(payload?: SystemSimRequestsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSimsRequests(payload),
    queryFn: () => getSystemSimsRequests(payload),
  })
}

export function getSystemSimsRequestsSummaryQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSimsRequestsSummary,
    queryFn: getSystemSimsRequestsSummary,
  })
}

export function getSystemSimsRequestsExportQueryOptions(payload?: SystemSimRequestsQuery) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.systemSimsRequests(payload), 'export'],
    queryFn: () => exportSystemSimsRequests(payload),
  })
}

export function getSystemSimsBatchesQueryOptions(payload?: SystemSimBatchesQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSimsBatches(payload),
    queryFn: () => getSystemSimsBatches(payload),
  })
}

export function getSystemSimsBatchesSummaryQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSimsBatchesSummary,
    queryFn: getSystemSimsBatchesSummary,
  })
}

export function getSystemSimBatchQueryOptions({ id }: GetSimBatchPayload) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSimBatch(id),
    queryFn: () => getSystemSimBatch({ id }),
  })
}

export function getSystemSimsBatchesExportQueryOptions(payload?: SystemSimBatchesQuery) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.systemSimsBatches(payload), 'export'],
    queryFn: () => exportSystemSimsBatches(payload),
  })
}

export function getSystemSimsExportQueryOptions(payload?: SystemSimsQuery) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.systemSims(payload), 'export'],
    queryFn: () => exportSystemSims(payload),
  })
}

export function useUpdateSystemSim() {
  return useMutation({
    mutationFn: updateSystemSim,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSims() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsSummary })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSim(id) })
    },
  })
}

export function useReassignSystemSim() {
  return useMutation({
    mutationFn: reassignSystemSim,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSims() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsSummary })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSim(id) })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevices() })
    },
  })
}

export function useSuspendSystemSim() {
  return useMutation({
    mutationFn: suspendSystemSim,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSims() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsSummary })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSim(id) })
    },
  })
}

export function useApproveSIMRequest() {
  return useMutation({
    mutationFn: approveSIMRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsRequests() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsRequestsSummary })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSims() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsSummary })
    },
  })
}

export function useRejectSIMRequest() {
  return useMutation({
    mutationFn: rejectSIMRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsRequests() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsRequestsSummary })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSims() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsSummary })
    },
  })
}

export function useRetrySimBatch() {
  return useMutation({
    mutationFn: retrySimBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsBatches() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsBatchesSummary })
    },
  })
}

// Feature flags and system settings

export function getSystemFeatureFlagsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemFeatureFlags,
    queryFn: getSystemFeatureFlags,
  })
}

export function getSystemSettingsQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.systemSettings, queryFn: getSystemSettings })
}

export function useUpdateFeatureFlag() {
  return useMutation({
    mutationFn: updateFeatureFlag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemFeatureFlags })
    },
  })
}

export function useUpdateSystemSettings() {
  return useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSettings })
    },
  })
}

// TRU-FE-7 § B — AI hooks.
export function getAIGovernanceQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.aiGovernance, queryFn: getAIGovernance })
}
export function useAIGovernance() {
  return useQuery(getAIGovernanceQueryOptions())
}
export function useUpdateAIGovernance() {
  return useMutation({
    mutationFn: updateAIGovernance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.aiGovernance })
    },
  })
}
export function getAIUsageQueryOptions(payload?: AIUsageQuery) {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.aiUsage(payload), queryFn: () => getAIUsage(payload) })
}
export function useAIUsage(payload?: AIUsageQuery) {
  return useQuery(getAIUsageQueryOptions(payload))
}
export function getAIRequestsQueryOptions(payload?: AIRequestsQuery) {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.aiRequests(payload), queryFn: () => getAIRequests(payload) })
}
export function useAIRequests(payload?: AIRequestsQuery) {
  return useQuery(getAIRequestsQueryOptions(payload))
}
export function useUpdateOpenRouterCredential() {
  return useMutation({ mutationFn: updateOpenRouterCredential })
}
export { exportAIRequests }

// TRU-FE-7 § D — per-account 2FA.
export function getTwoFactorQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.twoFactor, queryFn: getTwoFactor })
}
export function useTwoFactor() {
  return useQuery(getTwoFactorQueryOptions())
}
function invalidateTwoFactor() {
  queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.twoFactor })
}
export function useEnrolTwoFactor() {
  return useMutation({ mutationFn: enrolTwoFactor, onSuccess: invalidateTwoFactor })
}
export function useConfirmTwoFactor() {
  return useMutation({ mutationFn: confirmTwoFactor, onSuccess: invalidateTwoFactor })
}
export function useDisableTwoFactor() {
  return useMutation({ mutationFn: disableTwoFactor, onSuccess: invalidateTwoFactor })
}

// Dashboard, reference data, and subscription plans

export function getSystemDashboardQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.systemDashboard, queryFn: getSystemDashboard })
}

export function getSystemHealthQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.systemHealth, queryFn: getSystemHealth })
}

export function getSystemRefDataDeviceCatalogQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemRefDataDeviceCatalog,
    queryFn: getSystemRefDataDeviceCatalog,
  })
}

export function getSystemRefDataTenantOnboardingQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemRefDataTenantOnboarding,
    queryFn: getSystemRefDataTenantOnboarding,
  })
}

export function getSystemSubscriptionPlansQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSubscriptionPlans,
    queryFn: getSystemSubscriptionPlans,
  })
}

export function useUpdateSubscriptionPlanPrice() {
  return useMutation({
    mutationFn: updateSubscriptionPlanPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSubscriptionPlans })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.subscriptionPlans })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.onboardingPlans })
    },
  })
}

export function getSubscriptionPlansQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.subscriptionPlans, queryFn: getSubscriptionPlans })
}

export function getOnboardingPlansQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.onboardingPlans, queryFn: getOnboardingPlans })
}

export function getOnboardingExchangeRateQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.onboardingExchangeRate, queryFn: getOnboardingExchangeRate })
}

export function getOnboardingSubscriptionCapsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.onboardingSubscriptionCaps,
    queryFn: getOnboardingSubscriptionCaps,
  })
}

export function getOnboardingBusinessInfoQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.onboardingBusinessInfo,
    queryFn: getOnboardingBusinessInfo,
  })
}

export function getOnboardingKycDocumentsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.onboardingKycDocuments,
    queryFn: getOnboardingKycDocuments,
  })
}

export function getOnboardingStatusQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.onboardingStatus,
    queryFn: getOnboardingStatus,
  })
}

export function useUpdateOnboardingBusinessInfo() {
  return useMutation({
    mutationFn: updateOnboardingBusinessInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.onboardingBusinessInfo })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.onboardingStatus })
    },
  })
}

export function useUploadOnboardingKycDocument() {
  return useMutation({
    mutationFn: uploadOnboardingKycDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.onboardingKycDocuments })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.onboardingStatus })
    },
  })
}

export function useDeleteOnboardingKycDocument() {
  return useMutation({
    mutationFn: deleteOnboardingKycDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.onboardingKycDocuments })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.onboardingStatus })
    },
  })
}

export function useCreatePaymentIntent() {
  return useMutation({ mutationFn: createPaymentIntent })
}

export function useSubmitEnterpriseEnquiry() {
  return useMutation({ mutationFn: submitEnterpriseEnquiry })
}

export function useProvisionDevices() {
  return useMutation({ mutationFn: provisionDevices })
}

export function useRegisterSims() {
  return useMutation({ mutationFn: registerSims })
}

export function useImportSimsFromCsv() {
  return useMutation({ mutationFn: importSimsFromCsv })
}

export function useDownloadSimImportTemplate() {
  return useMutation({ mutationFn: downloadSimImportTemplate })
}

export function useImportSims() {
  return useMutation({
    mutationFn: importSims,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.sims() })
    },
  })
}

export function useDownloadSimRequestDeviceMappingTemplate() {
  return useMutation({ mutationFn: downloadSimRequestDeviceMappingTemplate })
}

export function useUploadSimRequestDeviceMapping() {
  return useMutation({ mutationFn: uploadSimRequestDeviceMapping })
}

export function useCreateSimRequest() {
  return useMutation({
    mutationFn: createSimRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.simRequests })
    },
  })
}

export function useCreateSim() {
  return useMutation({
    mutationFn: createSim,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.sims() })
    },
  })
}

export function getSimDataBundlesQueryOptions(payload: SimDataBundlesQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.simDataBundles(payload),
    queryFn: () => getSimDataBundles(payload),
  })
}

// ─── Tenant — SIMs ────────────────────────────────────────────────────────────

export function getSimsQueryOptions(payload?: SimsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.sims(payload),
    queryFn: () => getSims(payload),
  })
}

export function getSimQueryOptions({ id }: GetSimPayload) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.sim(id),
    queryFn: () => getSim({ id }),
  })
}

export function getSimCarriersQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.simCarriers,
    queryFn: getSimCarriers,
  })
}

export function getSimRequestsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.simRequests,
    queryFn: getSimRequests,
  })
}

export function getSimRequestQueryOptions({ id }: GetSimRequestPayload) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.simRequest(id),
    queryFn: () => getSimRequest({ id }),
  })
}

function invalidateSims(id?: string) {
  queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.sims() })
  if (id) queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.sim(id) })
}

export function useUpdateSim() {
  return useMutation({
    mutationFn: updateSim,
    onSuccess: (_, { id }) => invalidateSims(id),
  })
}

export function useDeleteSim() {
  return useMutation({
    mutationFn: deleteSim,
    onSuccess: () => invalidateSims(),
  })
}

export function useSuspendSim() {
  return useMutation({
    mutationFn: suspendSim,
    onSuccess: (_, { id }) => invalidateSims(id),
  })
}

export function useReactivateSim() {
  return useMutation({
    mutationFn: reactivateSim,
    onSuccess: (_, { id }) => invalidateSims(id),
  })
}

export function useUnassignSimDevice() {
  return useMutation({
    mutationFn: unassignSimDevice,
    onSuccess: (_, { id }) => invalidateSims(id),
  })
}

export { exportSims }

export function getDataBundleAllocationsQueryOptions(payload?: DataBundleAllocationsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dataBundleAllocations(payload),
    queryFn: () => getDataBundleAllocations(payload),
  })
}

export function getDataBundleTransactionsQueryOptions(payload?: DataBundleTransactionsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dataBundleTransactions(payload),
    queryFn: () => getDataBundleTransactions(payload),
  })
}

export function getDataBundleSpendTrendQueryOptions(payload?: DataBundleAnalyticsRangeQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dataBundleSpendTrend(payload),
    queryFn: () => getDataBundleSpendTrend(payload),
  })
}

export function getDataBundleSpendBreakdownQueryOptions(payload?: DataBundleAnalyticsRangeQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dataBundleSpendBreakdown(payload),
    queryFn: () => getDataBundleSpendBreakdown(payload),
  })
}

export function getDataBundleCarrierDistributionQueryOptions(payload?: DataBundleAnalyticsRangeQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dataBundleCarrierDistribution(payload),
    queryFn: () => getDataBundleCarrierDistribution(payload),
  })
}

export function getDataBundleSubscriptionUsageQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dataBundleSubscriptionUsage,
    queryFn: getDataBundleSubscriptionUsage,
  })
}

export function getDataBundleRatesQueryOptions(payload?: DataBundleRatesQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dataBundleRates(payload),
    queryFn: () => getDataBundleRates(payload),
  })
}

export function getDataBundleAllocationQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dataBundleAllocation(id),
    queryFn: () => getDataBundleAllocation({ id }),
    enabled: Boolean(id),
  })
}

export function getAllocatableSimsQueryOptions(payload: AllocatableSimsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.allocatableSims(payload),
    queryFn: () => getAllocatableSims(payload),
    enabled: Boolean(payload.params.carrierId),
  })
}

export function getDataBundleCarriersQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dataBundleCarriers,
    queryFn: getDataBundleCarriers,
  })
}

export function getDataBundleDashboardSummaryQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dataBundleDashboardSummary,
    queryFn: getDataBundleDashboardSummary,
  })
}

export function getDataBundleWalletBalanceQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dataBundleWalletBalance,
    queryFn: getDataBundleWalletBalance,
  })
}

export function getDataBundleSpendingLimitQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dataBundleSpendingLimit,
    queryFn: getDataBundleSpendingLimit,
  })
}

export function getDataBundleAutoTopupQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dataBundleAutoTopup,
    queryFn: getDataBundleAutoTopup,
  })
}

export function useDataBundleAllocation(id: string) {
  return useQuery(getDataBundleAllocationQueryOptions(id))
}

export function useAllocatableSims(payload: AllocatableSimsQuery) {
  return useQuery(getAllocatableSimsQueryOptions(payload))
}

export function useAllocateDataBundle() {
  return useMutation({
    mutationFn: allocateDataBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataBundleAllocations'] })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.dataBundleWalletBalance })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.dataBundleDashboardSummary })
    },
  })
}

export function useCreateSystemCarrier() {
  return useMutation({
    mutationFn: createSystemCarrier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.dataBundleCarriers })
    },
  })
}

export function useUpdateSystemCarrier() {
  return useMutation({
    mutationFn: updateSystemCarrier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.dataBundleCarriers })
    },
  })
}

export function useCreateSystemBundle() {
  return useMutation({
    mutationFn: createSystemBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataBundleRates'] })
    },
  })
}

export function useUpdateSystemBundle() {
  return useMutation({
    mutationFn: updateSystemBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataBundleRates'] })
    },
  })
}

export function useDeleteSystemBundle() {
  return useMutation({
    mutationFn: deleteSystemBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataBundleRates'] })
    },
  })
}

export {
  exportDataBundleAllocations,
  exportDataBundleRates,
  exportDataBundleTransactions,
}

export function useTopUpDataBundleWallet() {
  return useMutation({
    mutationFn: topUpDataBundleWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.dataBundleWalletBalance })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.dataBundleDashboardSummary })
    },
  })
}

export function useSaveDataBundleAutoTopup() {
  return useMutation({
    mutationFn: saveDataBundleAutoTopup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.dataBundleAutoTopup })
    },
  })
}

export function useDisableDataBundleAutoTopup() {
  return useMutation({
    mutationFn: disableDataBundleAutoTopup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.dataBundleAutoTopup })
    },
  })
}

export function useSaveDataBundleSpendingLimit() {
  return useMutation({
    mutationFn: saveDataBundleSpendingLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.dataBundleSpendingLimit })
    },
  })
}

export function useDisableDataBundleSpendingLimit() {
  return useMutation({
    mutationFn: disableDataBundleSpendingLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.dataBundleSpendingLimit })
    },
  })
}

export function useProvisionSims() {
  return useMutation({ mutationFn: provisionSims })
}

export function useUpdateOnboardingFeatures() {
  return useMutation({ mutationFn: updateOnboardingFeatures })
}

export function useCompleteOnboarding() {
  return useMutation({ mutationFn: completeOnboarding })
}

// Support tickets

export function getSupportTicketsQueryOptions(payload?: SupportTicketsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.supportTickets(payload),
    queryFn: () => getSupportTickets(payload),
  })
}

export function getSupportTicketQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.supportTicket(id),
    queryFn: () => getSupportTicket({ id }),
    enabled: !!id,
  })
}

export function useCreateSupportTicket() {
  return useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.supportTickets() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.supportTicketsSummary })
    },
  })
}

export function useAttachSupportTicketFiles() {
  return useMutation({ mutationFn: attachSupportTicketFiles })
}

export function getSupportTicketsSummaryQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.supportTicketsSummary,
    queryFn: getSupportTicketsSummary,
  })
}

export function getSupportTicketOptionsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.supportTicketOptions,
    queryFn: getSupportTicketOptions,
    staleTime: 60 * 60 * 1000, // options rarely change
  })
}

export function getSupportTicketContextQueryOptions(payload: SupportTicketContextPayload) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.supportTicketContext(payload),
    queryFn: () => getSupportTicketContext(payload),
    enabled: Boolean(payload.contextType && payload.contextId),
  })
}

export function getSupportTicketsExportQueryOptions(payload?: SupportTicketsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.supportTicketsExport(payload),
    queryFn: () => getSupportTicketsExport(payload),
    gcTime: 0,
    staleTime: 0,
  })
}

export function getSystemSupportDashboardQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSupportDashboard,
    queryFn: getSystemSupportDashboard,
  })
}

export function getSystemSupportTicketSummaryQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSupportTicketSummary,
    queryFn: getSystemSupportTicketSummary,
  })
}

export function getSystemEscalatedSupportTicketsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemEscalatedSupportTickets,
    queryFn: getSystemEscalatedSupportTickets,
  })
}

export function getSystemSupportTicketsQueryOptions(payload?: SystemSupportTicketsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSupportTickets(payload),
    queryFn: () => getSystemSupportTickets(payload),
  })
}

export function getSystemSupportTicketsExportQueryOptions(payload?: SystemSupportTicketsQuery) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.systemSupportTickets(payload), 'export'],
    queryFn: () => exportSystemSupportTickets(payload),
  })
}

export function getSystemDeviceSetupRequestsQueryOptions(payload?: SystemDeviceSetupRequestsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemDeviceSetupRequests(payload),
    queryFn: () => getSystemDeviceSetupRequests(payload),
  })
}

export function getSystemDeviceSetupRequestQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemDeviceSetupRequest(id),
    queryFn: () => getSystemDeviceSetupRequest({ id }),
  })
}

export function getSystemDeviceSetupRequestsExportQueryOptions(payload?: SystemDeviceSetupRequestsQuery) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.systemDeviceSetupRequests(payload), 'export'],
    queryFn: () => exportSystemDeviceSetupRequests(payload),
  })
}

// TRU-FE-5 § 3 — Approval Queue cards.
export function getSystemDeviceSetupSummaryQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemDeviceSetupSummary,
    queryFn: getSystemDeviceSetupSummary,
  })
}

export function useSystemDeviceSetupSummary() {
  return useQuery(getSystemDeviceSetupSummaryQueryOptions())
}

export function useAssignSystemDeviceSetupRequest() {
  return useMutation({
    mutationFn: assignSystemDeviceSetupRequest,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDeviceSetupRequests() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDeviceSetupRequest(id) })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDeviceSetupSummary })
    },
  })
}

// TRU-FE-5 § 4 — Approve.
export function useApproveSystemDeviceSetupRequest() {
  return useMutation({
    mutationFn: approveSystemDeviceSetupRequest,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDeviceSetupRequests() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDeviceSetupRequest(id) })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDeviceSetupSummary })
    },
  })
}

export function useRejectSystemDeviceSetupRequest() {
  return useMutation({
    mutationFn: rejectSystemDeviceSetupRequest,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDeviceSetupRequests() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDeviceSetupRequest(id) })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDeviceSetupSummary })
    },
  })
}

export function getSystemSupportTicketQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSupportTicket(id),
    queryFn: () => getSystemSupportTicket({ id }),
  })
}

export function getSupportTicketMessagesQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSupportTicketMessages(id),
    queryFn: () => getSupportTicketMessages({ id }),
  })
}

export function useUpdateSupportTicketStatus() {
  return useMutation({
    mutationFn: updateSupportTicketStatus,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportTickets() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportTicketSummary })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemEscalatedSupportTickets })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportTicket(id) })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportDashboard })
    },
  })
}

export function useEscalateSupportTicket() {
  return useMutation({
    mutationFn: escalateSupportTicket,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportTickets() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportTicketSummary })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemEscalatedSupportTickets })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportTicket(id) })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportDashboard })
    },
  })
}

export function useCreateSupportTicketMessage() {
  return useMutation({
    mutationFn: createSupportTicketMessage,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportTicketMessages(id) })
    },
  })
}

// Diagnostics and health

export function getAuthHealthQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.authHealth, queryFn: getAuthHealth })
}

// ─── Auth (additions) ─────────────────────────────────────────────────────────

export function getTenantStatusQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.tenantStatus, queryFn: getTenantStatus })
}

export function getActivityLogVerifyQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.activityLogVerify, queryFn: verifyActivityLog })
}

export function useResendVerification() {
  return useMutation({ mutationFn: resendVerification })
}

// ─── Mailbox ──────────────────────────────────────────────────────────────────

export function getMailboxCredentialsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.mailboxCredentials,
    queryFn: getMailboxCredentials,
  })
}

export function useSaveMailboxCredentials() {
  return useMutation({
    mutationFn: saveMailboxCredentials,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.mailboxCredentials })
    },
  })
}

export function useDeleteMailboxCredentials() {
  return useMutation({
    mutationFn: deleteMailboxCredentials,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.mailboxCredentials })
    },
  })
}

export function getMailboxThreadsQueryOptions(payload?: MailboxThreadsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.mailboxThreads(payload),
    queryFn: () => getMailboxThreads(payload),
  })
}

export function getMailboxThreadsSinceQueryOptions(payload: MailboxThreadsSinceQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.mailboxThreadsSince(payload),
    queryFn: () => getMailboxThreadsSince(payload),
  })
}

export function getMailboxThreadQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.mailboxThread(id),
    queryFn: () => getMailboxThread({ id }),
    enabled: Boolean(id),
  })
}

export function getMailboxAttachmentLinkQueryOptions(payload: MailboxAttachmentPayload) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.mailboxAttachment(payload),
    queryFn: () => getMailboxAttachmentLink(payload),
  })
}

export function useSendMailboxMessage() {
  return useMutation({
    mutationFn: sendMailboxMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailboxThreads'] })
    },
  })
}

// ─── Platform Alerts ──────────────────────────────────────────────────────────

export function getPlatformAlertSettingsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.platformAlertSettings,
    queryFn: getPlatformAlertSettings,
  })
}

export function useUpdatePlatformAlertSetting() {
  return useMutation({
    mutationFn: updatePlatformAlertSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.platformAlertSettings })
    },
  })
}

// ─── Communication Pricing ────────────────────────────────────────────────────

export function getCommunicationRatesQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.communicationRates,
    queryFn: getCommunicationRates,
  })
}

export function getCommunicationRateHistoryQueryOptions(channel: CommunicationChannel) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.communicationRateHistory(channel),
    queryFn: () => getCommunicationRateHistory({ channel }),
    enabled: Boolean(channel),
  })
}

export function useUpdateCommunicationRates() {
  return useMutation({
    mutationFn: updateCommunicationRates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.communicationRates })
      queryClient.invalidateQueries({ queryKey: ['communicationRateHistory'] })
    },
  })
}

// ─── Organisation Upgrades ────────────────────────────────────────────────────

export function getOrganisationUpgradeQueueQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.organisationUpgradeQueue,
    queryFn: getOrganisationUpgradeQueue,
  })
}

export function useRequestOrganisationUpgrade() {
  return useMutation({
    mutationFn: requestOrganisationUpgrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.organisationUpgradeQueue })
    },
  })
}

export function useApproveOrganisationUpgrade() {
  return useMutation({
    mutationFn: approveOrganisationUpgrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.organisationUpgradeQueue })
    },
  })
}

export function useRejectOrganisationUpgrade() {
  return useMutation({
    mutationFn: rejectOrganisationUpgrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.organisationUpgradeQueue })
    },
  })
}

// ─── System Support (assign) ──────────────────────────────────────────────────

export function useAssignSystemSupportTicket() {
  return useMutation({
    mutationFn: assignSystemSupportTicket,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportTickets() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportTicket(id) })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportTicketSummary })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportDashboard })
    },
  })
}

// ─── System KYC ───────────────────────────────────────────────────────────────

export function getSystemKycReviewQueueQueryOptions(payload?: SystemKycReviewQueueQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemKycReviewQueue(payload),
    queryFn: () => getSystemKycReviewQueue(payload),
  })
}

export function useApproveSystemKycDocument() {
  return useMutation({
    mutationFn: approveSystemKycDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemKycReviewQueue'] })
    },
  })
}

export function useRejectSystemKycDocument() {
  return useMutation({
    mutationFn: rejectSystemKycDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemKycReviewQueue'] })
    },
  })
}

// ─── Data Bundles (ledger) ────────────────────────────────────────────────────

export function getDataBundleWalletLedgerQueryOptions(payload?: DataBundleLedgerQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dataBundleLedger(payload),
    queryFn: () => getDataBundleWalletLedger(payload),
  })
}

// ─── Platform Wallets ─────────────────────────────────────────────────────────

export function getPlatformWalletsQueryOptions(payload?: PlatformWalletsQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.platformWallets(payload),
    queryFn: () => getPlatformWallets(payload),
  })
}

export function getPlatformWalletLedgerQueryOptions(payload?: PlatformWalletLedgerQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.platformWalletLedger(payload),
    queryFn: () => getPlatformWalletLedger(payload),
  })
}

export function usePlatformTopUpWallet() {
  return useMutation({
    mutationFn: platformTopUpWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformWallets'] })
      queryClient.invalidateQueries({ queryKey: ['platformWalletLedger'] })
    },
  })
}

export function useUpdatePlatformWalletCreditSettings() {
  return useMutation({
    mutationFn: updatePlatformWalletCreditSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformWallets'] })
    },
  })
}

// ─── Onboarding Applications (public) ────────────────────────────────────────

export {
  getOnboardingToken,
  setOnboardingToken,
  ONBOARDING_TOKEN_STORAGE_KEY,
} from '../lib/onboarding-instance'

export function useCreateOnboardingApplication() {
  return useMutation({
    mutationFn: createOnboardingApplication,
    onSuccess: (res: CreateOnboardingApplicationResponse) => {
      // Returned once and never again — keep it before anything else can fail.
      persistOnboardingToken(res.data.applicationToken)
      queryClient.setQueryData(AUTH_QUERY_KEY.onboardingApplication(res.data.id), res)
    },
  })
}

export function getOnboardingApplicationQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.onboardingApplication(id),
    queryFn: () => getOnboardingApplication({ id }),
    enabled: Boolean(id),
    // A 404 is a bad/expired token, not a blip — retrying only delays the reset.
    retry: false,
  })
}

export function getOnboardingApplicationStatusQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.onboardingApplicationStatus(id),
    queryFn: () => getOnboardingApplicationStatus({ id }),
    enabled: Boolean(id),
  })
}

export function getOnboardingM2mPlansQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.onboardingM2mPlans,
    queryFn: getOnboardingM2mPlans,
    staleTime: Infinity,
  })
}

export function getOnboardingIndemnityAgreementQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.onboardingIndemnityAgreement,
    queryFn: getOnboardingIndemnityAgreement,
  })
}

export function getOnboardingVehicleImportColumnsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.onboardingVehicleImportColumns,
    queryFn: getOnboardingVehicleImportColumns,
    staleTime: Infinity,
  })
}

export { getOnboardingVehicleImportTemplate }

// Every applicant mutation answers with the whole application — write it straight into the cache.
function writeOnboardingApplication(id: string, res: OnboardingApplicationResponse) {
  queryClient.setQueryData(AUTH_QUERY_KEY.onboardingApplication(id), res)
  queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.onboardingApplicationStatus(id) })
}

function applicationMutation<TVars extends { id: string }, TRes extends OnboardingApplicationResponse>(
  mutationFn: (vars: TVars) => Promise<TRes>,
) {
  return () => useMutation({
    mutationFn,
    onSuccess: (res, variables) => writeOnboardingApplication(variables.id, res),
  })
}

export const useUpdateOnboardingApplication = applicationMutation(updateOnboardingApplication)
export const useUploadOnboardingApplicationDocument = applicationMutation(uploadOnboardingApplicationDocument)
export const useDeleteOnboardingApplicationDocument = applicationMutation(deleteOnboardingApplicationDocument)
export const useVerifyOnboardingApplicationEmail = applicationMutation(verifyOnboardingApplicationEmail)
export const useVerifyOnboardingApplicationPhone = applicationMutation(verifyOnboardingApplicationPhone)
export const useAddOnboardingVehicle = applicationMutation(addOnboardingVehicle)
export const useUpdateOnboardingVehicle = applicationMutation(updateOnboardingVehicle)
export const useDeleteOnboardingVehicle = applicationMutation(deleteOnboardingVehicle)
export const useDeleteOnboardingDeviceRequest = applicationMutation(deleteOnboardingDeviceRequest)

/** A stock shortfall answers 201 without saving — only a saved request carries the application. */
export function useAddOnboardingDeviceRequest() {
  return useMutation({
    mutationFn: addOnboardingDeviceRequest,
    onSuccess: (res, variables) => {
      if ('requestSaved' in res.data)
        return
      writeOnboardingApplication(variables.id, { ...res, data: res.data })
    },
  })
}

// These two nest the application in their response rather than returning it flat.
export function useSignOnboardingIndemnity() {
  return useMutation({
    mutationFn: signOnboardingIndemnity,
    onSuccess: (res, variables) => writeOnboardingApplication(variables.id, { ...res, data: res.data.application }),
  })
}

export function useImportOnboardingVehicles() {
  return useMutation({
    mutationFn: importOnboardingVehicles,
    onSuccess: (res, variables) => writeOnboardingApplication(variables.id, { ...res, data: res.data.application }),
  })
}

export function useSendOnboardingApplicationEmailVerification() {
  return useMutation({ mutationFn: sendOnboardingApplicationEmailVerification })
}

export function useSendOnboardingApplicationPhoneVerification() {
  return useMutation({ mutationFn: sendOnboardingApplicationPhoneVerification })
}

export function getOnboardingOrderQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.onboardingOrder(id),
    queryFn: () => getOnboardingOrder({ id }),
    enabled: Boolean(id),
    retry: false,
  })
}

function invalidateOnboardingOrder(id: string) {
  queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.onboardingOrder(id) })
}

export function useSetOnboardingBillingEmail() {
  return useMutation({
    mutationFn: setOnboardingBillingEmail,
    onSuccess: (_res, variables) => invalidateOnboardingOrder(variables.id),
  })
}

export function useSendOnboardingBillingEmailVerification() {
  return useMutation({ mutationFn: sendOnboardingBillingEmailVerification })
}

export function useVerifyOnboardingBillingEmail() {
  return useMutation({
    mutationFn: verifyOnboardingBillingEmail,
    onSuccess: (res, variables) => {
      writeOnboardingApplication(variables.id, res)
      invalidateOnboardingOrder(variables.id)
    },
  })
}

export function useStartOnboardingPayment() {
  return useMutation({
    mutationFn: startOnboardingPayment,
    onSuccess: (_res, variables) => invalidateOnboardingOrder(variables.id),
  })
}

export function useScheduleOnboardingInstallation() {
  return useMutation({
    mutationFn: scheduleOnboardingInstallation,
    // The stage moves past installation_scheduling.
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.onboardingApplication(variables.id) })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.onboardingApplicationStatus(variables.id) })
    },
  })
}

export function useResumeOnboardingApplication() {
  return useMutation({ mutationFn: resumeOnboardingApplication })
}

export function useSubmitOnboardingApplication() {
  return useMutation({
    mutationFn: submitOnboardingApplication,
    onSuccess: (res, variables) => {
      if ('incomplete' in res)
        return
      writeOnboardingApplication(variables.id, res)
    },
  })
}

// ─── System Onboarding Applications (bearer) ─────────────────────────────────

export function getSystemOnboardingApplicationsQueryOptions(
  payload?: SystemOnboardingApplicationsQuery,
) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemOnboardingApplications(payload),
    queryFn: () => getSystemOnboardingApplications(payload),
  })
}

export function getSystemOnboardingApplicationQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemOnboardingApplication(id),
    queryFn: () => getSystemOnboardingApplication({ id }),
    enabled: Boolean(id),
    // Document download links expire after five minutes — never serve them from cache.
    staleTime: 0,
    gcTime: 0,
  })
}

export function getSystemOnboardingApplicationTimelineQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemOnboardingApplicationTimeline(id),
    queryFn: () => getSystemOnboardingApplicationTimeline({ id }),
    enabled: Boolean(id),
  })
}

function invalidateSystemOnboardingApplication(id: string) {
  queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemOnboardingApplication(id) })
  queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemOnboardingApplicationTimeline(id) })
  queryClient.invalidateQueries({ queryKey: ['systemOnboardingApplications'] })
  queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemOnboardingApplicationsSummary })
}

export function useApproveSystemOnboardingApplicationDocument() {
  return useMutation({
    mutationFn: approveSystemOnboardingApplicationDocument,
    onSuccess: (_res, variables) => invalidateSystemOnboardingApplication(variables.id),
  })
}

export function useRejectSystemOnboardingApplicationDocument() {
  return useMutation({
    mutationFn: rejectSystemOnboardingApplicationDocument,
    onSuccess: (_res, variables) => invalidateSystemOnboardingApplication(variables.id),
  })
}

export function useApproveSystemOnboardingApplication() {
  return useMutation({
    mutationFn: approveSystemOnboardingApplication,
    onSuccess: (_res, variables) => invalidateSystemOnboardingApplication(variables.id),
  })
}

export function useRejectSystemOnboardingApplication() {
  return useMutation({
    mutationFn: rejectSystemOnboardingApplication,
    onSuccess: (_res, variables) => invalidateSystemOnboardingApplication(variables.id),
  })
}

export function useRequestChangesSystemOnboardingApplication() {
  return useMutation({
    mutationFn: requestChangesSystemOnboardingApplication,
    onSuccess: (_res, variables) => invalidateSystemOnboardingApplication(variables.id),
  })
}

export function useResendSystemOnboardingApplicationSetupLink() {
  return useMutation({
    mutationFn: resendSystemOnboardingApplicationSetupLink,
    onSuccess: (_res, variables) => invalidateSystemOnboardingApplication(variables.id),
  })
}

export function useMarkSystemOnboardingApplicationProvisioned() {
  return useMutation({
    mutationFn: markSystemOnboardingApplicationProvisioned,
    onSuccess: (_res, variables) => invalidateSystemOnboardingApplication(variables.id),
  })
}

// ─── Platform Integrations ───────────────────────────────────────────────────

export function getPlatformIntegrationsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.platformIntegrations,
    queryFn: getPlatformIntegrations,
  })
}

export function useUpdatePlatformIntegration() {
  return useMutation({
    mutationFn: updatePlatformIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.platformIntegrations })
    },
  })
}

// ─── Communications Wallet ───────────────────────────────────────────────────

export function getCommunicationsWalletRatesQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.communicationsWalletRates,
    queryFn: getCommunicationsWalletRates,
  })
}

export function getCommunicationsWalletSpendTrendQueryOptions(
  payload?: CommunicationsWalletRangeQuery,
) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.communicationsWalletSpendTrend(payload),
    queryFn: () => getCommunicationsWalletSpendTrend(payload),
  })
}

export function getCommunicationsWalletSpendBreakdownQueryOptions(
  payload?: CommunicationsWalletRangeQuery,
) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.communicationsWalletSpendBreakdown(payload),
    queryFn: () => getCommunicationsWalletSpendBreakdown(payload),
  })
}

// ─── System Billing — bundle adoption + bundle catalog list ──────────────────

export function getBundleAdoptionQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.bundleAdoption,
    queryFn: getBundleAdoption,
  })
}

export function getBundleCatalogQueryOptions(payload?: BundleCatalogQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.bundleCatalog(payload),
    queryFn: () => getBundleCatalog(payload),
  })
}

export function useExportBundleAdoption() {
  return useMutation({ mutationFn: exportBundleAdoption })
}

// ─── Mailbox message flags ───────────────────────────────────────────────────

export function useUpdateMailboxMessageFlags() {
  return useMutation({
    mutationFn: updateMailboxMessageFlags,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailboxThreads'] })
      queryClient.invalidateQueries({ queryKey: ['mailboxThread'] })
    },
  })
}

// ─── Support Tickets (tenant) — reply / close / reopen ───────────────────────

function invalidateSupportTicket(id: string) {
  queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.supportTicket(id) })
  queryClient.invalidateQueries({ queryKey: ['supportTickets'] })
  queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.supportTicketsSummary })
}

export function useReplySupportTicket() {
  return useMutation({
    mutationFn: replySupportTicket,
    onSuccess: (_res, variables) => invalidateSupportTicket(variables.id),
  })
}

export function useCloseSupportTicket() {
  return useMutation({
    mutationFn: closeSupportTicket,
    onSuccess: (_res, variables) => invalidateSupportTicket(variables.id),
  })
}

export function useReopenSupportTicket() {
  return useMutation({
    mutationFn: reopenSupportTicket,
    onSuccess: (_res, variables) => invalidateSupportTicket(variables.id),
  })
}

// ─── System Subscription Plans — entitlements ────────────────────────────────

export function useUpdateSubscriptionPlanEntitlements() {
  return useMutation({
    mutationFn: updateSubscriptionPlanEntitlements,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSubscriptionPlans })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.subscriptionPlans })
    },
  })
}

// ─── System — cross-tenant audit log ─────────────────────────────────────────

export function getSystemAuditLogQueryOptions(payload?: SystemAuditLogQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemAuditLog(payload),
    queryFn: () => getSystemAuditLog(payload),
  })
}

export function getSystemAuditLogFiltersQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemAuditLogFilters,
    queryFn: getSystemAuditLogFilters,
  })
}

export function getSystemAuditLogVerifyQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemAuditLogVerify,
    queryFn: verifySystemAuditLog,
    // Reads whole hash chains — run on load and on the re-verify button only.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

export { exportSystemAuditLog }

// ─── System — tenant terminate / detail resource tabs / documents / audit ────

export function useTerminateSystemTenant() {
  return useMutation({
    mutationFn: terminateSystemTenant,
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemTenants() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemTenantsSummary })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemTenant(vars.id) })
    },
  })
}

export function getSystemTenantResourcesQueryOptions(payload: SystemTenantResourcesPayload) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemTenantResources(payload),
    queryFn: () => getSystemTenantResources(payload),
    enabled: Boolean(payload.id),
  })
}

export function getSystemTenantDocumentsQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemTenantDocuments(id),
    queryFn: () => getSystemTenantDocuments({ id }),
    enabled: Boolean(id),
  })
}

export function getSystemTenantAuditLogQueryOptions(id: string) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemTenantAuditLog(id),
    queryFn: () => getSystemTenantAuditLog({ id }),
    enabled: Boolean(id),
  })
}

export function getSystemOnboardingApplicationsSummaryQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemOnboardingApplicationsSummary,
    queryFn: getSystemOnboardingApplicationsSummary,
  })
}

