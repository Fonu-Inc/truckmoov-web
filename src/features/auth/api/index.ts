import { queryOptions, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { changeUserRole, forgetPassword, getDispatcherPreferences, getNotificationsPreferences, getOrganizationsSettings, getUserProfile, inviteMember, login, logout, register, registerInvitedMember, resetPassword, updateDispatcherPreferences, updateNotificationsPreferences, updateOrganizationsSettings, updateUserProfile, uploadImageToBucket, validateMemberInvite, verifyEmail, verifyPasswordReset } from "./requests";
import { queryClient } from "@/shared/providers/TanstackQueryProvider";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/shared/lib/appRoutes";

export const AUTH_QUERY_KEY = {
  user: ["user"],
  validateInviteMember: ["validateMember"],
  verifyEmail: ["verifyEmail"],
  verifyPasswordReset: ["verifyPasswordReset"],
  notificationPreferences: ["notificationPreferences"],
  dispatcherPreferences: ["dispatcherPreferences"],
  organizationSettings: ["organizationSettings"]
}

export function useRegister() {
  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      toast.success("Successful", {
        description: "Check your email inbox and click on the link to verify your email",
      });
    }
  });
}

export function useLogin() {
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setTokens({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        user: data.data.user,
      });
      toast.success("Login Successful", {
        description: "Welcome to Truckmoov"
      });
    }
  });
}

export function useLogout() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      navigate(APP_ROUTES.signIn)
      queryClient.clear()
    }
  })
}

export function useInviteMember() {
  return useMutation({
    mutationFn: inviteMember,
    onSuccess: (data) => {
      toast.success("Invite Sent")
    }
  })
}

export function validateMemberInviteQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.validateInviteMember,
    queryFn: validateMemberInvite,
    staleTime: 0,
    gcTime: 0,
  })
}

export function useRegisterInvitedMember() {
  return useMutation({
    mutationFn: registerInvitedMember,
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: forgetPassword,
    onSuccess: () => {
      toast.success("Request Successful", {
        description: "Check your email inbox and click on the link to verify your email",
      });
    }
  })
}

export function verifyEmailQueryOption(payload: Parameters<typeof verifyEmail>[0]) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.verifyEmail,
    queryFn: () => verifyEmail(payload),
    staleTime: 0,
    gcTime: 0
  })
}

export function verifyPasswordResetQueryOption(payload: Parameters<typeof verifyPasswordReset>[0]) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.verifyPasswordReset,
    queryFn: () => verifyPasswordReset(payload),
    staleTime: 0,
    gcTime: 0
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  })
}

export function useChangeUserRole() {
  return useMutation({
    mutationFn: changeUserRole,
  })
}

export function getUserProfileQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.user,
    queryFn: getUserProfile,
  })
}

export function useUpdateUserProfile() {
  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.user
      })
    }
  })
}

export function getNotificationsPreferencesQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.notificationPreferences,
    queryFn: getNotificationsPreferences
  })
}

export function useUpdateNotificationPreferences() {
  return useMutation({
    mutationFn: updateNotificationsPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.notificationPreferences
      })
      toast.success("Saved Changes")
    }
  })
}

export function getDispatcherPreferencesQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.dispatcherPreferences,
    queryFn: getDispatcherPreferences
  })
}

export function useUpdateDispatcherPreferences() {
  return useMutation({
    mutationFn: updateDispatcherPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.dispatcherPreferences,
      })
      toast.success("Saved Changes")
    }
  })
}

export function getOrganizationsSettingsQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.organizationSettings,
    queryFn: getOrganizationsSettings
  })
}

export function useUpdateOrganizationSettings() {
  return useMutation({
    mutationFn: updateOrganizationsSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY.organizationSettings,
      })
    }
  })
}

export function useUploadImageToBucket() {
  return useMutation({
    mutationFn: uploadImageToBucket,
  })
}