import { queryOptions, useMutation } from '@tanstack/react-query'

import { useAuthStore } from '../lib/auth-store'
import { queryClient } from '../lib/query-client'
import {
  approveSIMRequest,
  changeRole,
  completeProfile,
  createDeviceCatalogEntry,
  createSupportTicketMessage,
  createSystemAdmin,
  createSystemAdminInvite,
  createTenant,
  deleteDeviceCatalogEntry,
  deleteOrganizationUser,
  deleteSystemAdmin,
  deleteSystemAdminInvite,
  deleteTenant,
  escalateSupportTicket,
  exportSystemDevices,
  exportSystemSims,
  exportSystemTenants,
  forgotPassword,
  getActivityLog,
  getAuthHealth,
  getDispatchPreferences,
  getMe,
  getNotificationPreferences,
  getOrganizationSettings,
  getOrganizationUsers,
  getProfile,
  getSubscriptionPlans,
  getSupportTicketMessages,
  getSystemActivityLog,
  getSystemAdminInvites,
  getSystemAdmins,
  getSystemDashboard,
  getSystemDevice,
  getSystemDevices,
  getSystemDevicesCatalog,
  getSystemDevicesSummary,
  getSystemFeatureFlags,
  getSystemRefDataDeviceCatalog,
  getSystemRefDataTenantOnboarding,
  getSystemSettings,
  getSystemSims,
  getSystemSimsBatches,
  getSystemSimsRequests,
  getSystemSimsSummary,
  getSystemSubscriptionPlans,
  getSystemSupportDashboard,
  getSystemSupportTicket,
  getSystemSupportTickets,
  getSystemTenant,
  getSystemTenants,
  getSystemTenantsSummary,
  getTestSentry,
  inviteUser,
  login,
  logout,
  refresh,
  register,
  registerInvited,
  rejectSIMRequest,
  resendOrgInvite,
  resendSystemAdminInvite,
  resendTenantInvite,
  resetPassword,
  retrySimBatch,
  systemChangePassword,
  systemLogin,
  updateDeviceCatalogEntry,
  updateDispatchPreferences,
  updateFeatureFlag,
  updateNotificationPreferences,
  updateOrganizationSettings,
  updateOrganizationUser,
  updateOrganizationUserStatus,
  updateProfile,
  updateSupportTicketStatus,
  updateSystemAdminStatus,
  updateSystemSettings,
  updateTenant,
  updateTenantStatus,
  uploadMedia,
  verifyEmail,
  verifyReset,
} from './requests'
import type {
  ActivityLogQuery,
  SystemDeviceCatalogQuery,
  SystemDevicesQuery,
  SystemSimsQuery,
  SystemTenantsQuery,
} from './types'

export type {
  ActivityLog,
  ActivityLogQuery,
  AdminInvite,
  ApproveSIMRequestPayload,
  AuthSession,
  AuthUser,
  ChangeRolePayload,
  CompleteProfilePayload,
  CreateDeviceCatalogPayload,
  CreateSystemAdminInvitePayload,
  CreateSystemAdminPayload,
  CreateTenantPayload,
  CreateTicketMessagePayload,
  DeleteSystemAdminPayload,
  EscalateTicketPayload,
  ForgotPasswordPayload,
  InviteUserPayload,
  LoginPayload,
  LogoutPayload,
  RefreshPayload,
  RegisterInvitedPayload,
  RegisterPayload,
  RejectSIMRequestPayload,
  RemoveOrganizationUserData,
  ResendOrgInvitePayload,
  ResetPasswordPayload,
  RetrySimBatchPayload,
  SubscriptionPlan,
  SystemChangePasswordPayload,
  SystemDashboard,
  SystemDeviceCatalogModel,
  SystemDeviceCatalogQuery,
  SystemDeviceDetail,
  SystemDeviceDetailResponse,
  SystemDeviceInventoryItem,
  SystemDeviceInventoryList,
  SystemDevicesQuery,
  SystemDevicesSummary,
  SystemFeatureFlag,
  SystemFeatureFlagsList,
  SystemLoginPayload,
  SystemSimItem,
  SystemSimsList,
  SystemSimsQuery,
  SystemSimsSummary,
  SystemTenant,
  SystemTenantsQuery,
  SystemTenantsSummary,
  UpdateAdminStatusPayload,
  UpdateDeviceCatalogPayload,
  UpdateDispatchPrefsPayload,
  UpdateFeatureFlagPayload,
  UpdateNotifPrefsPayload,
  UpdateOrgSettingsPayload,
  UpdateOrgUserPayload,
  UpdateProfilePayload,
  UpdateSystemSettingsPayload,
  UpdateTenantPayload,
  UpdateTenantStatusPayload,
  UpdateTicketStatusPayload,
  UpdateUserStatusPayload,
  ValidateInviteQuery,
  VerifyEmailPayload,
  VerifyResetPayload,
} from './types'

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
  systemSimsSummary: ['systemSimsSummary'],
  systemSimsRequests: ['systemSimsRequests'],
  systemSimsBatches: ['systemSimsBatches'],

  systemFeatureFlags: ['systemFeatureFlags'],
  systemSettings: ['systemSettings'],

  systemDashboard: ['systemDashboard'],
  systemActivityLog: (payload?: ActivityLogQuery) =>
    payload ? ['systemActivityLog', payload] : ['systemActivityLog'],
  systemRefDataDeviceCatalog: ['systemRefDataDeviceCatalog'],
  systemRefDataTenantOnboarding: ['systemRefDataTenantOnboarding'],
  systemSubscriptionPlans: ['systemSubscriptionPlans'],
  subscriptionPlans: ['subscriptionPlans'],

  systemSupportDashboard: ['systemSupportDashboard'],
  systemSupportTickets: ['systemSupportTickets'],
  systemSupportTicket: (id: string) => ['systemSupportTicket', id],
  systemSupportTicketMessages: (id: string) => ['systemSupportTicketMessages', id],

  authHealth: ['authHealth'],
  testSentry: ['testSentry'],
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

export function getSystemSimsSummaryQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSimsSummary,
    queryFn: getSystemSimsSummary,
  })
}

export function getSystemSimsRequestsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSimsRequests,
    queryFn: getSystemSimsRequests,
  })
}

export function getSystemSimsBatchesQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSimsBatches,
    queryFn: getSystemSimsBatches,
  })
}

export function getSystemSimsExportQueryOptions(payload?: SystemSimsQuery) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.systemSims(payload), 'export'],
    queryFn: () => exportSystemSims(payload),
  })
}

export function useApproveSIMRequest() {
  return useMutation({
    mutationFn: approveSIMRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsRequests })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSims() })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsSummary })
    },
  })
}

export function useRejectSIMRequest() {
  return useMutation({
    mutationFn: rejectSIMRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsRequests })
    },
  })
}

export function useRetrySimBatch() {
  return useMutation({
    mutationFn: retrySimBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSimsBatches })
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

// Support tickets

export function getSystemSupportDashboardQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSupportDashboard,
    queryFn: getSystemSupportDashboard,
  })
}

export function getSystemSupportTicketsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemSupportTickets,
    queryFn: getSystemSupportTickets,
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
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportTickets })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportTicket(id) })
    },
  })
}

export function useEscalateSupportTicket() {
  return useMutation({
    mutationFn: escalateSupportTicket,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.systemSupportTickets })
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

export function getTestSentryQueryOptions() {
  return queryOptions({ queryKey: AUTH_QUERY_KEY.testSentry, queryFn: getTestSentry })
}
