import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

import { useAuthStore } from '../lib/auth-store'
import { queryClient } from '../lib/query-client'
import {
  assignSystemDeviceSetupRequest,
  approveSIMRequest,
  changeRole,
  completeProfile,
  createDeviceCatalogEntry,
  createSupportTicketMessage,
  createSystemAdmin,
  createSystemAdminInvite,
  createTenant,
  deleteOnboardingKycDocument,
  deleteDeviceCatalogEntry,
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
  updateSupportTicketStatus,
  updateSystemAdminStatus,
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
} from './requests'
import type {
  ActivityLogQuery,
  GetSimBatchPayload,
  SystemSimBatchesSummary,
  SystemDeviceCatalogQuery,
  SystemDeviceSetupRequestPayload,
  SystemDeviceSetupRequestsQuery,
  SystemDevicesQuery,
  SystemSimBatchesQuery,
  SystemSimRequestsQuery,
  SystemSimsQuery,
  SystemSupportTicketsQuery,
  SystemTenantsQuery,
  DataBundleAnalyticsRangeQuery,
  DataBundleAllocationsQuery,
  AllocatableSimsQuery,
  DataBundleRatesQuery,
  DataBundleTransactionsQuery,
  SimDataBundlesQuery,
  SimsQuery,
  GetSimPayload,
  UpdateSimPayload,
  DeleteSimPayload,
  SuspendSimPayload,
  ReactivateSimPayload,
  UnassignSimDevicePayload,
  GetSimRequestPayload,
} from './types'

// Every type in ./types is public — no hand-maintained list to fall out of date.
export type * from './types'

// Value + type export: UserRole is a const object, so it must not be type-only.
export { UserRole } from './types'

export const AUTH_QUERY_KEY = {
  me: ['me'],
  profile: ['profile'],
  notificationPreferences: ['notificationPreferences'],
  dispatchPreferences: ['dispatchPreferences'],

  organizationUsers: ['organizationUsers'],
  organizationSettings: ['organizationSettings'],

  activityLog: (payload?: ActivityLogQuery) => ['activityLog', payload],

  systemAdmins: ['systemAdmins'],
  systemAdminInvites: ['systemAdminInvites'],

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
  systemSupportTickets: (payload?: SystemSupportTicketsQuery) =>
    payload ? ['systemSupportTickets', payload] : ['systemSupportTickets'],
  systemSupportTicket: (id: string) => ['systemSupportTicket', id],
  systemSupportTicketMessages: (id: string) => ['systemSupportTicketMessages', id],

  authHealth: ['authHealth'],
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

export function getOrganizationUsersQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.organizationUsers,
    queryFn: getOrganizationUsers,
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
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.organizationUsers })
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
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.organizationUsers })
    },
  })
}

export function useUpdateOrganizationUser() {
  return useMutation({
    mutationFn: updateOrganizationUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.organizationUsers })
    },
  })
}

export function useDeleteOrganizationUser() {
  return useMutation({
    mutationFn: deleteOrganizationUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.organizationUsers })
    },
  })
}

export function useUpdateOrganizationUserStatus() {
  return useMutation({
    mutationFn: updateOrganizationUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.organizationUsers })
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
    },
  })
}

export function useUpdateDeviceCatalogEntry() {
  return useMutation({
    mutationFn: updateDeviceCatalogEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevicesCatalog() })
    },
  })
}

export function useDeleteDeviceCatalogEntry() {
  return useMutation({
    mutationFn: deleteDeviceCatalogEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevicesCatalog() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDevices() })
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

export function useAssignSystemDeviceSetupRequest() {
  return useMutation({
    mutationFn: assignSystemDeviceSetupRequest,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDeviceSetupRequests() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDeviceSetupRequest(id) })
    },
  })
}

export function useRejectSystemDeviceSetupRequest() {
  return useMutation({
    mutationFn: rejectSystemDeviceSetupRequest,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDeviceSetupRequests() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemDeviceSetupRequest(id) })
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

