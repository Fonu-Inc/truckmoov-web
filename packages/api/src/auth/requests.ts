import { axiosInstance } from '../lib/axios-instance'
import type { ServerResponse } from '../lib/types'

import type {
  ActivityLogQuery,
  ActivityLogResponse,
  ActivityLogVerifyResponse,
  ApproveSIMRequestPayload,
  AssignSystemSupportTicketPayload,
  CommunicationRateHistoryPayload,
  CommunicationRateHistoryResponse,
  CommunicationRatesResponse,
  DataBundleLedgerQuery,
  DataBundleLedgerResponse,
  MailboxAttachmentLinkResponse,
  MailboxAttachmentPayload,
  MailboxCredentialsResponse,
  MailboxThreadDetailResponse,
  MailboxThreadPayload,
  MailboxThreadsQuery,
  MailboxThreadsResponse,
  MailboxThreadsSinceQuery,
  OrganisationUpgradeQueueResponse,
  OrganisationUpgradeResponse,
  PlatformAlertSettingResponse,
  PlatformAlertSettingsResponse,
  RejectKycDocumentPayload,
  RequestUpgradePayload,
  ResendVerificationPayload,
  ReviewUpgradePayload,
  SaveMailCredentialsPayload,
  SendMailPayload,
  SendMailResponse,
  SystemKycReviewDocumentResponse,
  SystemKycReviewQueueQuery,
  SystemKycReviewQueueResponse,
  TenantStatusResponse,
  UpdateAlertSettingPayload,
  UpdateCommunicationRatesPayload,
  EnterpriseEnquiryPayload,
  PaymentIntentPayload,
  ProvisionDevicesPayload,
  RegisterSimsPayload,
  ProvisionSimsPayload,
  CreateSimRequestPayload,
  CreateSimPayload,
  SimsQuery,
  SimsListResponse,
  SimResponse,
  GetSimPayload,
  UpdateSimPayload,
  DeleteSimPayload,
  SuspendSimPayload,
  ReactivateSimPayload,
  UnassignSimDevicePayload,
  SimCarriersResponse,
  SimRequestsListResponse,
  SimRequestResponse,
  GetSimRequestPayload,
  DataBundleAllocationsListResponse,
  DataBundleAllocationsQuery,
  DataBundleAnalyticsRangeQuery,
  DataBundleAutoTopupResponse,
  DataBundleCarriersListResponse,
  DataBundleCarrierDistributionResponse,
  DataBundleDashboardSummaryResponse,
  DataBundleSpendBreakdownResponse,
  DataBundleSpendTrendResponse,
  DataBundleSpendingLimitResponse,
  DataBundleSubscriptionUsageResponse,
  DataBundleRatesListResponse,
  DataBundleRatesQuery,
  DataBundleTransactionsListResponse,
  DataBundleTransactionsQuery,
  DataBundleWalletTopupPayload,
  DataBundleWalletTopupResponse,
  DataBundleWalletBalanceResponse,
  DisableDataBundleAutoTopupResponse,
  DisableDataBundleSpendingLimitResponse,
  SaveDataBundleAutoTopupPayload,
  SaveDataBundleSpendingLimitPayload,
  SimDataBundlesQuery,
  SimRequestDeviceMappingUploadResponse,
  UpdateOnboardingFeaturesPayload,
  PaymentIntentResponse,
  AuthSystemSettingsResponse,
  AuthTokenResponse,
  ChangeRolePayload,
  CompleteProfilePayload,
  CreateDeviceCatalogPayload,
  CreateSystemAdminInvitePayload,
  CreateSystemAdminPayload,
  CreateTenantPayload,
  CreateTicketMessagePayload,
  DispatcherPreferencesResponse,
  DeleteSystemAdminPayload,
  EscalateTicketPayload,
  ForgotPasswordPayload,
  InviteActionResponse,
  InviteUserPayload,
  RegisterInvitedPayload,
  ResendOrgInvitePayload,
  SystemDeviceCatalogQuery,
  SystemDevicesQuery,
  SystemSimsQuery,
  LoginPayload,
  LogoutPayload,
  MeResponse,
  NotificationPreferencesResponse,
  OnboardingBusinessInfoResponse,
  OnboardingExchangeRateResponse,
  OnboardingKycDocumentsResponse,
  OnboardingPlansResponse,
  OnboardingStatusResponse,
  OnboardingSubscriptionCapsResponse,
  OrganizationSettingsResponse,
  OrganizationUserResponse,
  OrganizationUsersQuery,
  OrganizationUsersResponse,
  ProfileResponse,
  RefreshPayload,
  RegisterPayload,
  RejectSystemDeviceSetupRequestPayload,
  RejectSIMRequestPayload,
  RemoveOrganizationUserResponse,
  ResetPasswordPayload,
  RetrySimBatchPayload,
  AllocatableSimsQuery,
  AllocateDataBundlePayload,
  AuthHealthResponse,
  ChangeSystemPasswordResponse,
  CreateSimRequestResponse,
  CreateSystemBundlePayload,
  CreateSystemCarrierPayload,
  DataBundleAllocationDetail,
  DataBundleAllocationResult,
  DeleteSystemBundlePayload,
  GetDataBundleAllocationPayload,
  IdResponse,
  InviteValidationResponse,
  KycDocumentsResponse,
  MessageResponse,
  OnboardingCompleteResponse,
  OnboardingEnquiryResponse,
  OnboardingFeaturesResponse,
  OnboardingRequestIdResponse,
  OnboardingSimsRegisterResponse,
  SimActionResponse,
  SimDataBundlesResponse,
  SimImportResponse,
  SimRequestDeviceMappingProcessResponse,
  StandardApiResponse,
  SystemSimBatchRetryResult,
  SystemSimRequestActionResult,
  SystemSupportEscalatedResponse,
  SystemSupportTicketDetailResponse,
  SystemSupportTicketMessageResponse,
  SystemSupportTicketMessagesResponse,
  SystemSupportTicketStatusResponse,
  SystemSupportTicketsListResponse,
  UpdateSystemBundlePayload,
  UpdateSystemCarrierPayload,
  SystemAdminInviteCancelResponse,
  SystemAdminInviteResponse,
  SystemAdminInvitesResponse,
  SystemChangePasswordPayload,
  SystemDashboardResponse,
  SystemDeviceCatalogDeleteResponse,
  SystemDeviceCatalogListResponse,
  SystemDeviceCatalogModelResponse,
  SystemDeviceCatalogReferenceDataResponse,
  SystemDeviceDetailResponse,
  SystemDeviceInventoryListResponse,
  SystemDeviceSetupRequestPayload,
  SystemDeviceSetupRequestResponse,
  SystemDeviceSetupRequestsListResponse,
  SystemDeviceSetupRequestsQuery,
  SystemDeviceSummaryResponse,
  SystemFeatureFlagResponse,
  SystemFeatureFlagsResponse,
  SystemHealthResponse,
  SystemLoginPayload,
  SystemSupportDashboardResponse,
  SystemSupportTicketSummaryResponse,
  SystemSupportTicketsQuery,
  SystemSimBatchesQuery,
  SystemSimBatchesListResponse,
  SystemSimBatchResponse,
  SystemSimBatchesSummaryResponse,
  GetSimBatchPayload,
  SystemSimResponse,
  SystemSimRequestsQuery,
  SystemSimRequestsListResponse,
  SystemSimRequestsSummaryResponse,
  SystemSimSummaryResponse,
  SystemSimsListResponse,
  SystemSubscriptionPlansResponse,
  SystemTenantDeleteResponse,
  SystemTenantDetailResponse,
  SystemTenantInviteActionResponse,
  SystemTenantOnboardingReferenceDataResponse,
  SystemTenantOnboardingResponse,
  SystemTenantsListResponse,
  SystemTenantsSummaryResponse,
  SystemTenantsQuery,
  DeleteOnboardingKycDocumentPayload,
  UpdateAdminStatusPayload,
  UpdateDeviceCatalogPayload,
  UpdateDispatchPrefsPayload,
  UpdateFeatureFlagPayload,
  UpdateNotifPrefsPayload,
  UpdateOnboardingBusinessInfoPayload,
  UpdateOrgSettingsPayload,
  UpdateOrgUserPayload,
  UpdateProfilePayload,
  ReassignSystemSimPayload,
  SuspendSystemSimPayload,
  UpdateSystemSettingsPayload,
  UpdateSystemSimPayload,
  UpdateTenantPayload,
  UpdateTenantStatusPayload,
  UpdateTicketStatusPayload,
  UpdateUserStatusPayload,
  UploadedMediaResponse,
  UploadOnboardingKycDocumentPayload,
  ValidateInviteQuery,
  VerifyEmailPayload,
  VerifyResetPayload,
} from './types'

// ─── Public auth ─────────────────────────────────────────────────────────────

export async function register({ data }: RegisterPayload) {
  const { data: res } = await axiosInstance.post<AuthTokenResponse>('/auth/register', data)
  return res
}

export async function login({ data }: LoginPayload) {
  const { data: res } = await axiosInstance.post<AuthTokenResponse>('/auth/login', data)
  return res
}

export async function systemLogin({ data }: SystemLoginPayload) {
  const { data: res } = await axiosInstance.post<AuthTokenResponse>('/auth/system/login', data)
  return res
}

export async function refresh({ data }: RefreshPayload) {
  const { data: res } = await axiosInstance.post<AuthTokenResponse>('/auth/refresh', data)
  return res
}

export async function validateInvite({ params }: ValidateInviteQuery) {
  const { data } = await axiosInstance.get<InviteValidationResponse>('/auth/invite/validate', { params })
  return data
}

export async function forgotPassword({ data }: ForgotPasswordPayload) {
  const { data: res } = await axiosInstance.post<MessageResponse>('/auth/forgot-password', data)
  return res
}

export async function resetPassword({ data }: ResetPasswordPayload) {
  const { data: res } = await axiosInstance.post<MessageResponse>('/auth/reset-password', data)
  return res
}

export async function completeProfile({ data }: CompleteProfilePayload) {
  const { data: res } = await axiosInstance.post<ProfileResponse>('/auth/complete-profile', data)
  return res
}

export async function verifyEmail({ data }: VerifyEmailPayload) {
  const { data: res } = await axiosInstance.post<MessageResponse>('/auth/verify-email', data)
  return res
}

export async function verifyReset({ data }: VerifyResetPayload) {
  const { data: res } = await axiosInstance.post<MessageResponse>('/auth/verify-reset', data)
  return res
}

export async function registerInvited({ data }: RegisterInvitedPayload) {
  const { data: res } = await axiosInstance.post<AuthTokenResponse>('/auth/register/invited', data)
  return res
}

export async function getAuthHealth() {
  const { data } = await axiosInstance.get<AuthHealthResponse>('/auth/health')
  return data
}

export async function uploadMedia(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axiosInstance.post<UploadedMediaResponse>('/auth/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// ─── Protected — profile & preferences ───────────────────────────────────────

export async function getMe() {
  const { data } = await axiosInstance.get<MeResponse>('/auth/me')
  return data
}

export async function getProfile() {
  const { data } = await axiosInstance.get<ProfileResponse>('/auth/profile')
  return data
}

export async function updateProfile({ data }: UpdateProfilePayload) {
  const { data: res } = await axiosInstance.patch<ProfileResponse>('/auth/profile', data)
  return res
}

export async function getNotificationPreferences() {
  const { data } = await axiosInstance.get<NotificationPreferencesResponse>('/auth/profile/preferences/notifications')
  return data
}

export async function updateNotificationPreferences({ data }: UpdateNotifPrefsPayload) {
  const { data: res } = await axiosInstance.patch<NotificationPreferencesResponse>('/auth/profile/preferences/notifications', data)
  return res
}

export async function getDispatchPreferences() {
  const { data } = await axiosInstance.get<DispatcherPreferencesResponse>('/auth/profile/preferences/dispatch')
  return data
}

export async function updateDispatchPreferences({ data }: UpdateDispatchPrefsPayload) {
  const { data: res } = await axiosInstance.patch<DispatcherPreferencesResponse>('/auth/profile/preferences/dispatch', data)
  return res
}

// ─── Protected — organization admin ───────────────────────────────────────────

export async function inviteUser({ data }: InviteUserPayload) {
  const { data: res } = await axiosInstance.post<OrganizationUserResponse>('/auth/invite', data)
  return res
}

export async function resendOrgInvite({ data }: ResendOrgInvitePayload) {
  const { data: res } = await axiosInstance.post<InviteActionResponse>('/auth/organization/invites/resend', data)
  return res
}

export async function changeRole({ data }: ChangeRolePayload) {
  const { data: res } = await axiosInstance.post<OrganizationUserResponse>('/auth/change-role', data)
  return res
}

export async function logout({ data }: LogoutPayload) {
  const { data: res } = await axiosInstance.post<MessageResponse>('/auth/logout', data)
  return res
}

export async function getOrganizationUsers(payload?: OrganizationUsersQuery) {
  const { data } = await axiosInstance.get<OrganizationUsersResponse>('/auth/organization/users', {
    params: payload?.params,
  })
  return data
}

export async function updateOrganizationUser({ id, data }: UpdateOrgUserPayload) {
  const { data: res } = await axiosInstance.patch<OrganizationUserResponse>(`/auth/organization/users/${id}`, data)
  return res
}

export async function deleteOrganizationUser({ id }: { id: string }) {
  const { data } = await axiosInstance.delete<RemoveOrganizationUserResponse>(`/auth/organization/users/${id}`)
  return data
}

export async function updateOrganizationUserStatus({ id, data }: UpdateUserStatusPayload) {
  const { data: res } = await axiosInstance.patch<OrganizationUserResponse>(`/auth/organization/users/${id}/status`, data)
  return res
}

export async function getOrganizationSettings() {
  const { data } = await axiosInstance.get<OrganizationSettingsResponse>('/auth/organization/settings')
  return data
}

export async function updateOrganizationSettings({ data }: UpdateOrgSettingsPayload) {
  const { data: res } = await axiosInstance.patch<OrganizationSettingsResponse>('/auth/organization/settings', data)
  return res
}

// ─── Protected — activity log ─────────────────────────────────────────────────

export async function getActivityLog(payload?: ActivityLogQuery) {
  const { data } = await axiosInstance.get<ActivityLogResponse>('/auth/activity-log', {
    params: payload?.params,
  })
  return data
}

// ─── System admin — admins & invites ─────────────────────────────────────────

export async function getSystemAdmins() {
  const { data } = await axiosInstance.get<OrganizationUsersResponse>('/auth/system/admins')
  return data
}

export async function createSystemAdmin({ data }: CreateSystemAdminPayload) {
  const { data: res } = await axiosInstance.post<OrganizationUserResponse>('/auth/system/admins', data)
  return res
}

export async function updateSystemAdminStatus({ id, data }: UpdateAdminStatusPayload) {
  const { data: res } = await axiosInstance.patch<OrganizationUserResponse>(`/auth/system/admins/${id}/status`, data)
  return res
}

export async function deleteSystemAdmin({ id }: DeleteSystemAdminPayload) {
  const { data } = await axiosInstance.delete<RemoveOrganizationUserResponse>(`/auth/system/admins/${id}`)
  return data
}

export async function systemChangePassword({ data }: SystemChangePasswordPayload) {
  const { data: res } = await axiosInstance.patch<ChangeSystemPasswordResponse>('/auth/system/change-password', data)
  return res
}

export async function getSystemAdminInvites() {
  const { data } = await axiosInstance.get<SystemAdminInvitesResponse>('/auth/system/admin-invites')
  return data
}

export async function createSystemAdminInvite({ data }: CreateSystemAdminInvitePayload) {
  const { data: res } = await axiosInstance.post<SystemAdminInviteResponse>('/auth/system/admin-invites', data)
  return res
}

export async function deleteSystemAdminInvite({ id }: { id: string }) {
  await axiosInstance.delete<SystemAdminInviteCancelResponse>(`/auth/system/admin-invites/${id}`)
}

export async function resendSystemAdminInvite({ id }: { id: string }) {
  const { data } = await axiosInstance.post<SystemAdminInviteResponse>(`/auth/system/admin-invites/${id}/resend`)
  return data
}

// ─── System admin — tenants ───────────────────────────────────────────────────

export async function getSystemTenants(payload?: SystemTenantsQuery) {
  const { data } = await axiosInstance.get<SystemTenantsListResponse>('/auth/system/tenants', {
    params: payload?.params,
  })
  return data
}

export async function getSystemTenantsSummary() {
  const { data } = await axiosInstance.get<SystemTenantsSummaryResponse>('/auth/system/tenants/summary')
  return data
}

export async function exportSystemTenants(payload?: SystemTenantsQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/system/tenants/export', {
    responseType: 'blob',
    params: payload?.params,
  })
  return data
}

export async function createTenant({ data }: CreateTenantPayload) {
  const { data: res } = await axiosInstance.post<SystemTenantOnboardingResponse>('/auth/system/tenants', data)
  return res
}

export async function getSystemTenant({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SystemTenantDetailResponse>(`/auth/system/tenants/${id}`)
  return data
}

export async function updateTenant({ id, data }: UpdateTenantPayload) {
  const { data: res } = await axiosInstance.patch<SystemTenantDetailResponse>(`/auth/system/tenants/${id}`, data)
  return res
}

export async function deleteTenant({ id }: { id: string }) {
  await axiosInstance.delete<SystemTenantDeleteResponse>(`/auth/system/tenants/${id}`)
}

export async function updateTenantStatus({ id, data }: UpdateTenantStatusPayload) {
  const { data: res } = await axiosInstance.patch<SystemTenantDetailResponse>(`/auth/system/tenants/${id}/status`, data)
  return res
}

export async function resendTenantInvite({ id }: { id: string }) {
  const { data } = await axiosInstance.post<SystemTenantInviteActionResponse>(`/auth/system/tenants/${id}/invite/resend`)
  return data
}

// ─── System admin — devices ───────────────────────────────────────────────────

export async function getSystemDevices(payload?: SystemDevicesQuery) {
  const { data } = await axiosInstance.get<SystemDeviceInventoryListResponse>('/auth/system/devices', {
    params: payload?.params,
  })
  return data
}

export async function getSystemDevicesSummary() {
  const { data } = await axiosInstance.get<SystemDeviceSummaryResponse>('/auth/system/devices/summary')
  return data
}

export async function getSystemDevice({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SystemDeviceDetailResponse>(`/auth/system/devices/${id}`)
  return data
}

export async function exportSystemDevices(payload?: SystemDevicesQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/system/devices/export', {
    responseType: 'blob',
    params: payload?.params,
  })
  return data
}

export async function getSystemDevicesCatalog(payload?: SystemDeviceCatalogQuery) {
  const { data } = await axiosInstance.get<SystemDeviceCatalogListResponse>('/auth/system/devices/catalog', {
    params: payload?.params,
  })
  return data
}

export async function exportSystemDevicesCatalog(payload?: SystemDeviceCatalogQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/system/devices/catalog/export', {
    responseType: 'blob',
    params: payload?.params,
  })
  return data
}

export async function createDeviceCatalogEntry({ data }: CreateDeviceCatalogPayload) {
  const { data: res } = await axiosInstance.post<SystemDeviceCatalogModelResponse>('/auth/system/devices/catalog', data)
  return res
}

export async function updateDeviceCatalogEntry({ id, data }: UpdateDeviceCatalogPayload) {
  const { data: res } = await axiosInstance.patch<SystemDeviceCatalogModelResponse>(`/auth/system/devices/catalog/${id}`, data)
  return res
}

export async function deleteDeviceCatalogEntry({ id }: { id: string }) {
  await axiosInstance.delete<SystemDeviceCatalogDeleteResponse>(`/auth/system/devices/catalog/${id}`)
}

// ─── System admin — SIMs ──────────────────────────────────────────────────────

export async function getSystemSims(payload?: SystemSimsQuery) {
  const { data } = await axiosInstance.get<SystemSimsListResponse>('/auth/system/sims', {
    params: payload?.params,
  })
  return data
}

export async function getSystemSim({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SystemSimResponse>(`/auth/system/sims/${id}`)
  return data
}

export async function updateSystemSim({ id, data: body }: UpdateSystemSimPayload) {
  const { data } = await axiosInstance.patch<SystemSimResponse>(`/auth/system/sims/${id}`, body)
  return data
}

export async function reassignSystemSim({ id, data: body }: ReassignSystemSimPayload) {
  const { data } = await axiosInstance.patch<SystemSimResponse>(`/auth/system/sims/${id}/reassign`, body)
  return data
}

export async function suspendSystemSim({ id, data: body }: SuspendSystemSimPayload) {
  const { data } = await axiosInstance.patch<SystemSimResponse>(`/auth/system/sims/${id}/suspend`, body)
  return data
}

export async function getSystemSimsSummary() {
  const { data } = await axiosInstance.get<SystemSimSummaryResponse>('/auth/system/sims/summary')
  return data
}

export async function exportSystemSims(payload?: SystemSimsQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/system/sims/export', {
    responseType: 'blob',
    params: payload?.params,
  })
  return data
}

export async function getSystemSimsRequests(payload?: SystemSimRequestsQuery) {
  const { data } = await axiosInstance.get<SystemSimRequestsListResponse>('/auth/system/sims/requests', {
    params: payload?.params,
  })
  return data
}

export async function getSystemSimsRequestsSummary() {
  const { data } = await axiosInstance.get<SystemSimRequestsSummaryResponse>('/auth/system/sims/requests/summary')
  return data
}

export async function exportSystemSimsRequests(payload?: SystemSimRequestsQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/system/sims/requests/export', {
    responseType: 'blob',
    params: payload?.params,
  })
  return data
}

export async function approveSIMRequest({ id }: ApproveSIMRequestPayload) {
  const { data } = await axiosInstance.post<ServerResponse<SystemSimRequestActionResult>>(
    `/auth/system/sims/requests/${id}/approve`,
  )
  return data
}

export async function rejectSIMRequest({ id, data }: RejectSIMRequestPayload) {
  const { data: res } = await axiosInstance.post<ServerResponse<SystemSimRequestActionResult>>(
    `/auth/system/sims/requests/${id}/reject`,
    data,
  )
  return res
}

export async function getSystemSimsBatches(payload?: SystemSimBatchesQuery) {
  const { data } = await axiosInstance.get<SystemSimBatchesListResponse>('/auth/system/sims/batches', {
    params: payload?.params,
  })
  return data
}

export async function getSystemSimsBatchesSummary() {
  const { data } = await axiosInstance.get<SystemSimBatchesSummaryResponse>('/auth/system/sims/batches/summary')
  return data
}

export async function exportSystemSimsBatches(payload?: SystemSimBatchesQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/system/sims/batches/export', {
    responseType: 'blob',
    params: payload?.params,
  })
  return data
}

export async function getSystemSimBatch({ id }: GetSimBatchPayload) {
  const { data } = await axiosInstance.get<SystemSimBatchResponse>(`/auth/system/sims/batches/${id}`)
  return data
}

export async function retrySimBatch({ id }: RetrySimBatchPayload) {
  const { data } = await axiosInstance.post<ServerResponse<SystemSimBatchRetryResult>>(
    `/auth/system/sims/batches/${id}/retry`,
  )
  return data
}

// ─── System admin — feature flags ────────────────────────────────────────────

export async function getSystemFeatureFlags() {
  const { data } = await axiosInstance.get<SystemFeatureFlagsResponse>('/auth/system/feature-flags')
  return data
}

export async function updateFeatureFlag({ key, data }: UpdateFeatureFlagPayload) {
  const { data: res } = await axiosInstance.patch<SystemFeatureFlagResponse>(`/auth/system/feature-flags/${key}`, data)
  return res
}

// ─── System admin — settings & dashboard ─────────────────────────────────────

export async function getSystemSettings() {
  const { data } = await axiosInstance.get<AuthSystemSettingsResponse>('/auth/system/settings')
  return data
}

export async function updateSystemSettings({ data }: UpdateSystemSettingsPayload) {
  const { data: res } = await axiosInstance.patch<AuthSystemSettingsResponse>('/auth/system/settings', data)
  return res
}

export async function getSystemDashboard() {
  const { data } = await axiosInstance.get<SystemDashboardResponse>('/auth/system/dashboard')
  return data
}

export async function getSystemHealth() {
  const { data } = await axiosInstance.get<SystemHealthResponse>('/auth/system/health')
  return data
}

export async function getSystemActivityLog(payload?: ActivityLogQuery) {
  const { data } = await axiosInstance.get<ActivityLogResponse>('/auth/system/activity-log', {
    params: payload?.params,
  })
  return data
}

// ─── System admin — reference data & plans ───────────────────────────────────

export async function getSystemRefDataDeviceCatalog() {
  const { data } = await axiosInstance.get<SystemDeviceCatalogReferenceDataResponse>('/auth/system/reference-data/device-catalog')
  return data
}

export async function getSystemRefDataTenantOnboarding() {
  const { data } = await axiosInstance.get<SystemTenantOnboardingReferenceDataResponse>('/auth/system/reference-data/tenant-onboarding')
  return data
}

export async function getSystemSubscriptionPlans() {
  const { data } = await axiosInstance.get<SystemSubscriptionPlansResponse>('/auth/system/subscription-plans')
  return data
}

// ponytail: /auth/subscription-plans is not in the spec — use
// getSystemSubscriptionPlans (system console) or getOnboardingPlans (public).
export async function getSubscriptionPlans() {
  const { data } = await axiosInstance.get<SystemSubscriptionPlansResponse>('/auth/system/subscription-plans')
  return data
}

export async function getOnboardingPlans() {
  const { data } = await axiosInstance.get<OnboardingPlansResponse>('/auth/onboarding/plans')
  return data
}

export async function getOnboardingExchangeRate() {
  const { data } = await axiosInstance.get<OnboardingExchangeRateResponse>('/auth/onboarding/exchange-rate')
  return data
}

export async function getOnboardingSubscriptionCaps() {
  const { data } = await axiosInstance.get<OnboardingSubscriptionCapsResponse>('/auth/onboarding/subscription/caps')
  return data
}

export async function getOnboardingStatus() {
  const { data } = await axiosInstance.get<OnboardingStatusResponse>('/auth/onboarding/status')
  return data
}

export async function createPaymentIntent({ data }: PaymentIntentPayload) {
  const { data: res } = await axiosInstance.post<PaymentIntentResponse>('/auth/onboarding/payment/intent', data)
  return res
}

export async function submitEnterpriseEnquiry({ data }: EnterpriseEnquiryPayload) {
  const { data: res } = await axiosInstance.post<OnboardingEnquiryResponse>('/auth/onboarding/enterprise/enquiry', data)
  return res
}

export async function getOnboardingBusinessInfo() {
  const { data } = await axiosInstance.get<OnboardingBusinessInfoResponse>('/auth/onboarding/business-info')
  return data
}

export async function updateOnboardingBusinessInfo({ data: body }: UpdateOnboardingBusinessInfoPayload) {
  const { data } = await axiosInstance.put<OnboardingBusinessInfoResponse>('/auth/onboarding/business-info', body)
  return data
}

export async function getOnboardingKycDocuments() {
  const { data } = await axiosInstance.get<OnboardingKycDocumentsResponse>('/auth/onboarding/kyc/documents')
  return data
}

export async function uploadOnboardingKycDocument({ documentType, file }: UploadOnboardingKycDocumentPayload) {
  const form = new FormData()
  form.append('document_type', documentType)
  form.append('file', file)
  const { data } = await axiosInstance.post<KycDocumentsResponse>('/auth/onboarding/kyc/documents', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function deleteOnboardingKycDocument({ id }: DeleteOnboardingKycDocumentPayload) {
  const { data } = await axiosInstance.delete<MessageResponse>(`/auth/onboarding/kyc/documents/${id}`)
  return data
}

export async function provisionDevices({ data }: ProvisionDevicesPayload) {
  const { data: res } = await axiosInstance.post<OnboardingRequestIdResponse>('/auth/onboarding/devices/provision', data)
  return res
}

export async function registerSims({ data }: RegisterSimsPayload) {
  const { data: res } = await axiosInstance.post<OnboardingSimsRegisterResponse>('/auth/onboarding/sims/register', data)
  return res
}

export async function importSimsFromCsv(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axiosInstance.post<SimImportResponse>('/auth/onboarding/sims/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function downloadSimImportTemplate() {
  const { data } = await axiosInstance.get<Blob>('/auth/sims/import/template', {
    responseType: 'blob',
  })
  return data
}

export async function importSims(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axiosInstance.post<SimImportResponse>('/auth/sims/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function downloadSimRequestDeviceMappingTemplate() {
  const { data } = await axiosInstance.get<Blob>('/auth/sims/requests/device-mapping/template', {
    responseType: 'blob',
  })
  return data
}

export async function uploadSimRequestDeviceMapping(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axiosInstance.post<SimRequestDeviceMappingUploadResponse>(
    '/auth/sims/requests/device-mapping',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function createSimRequest({ data }: CreateSimRequestPayload) {
  const { data: response } = await axiosInstance.post<CreateSimRequestResponse>('/auth/sims/requests', data)
  return response
}

export async function createSim({ data }: CreateSimPayload) {
  const { data: response } = await axiosInstance.post<SimActionResponse>('/auth/sims', data)
  return response
}

export async function getSimDataBundles({ params }: SimDataBundlesQuery) {
  const { data } = await axiosInstance.get<SimDataBundlesResponse>('/auth/sims/data-bundles', { params })
  return data
}

// ─── Tenant — SIMs ────────────────────────────────────────────────────────────

export async function getSims(payload?: SimsQuery) {
  const { data } = await axiosInstance.get<SimsListResponse>('/auth/sims', {
    params: payload?.params,
  })
  return data
}

export async function getSim({ id }: GetSimPayload) {
  const { data } = await axiosInstance.get<SimResponse>(`/auth/sims/${id}`)
  return data
}

export async function updateSim({ id, data: body }: UpdateSimPayload) {
  const { data } = await axiosInstance.patch<SimResponse>(`/auth/sims/${id}`, body)
  return data
}

export async function deleteSim({ id }: DeleteSimPayload) {
  const { data } = await axiosInstance.delete<SimActionResponse>(`/auth/sims/${id}`)
  return data
}

export async function suspendSim({ id, data: body }: SuspendSimPayload) {
  const { data } = await axiosInstance.post<SimActionResponse>(`/auth/sims/${id}/suspend`, body)
  return data
}

export async function reactivateSim({ id }: ReactivateSimPayload) {
  const { data } = await axiosInstance.post<SimActionResponse>(`/auth/sims/${id}/reactivate`)
  return data
}

export async function unassignSimDevice({ id }: UnassignSimDevicePayload) {
  const { data } = await axiosInstance.delete<SimActionResponse>(`/auth/sims/${id}/device`)
  return data
}

export async function exportSims(payload?: SimsQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/sims/export', {
    responseType: 'blob',
    params: payload?.params,
  })
  return data
}

export async function getSimCarriers() {
  const { data } = await axiosInstance.get<SimCarriersResponse>('/auth/sims/carriers')
  return data
}

export async function getSimRequests() {
  const { data } = await axiosInstance.get<SimRequestsListResponse>('/auth/sims/requests')
  return data
}

export async function getSimRequest({ id }: GetSimRequestPayload) {
  const { data } = await axiosInstance.get<SimRequestResponse>(`/auth/sims/requests/${id}`)
  return data
}

export async function getDataBundleDashboardSummary() {
  const { data } = await axiosInstance.get<DataBundleDashboardSummaryResponse>('/auth/data-bundles/summary')
  return data
}

export async function getDataBundleWalletBalance() {
  const { data } = await axiosInstance.get<DataBundleWalletBalanceResponse>('/auth/data-bundles/wallet/balance')
  return data
}

export async function topUpDataBundleWallet({ data: body }: DataBundleWalletTopupPayload) {
  const { data } = await axiosInstance.post<DataBundleWalletTopupResponse>('/auth/data-bundles/wallet/topup', body)
  return data
}

export async function getDataBundleSpendingLimit() {
  const { data } = await axiosInstance.get<DataBundleSpendingLimitResponse>('/auth/data-bundles/spending-limit')
  return data
}

export async function saveDataBundleSpendingLimit({ data: body }: SaveDataBundleSpendingLimitPayload) {
  const { data } = await axiosInstance.post<DataBundleSpendingLimitResponse>('/auth/data-bundles/spending-limit', body)
  return data
}

export async function disableDataBundleSpendingLimit() {
  const { data } = await axiosInstance.delete<DisableDataBundleSpendingLimitResponse>('/auth/data-bundles/spending-limit')
  return data
}

export async function getDataBundleAutoTopup() {
  const { data } = await axiosInstance.get<DataBundleAutoTopupResponse>('/auth/data-bundles/auto-topup')
  return data
}

export async function saveDataBundleAutoTopup({ data: body }: SaveDataBundleAutoTopupPayload) {
  const { data } = await axiosInstance.post<DataBundleAutoTopupResponse>('/auth/data-bundles/auto-topup', body)
  return data
}

export async function disableDataBundleAutoTopup() {
  const { data } = await axiosInstance.delete<DisableDataBundleAutoTopupResponse>('/auth/data-bundles/auto-topup')
  return data
}

export async function getDataBundleAllocations(payload?: DataBundleAllocationsQuery) {
  const { data } = await axiosInstance.get<DataBundleAllocationsListResponse>('/auth/data-bundles/allocations', {
    params: payload?.params,
  })
  return data
}

export async function getDataBundleTransactions(payload?: DataBundleTransactionsQuery) {
  const { data } = await axiosInstance.get<DataBundleTransactionsListResponse>('/auth/data-bundles/transactions', {
    params: payload?.params,
  })
  return data
}

export async function getDataBundleSpendTrend(payload?: DataBundleAnalyticsRangeQuery) {
  const { data } = await axiosInstance.get<DataBundleSpendTrendResponse>('/auth/data-bundles/analytics/spend-trend', {
    params: payload?.params,
  })
  return data
}

export async function getDataBundleSpendBreakdown(payload?: DataBundleAnalyticsRangeQuery) {
  const { data } = await axiosInstance.get<DataBundleSpendBreakdownResponse>('/auth/data-bundles/analytics/spend-breakdown', {
    params: payload?.params,
  })
  return data
}

export async function getDataBundleCarrierDistribution(payload?: DataBundleAnalyticsRangeQuery) {
  const { data } = await axiosInstance.get<DataBundleCarrierDistributionResponse>('/auth/data-bundles/analytics/carrier-distribution', {
    params: payload?.params,
  })
  return data
}

export async function getDataBundleSubscriptionUsage() {
  const { data } = await axiosInstance.get<DataBundleSubscriptionUsageResponse>('/auth/data-bundles/analytics/subscription-usage')
  return data
}

export async function getDataBundleRates(payload?: DataBundleRatesQuery) {
  const { data } = await axiosInstance.get<DataBundleRatesListResponse>('/auth/data-bundles/rates', {
    params: payload?.params,
  })
  return data
}

export async function createSystemCarrier({ data: body }: CreateSystemCarrierPayload) {
  const { data } = await axiosInstance.post<IdResponse>('/auth/system/carriers', body)
  return data
}

export async function updateSystemCarrier({ id, data: body }: UpdateSystemCarrierPayload) {
  const { data } = await axiosInstance.patch<IdResponse>(`/auth/system/carriers/${id}`, body)
  return data
}

export async function createSystemBundle({ data: body }: CreateSystemBundlePayload) {
  const { data } = await axiosInstance.post<IdResponse>('/auth/system/bundle-catalog', body)
  return data
}

export async function updateSystemBundle({ id, data: body }: UpdateSystemBundlePayload) {
  const { data } = await axiosInstance.patch<IdResponse>(`/auth/system/bundle-catalog/${id}`, body)
  return data
}

export async function deleteSystemBundle({ id }: DeleteSystemBundlePayload) {
  const { data } = await axiosInstance.delete<MessageResponse>(`/auth/system/bundle-catalog/${id}`)
  return data
}

export async function allocateDataBundle({ data: body }: AllocateDataBundlePayload) {
  const { data } = await axiosInstance.post<ServerResponse<DataBundleAllocationResult>>(
    '/auth/data-bundles/allocations',
    body,
  )
  return data
}

export async function getDataBundleAllocation({ id }: GetDataBundleAllocationPayload) {
  const { data } = await axiosInstance.get<ServerResponse<DataBundleAllocationDetail>>(
    `/auth/data-bundles/allocations/${id}`,
  )
  return data
}

export async function getAllocatableSims({ params }: AllocatableSimsQuery) {
  const { data } = await axiosInstance.get<SimsListResponse>('/auth/data-bundles/allocations/sims', { params })
  return data
}

export async function exportDataBundleAllocations(payload?: DataBundleAllocationsQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/data-bundles/allocations/export', {
    responseType: 'blob',
    params: payload?.params,
  })
  return data
}

export async function exportDataBundleTransactions(payload?: DataBundleTransactionsQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/data-bundles/transactions/export', {
    responseType: 'blob',
    params: payload?.params,
  })
  return data
}

export async function exportDataBundleRates(payload?: DataBundleRatesQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/data-bundles/rates/export', {
    responseType: 'blob',
    params: payload?.params,
  })
  return data
}

export async function getDataBundleCarriers() {
  const { data } = await axiosInstance.get<DataBundleCarriersListResponse>('/auth/data-bundles/carriers')
  return data
}

export async function provisionSims({ data }: ProvisionSimsPayload) {
  const { data: res } = await axiosInstance.post<OnboardingRequestIdResponse>('/auth/onboarding/sims/provision', data)
  return res
}

export async function updateOnboardingFeatures({ data }: UpdateOnboardingFeaturesPayload) {
  const { data: res } = await axiosInstance.put<OnboardingFeaturesResponse>('/auth/onboarding/features', data)
  return res
}

export async function completeOnboarding() {
  const { data } = await axiosInstance.post<OnboardingCompleteResponse>('/auth/onboarding/complete')
  return data
}

// ─── System admin — support tickets ──────────────────────────────────────────

export async function getSystemSupportDashboard() {
  const { data } = await axiosInstance.get<SystemSupportDashboardResponse>('/auth/system/support/dashboard')
  return data
}

export async function getSystemSupportTicketSummary() {
  const { data } = await axiosInstance.get<SystemSupportTicketSummaryResponse>('/auth/system/support/tickets/summary')
  return data
}

export async function getSystemSupportTickets(payload?: SystemSupportTicketsQuery) {
  const { data } = await axiosInstance.get<SystemSupportTicketsListResponse>('/auth/system/support/tickets', {
    params: payload?.params,
  })
  return data
}

export async function exportSystemSupportTickets(payload?: SystemSupportTicketsQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/system/support/tickets/export', {
    responseType: 'blob',
    params: payload?.params,
  })
  return data
}

export async function getSystemEscalatedSupportTickets() {
  const { data } = await axiosInstance.get<SystemSupportEscalatedResponse>('/auth/system/support/escalated')
  return data
}

export async function getSystemDeviceSetupRequests(payload?: SystemDeviceSetupRequestsQuery) {
  const { data } = await axiosInstance.get<SystemDeviceSetupRequestsListResponse>('/auth/system/support/device-setup', {
    params: payload?.params,
  })
  return data
}

export async function getSystemDeviceSetupRequest({ id }: SystemDeviceSetupRequestPayload) {
  const { data } = await axiosInstance.get<SystemDeviceSetupRequestResponse>(`/auth/system/support/device-setup/${id}`)
  return data
}

export async function assignSystemDeviceSetupRequest({ id }: SystemDeviceSetupRequestPayload) {
  const { data } = await axiosInstance.patch<SystemDeviceSetupRequestResponse>(`/auth/system/support/device-setup/${id}/assign`)
  return data
}

export async function rejectSystemDeviceSetupRequest({ id, data: body }: RejectSystemDeviceSetupRequestPayload) {
  const { data } = await axiosInstance.patch<SystemDeviceSetupRequestResponse>(`/auth/system/support/device-setup/${id}/reject`, body)
  return data
}

export async function exportSystemDeviceSetupRequests(payload?: SystemDeviceSetupRequestsQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/system/support/device-setup/export', {
    responseType: 'blob',
    params: payload?.params,
  })
  return data
}

export async function getSystemSupportTicket({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SystemSupportTicketDetailResponse>(`/auth/system/support/tickets/${id}`)
  return data
}

export async function updateSupportTicketStatus({ id, data }: UpdateTicketStatusPayload) {
  const { data: res } = await axiosInstance.patch<SystemSupportTicketStatusResponse>(
    `/auth/system/support/tickets/${id}/status`,
    data,
  )
  return res
}

export async function escalateSupportTicket({ id, data: body }: EscalateTicketPayload) {
  const { data } = await axiosInstance.patch<SystemSupportTicketStatusResponse>(
    `/auth/system/support/tickets/${id}/escalate`,
    body,
  )
  return data
}

export async function getSupportTicketMessages({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SystemSupportTicketMessagesResponse>(
    `/auth/system/support/tickets/${id}/messages`,
  )
  return data
}

export async function createSupportTicketMessage({ id, data }: CreateTicketMessagePayload) {
  const { data: res } = await axiosInstance.post<SystemSupportTicketMessageResponse>(
    `/auth/system/support/tickets/${id}/messages`,
    data,
  )
  return res
}

// ─── Auth (additions) ─────────────────────────────────────────────────────────

export async function getTenantStatus() {
  const { data } = await axiosInstance.get<TenantStatusResponse>('/auth/tenant-status')
  return data
}

export async function resendVerification({ data }: ResendVerificationPayload) {
  const { data: res } = await axiosInstance.post<MessageResponse>('/auth/resend-verification', data)
  return res
}

export async function verifyActivityLog() {
  const { data } = await axiosInstance.get<ActivityLogVerifyResponse>('/auth/activity-log/verify')
  return data
}

// ─── Mailbox ──────────────────────────────────────────────────────────────────

export async function getMailboxCredentials() {
  const { data } = await axiosInstance.get<MailboxCredentialsResponse>('/auth/mailbox/credentials')
  return data
}

export async function saveMailboxCredentials({ data: body }: SaveMailCredentialsPayload) {
  const { data } = await axiosInstance.put<MailboxCredentialsResponse>('/auth/mailbox/credentials', body)
  return data
}

export async function deleteMailboxCredentials() {
  const { data } = await axiosInstance.delete<MessageResponse>('/auth/mailbox/credentials')
  return data
}

export async function getMailboxThreads(payload?: MailboxThreadsQuery) {
  const { data } = await axiosInstance.get<MailboxThreadsResponse>('/auth/mailbox/threads', {
    params: payload?.params,
  })
  return data
}

export async function getMailboxThreadsSince(payload: MailboxThreadsSinceQuery) {
  const { data } = await axiosInstance.get<MailboxThreadsResponse>('/auth/mailbox/threads/since', {
    params: payload.params,
  })
  return data
}

export async function getMailboxThread({ id }: MailboxThreadPayload) {
  const { data } = await axiosInstance.get<MailboxThreadDetailResponse>(`/auth/mailbox/threads/${id}`)
  return data
}

export async function getMailboxAttachmentLink({ messageId, index }: MailboxAttachmentPayload) {
  const { data } = await axiosInstance.get<MailboxAttachmentLinkResponse>(
    `/auth/mailbox/messages/${messageId}/attachments/${index}`,
  )
  return data
}

export async function sendMailboxMessage({ data: body }: SendMailPayload) {
  const { data } = await axiosInstance.post<SendMailResponse>('/auth/mailbox/send', body)
  return data
}

// ─── Platform Alerts ──────────────────────────────────────────────────────────

export async function getPlatformAlertSettings() {
  const { data } = await axiosInstance.get<PlatformAlertSettingsResponse>('/auth/system/alert-settings')
  return data
}

export async function updatePlatformAlertSetting({ alertType, data: body }: UpdateAlertSettingPayload) {
  const { data } = await axiosInstance.patch<PlatformAlertSettingResponse>(
    `/auth/system/alert-settings/${alertType}`,
    body,
  )
  return data
}

// ─── Communication Pricing ────────────────────────────────────────────────────

export async function getCommunicationRates() {
  const { data } = await axiosInstance.get<CommunicationRatesResponse>('/auth/system/communication-rates')
  return data
}

export async function updateCommunicationRates({ data: body }: UpdateCommunicationRatesPayload) {
  const { data } = await axiosInstance.put<CommunicationRatesResponse>('/auth/system/communication-rates', body)
  return data
}

export async function getCommunicationRateHistory({ channel }: CommunicationRateHistoryPayload) {
  const { data } = await axiosInstance.get<CommunicationRateHistoryResponse>(
    `/auth/system/communication-rates/${channel}/history`,
  )
  return data
}

// ─── Organisation Upgrades ────────────────────────────────────────────────────

export async function requestOrganisationUpgrade({ data: body }: RequestUpgradePayload) {
  const { data } = await axiosInstance.post<OrganisationUpgradeResponse>('/auth/organisation-upgrades', body)
  return data
}

export async function getOrganisationUpgradeQueue() {
  const { data } = await axiosInstance.get<OrganisationUpgradeQueueResponse>('/auth/organisation-upgrades')
  return data
}

export async function approveOrganisationUpgrade({ id, data: body }: ReviewUpgradePayload) {
  const { data } = await axiosInstance.post<OrganisationUpgradeResponse>(
    `/auth/organisation-upgrades/${id}/approve`,
    body,
  )
  return data
}

export async function rejectOrganisationUpgrade({ id, data: body }: ReviewUpgradePayload) {
  const { data } = await axiosInstance.post<OrganisationUpgradeResponse>(
    `/auth/organisation-upgrades/${id}/reject`,
    body,
  )
  return data
}

// ─── System Support (assign ticket) ───────────────────────────────────────────

export async function assignSystemSupportTicket({ id, data: body }: AssignSystemSupportTicketPayload) {
  const { data } = await axiosInstance.patch<SystemSupportTicketDetailResponse>(
    `/auth/system/support/tickets/${id}/assign`,
    body,
  )
  return data
}

// ─── System KYC ───────────────────────────────────────────────────────────────

export async function getSystemKycReviewQueue(payload?: SystemKycReviewQueueQuery) {
  const { data } = await axiosInstance.get<SystemKycReviewQueueResponse>('/auth/system/kyc/documents', {
    params: payload?.params,
  })
  return data
}

export async function approveSystemKycDocument({ id }: { id: string }) {
  const { data } = await axiosInstance.patch<SystemKycReviewDocumentResponse>(
    `/auth/system/kyc/documents/${id}/approve`,
  )
  return data
}

export async function rejectSystemKycDocument({ id, data: body }: RejectKycDocumentPayload) {
  const { data } = await axiosInstance.patch<SystemKycReviewDocumentResponse>(
    `/auth/system/kyc/documents/${id}/reject`,
    body,
  )
  return data
}

// ─── Data Bundles (ledger) ────────────────────────────────────────────────────

export async function getDataBundleWalletLedger(payload?: DataBundleLedgerQuery) {
  const { data } = await axiosInstance.get<DataBundleLedgerResponse>('/auth/data-bundles/ledger', {
    params: payload?.params,
  })
  return data
}
