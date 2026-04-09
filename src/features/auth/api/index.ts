import { queryOptions, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/shared/lib/appRoutes";
import { queryClient } from "@/shared/providers/TanstackQueryProvider";
import { useAuthStore } from "@/stores/authStore";
import {
  changeSystemPassword,
  changeUserRole,
  completeProfile,
  createSystemAdmin,
  createSystemTenant,
  exportSystemTenants,
  forgetPassword,
  getActivityLog,
  getDispatcherPreferences,
  getInvitedUsers,
  getNotificationsPreferences,
  getOrganizationsSettings,
  getSystemActivityLog,
  getSystemAdmins,
  getSystemDashboard,
  getSystemTenant,
  getSystemTenantOnboardingReferenceData,
  getSystemTenants,
  getSystemTenantsSummary,
  getUserProfile,
  inviteMember,
  login,
  logout,
  register,
  registerInvitedMember,
  removeInvitedUser,
  resendInvitedUserMail,
  resetPassword,
  systemLogin,
  updateDispatcherPreferences,
  updateInvitedUser,
  updateNotificationsPreferences,
  updateOrganizationsSettings,
  updateOrganizationUserStatus,
  updateSystemAdminStatus,
  updateSystemTenantStatus,
  updateUserProfile,
  uploadMediaToBucket,
  verifyEmail,
  verifyPasswordReset,
} from "./requests";
import type { ActivityLogQuery, SystemTenantsQuery } from "./types";

export const AUTH_QUERY_KEY = {
  user: ["user"],
  verifyEmail: ["verifyEmail"],
  verifyPasswordReset: ["verifyPasswordReset"],
  notificationPreferences: ["notificationPreferences"],
  dispatcherPreferences: ["dispatcherPreferences"],
  organizationSettings: ["organizationSettings"],
  invitedUsers: ["invitedUsers"],
  activityLog: ["activityLog"],
  systemAdmins: ["systemAdmins"],
  systemActivityLog: ["systemActivityLog"],
  systemDashboard: ["systemDashboard"],
  systemTenantsSummary: ["systemTenantsSummary"],
  systemTenants: ["systemTenants"],
  systemTenant: ["systemTenant"],
  systemTenantOnboardingReferenceData: ["systemTenantOnboardingReferenceData"],
} as const;

export function useRegister() {
  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      toast.success("Successful", {
        description: "Check your email inbox and click on the link to verify your email",
      });
    },
  });
}

export function useLogin() {
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setTokens({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      });
      setUser(data.data.user);
      toast.success("Login Successful", {
        description: "Welcome to Truckmoov",
      });
    },
  });
}

export function useSystemLogin() {
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation({
    mutationFn: systemLogin,
    onSuccess: (data) => {
      setTokens({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      });
      toast.success("Login Successful");
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      navigate(APP_ROUTES.signIn);
      queryClient.clear();
    },
  });
}

export function useChangeSystemPassword() {
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation({
    mutationFn: changeSystemPassword,
    onSuccess: (data) => {
      setTokens({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      });
      toast.success("Password Updated");
    },
  });
}

export function useInviteMember() {
  return useMutation({
    mutationFn: inviteMember,
    onSuccess: () => {
      toast.success("Invite Sent");
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.invitedUsers,
      });
    },
  });
}

export function getInvitedUserQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.invitedUsers,
    queryFn: getInvitedUsers,
  });
}

export function useUpdateInvitedUser() {
  return useMutation({
    mutationFn: updateInvitedUser,
    onSuccess: () => {
      toast.success("User Detail Updated");
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.invitedUsers,
      });
    },
  });
}

export function useDeleteInvitedUser() {
  return useMutation({
    mutationFn: removeInvitedUser,
    onSuccess: () => {
      toast.success("User Deleted");
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.invitedUsers,
      });
    },
  });
}

export function useUpdateOrganizationUserStatus() {
  return useMutation({
    mutationFn: updateOrganizationUserStatus,
    onSuccess: () => {
      toast.success("User Status Updated");
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.invitedUsers,
      });
    },
  });
}

export function useResendInvitedUserMail() {
  return useMutation({
    mutationFn: resendInvitedUserMail,
  });
}

export function useRegisterInvitedMember() {
  return useMutation({
    mutationFn: registerInvitedMember,
  });
}

export function useCompleteProfile() {
  return useMutation({
    mutationFn: completeProfile,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: forgetPassword,
    onSuccess: () => {
      toast.success("Request Successful", {
        description: "Check your email inbox and click on the link to verify your email",
      });
    },
  });
}

export function verifyEmailQueryOption(payload: Parameters<typeof verifyEmail>[0]) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.verifyEmail, payload.data.token],
    queryFn: () => verifyEmail(payload),
    staleTime: 0,
    gcTime: 0,
  });
}

export function verifyPasswordResetQueryOption(payload: Parameters<typeof verifyPasswordReset>[0]) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.verifyPasswordReset, payload.data.token],
    queryFn: () => verifyPasswordReset(payload),
    staleTime: 0,
    gcTime: 0,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  });
}

export function useChangeUserRole() {
  return useMutation({
    mutationFn: changeUserRole,
  });
}

export function getUserProfileQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.user,
    queryFn: getUserProfile,
  });
}

export function useUpdateUserProfile() {
  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.user,
      });
    },
  });
}

export function getNotificationsPreferencesQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.notificationPreferences,
    queryFn: getNotificationsPreferences,
  });
}

export function useUpdateNotificationPreferences() {
  return useMutation({
    mutationFn: updateNotificationsPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.notificationPreferences,
      });
      toast.success("Saved Changes");
    },
  });
}

export function getDispatcherPreferencesQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dispatcherPreferences,
    queryFn: getDispatcherPreferences,
  });
}

export function useUpdateDispatcherPreferences() {
  return useMutation({
    mutationFn: updateDispatcherPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.dispatcherPreferences,
      });
      toast.success("Saved Changes");
    },
  });
}

export function getOrganizationsSettingsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.organizationSettings,
    queryFn: getOrganizationsSettings,
  });
}

export function useUpdateOrganizationSettings() {
  return useMutation({
    mutationFn: updateOrganizationsSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.organizationSettings,
      });
      toast.success("Saved Changes");
    },
  });
}

export function getActivityLogQueryOptions(payload?: ActivityLogQuery) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.activityLog, payload ?? {}],
    queryFn: () => getActivityLog(payload),
  });
}

export function useCreateSystemAdmin() {
  return useMutation({
    mutationFn: createSystemAdmin,
    onSuccess: () => {
      toast.success("System Admin Created");
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.systemAdmins,
      });
    },
  });
}

export function getSystemAdminsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemAdmins,
    queryFn: getSystemAdmins,
  });
}

export function useUpdateSystemAdminStatus() {
  return useMutation({
    mutationFn: updateSystemAdminStatus,
    onSuccess: () => {
      toast.success("System Admin Status Updated");
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.systemAdmins,
      });
    },
  });
}

export function useCreateSystemTenant() {
  return useMutation({
    mutationFn: createSystemTenant,
    onSuccess: () => {
      toast.success("Tenant Created");
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.systemTenants,
      });
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.systemTenantsSummary,
      });
    },
  });
}

export function getSystemTenantsQueryOptions(payload?: SystemTenantsQuery) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.systemTenants, payload ?? {}],
    queryFn: () => getSystemTenants(payload),
  });
}

export function getSystemActivityLogQueryOptions(payload?: ActivityLogQuery) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.systemActivityLog, payload ?? {}],
    queryFn: () => getSystemActivityLog(payload),
  });
}

export function getSystemDashboardQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemDashboard,
    queryFn: getSystemDashboard,
  });
}

export function getSystemTenantsSummaryQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemTenantsSummary,
    queryFn: getSystemTenantsSummary,
  });
}

export function useExportSystemTenants() {
  return useMutation({
    mutationFn: exportSystemTenants,
  });
}

export function getSystemTenantOnboardingReferenceDataQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.systemTenantOnboardingReferenceData,
    queryFn: getSystemTenantOnboardingReferenceData,
  });
}

export function getSystemTenantQueryOptions(tenantId: string) {
  return queryOptions({
    queryKey: [...AUTH_QUERY_KEY.systemTenant, tenantId],
    queryFn: () => getSystemTenant(tenantId),
  });
}

export function useUpdateSystemTenantStatus() {
  return useMutation({
    mutationFn: updateSystemTenantStatus,
    onSuccess: (_, variables) => {
      toast.success("Tenant Status Updated");
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.systemTenants,
      });
      queryClient.invalidateQueries({
        queryKey: [...AUTH_QUERY_KEY.systemTenant, variables.tenantId],
      });
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.systemTenantsSummary,
      });
    },
  });
}

export function useUploadMediaToBucket() {
  return useMutation({
    mutationFn: uploadMediaToBucket,
  });
}
