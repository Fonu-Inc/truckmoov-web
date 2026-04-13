import { axiosInstance, ServerSuccessResponse } from "@/shared/utils/axios-instance";
import { useAuthStore } from "@/stores/authStore";
import type {
  ActivityLogEntry,
  ActivityLogQuery,
  AuthMeResponse,
  Authentication,
  ChangeSystemPasswordPayload,
  ChangeUserRolePayload,
  CreateSystemDeviceModelPayload,
  CompleteProfilePayload,
  CreateSystemAdminPayload,
  CreateSystemTenantPayload,
  DispatchPreferencesResponse,
  ForgetPasswordPayload,
  GetNewAccessTokenPayload,
  InviteMemberPayload,
  InvitedUsers,
  LoginPayload,
  LogoutPayload,
  NotificationPreferencesResponse,
  OrganizationSettings,
  ProfileUser,
  RegisterInviteMemberPayload,
  RegisterPayload,
  RemoveInvitedUserPayload,
  RemoveInvitedUserResponse,
  ResendInvitedUserMailPayload,
  ResendInvitedUserMailResponse,
  ResetPasswordPayload,
  Session,
  SystemDeviceCatalogDeleteData,
  SystemDeviceCatalogListData,
  SystemDeviceCatalogModel,
  SystemDeviceCatalogQuery,
  SystemDeviceCatalogReferenceData,
  SystemDeviceInventoryListData,
  SystemDeviceInventoryQuery,
  SystemDeviceSummaryData,
  SystemDashboard,
  SystemSubscriptionPlansResponse,
  SystemTenantDetail,
  SystemTenantDeleteResponse,
  SystemTenantOnboarding,
  SystemTenantOnboardingReferenceData,
  SystemTenantsListResponse,
  SystemTenantsQuery,
  SystemTenantsSummary,
  UpdateDispatcherPreferencesPayload,
  UpdateInvitedUserPayload,
  UpdateInvitedUserResponse,
  UpdateNotificationPreferencesPayload,
  UpdateOrganizationsSettingsPayload,
  UpdateOrganizationUserStatusPayload,
  UpdateSystemAdminStatusPayload,
  UpdateSystemDeviceModelPayload,
  UpdateSystemTenantPayload,
  UpdateSystemTenantStatusPayload,
  UpdateUserProfilePayload,
  UploadImageToBucketPayload,
  UploadedImage,
  User,
  VerifyEmailPayload,
  VerifyEmailResponse,
  VerifyPasswordResetPayload,
  VerifyPasswordResetResponse,
} from "./types";

function mapProfileUserToStoreUser(user: ProfileUser): User {
  return {
    id: user.userId,
    userId: user.userId,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
    name: user.profile?.fullName ?? undefined,
    avatar: user.profile?.profilePictureUrl ?? undefined,
    profile: user.profile,
    accountStatus: user.accountStatus,
  };
}

export async function register(payload: RegisterPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<Session>>("/auth/register", payload.data);
  return data;
}

export async function login(payload: LoginPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<Authentication>>("/auth/login", payload.data);
  return data;
}

export async function systemLogin(payload: LoginPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<Authentication>>("/auth/system/login", payload.data);
  return data;
}

export async function getNewAccessToken(payload: GetNewAccessTokenPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<Session>>("/auth/refresh", payload.data);
  return data;
}

export async function changeSystemPassword(payload: ChangeSystemPasswordPayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<Session>>(
    "/auth/system/change-password",
    payload.data
  );
  return data;
}

export async function getSystemSubscriptionPlans() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<SystemSubscriptionPlansResponse>>(
    "/auth/system/subscription-plans"
  );
  return data;
}

export async function inviteMember(payload: InviteMemberPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<null>>("/auth/invite", payload.data);
  return data;
}

export async function getInvitedUsers() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<InvitedUsers>>("/auth/organization/users");
  return data;
}

export async function updateInvitedUser(payload: UpdateInvitedUserPayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<UpdateInvitedUserResponse>>(
    `/auth/organization/users/${payload.userId}`,
    payload.data
  );
  return data;
}

export async function removeInvitedUser(payload: RemoveInvitedUserPayload) {
  const { data } = await axiosInstance.delete<ServerSuccessResponse<RemoveInvitedUserResponse>>(
    `/auth/organization/users/${payload.userId}`
  );
  return data;
}

export async function updateOrganizationUserStatus(payload: UpdateOrganizationUserStatusPayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<UpdateInvitedUserResponse>>(
    `/auth/organization/users/${payload.userId}/status`,
    payload.data
  );
  return data;
}

export async function resendInvitedUserMail(payload: ResendInvitedUserMailPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<ResendInvitedUserMailResponse>>(
    "/auth/organization/invites/resend",
    payload.data
  );
  return data;
}

export async function registerInvitedMember(payload: RegisterInviteMemberPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<Session>>("/auth/register/invited", payload.data);
  return data;
}

export async function completeProfile(payload: CompleteProfilePayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<null>>("/auth/complete-profile", payload.data);
  return data;
}

export async function forgetPassword(payload: ForgetPasswordPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<null>>("/auth/forgot-password", payload.data);
  return data;
}

export async function verifyEmail(payload: VerifyEmailPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<VerifyEmailResponse>>("/auth/verify-email", payload.data);
  return data;
}

export async function verifyPasswordReset(payload: VerifyPasswordResetPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<VerifyPasswordResetResponse>>(
    "/auth/verify-reset",
    payload.data
  );
  return data;
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<null>>("/auth/reset-password", payload.data);
  return data;
}

export async function changeUserRole(payload: ChangeUserRolePayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<null>>("/auth/change-role", payload.data);
  return data;
}

export async function logout(payload: LogoutPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<null>>("/auth/logout", payload.data);
  return data;
}

export async function getUserProfile() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<ProfileUser>>("/auth/profile");
  if (data.status) {
    useAuthStore.getState().setUser(mapProfileUserToStoreUser(data.data));
  }
  return data;
}

export async function getAuthMe() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<AuthMeResponse>>("/auth/me");
  return data;
}

export async function updateUserProfile(payload: UpdateUserProfilePayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<ProfileUser>>("/auth/profile", payload.data);
  return data;
}

export async function getNotificationsPreferences() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<NotificationPreferencesResponse>>(
    "/auth/preferences/notifications"
  );
  return data;
}

export async function updateNotificationsPreferences(payload: UpdateNotificationPreferencesPayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<NotificationPreferencesResponse>>(
    "/auth/preferences/notifications",
    payload.data
  );
  return data;
}

export async function getDispatcherPreferences() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<DispatchPreferencesResponse>>(
    "/auth/preferences/dispatch"
  );
  return data;
}

export async function updateDispatcherPreferences(payload: UpdateDispatcherPreferencesPayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<DispatchPreferencesResponse>>(
    "/auth/preferences/dispatch",
    payload.data
  );
  return data;
}

export async function getOrganizationsSettings() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<OrganizationSettings>>("/auth/organization/settings");
  return data;
}

export async function updateOrganizationsSettings(payload: UpdateOrganizationsSettingsPayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<OrganizationSettings>>(
    "/auth/organization/settings",
    payload.data
  );
  return data;
}

export async function getActivityLog(payload?: ActivityLogQuery) {
  const { data } = await axiosInstance.get<ServerSuccessResponse<ActivityLogEntry[]>>("/auth/activity-log", {
    params: payload,
  });
  return data;
}

export async function getSystemDeviceInventory(payload?: SystemDeviceInventoryQuery) {
  const { data } = await axiosInstance.get<ServerSuccessResponse<SystemDeviceInventoryListData>>("/auth/system/devices", {
    params: payload,
  });
  return data;
}

export async function getSystemDeviceSummary() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<SystemDeviceSummaryData>>(
    "/auth/system/devices/summary"
  );
  return data;
}

export async function exportSystemDeviceInventory(payload?: SystemDeviceInventoryQuery) {
  const { data } = await axiosInstance.get<Blob>("/auth/system/devices/export", {
    params: payload,
    responseType: "blob",
  });
  return data;
}

export async function getSystemDeviceCatalog(payload?: SystemDeviceCatalogQuery) {
  const { data } = await axiosInstance.get<ServerSuccessResponse<SystemDeviceCatalogListData>>(
    "/auth/system/devices/catalog",
    {
      params: payload,
    }
  );
  return data;
}

export async function createSystemDeviceModel(payload: CreateSystemDeviceModelPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<SystemDeviceCatalogModel>>(
    "/auth/system/devices/catalog",
    payload.data
  );
  return data;
}

export async function updateSystemDeviceModel(payload: UpdateSystemDeviceModelPayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<SystemDeviceCatalogModel>>(
    `/auth/system/devices/catalog/${payload.deviceModelId}`,
    payload.data
  );
  return data;
}

export async function deleteSystemDeviceModel(deviceModelId: string) {
  const { data } = await axiosInstance.delete<ServerSuccessResponse<SystemDeviceCatalogDeleteData>>(
    `/auth/system/devices/catalog/${deviceModelId}`
  );
  return data;
}

export async function getSystemDeviceCatalogReferenceData() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<SystemDeviceCatalogReferenceData>>(
    "/auth/system/reference-data/device-catalog"
  );
  return data;
}

export async function createSystemAdmin(payload: CreateSystemAdminPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<UpdateInvitedUserResponse>>(
    "/auth/system/admins",
    payload.data
  );
  return data;
}

export async function getSystemAdmins() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<InvitedUsers>>("/auth/system/admins");
  return data;
}

export async function updateSystemAdminStatus(payload: UpdateSystemAdminStatusPayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<UpdateInvitedUserResponse>>(
    `/auth/system/admins/${payload.userId}/status`,
    payload.data
  );
  return data;
}

export async function createSystemTenant(payload: CreateSystemTenantPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<SystemTenantOnboarding>>(
    "/auth/system/tenants",
    payload.data
  );
  return data;
}

export async function getSystemTenants(payload?: SystemTenantsQuery) {
  const { data } = await axiosInstance.get<ServerSuccessResponse<SystemTenantsListResponse>>("/auth/system/tenants", {
    params: payload,
  });
  return data;
}

export async function getSystemActivityLog(payload?: ActivityLogQuery) {
  const { data } = await axiosInstance.get<ServerSuccessResponse<ActivityLogEntry[]>>("/auth/system/activity-log", {
    params: payload,
  });
  return data;
}

export async function getSystemDashboard() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<SystemDashboard>>("/auth/system/dashboard");
  return data;
}

export async function getSystemTenantsSummary() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<SystemTenantsSummary>>(
    "/auth/system/tenants/summary"
  );
  return data;
}

export async function exportSystemTenants(payload?: SystemTenantsQuery) {
  const { data } = await axiosInstance.get<Blob>("/auth/system/tenants/export", {
    params: payload,
    responseType: "blob",
  });
  return data;
}

export async function getSystemTenantOnboardingReferenceData() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<SystemTenantOnboardingReferenceData>>(
    "/auth/system/reference-data/tenant-onboarding"
  );
  return data;
}

export async function getSystemTenant(tenantId: string) {
  const { data } = await axiosInstance.get<ServerSuccessResponse<SystemTenantDetail>>(
    `/auth/system/tenants/${tenantId}`
  );
  return data;
}

export async function updateSystemTenantStatus(payload: UpdateSystemTenantStatusPayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<SystemTenantDetail>>(
    `/auth/system/tenants/${payload.tenantId}/status`,
    payload.data
  );
  return data;
}

export async function updateSystemTenant(payload: UpdateSystemTenantPayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<SystemTenantDetail>>(
    `/auth/system/tenants/${payload.tenantId}`,
    payload.data
  );
  return data;
}

export async function deleteSystemTenant(tenantId: string) {
  const { data } = await axiosInstance.delete<ServerSuccessResponse<SystemTenantDeleteResponse>>(
    `/auth/system/tenants/${tenantId}`
  );
  return data;
}

export async function uploadMediaToBucket(payload: UploadImageToBucketPayload) {
  const formData = new FormData();

  payload.files.forEach((file) => {
    formData.append("file", file);
  });

  const { data } = await axiosInstance.post<ServerSuccessResponse<UploadedImage>>("/auth/media/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}
