
import { axiosInstance } from '../lib/axios-instance'
import { onboardingInstance } from '../lib/onboarding-instance'
import type { ServerResponse } from '../lib/types'

import type {
  ActivityLogQuery,
  ActivityLogResponse,
  ActivityLogVerifyResponse,
  ApproveSIMRequestPayload,
  ClickToCallCredentials,
  AssignSystemSupportTicketPayload,
  AttachSupportTicketFilesPayload,
  CommunicationRateHistoryPayload,
  CommunicationRateHistoryResponse,
  CommunicationRatesResponse,
  DataBundleLedgerQuery,
  DataBundleLedgerFilters,
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
  SendTestAlertPayload,
  SendTestAlertResponse,
  StaffRolesResponse,
  StaffPermissionsResponse,
  StaffRoleBody,
  StaffRoleResponse,
  SetStaffMemberRolePayload,
  SetStaffMemberCustomRolePayload,
  SetStaffMemberPermissionsPayload,
  StaffMemberAccessResponse,
  AdminNotificationsQuery,
  AdminNotificationsResponse,
  AdminNotificationReadResponse,
  PlatformTopUpPayload,
  PlatformTopUpResponse,
  PlatformWalletCreditSettingsPayload,
  PlatformWalletCreditSettingsResponse,
  PlatformWalletLedgerQuery,
  PlatformWalletLedgerResponse,
  PlatformWalletsQuery,
  PlatformWalletsResponse,
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
  SimRequestsQuery,
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
  AIGovernanceResponse,
  AIRequestsListResponse,
  AIRequestsQuery,
  AIUsageQuery,
  AIUsageResponse,
  AuthSystemSettingsResponse,
  AuthTokenResponse,
  CreateSystemInstallerPayload,
  InstallerDashboardResponse,
  InstallerDisplayPreferencesResponse,
  InstallerNotificationPreferencesResponse,
  InstallerProfileResponse,
  InstallerWorkPreferencesResponse,
  ChangeInstallerPasswordPayload,
  UpdateInstallerDisplayPreferencesPayload,
  UpdateInstallerNotificationPreferencesPayload,
  UpdateInstallerProfilePayload,
  UpdateInstallerWorkPreferencesPayload,
  InstallerEvidenceLinkResponse,
  InstallerJobResponse,
  InstallerJobsExportQuery,
  InstallerJobsQuery,
  InstallerJobsResponse,
  ReportInstallerJobIssuePayload,
  SaveInstallerJobNotesPayload,
  SetInstallerChecklistItemPayload,
  UploadInstallerEvidencePayload,
  InstallerLoginPayload,
  InstallerNotificationsResponse,
  InstallerSupportTicketResponse,
  InstallerSupportTicketsQuery,
  InstallerSupportTicketsResponse,
  CreateInstallerSupportTicketPayload,
  InstallerOptionsResponse,
  RejectedOfferResponse,
  RejectInstallerJobPayload,
  InstallerLoginResponse,
  InstallerLoginTwoFactorPayload,
  LoginResponse,
  LoginTwoFactorPayload,
  SystemLoginResponse,
  SystemLoginTwoFactorResponse,
  SystemInstallationJobsQuery,
  SystemInstallationJobsResponse,
  SystemInstallationJobDetailResponse,
  SystemInstallerActionPayload,
  SystemInstallerResponse,
  SystemInstallersQuery,
  SystemInstallersResponse,
  UpdateSystemInstallerPayload,
  ChangeRolePayload,
  CompleteProfilePayload,
  CreateDeviceCatalogPayload,
  CreateSystemAdminInvitePayload,
  CreateSystemAdminPayload,
  CreateSupportTicketPayload,
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
  OnboardingKycDocumentsResponse,
  TenantStorageUsageResponse,
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
  ApproveSystemDeviceSetupRequestPayload,
  RejectSystemDeviceSetupRequestPayload,
  RejectSIMRequestPayload,
  RemoveOrganizationUserResponse,
  SystemFailedLoginsQuery,
  SystemFailedLoginsResponse,
  SystemAuthEventsQuery,
  SystemAuthEventsResponse,
  SystemAutoBlockRulesResponse,
  UpdateSystemAutoBlockRulePayload,
  UpdateSystemAutoBlockRuleResponse,
  SystemSecurityEventsQuery,
  SystemSecurityEventsResponse,
  SystemSecurityOverviewResponse,
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
  OnboardingSimImportResponse,
  StandardApiResponse,
  SupportTicketContextPayload,
  SupportTicketContextResponse,
  SupportTicketDetailResponse,
  SupportTicketReplyResponse,
  SupportTicketAttachmentLinkResponse,
  SupportTicketCsatResponse,
  SubmitSupportTicketCsatPayload,
  CapabilitiesResponse,
  SupportTicketOptionsResponse,
  SupportTicketResponse,
  SupportTicketsListResponse,
  SupportTicketsQuery,
  SupportTicketsSummaryResponse,
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
  SystemDeviceSetupSummaryResponse,
  StillReportingDevicesResponse,
  UnrecognisedDeviceActionPayload,
  UnrecognisedDeviceActionResponse,
  UnrecognisedDevicesResponse,
  SystemDeviceSummaryResponse,
  SystemDeviceManufacturersResponse,
  SystemSimCarrierBreakdownResponse,
  SystemSnapshotPeriod,
  SystemRevenueByMonthResponse,
  SystemTenantGrowthResponse,
  SystemSimDataUsageResponse,
  SystemDeviceMessageRateResponse,
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
  SystemTenantBillingResponse,
  SystemTenantContactDetail,
  SystemTenantQuotasResponse,
  SystemTenantTrialResponse,
  SystemTenantExportResponse,
  SystemTenantExportsResponse,
  UpdateSystemTenantQuotasPayload,
  ExtendSystemTenantTrialPayload,
  ConvertSystemTenantTrialPayload,
  RequestSystemTenantExportPayload,
  DownloadSystemTenantExportPayload,
  SystemTenantDetailResponse,
  SystemTenantInviteActionResponse,
  SystemTenantOnboardingReferenceDataResponse,
  SystemTenantOnboardingResponse,
  SystemTenantsListResponse,
  SystemTenantsSummaryResponse,
  SystemTelecomMasterDetailResponse,
  SystemTelecomMasterListResponse,
  ResolveSystemTelecomMasterPayload,
  SubmitTenantTelecomMasterPayload,
  TenantTelecomMasterResponse,
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
  CreateSystemSimPayload,
  ImportSystemSimsPayload,
  DeleteSystemSimPayload,
  ActivateSystemSimPayload,
  BulkSystemSimStatusPayload,
  SystemSimImportResponse,
  SystemSimBulkStatusResponse,
  SystemSimDeleteResponse,
  UpdateSubscriptionPlanPricePayload,
  ConfirmTwoFactorPayload,
  DisableTwoFactorPayload,
  TwoFactorEnrolmentResponse,
  TwoFactorRecoveryCodesResponse,
  TwoFactorStateResponse,
  UpdateAIGovernancePayload,
  UpdateOpenRouterCredentialPayload,
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
  BundleAdoptionQuery,
  BundleAdoptionResponse,
  BundleCatalogListResponse,
  BundleCatalogQuery,
  BundleSummaryResponse,
  CloseSupportTicketPayload,
  CommunicationsWalletRangeQuery,
  CommunicationsWalletRatesResponse,
  CommunicationsWalletSpendBreakdownResponse,
  CommunicationsWalletSpendTrendResponse,
  CreateOnboardingApplicationPayload,
  CreateOnboardingApplicationResponse,
  DeleteOnboardingApplicationDocumentPayload,
  MailboxMessageFlagsResponse,
  AddOnboardingDeviceRequestPayload,
  AddOnboardingDeviceRequestResponse,
  AddOnboardingVehiclePayload,
  DeleteOnboardingDeviceRequestPayload,
  UpdateOnboardingDeviceRequestPayload,
  PickupLocationsResponse,
  SetOnboardingFulfilmentPayload,
  ContactEnquiryPayload,
  ContactEnquiryResponse,
  DeleteOnboardingVehiclePayload,
  ImportOnboardingVehiclesPayload,
  ImportOnboardingVehiclesResponse,
  OnboardingApplicationResponse,
  OnboardingOrderResponse,
  ScheduleOnboardingInstallationPayload,
  ScheduleOnboardingInstallationResponse,
  SetOnboardingBillingEmailPayload,
  SetOnboardingBillingEmailResponse,
  StartOnboardingPaymentPayload,
  StartOnboardingPaymentResponse,
  OnboardingIndemnityAgreementResponse,
  OnboardingEmailAvailabilityResponse,
  VerifyOnboardingTelecomMasterNumberResponse,
  OnboardingM2mPlansResponse,
  OnboardingVehicleImportColumnsResponse,
  ResumeOnboardingApplicationPayload,
  SignOnboardingIndemnityPayload,
  SignOnboardingIndemnityResponse,
  SubmitOnboardingApplicationResponse,
  UpdateOnboardingVehiclePayload,
  OnboardingApplicationStatusResponse,
  OnboardingApplicationVerifyPayload,
  OnboardingApplicationVerifySendResponse,
  PlatformIntegrationResponse,
  PlatformIntegrationsResponse,
  ReopenSupportTicketPayload,
  ReplySupportTicketPayload,
  SubmitOnboardingApplicationIncomplete,
  SystemOnboardingApplicationDocumentActionPayload,
  SystemOnboardingApplicationDocumentResponse,
  SystemOnboardingApplicationsListResponse,
  SystemOnboardingApplicationResponse,
  SystemOnboardingDocumentLinkResponse,
  SystemApproveOnboardingApplicationResponse,
  SystemOnboardingDecisionResponse,
  SystemOnboardingChangesLinkResendResponse,
  SystemOnboardingPaymentLinkResendResponse,
  SystemOnboardingSetupLinkResendResponse,
  SystemOnboardingTimelineResponse,
  SystemOnboardingProvisionedPayload,
  SystemOnboardingProvisionedResponse,
  SystemReviewOnboardingPaymentPayload,
  SystemRefundOnboardingPaymentPayload,
  SystemRefundOnboardingPaymentResponse,
  SystemReviewOnboardingPaymentResponse,
  SystemAuditLogFiltersResponse,
  SystemAuditLogQuery,
  SystemAuditLogResponse,
  SystemAuditLogVerifyResponse,
  SystemActionHistoryQuery,
  SystemWalletsResponse,
  SystemAuditLogEntry,
  SystemOnboardingApplicationsQuery,
  SystemOnboardingApplicationsSummaryResponse,
  SystemTenantAuditLogResponse,
  SystemTenantDocumentsResponse,
  SystemTenantResourcesPayload,
  SystemTenantResourcesResponse,
  TerminateSystemTenantPayload,
  TerminateSystemTenantResponse,
  SystemRejectOnboardingApplicationDocumentPayload,
  SystemRejectOnboardingApplicationPayload,
  SystemRequestChangesOnboardingApplicationPayload,
  UpdateMailboxMessageFlagsPayload,
  UpdateOnboardingApplicationPayload,
  UpdatePlatformIntegrationPayload,
  UpdateSubscriptionPlanEntitlementsPayload,
  UploadOnboardingApplicationDocumentPayload,
  SuspendSystemDevicePayload,
  ReinstateSystemDevicePayload,
  UpdateSystemDevicePayload,
  AssignSystemDevicesPayload,
  SystemDeviceWriteResponse,
  AssignSystemInstallationPayload,
  SystemInstallationAssignmentResponse,
  SystemDeviceActionResponse,
} from './types'

// ─── Public auth ─────────────────────────────────────────────────────────────

export async function register({ data }: RegisterPayload) {
  const { data: res } = await axiosInstance.post<AuthTokenResponse>('/auth/register', data)
  return res
}

export async function login({ data }: LoginPayload) {
  const { data: res } = await axiosInstance.post<LoginResponse>('/auth/login', data)
  return res
}

// TRU-FE-23 — a challenge from a portal's password step is only accepted by that portal's two-factor route.
export async function loginTwoFactor({ data }: LoginTwoFactorPayload) {
  const { data: res } = await axiosInstance.post<AuthTokenResponse>('/auth/login/two-factor', data)
  return res
}

export async function systemLogin({ data }: SystemLoginPayload) {
  const { data: res } = await axiosInstance.post<SystemLoginResponse>('/auth/system/login', data)
  return res
}

export async function systemLoginTwoFactor({ data }: LoginTwoFactorPayload) {
  const { data: res } = await axiosInstance.post<SystemLoginTwoFactorResponse>('/auth/system/login/two-factor', data)
  return res
}

// TRU-FE-18 — the installer portal's own sign-in: the only route that admits installers
// and hands out the two-factor challenge.
export async function installerLogin({ data }: InstallerLoginPayload) {
  const { data: res } = await axiosInstance.post<InstallerLoginResponse>('/auth/installer/login', data)
  return res
}

export async function installerLoginTwoFactor({ data }: InstallerLoginTwoFactorPayload) {
  const { data: res } = await axiosInstance.post<AuthTokenResponse>('/auth/installer/login/two-factor', data)
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

// ─── TRU-FE-19 — installer portal dashboard ─────────────────────────────────

export async function getInstallerDashboard() {
  const { data } = await axiosInstance.get<InstallerDashboardResponse>('/auth/installer/dashboard')
  return data
}

export async function acceptInstallerJob({ jobId }: { jobId: string }) {
  const { data } = await axiosInstance.post<InstallerJobResponse>(`/auth/installer/jobs/${jobId}/accept`)
  return data
}

export async function rejectInstallerJob({ jobId, data: body }: RejectInstallerJobPayload) {
  const { data } = await axiosInstance.post<RejectedOfferResponse>(`/auth/installer/jobs/${jobId}/reject`, body)
  return data
}

export async function getInstallerNotifications(params?: { limit?: number, page?: number, unread?: boolean }) {
  const { data } = await axiosInstance.get<InstallerNotificationsResponse>('/auth/installer/notifications', { params })
  return data
}

export async function markInstallerNotificationRead({ id }: { id: string }) {
  const { data } = await axiosInstance.post<ServerResponse<unknown>>(`/auth/installer/notifications/${id}/read`)
  return data
}

export async function markAllInstallerNotificationsRead() {
  const { data } = await axiosInstance.post<ServerResponse<unknown>>('/auth/installer/notifications/read-all')
  return data
}

// ─── TRU-FE-22 — installer support tickets ──────────────────────────────────

export async function createInstallerSupportTicket({ data: body }: CreateInstallerSupportTicketPayload) {
  const { data } = await axiosInstance.post<InstallerSupportTicketResponse>('/auth/installer/support/tickets', body)
  return data
}

export async function getInstallerSupportTickets(payload?: InstallerSupportTicketsQuery) {
  const { data } = await axiosInstance.get<InstallerSupportTicketsResponse>('/auth/installer/support/tickets', { params: payload?.params })
  return data
}

export async function getInstallerSupportTicket({ id }: { id: string }) {
  const { data } = await axiosInstance.get<InstallerSupportTicketResponse>(`/auth/installer/support/tickets/${id}`)
  return data
}

export async function getInstallerSupportTicketAttachmentLink({ id, attachmentId }: { id: string, attachmentId: string }) {
  const { data } = await axiosInstance.get<InstallerEvidenceLinkResponse>(`/auth/installer/support/tickets/${id}/attachments/${attachmentId}`)
  return data
}

export async function getInstallerOptions() {
  const { data } = await axiosInstance.get<InstallerOptionsResponse>('/auth/installer/options')
  return data
}

export async function getInstallerDisplayPreferences() {
  const { data } = await axiosInstance.get<InstallerDisplayPreferencesResponse>('/auth/installer/preferences/display')
  return data
}

// ─── TRU-FE-21 — installer settings ──────────────────────────────────────────

export async function updateInstallerDisplayPreferences({ data: body }: UpdateInstallerDisplayPreferencesPayload) {
  const { data } = await axiosInstance.patch<InstallerDisplayPreferencesResponse>('/auth/installer/preferences/display', body)
  return data
}

export async function getInstallerProfile() {
  const { data } = await axiosInstance.get<InstallerProfileResponse>('/auth/installer/profile')
  return data
}

export async function updateInstallerProfile({ data: body }: UpdateInstallerProfilePayload) {
  const { data } = await axiosInstance.patch<InstallerProfileResponse>('/auth/installer/profile', body)
  return data
}

/** JPG or PNG, up to 2 MB. */
export async function uploadInstallerProfilePhoto({ file }: { file: File }) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axiosInstance.post<InstallerProfileResponse>('/auth/installer/profile/photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function changeInstallerPassword({ data: body }: ChangeInstallerPasswordPayload) {
  const { data } = await axiosInstance.post<AuthTokenResponse>('/auth/installer/password', body)
  return data
}

export async function getInstallerNotificationPreferences() {
  const { data } = await axiosInstance.get<InstallerNotificationPreferencesResponse>('/auth/installer/preferences/notifications')
  return data
}

export async function updateInstallerNotificationPreferences({ data: body }: UpdateInstallerNotificationPreferencesPayload) {
  const { data } = await axiosInstance.patch<InstallerNotificationPreferencesResponse>('/auth/installer/preferences/notifications', body)
  return data
}

export async function getInstallerWorkPreferences() {
  const { data } = await axiosInstance.get<InstallerWorkPreferencesResponse>('/auth/installer/preferences/work')
  return data
}

export async function updateInstallerWorkPreferences({ data: body }: UpdateInstallerWorkPreferencesPayload) {
  const { data } = await axiosInstance.patch<InstallerWorkPreferencesResponse>('/auth/installer/preferences/work', body)
  return data
}

// ─── TRU-FE-20 — installer jobs ──────────────────────────────────────────────

export async function getInstallerJobs(params?: InstallerJobsQuery) {
  const { data } = await axiosInstance.get<InstallerJobsResponse>('/auth/installer/jobs', { params })
  return data
}

/** Installation History as CSV, capped at 5000 rows. */
export async function exportInstallerJobs(params?: InstallerJobsExportQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/installer/jobs/export', { params, responseType: 'blob' })
  return data
}

export async function getInstallerJob({ jobId }: { jobId: string }) {
  const { data } = await axiosInstance.get<InstallerJobResponse>(`/auth/installer/jobs/${jobId}`)
  return data
}

export async function startInstallerJob({ jobId }: { jobId: string }) {
  const { data } = await axiosInstance.post<InstallerJobResponse>(`/auth/installer/jobs/${jobId}/start`)
  return data
}

export async function setInstallerChecklistItem({ jobId, itemKey, data: body }: SetInstallerChecklistItemPayload) {
  const { data } = await axiosInstance.put<InstallerJobResponse>(`/auth/installer/jobs/${jobId}/checklist/${itemKey}`, body)
  return data
}

export async function saveInstallerJobNotes({ jobId, data: body }: SaveInstallerJobNotesPayload) {
  const { data } = await axiosInstance.patch<InstallerJobResponse>(`/auth/installer/jobs/${jobId}/notes`, body)
  return data
}

export async function uploadInstallerEvidence({ jobId, category, file }: UploadInstallerEvidencePayload) {
  const form = new FormData()
  form.append('category', category)
  form.append('file', file)
  const { data } = await axiosInstance.post<ServerResponse<unknown>>(`/auth/installer/jobs/${jobId}/evidence`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function getInstallerEvidenceLink({ jobId, evidenceId }: { jobId: string, evidenceId: string }) {
  const { data } = await axiosInstance.get<InstallerEvidenceLinkResponse>(`/auth/installer/jobs/${jobId}/evidence/${evidenceId}`)
  return data
}

export async function reportInstallerJobIssue({ jobId, issueType, description, photo }: ReportInstallerJobIssuePayload) {
  const form = new FormData()
  form.append('issueType', issueType)
  form.append('description', description)
  if (photo)
    form.append('photo', photo)
  const { data } = await axiosInstance.post<InstallerJobResponse>(`/auth/installer/jobs/${jobId}/issues`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function completeInstallerJob({ jobId }: { jobId: string }) {
  const { data } = await axiosInstance.post<InstallerJobResponse>(`/auth/installer/jobs/${jobId}/complete`)
  return data
}

export async function createSystemInstaller({ data }: CreateSystemInstallerPayload) {
  const { data: res } = await axiosInstance.post<SystemInstallerResponse>('/auth/system/installers', data)
  return res
}

export async function getSystemInstallers(params?: SystemInstallersQuery) {
  const { data } = await axiosInstance.get<SystemInstallersResponse>('/auth/system/installers', { params })
  return data
}

export async function getSystemInstallationJobs(params?: SystemInstallationJobsQuery) {
  const { data } = await axiosInstance.get<SystemInstallationJobsResponse>('/auth/system/installation-orders', { params })
  return data
}

export async function getSystemInstallationJob({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SystemInstallationJobDetailResponse>(
    `/auth/system/installation-orders/${id}`,
  )
  return data
}

export async function updateSystemInstaller({ id, data }: UpdateSystemInstallerPayload) {
  const { data: res } = await axiosInstance.patch<SystemInstallerResponse>(`/auth/system/installers/${id}`, data)
  return res
}

export async function suspendSystemInstaller({ id }: SystemInstallerActionPayload) {
  const { data } = await axiosInstance.post<SystemInstallerResponse>(`/auth/system/installers/${id}/suspend`)
  return data
}

export async function reactivateSystemInstaller({ id }: SystemInstallerActionPayload) {
  const { data } = await axiosInstance.post<SystemInstallerResponse>(`/auth/system/installers/${id}/reactivate`)
  return data
}

export async function resendSystemInstallerInvite({ id }: SystemInstallerActionPayload) {
  const { data } = await axiosInstance.post<SystemInstallerResponse>(`/auth/system/installers/${id}/resend-invite`)
  return data
}

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

export async function getStaffRoles() {
  const { data } = await axiosInstance.get<StaffRolesResponse>('/auth/system/roles')
  return data
}

export async function getStaffPermissions() {
  const { data } = await axiosInstance.get<StaffPermissionsResponse>('/auth/system/roles/permissions')
  return data
}

export async function createStaffRole(body: StaffRoleBody) {
  const { data } = await axiosInstance.post<StaffRoleResponse>('/auth/system/roles', body)
  return data
}

export async function updateStaffRole({ id, ...body }: StaffRoleBody & { id: string }) {
  const { data } = await axiosInstance.patch<StaffRoleResponse>(`/auth/system/roles/${id}`, body)
  return data
}

export async function deleteStaffRole({ id }: { id: string }) {
  const { data } = await axiosInstance.delete<ServerResponse<{ roleId: string }>>(`/auth/system/roles/${id}`)
  return data
}

export async function setStaffMemberRole({ userId, role }: SetStaffMemberRolePayload) {
  const { data } = await axiosInstance.patch<StaffMemberAccessResponse>(`/auth/system/admins/${userId}/role`, { role })
  return data
}

export async function setStaffMemberCustomRole({ userId, customRoleId }: SetStaffMemberCustomRolePayload) {
  const { data } = await axiosInstance.put<StaffMemberAccessResponse>(`/auth/system/admins/${userId}/custom-role`, { customRoleId })
  return data
}

export async function setStaffMemberPermissions({ userId, permissions }: SetStaffMemberPermissionsPayload) {
  const { data } = await axiosInstance.put<StaffMemberAccessResponse>(`/auth/system/admins/${userId}/permissions`, { permissions })
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

export async function getSystemTelecomMasterRequests() {
  const { data } = await axiosInstance.get<SystemTelecomMasterListResponse>('/auth/system/telecom-master')
  return data
}

export async function getSystemTelecomMasterRequest({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SystemTelecomMasterDetailResponse>(
    `/auth/system/telecom-master/${id}`,
  )
  return data
}

export async function retrySystemTelecomMasterRequest({ id }: { id: string }) {
  const { data } = await axiosInstance.post<SystemTelecomMasterDetailResponse>(
    `/auth/system/telecom-master/${id}/retry`,
  )
  return data
}

export async function resolveSystemTelecomMasterRequest({ id, data: body }: ResolveSystemTelecomMasterPayload) {
  const { data } = await axiosInstance.post<SystemTelecomMasterDetailResponse>(
    `/auth/system/telecom-master/${id}/resolve`,
    body,
  )
  return data
}

export async function getTenantTelecomMaster() {
  const { data } = await axiosInstance.get<TenantTelecomMasterResponse>('/auth/telecom-master')
  return data
}

export async function submitTenantTelecomMaster({ data: body }: SubmitTenantTelecomMasterPayload) {
  const { data } = await axiosInstance.post<TenantTelecomMasterResponse>('/auth/telecom-master', body)
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
  const { data } = await axiosInstance.get<ServerResponse<SystemTenantContactDetail>>(`/auth/system/tenants/${id}`)
  return data
}

export async function getSystemTenantBilling({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SystemTenantBillingResponse>(`/auth/system/tenants/${id}/billing`)
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

export async function getSystemDeviceManufacturers(period?: SystemSnapshotPeriod) {
  const { data } = await axiosInstance.get<SystemDeviceManufacturersResponse>('/auth/system/devices/manufacturers', {
    params: { period },
  })
  return data
}

export async function getSystemRevenueByMonth(months?: number) {
  const { data } = await axiosInstance.get<SystemRevenueByMonthResponse>('/auth/system/tenants/revenue-by-month', {
    params: { months },
  })
  return data
}

export async function getSystemTenantGrowth(months?: number) {
  const { data } = await axiosInstance.get<SystemTenantGrowthResponse>('/auth/system/tenants/growth', {
    params: { months },
  })
  return data
}

export async function getSystemSimDataUsage(days?: number) {
  const { data } = await axiosInstance.get<SystemSimDataUsageResponse>('/auth/system/sims/data-usage', {
    params: { days },
  })
  return data
}

export async function getSystemDeviceMessageRate() {
  const { data } = await axiosInstance.get<SystemDeviceMessageRateResponse>('/auth/system/devices/messages-per-hour')
  return data
}

export async function getSystemDevicesSummary() {
  const { data } = await axiosInstance.get<SystemDeviceSummaryResponse>('/auth/system/devices/summary')
  return data
}

export async function getStillReportingDevices() {
  const { data } = await axiosInstance.get<StillReportingDevicesResponse>('/auth/system/devices/still-reporting')
  return data
}

export async function getUnrecognisedDevices() {
  const { data } = await axiosInstance.get<UnrecognisedDevicesResponse>('/auth/system/devices/unrecognised')
  return data
}

export async function actOnUnrecognisedDevice({ imei, action, data: body }: UnrecognisedDeviceActionPayload) {
  const { data } = await axiosInstance.post<UnrecognisedDeviceActionResponse>(
    `/auth/system/devices/unrecognised/${encodeURIComponent(imei)}/${action}`,
    body,
  )
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

// TRU-FE-5 § 7 — Suspend a device platform-wide. Optional { reason }.
// Returns 400 if already suspended/decommissioned, 404 if not found,
// 503 if the device service is unreachable (do NOT optimistically update on 503).
export async function suspendSystemDevice({ id, data: body }: SuspendSystemDevicePayload) {
  const { data } = await axiosInstance.post<SystemDeviceActionResponse>(`/auth/system/devices/${id}/suspend`, body ?? {})
  return data
}

// TRU-FE-5 § 7 — Reinstate a suspended device. No body.
// ⚠️ Returns assignable, not assigned — vehicle link was released on suspension.
export async function reinstateSystemDevice({ id }: ReinstateSystemDevicePayload) {
  const { data } = await axiosInstance.post<SystemDeviceActionResponse>(`/auth/system/devices/${id}/reinstate`)
  return data
}

export async function updateSystemDevice({ id, data: body }: UpdateSystemDevicePayload) {
  const { data } = await axiosInstance.patch<SystemDeviceWriteResponse>(`/auth/system/devices/${id}`, body)
  return data
}

export async function assignSystemDevices({ data: body }: AssignSystemDevicesPayload) {
  const { data } = await axiosInstance.post<SystemDeviceWriteResponse>('/auth/system/devices/assign', body)
  return data
}

export async function assignSystemInstallationOrder({ id, data: body }: AssignSystemInstallationPayload) {
  const { data } = await axiosInstance.post<SystemInstallationAssignmentResponse>(
    `/auth/system/installation-orders/${id}/assign`,
    body,
  )
  return data
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

export async function createSystemSim(body: CreateSystemSimPayload) {
  const { data } = await axiosInstance.post<SystemSimResponse>('/auth/system/sims', body)
  return data
}

export async function importSystemSims(body: ImportSystemSimsPayload) {
  const { data } = await axiosInstance.post<SystemSimImportResponse>('/auth/system/sims/import', body)
  return data
}

export async function deleteSystemSim({ id }: DeleteSystemSimPayload) {
  const { data } = await axiosInstance.delete<SystemSimDeleteResponse>(`/auth/system/sims/${id}`)
  return data
}

export async function activateSystemSim({ id }: ActivateSystemSimPayload) {
  const { data } = await axiosInstance.patch<SystemSimResponse>(`/auth/system/sims/${id}/activate`)
  return data
}

export async function bulkSystemSimStatus(body: BulkSystemSimStatusPayload) {
  const { data } = await axiosInstance.post<SystemSimBulkStatusResponse>('/auth/system/sims/bulk-status', body)
  return data
}

export async function getSystemSimsSummary() {
  const { data } = await axiosInstance.get<SystemSimSummaryResponse>('/auth/system/sims/summary')
  return data
}

export async function getSystemSimCarrierBreakdown(period?: SystemSnapshotPeriod) {
  const { data } = await axiosInstance.get<SystemSimCarrierBreakdownResponse>('/auth/system/sims/by-carrier', {
    params: { period },
  })
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

// ─── TRU-FE-7 § B — AI ────────────────────────────────────────────────────────

export async function getAIGovernance() {
  const { data } = await axiosInstance.get<AIGovernanceResponse>('/auth/system/ai/governance')
  return data
}

export async function updateAIGovernance({ data }: UpdateAIGovernancePayload) {
  const { data: res } = await axiosInstance.patch<AIGovernanceResponse>('/auth/system/ai/governance', data)
  return res
}

export async function getAIUsage(payload?: AIUsageQuery) {
  const { data } = await axiosInstance.get<AIUsageResponse>('/auth/system/ai/usage', { params: payload?.params })
  return data
}

export async function getAIRequests(payload?: AIRequestsQuery) {
  const { data } = await axiosInstance.get<AIRequestsListResponse>('/auth/system/ai/requests', { params: payload?.params })
  return data
}

export async function exportAIRequests(payload?: AIRequestsQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/system/ai/requests/export', {
    responseType: 'blob',
    params: payload?.params,
  })
  return data
}

// TRU-FE-7 § B — OpenRouter credential (currently 503 on dev-api, see BE bug comment).
export async function updateOpenRouterCredential({ data }: UpdateOpenRouterCredentialPayload) {
  const { data: res } = await axiosInstance.put('/auth/system/integrations/openrouter', data)
  return res
}

// ─── TRU-FE-7 § D — per-account TOTP two-factor ──────────────────────────────
export async function getTwoFactor() {
  const { data } = await axiosInstance.get<TwoFactorStateResponse>('/auth/two-factor')
  return data
}
export async function enrolTwoFactor() {
  const { data } = await axiosInstance.post<TwoFactorEnrolmentResponse>('/auth/two-factor/enrol', {})
  return data
}
export async function confirmTwoFactor({ data }: ConfirmTwoFactorPayload) {
  const { data: res } = await axiosInstance.post<TwoFactorRecoveryCodesResponse>('/auth/two-factor/enrol/confirm', data)
  return res
}
export async function disableTwoFactor({ data }: DisableTwoFactorPayload) {
  const { data: res } = await axiosInstance.post<ServerResponse<null>>('/auth/two-factor/disable', data)
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

export async function updateSubscriptionPlanPrice({ id, data }: UpdateSubscriptionPlanPricePayload) {
  await axiosInstance.patch(`/auth/system/subscription-plans/${id}`, data)
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

export async function getTenantStorageUsage() {
  const { data } = await axiosInstance.get<TenantStorageUsageResponse>('/auth/storage/usage')
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
  const { data } = await axiosInstance.post<OnboardingSimImportResponse>('/auth/onboarding/sims/import', form, {
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

export async function getSimRequests(payload?: SimRequestsQuery) {
  const { data } = await axiosInstance.get<SimRequestsListResponse>('/auth/sims/requests', {
    params: payload?.params,
  })
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

export async function getDataBundleSubscriptionUsage(payload?: DataBundleAnalyticsRangeQuery) {
  const { data } = await axiosInstance.get<DataBundleSubscriptionUsageResponse>('/auth/data-bundles/analytics/subscription-usage', {
    params: payload?.params,
  })
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

export async function getSupportTickets(payload?: SupportTicketsQuery) {
  const { data } = await axiosInstance.get<SupportTicketsListResponse>('/auth/support-tickets', {
    params: payload?.params,
  })
  return data
}

export async function createSupportTicket({ data: body }: CreateSupportTicketPayload) {
  const { data } = await axiosInstance.post<SupportTicketResponse>('/auth/support-tickets', body)
  return data
}

export async function getSupportTicket({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SupportTicketDetailResponse>(`/auth/support-tickets/${id}`)
  return data
}

export async function attachSupportTicketFiles({ id, data: files, messageId }: AttachSupportTicketFilesPayload) {
  const body = new FormData()
  files.forEach(file => body.append('files', file))

  const { data } = await axiosInstance.post<StandardApiResponse>(`/auth/support-tickets/${id}/attachments`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { messageId },
  })
  return data
}

export async function getSupportTicketAttachmentLink({ id, attachmentId }: { id: string, attachmentId: string }) {
  const { data } = await axiosInstance.get<SupportTicketAttachmentLinkResponse>(
    `/auth/support-tickets/${id}/attachments/${attachmentId}`,
  )
  return data
}

export async function getSupportTicketCsat({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SupportTicketCsatResponse>(`/auth/support-tickets/${id}/csat`)
  return data
}

export async function submitSupportTicketCsat({ id, data: body }: SubmitSupportTicketCsatPayload) {
  const { data } = await axiosInstance.post<SupportTicketCsatResponse>(`/auth/support-tickets/${id}/csat`, body)
  return data
}

export async function getCapabilities() {
  const { data } = await axiosInstance.get<CapabilitiesResponse>('/auth/capabilities')
  return data
}

export async function getSupportTicketsSummary() {
  const { data } = await axiosInstance.get<SupportTicketsSummaryResponse>('/auth/support-tickets/summary')
  return data
}

export async function getSupportTicketOptions() {
  const { data } = await axiosInstance.get<SupportTicketOptionsResponse>('/auth/support-tickets/options')
  return data
}

export async function getSupportTicketContext({ contextType, contextId }: SupportTicketContextPayload) {
  const { data } = await axiosInstance.get<SupportTicketContextResponse>(
    `/auth/support-tickets/context/${contextType}/${contextId}`,
  )
  return data
}

export async function getSupportTicketsExport(payload?: SupportTicketsQuery) {
  const res = await axiosInstance.get<Blob>('/auth/support-tickets/export', {
    params: payload?.params,
    responseType: 'blob',
  })
  return res.data
}

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

// TRU-FE-5 § 4 — Approve. Only valid on pending_review; second decision returns 400.
export async function approveSystemDeviceSetupRequest({ id, data: body }: ApproveSystemDeviceSetupRequestPayload) {
  const { data } = await axiosInstance.patch<SystemDeviceSetupRequestResponse>(
    `/auth/system/support/device-setup/${id}/approve`,
    body ?? {},
  )
  return data
}

// TRU-FE-5 § 3 — Approval Queue card counts.
export async function getSystemDeviceSetupSummary() {
  const { data } = await axiosInstance.get<SystemDeviceSetupSummaryResponse>('/auth/system/support/device-setup/summary')
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

export async function sendTestAlert(payload?: SendTestAlertPayload) {
  const { data } = await axiosInstance.post<SendTestAlertResponse>('/auth/system/alert-settings/test', payload?.data ?? {})
  return data
}

export async function getAdminNotifications(payload?: AdminNotificationsQuery) {
  const { data } = await axiosInstance.get<AdminNotificationsResponse>('/auth/system/notifications', {
    params: payload?.params,
  })
  return data
}

export async function markAdminNotificationRead({ id }: { id: string }) {
  const { data } = await axiosInstance.post<AdminNotificationReadResponse>(`/auth/system/notifications/${id}/read`)
  return data
}

export async function markAllAdminNotificationsRead() {
  const { data } = await axiosInstance.post<AdminNotificationReadResponse>('/auth/system/notifications/read-all')
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

export async function exportDataBundleWalletLedger(params?: DataBundleLedgerFilters) {
  const { data } = await axiosInstance.get<Blob>('/auth/data-bundles/ledger/export', {
    responseType: 'blob',
    params,
  })
  return data
}

// ─── Platform Wallets ─────────────────────────────────────────────────────────

export async function getPlatformWallets(payload?: PlatformWalletsQuery) {
  const { data } = await axiosInstance.get<PlatformWalletsResponse>('/auth/system/wallets', {
    params: payload?.params,
  })
  return data
}

export async function getSystemWallets(payload?: PlatformWalletsQuery) {
  const { data } = await axiosInstance.get<SystemWalletsResponse>('/auth/system/wallets', {
    params: payload?.params,
  })
  return data
}

export async function getPlatformWalletLedger(payload?: PlatformWalletLedgerQuery) {
  const { data } = await axiosInstance.get<PlatformWalletLedgerResponse>('/auth/system/wallets/ledger', {
    params: payload?.params,
  })
  return data
}

export async function platformTopUpWallet({ tenantId, data: body }: PlatformTopUpPayload) {
  const { data } = await axiosInstance.post<PlatformTopUpResponse>(
    `/auth/system/wallets/${tenantId}/top-up`,
    body,
  )
  return data
}

export async function updatePlatformWalletCreditSettings({
  tenantId,
  data: body,
}: PlatformWalletCreditSettingsPayload) {
  const { data } = await axiosInstance.put<PlatformWalletCreditSettingsResponse>(
    `/auth/system/wallets/${tenantId}/credit-settings`,
    body,
  )
  return data
}

export async function getSystemSecurityOverview() {
  const { data } = await axiosInstance.get<SystemSecurityOverviewResponse>('/auth/system/security/overview')
  return data
}

export async function getSystemFailedLogins(payload?: SystemFailedLoginsQuery) {
  const { data } = await axiosInstance.get<SystemFailedLoginsResponse>('/auth/system/security/failed-logins', {
    params: payload?.params,
  })
  return data
}

export async function getSystemAuthEvents(payload?: SystemAuthEventsQuery) {
  const { data } = await axiosInstance.get<SystemAuthEventsResponse>('/auth/system/security/auth-events', {
    params: payload?.params,
  })
  return data
}

export async function getSystemAutoBlockRules() {
  const { data } = await axiosInstance.get<SystemAutoBlockRulesResponse>(
    '/auth/system/security/auto-block-rules',
  )
  return data
}

export async function updateSystemAutoBlockRule({ id, data: body }: UpdateSystemAutoBlockRulePayload) {
  const { data } = await axiosInstance.patch<UpdateSystemAutoBlockRuleResponse>(
    `/auth/system/security/auto-block-rules/${id}`,
    body,
  )
  return data
}

export async function getSystemSecurityEvents(payload?: SystemSecurityEventsQuery) {
  const { data } = await axiosInstance.get<SystemSecurityEventsResponse>(
    '/auth/system/security/events',
    { params: payload?.params },
  )
  return data
}

// ─── Onboarding Applications (public, X-Application-Token) ───────────────────
// 404 from onboardingInstance means 'wrong or missing token' (or an expired draft) — do NOT
// surface it as 'not found' in the UI.

const ONBOARDING = '/auth/onboarding/applications'

export async function createOnboardingApplication({ data }: CreateOnboardingApplicationPayload) {
  const { data: res } = await onboardingInstance.post<CreateOnboardingApplicationResponse>(ONBOARDING, data)
  return res
}

export async function getOnboardingApplication({ id }: { id: string }) {
  const { data } = await onboardingInstance.get<OnboardingApplicationResponse>(`${ONBOARDING}/${id}`)
  return data
}

export async function updateOnboardingApplication({ id, data }: UpdateOnboardingApplicationPayload) {
  const { data: res } = await onboardingInstance.patch<OnboardingApplicationResponse>(`${ONBOARDING}/${id}`, data)
  return res
}

export async function getOnboardingM2mPlans() {
  const { data } = await onboardingInstance.get<OnboardingM2mPlansResponse>(`${ONBOARDING}/m2m-plans`)
  return data
}

export async function getOnboardingEmailAvailability({ email, applicationId }: { email: string, applicationId?: string }) {
  const { data } = await onboardingInstance.get<OnboardingEmailAvailabilityResponse>(
    `${ONBOARDING}/email-availability`,
    { params: { email, applicationId } },
  )
  return data
}

export async function verifyOnboardingTelecomMasterNumber(msisdn: string) {
  const { data } = await onboardingInstance.post<VerifyOnboardingTelecomMasterNumberResponse>(
    `${ONBOARDING}/telecom-master/verify`,
    { msisdn },
  )
  return data
}

export async function getOnboardingIndemnityAgreement() {
  const { data } = await onboardingInstance.get<OnboardingIndemnityAgreementResponse>(`${ONBOARDING}/indemnity-agreement`)
  return data
}

export async function signOnboardingIndemnity({ id, signerName, templateVersion, method, file }: SignOnboardingIndemnityPayload) {
  const form = new FormData()
  form.append('signer_name', signerName)
  form.append('template_version', templateVersion)
  form.append('method', method)
  form.append('file', file, file instanceof File ? file.name : 'signature.png')
  const { data } = await onboardingInstance.post<SignOnboardingIndemnityResponse>(
    `${ONBOARDING}/${id}/indemnity-signature`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

/** Always answers the same, whether or not an application exists — don't branch on it. */
export async function resumeOnboardingApplication({ data }: ResumeOnboardingApplicationPayload) {
  const { data: res } = await onboardingInstance.post<ServerResponse<unknown>>(`${ONBOARDING}/resume`, data)
  return res
}

export async function uploadOnboardingApplicationDocument({
  id,
  documentType,
  vehicleId,
  file,
}: UploadOnboardingApplicationDocumentPayload) {
  const form = new FormData()
  form.append('document_type', documentType)
  if (vehicleId)
    form.append('vehicle_id', vehicleId)
  form.append('file', file)
  const { data } = await onboardingInstance.post<OnboardingApplicationResponse>(
    `${ONBOARDING}/${id}/documents`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function deleteOnboardingApplicationDocument({
  id,
  documentId,
}: DeleteOnboardingApplicationDocumentPayload) {
  const { data } = await onboardingInstance.delete<OnboardingApplicationResponse>(`${ONBOARDING}/${id}/documents/${documentId}`)
  return data
}

/** The vehicle licence travels with the vehicle: the server refuses a vehicle without it. */
export async function addOnboardingVehicle({ id, data, licence }: AddOnboardingVehiclePayload) {
  const form = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined)
      form.append(key, String(value))
  }
  form.append('file', licence)
  const { data: res } = await onboardingInstance.post<OnboardingApplicationResponse>(
    `${ONBOARDING}/${id}/vehicles`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return res
}

export async function updateOnboardingVehicle({ id, vehicleId, data }: UpdateOnboardingVehiclePayload) {
  const { data: res } = await onboardingInstance.patch<OnboardingApplicationResponse>(`${ONBOARDING}/${id}/vehicles/${vehicleId}`, data)
  return res
}

/** Also removes any licence filed against the vehicle. */
export async function deleteOnboardingVehicle({ id, vehicleId }: DeleteOnboardingVehiclePayload) {
  const { data } = await onboardingInstance.delete<OnboardingApplicationResponse>(`${ONBOARDING}/${id}/vehicles/${vehicleId}`)
  return data
}

export async function importOnboardingVehicles({ id, file }: ImportOnboardingVehiclesPayload) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await onboardingInstance.post<ImportOnboardingVehiclesResponse>(
    `${ONBOARDING}/${id}/vehicles/import`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function getOnboardingVehicleImportTemplate() {
  const { data } = await onboardingInstance.get<Blob>(`${ONBOARDING}/vehicle-import/template`, { responseType: 'blob' })
  return data
}

export async function getOnboardingVehicleImportColumns() {
  const { data } = await onboardingInstance.get<OnboardingVehicleImportColumnsResponse>(`${ONBOARDING}/vehicle-import/columns`)
  return data
}

export async function addOnboardingDeviceRequest({ id, data }: AddOnboardingDeviceRequestPayload) {
  const { data: res } = await onboardingInstance.post<AddOnboardingDeviceRequestResponse>(`${ONBOARDING}/${id}/device-requests`, data)
  return res
}

export async function deleteOnboardingDeviceRequest({ id, requestId }: DeleteOnboardingDeviceRequestPayload) {
  const { data } = await onboardingInstance.delete<OnboardingApplicationResponse>(`${ONBOARDING}/${id}/device-requests/${requestId}`)
  return data
}

export async function updateOnboardingDeviceRequest({ id, requestId, data }: UpdateOnboardingDeviceRequestPayload) {
  const { data: res } = await onboardingInstance.patch<AddOnboardingDeviceRequestResponse>(`${ONBOARDING}/${id}/device-requests/${requestId}`, data)
  return res
}

export async function getPickupLocations() {
  const { data } = await onboardingInstance.get<PickupLocationsResponse>(`${ONBOARDING}/pickup-locations`)
  return data
}

export async function setOnboardingFulfilment({ id, data }: SetOnboardingFulfilmentPayload) {
  const { data: res } = await onboardingInstance.put<OnboardingApplicationResponse>(`${ONBOARDING}/${id}/fulfilment`, data)
  return res
}

/** The landing page contact form: stored and emailed to platform support. */
export async function sendContactEnquiry({ data }: ContactEnquiryPayload) {
  const { data: res } = await onboardingInstance.post<ContactEnquiryResponse>('/auth/contact', data)
  return res
}

export async function sendOnboardingApplicationEmailVerification({ id }: { id: string }) {
  const { data } = await onboardingInstance.post<OnboardingApplicationVerifySendResponse>(`${ONBOARDING}/${id}/verify/email/send`)
  return data
}

export async function verifyOnboardingApplicationEmail({ id, data: body }: OnboardingApplicationVerifyPayload) {
  const { data } = await onboardingInstance.post<OnboardingApplicationResponse>(`${ONBOARDING}/${id}/verify/email`, body)
  return data
}

export async function sendOnboardingApplicationPhoneVerification({ id }: { id: string }) {
  const { data } = await onboardingInstance.post<OnboardingApplicationVerifySendResponse>(`${ONBOARDING}/${id}/verify/phone/send`)
  return data
}

export async function verifyOnboardingApplicationPhone({ id, data: body }: OnboardingApplicationVerifyPayload) {
  const { data } = await onboardingInstance.post<OnboardingApplicationResponse>(`${ONBOARDING}/${id}/verify/phone`, body)
  return data
}

// The submit 400 carries every gate at the top level of the body. It is returned as
// SubmitOnboardingApplicationIncomplete so the UI can send the applicant to the right step;
// anything else (409 claimTypes included) is rethrown as ServerErrorResponse.
export async function submitOnboardingApplication({
  id,
}: {
  id: string
}): Promise<SubmitOnboardingApplicationResponse | SubmitOnboardingApplicationIncomplete> {
  // Let the 400 through as a response: the interceptor would otherwise normalise away its body.
  const res = await onboardingInstance.post<SubmitOnboardingApplicationResponse | Partial<SubmitOnboardingApplicationIncomplete>>(
    `${ONBOARDING}/${id}/submit`,
    undefined,
    { validateStatus: status => (status >= 200 && status < 300) || status === 400 },
  )
  if (res.status !== 400)
    return res.data as SubmitOnboardingApplicationResponse
  const raw = res.data as Partial<SubmitOnboardingApplicationIncomplete>
  return {
    incomplete: true,
    message: typeof raw.message === 'string' ? raw.message : 'Application is incomplete.',
    emailVerified: raw.emailVerified ?? false,
    phoneVerified: raw.phoneVerified ?? false,
    missingDocuments: raw.missingDocuments ?? [],
    vehiclesMissingDocuments: raw.vehiclesMissingDocuments ?? [],
    vehicleCount: raw.vehicleCount ?? 0,
    requestedDevices: raw.requestedDevices ?? 0,
    deviceAllocationComplete: raw.deviceAllocationComplete ?? false,
    inventoryShortfallAccepted: raw.inventoryShortfallAccepted ?? false,
    indemnitySigned: raw.indemnitySigned ?? false,
    planSelected: raw.planSelected ?? false,
  }
}

export async function getOnboardingOrder({ id }: { id: string }) {
  const { data } = await onboardingInstance.get<OnboardingOrderResponse>(`${ONBOARDING}/${id}/order`)
  return data
}

/** Changing the address clears its verification. */
export async function setOnboardingBillingEmail({ id, data }: SetOnboardingBillingEmailPayload) {
  const { data: res } = await onboardingInstance.put<SetOnboardingBillingEmailResponse>(`${ONBOARDING}/${id}/billing-email`, data)
  return res
}

export async function sendOnboardingBillingEmailVerification({ id }: { id: string }) {
  const { data } = await onboardingInstance.post<OnboardingApplicationVerifySendResponse>(`${ONBOARDING}/${id}/verify/billing-email/send`)
  return data
}

export async function verifyOnboardingBillingEmail({ id, data: body }: OnboardingApplicationVerifyPayload) {
  const { data } = await onboardingInstance.post<OnboardingApplicationResponse>(`${ONBOARDING}/${id}/verify/billing-email`, body)
  return data
}

/** Never send a total — the server prices the order itself. Returns the provider's checkout URL. */
export async function startOnboardingPayment({ id, data }: StartOnboardingPaymentPayload) {
  const { data: res } = await onboardingInstance.post<StartOnboardingPaymentResponse>(`${ONBOARDING}/${id}/payment`, data)
  return res
}

/** Asks the provider about a late payment and confirms it if paid. Same shape as getOnboardingOrder. */
export async function verifyOnboardingPayment({ id }: { id: string }) {
  const { data } = await onboardingInstance.post<OnboardingOrderResponse>(`${ONBOARDING}/${id}/payment/verify`)
  return data
}

/** Books the fitting. On success the account exists and the setup link is emailed. */
export async function scheduleOnboardingInstallation({ id, data }: ScheduleOnboardingInstallationPayload) {
  const { data: res } = await onboardingInstance.post<ScheduleOnboardingInstallationResponse>(`${ONBOARDING}/${id}/installation`, data)
  return res
}

export async function getOnboardingApplicationStatus({ id }: { id: string }) {
  const { data } = await onboardingInstance.get<OnboardingApplicationStatusResponse>(`${ONBOARDING}/${id}/status`)
  return data
}

// ─── System Onboarding Applications (bearer) ─────────────────────────────────

export async function getSystemOnboardingApplications(payload?: SystemOnboardingApplicationsQuery) {
  const { data } = await axiosInstance.get<SystemOnboardingApplicationsListResponse>(
    '/auth/system/onboarding/applications',
    { params: payload?.params },
  )
  return data
}

export async function getSystemOnboardingApplication({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SystemOnboardingApplicationResponse>(
    `/auth/system/onboarding/applications/${id}`,
  )
  return data
}

export async function getSystemOnboardingApplicationDocumentLink({
  id,
  documentId,
}: {
  id: string
  documentId: string
}) {
  const { data } = await axiosInstance.get<SystemOnboardingDocumentLinkResponse>(
    `/auth/system/onboarding/applications/${id}/documents/${documentId}/link`,
  )
  return data
}

export async function approveSystemOnboardingApplicationDocument({
  id,
  documentId,
}: SystemOnboardingApplicationDocumentActionPayload) {
  const { data } = await axiosInstance.patch<SystemOnboardingApplicationDocumentResponse>(
    `/auth/system/onboarding/applications/${id}/documents/${documentId}/approve`,
  )
  return data
}

export async function rejectSystemOnboardingApplicationDocument({
  id,
  documentId,
  data: body,
}: SystemRejectOnboardingApplicationDocumentPayload) {
  const { data } = await axiosInstance.patch<SystemOnboardingApplicationDocumentResponse>(
    `/auth/system/onboarding/applications/${id}/documents/${documentId}/reject`,
    body,
  )
  return data
}

export async function approveSystemOnboardingApplication({ id }: { id: string }) {
  const { data } = await axiosInstance.post<SystemApproveOnboardingApplicationResponse>(
    `/auth/system/onboarding/applications/${id}/approve`,
  )
  return data
}

export async function rejectSystemOnboardingApplication({
  id,
  data: body,
}: SystemRejectOnboardingApplicationPayload) {
  const { data } = await axiosInstance.post<SystemOnboardingDecisionResponse>(
    `/auth/system/onboarding/applications/${id}/reject`,
    body,
  )
  return data
}

export async function requestChangesSystemOnboardingApplication({
  id,
  data: body,
}: SystemRequestChangesOnboardingApplicationPayload) {
  const { data } = await axiosInstance.post<SystemOnboardingDecisionResponse>(
    `/auth/system/onboarding/applications/${id}/request-changes`,
    body,
  )
  return data
}

export async function resendSystemOnboardingApplicationSetupLink({ id }: { id: string }) {
  const { data } = await axiosInstance.post<SystemOnboardingSetupLinkResendResponse>(
    `/auth/system/onboarding/applications/${id}/setup-link/resend`,
  )
  return data
}

export async function resendSystemOnboardingApplicationChangesLink({ id }: { id: string }) {
  const { data } = await axiosInstance.post<SystemOnboardingChangesLinkResendResponse>(
    `/auth/system/onboarding/applications/${id}/changes-link/resend`,
  )
  return data
}

export async function resendSystemOnboardingApplicationPaymentLink({ id }: { id: string }) {
  const { data } = await axiosInstance.post<SystemOnboardingPaymentLinkResendResponse>(
    `/auth/system/onboarding/applications/${id}/payment-link/resend`,
  )
  return data
}

export async function getSystemOnboardingApplicationTimeline({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SystemOnboardingTimelineResponse>(
    `/auth/system/onboarding/applications/${id}/timeline`,
  )
  return data
}

// Devices and SIMs are physically allocated — this is what opens payment for the applicant.
export async function markSystemOnboardingApplicationProvisioned({ id, data: body }: SystemOnboardingProvisionedPayload) {
  const { data } = await axiosInstance.post<SystemOnboardingProvisionedResponse>(
    `/auth/system/onboarding/applications/${id}/provisioned`,
    body ?? {},
  )
  return data
}

function onboardingPaymentPath(id: string, paymentId: string | undefined, action: 'review' | 'refund') {
  const payment = paymentId ? `/${paymentId}` : ''
  return `/auth/system/onboarding/applications/${id}/payment${payment}/${action}`
}

export async function reviewSystemOnboardingPayment({ id, paymentId, data: body }: SystemReviewOnboardingPaymentPayload) {
  const { data } = await axiosInstance.post<SystemReviewOnboardingPaymentResponse>(
    onboardingPaymentPath(id, paymentId, 'review'),
    body,
  )
  return data
}

export async function refundSystemOnboardingPayment({ id, paymentId, data: body }: SystemRefundOnboardingPaymentPayload) {
  const { data } = await axiosInstance.post<SystemRefundOnboardingPaymentResponse>(
    onboardingPaymentPath(id, paymentId, 'refund'),
    body,
  )
  return data
}

// ─── Platform Integrations ───────────────────────────────────────────────────

export async function getPlatformIntegrations() {
  const { data } = await axiosInstance.get<PlatformIntegrationsResponse>('/auth/system/integrations')
  return data
}

export async function updatePlatformIntegration({
  serviceKey,
  data: body,
}: UpdatePlatformIntegrationPayload) {
  const { data } = await axiosInstance.put<PlatformIntegrationResponse>(
    `/auth/system/integrations/${serviceKey}`,
    body,
  )
  return data
}

// ─── Communications Wallet ───────────────────────────────────────────────────

export async function getCommunicationsWalletRates() {
  const { data } = await axiosInstance.get<CommunicationsWalletRatesResponse>(
    '/auth/communications-wallet/rates',
  )
  return data
}

export async function getCommunicationsWalletSpendTrend(payload?: CommunicationsWalletRangeQuery) {
  const { data } = await axiosInstance.get<CommunicationsWalletSpendTrendResponse>(
    '/auth/communications-wallet/spend-trend',
    { params: payload?.params },
  )
  return data
}

export async function getCommunicationsWalletSpendBreakdown(
  payload?: CommunicationsWalletRangeQuery,
) {
  const { data } = await axiosInstance.get<CommunicationsWalletSpendBreakdownResponse>(
    '/auth/communications-wallet/spend-breakdown',
    { params: payload?.params },
  )
  return data
}

// ─── System Billing — bundle adoption + bundle catalog list ──────────────────

export async function getBundleAdoption(payload?: BundleAdoptionQuery) {
  const { data } = await axiosInstance.get<BundleAdoptionResponse>('/auth/system/bundle-adoption', {
    params: payload?.params,
  })
  return data
}

export async function getBundleSummary() {
  const { data } = await axiosInstance.get<BundleSummaryResponse>('/auth/system/bundle-catalog/summary')
  return data
}

export async function exportBundleCatalog(payload?: BundleCatalogQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/system/bundle-catalog/export', {
    params: payload?.params,
    responseType: 'blob',
  })
  return data
}

export async function getSystemSimImportTemplate() {
  const { data } = await axiosInstance.get<Blob>('/auth/system/sims/import/template', {
    responseType: 'blob',
  })
  return data
}

export async function exportBundleAdoption(payload?: BundleAdoptionQuery) {
  const { data } = await axiosInstance.get<Blob>('/auth/system/bundle-adoption/export', {
    params: payload?.params,
    responseType: 'blob',
  })
  return data
}

export async function getBundleCatalog(payload?: BundleCatalogQuery) {
  const { data } = await axiosInstance.get<BundleCatalogListResponse>('/auth/system/bundle-catalog', {
    params: payload?.params,
  })
  return data
}

// ─── Mailbox message flags ───────────────────────────────────────────────────

export async function updateMailboxMessageFlags({
  id,
  data: body,
}: UpdateMailboxMessageFlagsPayload) {
  const { data } = await axiosInstance.patch<MailboxMessageFlagsResponse>(
    `/auth/mailbox/messages/${id}/flags`,
    body,
  )
  return data
}

// ─── Support Tickets (tenant) — reply / close / reopen ───────────────────────

export async function replySupportTicket({ id, data: body }: ReplySupportTicketPayload) {
  const { data } = await axiosInstance.post<SupportTicketReplyResponse>(
    `/auth/support-tickets/${id}/reply`,
    body,
  )
  return data
}

export async function closeSupportTicket({ id }: CloseSupportTicketPayload) {
  const { data } = await axiosInstance.post<ServerResponse<unknown>>(
    `/auth/support-tickets/${id}/close`,
  )
  return data
}

export async function reopenSupportTicket({ id, data: body }: ReopenSupportTicketPayload) {
  const { data } = await axiosInstance.post<ServerResponse<unknown>>(
    `/auth/support-tickets/${id}/reopen`,
    body,
  )
  return data
}

// ─── System Subscription Plans — entitlements ────────────────────────────────

export async function updateSubscriptionPlanEntitlements({
  id,
  data: body,
}: UpdateSubscriptionPlanEntitlementsPayload) {
  await axiosInstance.patch(`/auth/system/subscription-plans/${id}/entitlements`, body)
}

// ─── System — cross-tenant audit log ─────────────────────────────────────────

export async function getSystemAuditLog(payload?: SystemAuditLogQuery) {
  const { data } = await axiosInstance.get<SystemAuditLogResponse>(
    '/auth/system/audit-log',
    { params: payload?.params },
  )
  return data
}

export async function getSystemActionHistory({ prefixes, tenantId, limit = 500 }: SystemActionHistoryQuery): Promise<SystemAuditLogEntry[]> {
  const groups = await Promise.all(
    prefixes.map((prefix) => getSystemAuditLog({ params: { search: prefix, tenantId, limit } })),
  )
  return groups
    .flatMap((res) => res.data.items)
    .filter((entry) => prefixes.some((prefix) => entry.action.startsWith(prefix)))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}

export async function getSystemAuditLogFilters() {
  const { data } = await axiosInstance.get<SystemAuditLogFiltersResponse>(
    '/auth/system/audit-log/filters',
  )
  return data
}

export async function verifySystemAuditLog() {
  const { data } = await axiosInstance.get<SystemAuditLogVerifyResponse>(
    '/auth/system/audit-log/verify',
  )
  return data
}

export async function exportSystemAuditLog(payload?: SystemAuditLogQuery) {
  const res = await axiosInstance.get<Blob>('/auth/system/audit-log/export', {
    params: payload?.params,
    responseType: 'blob',
  })
  return res.data
}

// ─── System — tenant terminate / detail resource tabs / docs / audit ─────────

export async function terminateSystemTenant({ id, data }: TerminateSystemTenantPayload) {
  const { data: res } = await axiosInstance.post<TerminateSystemTenantResponse>(
    `/auth/system/tenants/${id}/terminate`,
    data,
  )
  return res
}

export async function getSystemTenantResources({
  id,
  tab,
  planCode,
}: SystemTenantResourcesPayload) {
  const { data } = await axiosInstance.get<SystemTenantResourcesResponse<unknown>>(
    `/auth/system/tenants/${id}/resources/${tab}`,
    { params: planCode ? { planCode } : undefined },
  )
  return data
}

export async function getSystemTenantDocuments({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SystemTenantDocumentsResponse>(
    `/auth/system/tenants/${id}/documents`,
  )
  return data
}

export async function getSystemTenantAuditLog({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SystemTenantAuditLogResponse>(
    `/auth/system/tenants/${id}/audit-log`,
  )
  return data
}

export async function getSystemOnboardingApplicationsSummary() {
  const { data } = await axiosInstance.get<SystemOnboardingApplicationsSummaryResponse>(
    '/auth/system/onboarding/applications/summary',
  )
  return data
}

// ─── System — tenant limits, trial and data export ───────────────────────────

export async function updateSystemTenantQuotas({ id, data }: UpdateSystemTenantQuotasPayload) {
  const { data: res } = await axiosInstance.patch<SystemTenantQuotasResponse>(`/auth/system/tenants/${id}/quotas`, data)
  return res
}

export async function extendSystemTenantTrial({ id, data }: ExtendSystemTenantTrialPayload) {
  const { data: res } = await axiosInstance.post<SystemTenantTrialResponse>(`/auth/system/tenants/${id}/trial/extend`, data)
  return res
}

export async function convertSystemTenantTrial({ id, data }: ConvertSystemTenantTrialPayload) {
  const { data: res } = await axiosInstance.post<SystemTenantTrialResponse>(`/auth/system/tenants/${id}/trial/convert`, data ?? {})
  return res
}

export async function requestSystemTenantExport({ id, data }: RequestSystemTenantExportPayload) {
  const { data: res } = await axiosInstance.post<SystemTenantExportResponse>(`/auth/system/tenants/${id}/exports`, data)
  return res
}

export async function getSystemTenantExports({ id }: { id: string }) {
  const { data } = await axiosInstance.get<SystemTenantExportsResponse>(`/auth/system/tenants/${id}/exports`)
  return data
}

export async function downloadSystemTenantExport({ id, exportId }: DownloadSystemTenantExportPayload) {
  const { data } = await axiosInstance.get<Blob>(`/auth/system/tenants/${id}/exports/${exportId}/download`, {
    responseType: 'blob',
  })
  return data
}

/** SIP settings for the browser dialer. The Fonu key stays on the server. */
export async function getClickToCallCredentials() {
  const { data } = await axiosInstance.get<ServerResponse<ClickToCallCredentials>>('/auth/telephony/click-to-call-credentials')
  return data.data
}

export async function getInstallationStatus() {
  const { data } = await axiosInstance.get<import('./types').InstallationStatusResponse>('/auth/installation/status')
  return data
}

export async function confirmInstallation() {
  const { data } = await axiosInstance.post<import('./types').InstallationConfirmationResponse>('/auth/installation/confirm')
  return data
}
