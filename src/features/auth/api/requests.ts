import { axiosInstance, ServerSuccessResponse } from "@/shared/utils/axios-instance";
import { RegisterPayload, LoginPayload, Authentication, GetNewAccessTokenPayload, User, UpdateUserProfilePayload, NotificationPreferencesResponse, UpdateNotificationPreferencesPayload, DispatchPreferencesResponse, UpdateDispatcherPreferencesPayload, OrganizationSettings, UpdateOrganizationsSettingsPayload, InviteMemberPayload, RegisterInviteMemberPayload, ResetPasswordPayload, ChangeUserRolePayload, LogoutPayload, LogOutResponse, ForgetPasswordPayload, VerifyPasswordResetPayload, VerifyPasswordResetResponse, UploadImageToBucketPayload, UploadedImage, VerifyEmailPayload, InvitedUsers, UpdateInvitedUserPayload, UpdateInvitedUserResponse, RemoveInvitedUserPayload, RemoveInvitedUserResponse, ResendInvitedUserMailPayload, ResendInvitedUserMailRepsonse } from "./types";
import { useAuthStore } from "@/stores/authStore";

export async function register(payload: RegisterPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<Omit<Authentication, "user">>>(
    "/auth/register",
    payload.data
  );
  return data;
}

export async function login(payload: LoginPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<Authentication>>(
    "/auth/login",
    payload.data
  );
  return data;
}

export async function getNewAccessToken(payload: GetNewAccessTokenPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<Authentication>>(
    "/auth/refresh",
    payload.data
  );
  return data;
}

export async function inviteMember(payload: InviteMemberPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse>('/auth/invite', payload.data)
  return data
}

export async function getInvitedUsers() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<InvitedUsers>>("/auth/organization/users");
  return data;
}

export async function updateInvitedUser(payload: UpdateInvitedUserPayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<UpdateInvitedUserResponse>>(`/auth/organization/users/${payload.userId}`, payload.data)
  return data;
}

export async function removeInvitedUser(payload: RemoveInvitedUserPayload) {
  const { data } = await axiosInstance.delete<ServerSuccessResponse<RemoveInvitedUserResponse>>(`/auth/organization/users/${payload.userId}`)
  return data;
}

export async function resendInvitedUserMail(payload: ResendInvitedUserMailPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<ResendInvitedUserMailRepsonse>>("/auth/organization/invites/resend", payload.data)
  return data;
}

export async function registerInvitedMember(payload: RegisterInviteMemberPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse>("/auth/register/invited", payload.data)
  return data
}

export async function forgetPassword(payload: ForgetPasswordPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse>("/auth/forgot-password", payload.data)
  return data
}

export async function verifyEmail(payload: VerifyEmailPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse>("/auth/verify-email", payload.data)
  return data
}

export async function verifyPasswordReset(payload: VerifyPasswordResetPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<VerifyPasswordResetResponse>>('/auth/verify-reset', payload.data)
  return data
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse>('/auth/reset-password', payload.data)
  return data;
}

export async function changeUserRole(payload: ChangeUserRolePayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse>('/auth/change-role', payload.data)
  return data;
}

export async function logout(payload: LogoutPayload) {
  const { data } = await axiosInstance.post<ServerSuccessResponse<LogOutResponse>>('/auth/logout', payload.data)
  return data;
}

export async function getUserProfile() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<User>>("/auth/profile")
  if (data.status) {
    useAuthStore.getState().setUser(data.data)
  }
  return data
}

export async function updateUserProfile(payload: UpdateUserProfilePayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<User>>("/auth/profile", payload.data)
  return data;
}

export async function getNotificationsPreferences() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<NotificationPreferencesResponse>>("/auth/preferences/notifications");
  return data;
}

export async function updateNotificationsPreferences(payload: UpdateNotificationPreferencesPayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<NotificationPreferencesResponse>>("/auth/preferences/notifications", payload.data);
  return data;
}

export async function getDispatcherPreferences() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<DispatchPreferencesResponse>>("/auth/preferences/dispatch");
  return data;
}

export async function updateDispatcherPreferences(payload: UpdateDispatcherPreferencesPayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<NotificationPreferencesResponse>>("/auth/preferences/dispatch", payload.data);
  return data;
}

export async function getOrganizationsSettings() {
  const { data } = await axiosInstance.get<ServerSuccessResponse<OrganizationSettings>>("/auth/organization/settings");
  return data;
}

export async function updateOrganizationsSettings(payload: UpdateOrganizationsSettingsPayload) {
  const { data } = await axiosInstance.patch<ServerSuccessResponse<OrganizationSettings>>("/auth/organization/settings", payload.data);
  return data;
}

export async function uploadMediaToBucket(payload: UploadImageToBucketPayload) {
  const formData = new FormData()
  const files = payload.files

  files.forEach((file) => formData.append("file", file))

  const { data } = await axiosInstance.post<ServerSuccessResponse<UploadedImage>>("/auth/media/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })

  return data;
}
