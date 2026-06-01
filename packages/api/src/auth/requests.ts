import { axiosInstance } from '../lib/axios-instance'

import type {
  ActivityLogQuery,
  ApproveSIMRequestPayload,
  ChangeRolePayload,
  CompleteProfilePayload,
  CreateDeviceCatalogPayload,
  CreateSystemAdminInvitePayload,
  CreateSystemAdminPayload,
  CreateTenantPayload,
  CreateTicketMessagePayload,
  EscalateTicketPayload,
  ForgotPasswordPayload,
  InviteUserPayload,
  LoginPayload,
  LogoutPayload,
  RefreshPayload,
  RegisterPayload,
  RejectSIMRequestPayload,
  ResetPasswordPayload,
  RetrySimBatchPayload,
  SystemChangePasswordPayload,
  SystemLoginPayload,
  SystemTenantsQuery,
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

// ─── Public auth ─────────────────────────────────────────────────────────────

export async function register({ data }: RegisterPayload) {
  const { data: res } = await axiosInstance.post('/auth/register', data)
  return res
}

export async function login({ data }: LoginPayload) {
  const { data: res } = await axiosInstance.post('/auth/login', data)
  return res
}

export async function systemLogin({ data }: SystemLoginPayload) {
  const { data: res } = await axiosInstance.post('/auth/system/login', data)
  return res
}

export async function refresh({ data }: RefreshPayload) {
  const { data: res } = await axiosInstance.post('/auth/refresh', data)
  return res
}

export async function validateInvite({ params }: ValidateInviteQuery) {
  const { data } = await axiosInstance.get('/auth/invite/validate', { params })
  return data
}

export async function forgotPassword({ data }: ForgotPasswordPayload) {
  const { data: res } = await axiosInstance.post('/auth/forgot-password', data)
  return res
}

export async function resetPassword({ data }: ResetPasswordPayload) {
  const { data: res } = await axiosInstance.post('/auth/reset-password', data)
  return res
}

export async function completeProfile({ data }: CompleteProfilePayload) {
  const { data: res } = await axiosInstance.post('/auth/complete-profile', data)
  return res
}

export async function verifyEmail({ data }: VerifyEmailPayload) {
  const { data: res } = await axiosInstance.post('/auth/verify-email', data)
  return res
}

export async function verifyReset({ data }: VerifyResetPayload) {
  const { data: res } = await axiosInstance.post('/auth/verify-reset', data)
  return res
}

export async function registerInvited() {
  const { data } = await axiosInstance.post('/auth/register/invited')
  return data
}

export async function uploadMedia(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axiosInstance.post('/auth/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// ─── Protected — profile & preferences ───────────────────────────────────────

export async function getMe() {
  const { data } = await axiosInstance.get('/auth/me')
  return data
}

export async function getProfile() {
  const { data } = await axiosInstance.get('/auth/profile')
  return data
}

export async function updateProfile({ data }: UpdateProfilePayload) {
  const { data: res } = await axiosInstance.patch('/auth/profile', data)
  return res
}

export async function getNotificationPreferences() {
  const { data } = await axiosInstance.get('/auth/preferences/notifications')
  return data
}

export async function updateNotificationPreferences({ data }: UpdateNotifPrefsPayload) {
  const { data: res } = await axiosInstance.patch('/auth/preferences/notifications', data)
  return res
}

export async function getDispatchPreferences() {
  const { data } = await axiosInstance.get('/auth/preferences/dispatch')
  return data
}

export async function updateDispatchPreferences({ data }: UpdateDispatchPrefsPayload) {
  const { data: res } = await axiosInstance.patch('/auth/preferences/dispatch', data)
  return res
}

// ─── Protected — organization admin ───────────────────────────────────────────

export async function inviteUser({ data }: InviteUserPayload) {
  const { data: res } = await axiosInstance.post('/auth/invite', data)
  return res
}

export async function resendOrgInvite() {
  const { data } = await axiosInstance.post('/auth/organization/invites/resend')
  return data
}

export async function changeRole({ data }: ChangeRolePayload) {
  const { data: res } = await axiosInstance.post('/auth/change-role', data)
  return res
}

export async function logout({ data }: LogoutPayload) {
  const { data: res } = await axiosInstance.post('/auth/logout', data)
  return res
}

export async function getOrganizationUsers() {
  const { data } = await axiosInstance.get('/auth/organization/users')
  return data
}

export async function updateOrganizationUser({ id, data }: UpdateOrgUserPayload) {
  const { data: res } = await axiosInstance.patch(`/auth/organization/users/${id}`, data)
  return res
}

export async function deleteOrganizationUser({ id }: { id: string }) {
  await axiosInstance.delete(`/auth/organization/users/${id}`)
}

export async function updateOrganizationUserStatus({ id, data }: UpdateUserStatusPayload) {
  const { data: res } = await axiosInstance.patch(`/auth/organization/users/${id}/status`, data)
  return res
}

export async function getOrganizationSettings() {
  const { data } = await axiosInstance.get('/auth/organization/settings')
  return data
}

export async function updateOrganizationSettings({ data }: UpdateOrgSettingsPayload) {
  const { data: res } = await axiosInstance.patch('/auth/organization/settings', data)
  return res
}

// ─── Protected — activity log ─────────────────────────────────────────────────

export async function getActivityLog(payload?: ActivityLogQuery) {
  const { data } = await axiosInstance.get('/auth/activity-log', {
    params: payload?.params,
  })
  return data
}

// ─── System admin — admins & invites ─────────────────────────────────────────

export async function getSystemAdmins() {
  const { data } = await axiosInstance.get('/auth/system/admins')
  return data
}

export async function createSystemAdmin({ data }: CreateSystemAdminPayload) {
  const { data: res } = await axiosInstance.post('/auth/system/admins', data)
  return res
}

export async function updateSystemAdminStatus({ id, data }: UpdateAdminStatusPayload) {
  const { data: res } = await axiosInstance.patch(`/auth/system/admins/${id}/status`, data)
  return res
}

export async function systemChangePassword({ data }: SystemChangePasswordPayload) {
  const { data: res } = await axiosInstance.patch('/auth/system/change-password', data)
  return res
}

export async function getSystemAdminInvites() {
  const { data } = await axiosInstance.get('/auth/system/admin-invites')
  return data
}

export async function createSystemAdminInvite({ data }: CreateSystemAdminInvitePayload) {
  const { data: res } = await axiosInstance.post('/auth/system/admin-invites', data)
  return res
}

export async function deleteSystemAdminInvite({ id }: { id: string }) {
  await axiosInstance.delete(`/auth/system/admin-invites/${id}`)
}

export async function resendSystemAdminInvite({ id }: { id: string }) {
  const { data } = await axiosInstance.post(`/auth/system/admin-invites/${id}/resend`)
  return data
}

// ─── System admin — tenants ───────────────────────────────────────────────────

export async function getSystemTenants(payload?: SystemTenantsQuery) {
  const { data } = await axiosInstance.get('/auth/system/tenants', {
    params: payload?.params,
  })
  return data
}

export async function getSystemTenantsSummary() {
  const { data } = await axiosInstance.get('/auth/system/tenants/summary')
  return data
}

export async function exportSystemTenants() {
  const { data } = await axiosInstance.get('/auth/system/tenants/export', {
    responseType: 'blob',
  })
  return data
}

export async function createTenant({ data }: CreateTenantPayload) {
  const { data: res } = await axiosInstance.post('/auth/system/tenants', data)
  return res
}

export async function getSystemTenant({ id }: { id: string }) {
  const { data } = await axiosInstance.get(`/auth/system/tenants/${id}`)
  return data
}

export async function updateTenant({ id, data }: UpdateTenantPayload) {
  const { data: res } = await axiosInstance.patch(`/auth/system/tenants/${id}`, data)
  return res
}

export async function deleteTenant({ id }: { id: string }) {
  await axiosInstance.delete(`/auth/system/tenants/${id}`)
}

export async function updateTenantStatus({ id, data }: UpdateTenantStatusPayload) {
  const { data: res } = await axiosInstance.patch(`/auth/system/tenants/${id}/status`, data)
  return res
}

export async function resendTenantInvite({ id }: { id: string }) {
  const { data } = await axiosInstance.post(`/auth/system/tenants/${id}/invite/resend`)
  return data
}

// ─── System admin — devices ───────────────────────────────────────────────────

export async function getSystemDevices() {
  const { data } = await axiosInstance.get('/auth/system/devices')
  return data
}

export async function getSystemDevicesSummary() {
  const { data } = await axiosInstance.get('/auth/system/devices/summary')
  return data
}

export async function exportSystemDevices() {
  const { data } = await axiosInstance.get('/auth/system/devices/export', {
    responseType: 'blob',
  })
  return data
}

export async function getSystemDevicesCatalog() {
  const { data } = await axiosInstance.get('/auth/system/devices/catalog')
  return data
}

export async function createDeviceCatalogEntry({ data }: CreateDeviceCatalogPayload) {
  const { data: res } = await axiosInstance.post('/auth/system/devices/catalog', data)
  return res
}

export async function updateDeviceCatalogEntry({ id, data }: UpdateDeviceCatalogPayload) {
  const { data: res } = await axiosInstance.patch(`/auth/system/devices/catalog/${id}`, data)
  return res
}

export async function deleteDeviceCatalogEntry({ id }: { id: string }) {
  await axiosInstance.delete(`/auth/system/devices/catalog/${id}`)
}

// ─── System admin — SIMs ──────────────────────────────────────────────────────

export async function getSystemSims() {
  const { data } = await axiosInstance.get('/auth/system/sims')
  return data
}

export async function getSystemSimsSummary() {
  const { data } = await axiosInstance.get('/auth/system/sims/summary')
  return data
}

export async function exportSystemSims() {
  const { data } = await axiosInstance.get('/auth/system/sims/export', {
    responseType: 'blob',
  })
  return data
}

export async function getSystemSimsRequests() {
  const { data } = await axiosInstance.get('/auth/system/sims/requests')
  return data
}

export async function approveSIMRequest({ id }: ApproveSIMRequestPayload) {
  const { data } = await axiosInstance.patch(`/auth/system/sims/requests/${id}/approve`)
  return data
}

export async function rejectSIMRequest({ id, data }: RejectSIMRequestPayload) {
  const { data: res } = await axiosInstance.patch(`/auth/system/sims/requests/${id}/reject`, data)
  return res
}

export async function getSystemSimsBatches() {
  const { data } = await axiosInstance.get('/auth/system/sims/batches')
  return data
}

export async function retrySimBatch({ id }: RetrySimBatchPayload) {
  const { data } = await axiosInstance.post(`/auth/system/sims/batches/${id}/retry`)
  return data
}

// ─── System admin — feature flags ────────────────────────────────────────────

export async function getSystemFeatureFlags() {
  const { data } = await axiosInstance.get('/auth/system/feature-flags')
  return data
}

export async function updateFeatureFlag({ key, data }: UpdateFeatureFlagPayload) {
  const { data: res } = await axiosInstance.patch(`/auth/system/feature-flags/${key}`, data)
  return res
}

// ─── System admin — settings & dashboard ─────────────────────────────────────

export async function getSystemSettings() {
  const { data } = await axiosInstance.get('/auth/system/settings')
  return data
}

export async function updateSystemSettings({ data }: UpdateSystemSettingsPayload) {
  const { data: res } = await axiosInstance.patch('/auth/system/settings', data)
  return res
}

export async function getSystemDashboard() {
  const { data } = await axiosInstance.get('/auth/system/dashboard')
  return data
}

export async function getSystemActivityLog() {
  const { data } = await axiosInstance.get('/auth/system/activity-log')
  return data
}

// ─── System admin — reference data & plans ───────────────────────────────────

export async function getSystemRefDataDeviceCatalog() {
  const { data } = await axiosInstance.get('/auth/system/reference-data/device-catalog')
  return data
}

export async function getSystemRefDataTenantOnboarding() {
  const { data } = await axiosInstance.get('/auth/system/reference-data/tenant-onboarding')
  return data
}

export async function getSystemSubscriptionPlans() {
  const { data } = await axiosInstance.get('/auth/system/subscription-plans')
  return data
}

// ─── System admin — support tickets ──────────────────────────────────────────

export async function getSystemSupportDashboard() {
  const { data } = await axiosInstance.get('/auth/system/support/dashboard')
  return data
}

export async function getSystemSupportTickets() {
  const { data } = await axiosInstance.get('/auth/system/support/tickets')
  return data
}

export async function getSystemSupportTicket({ id }: { id: string }) {
  const { data } = await axiosInstance.get(`/auth/system/support/tickets/${id}`)
  return data
}

export async function updateSupportTicketStatus({ id, data }: UpdateTicketStatusPayload) {
  const { data: res } = await axiosInstance.patch(`/auth/system/support/tickets/${id}/status`, data)
  return res
}

export async function escalateSupportTicket({ id }: EscalateTicketPayload) {
  const { data } = await axiosInstance.patch(`/auth/system/support/tickets/${id}/escalate`)
  return data
}

export async function getSupportTicketMessages({ id }: { id: string }) {
  const { data } = await axiosInstance.get(`/auth/system/support/tickets/${id}/messages`)
  return data
}

export async function createSupportTicketMessage({ id, data }: CreateTicketMessagePayload) {
  const { data: res } = await axiosInstance.post(`/auth/system/support/tickets/${id}/messages`, data)
  return res
}
