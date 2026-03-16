import { queryOptions, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { changeUserRole, forgetPassword, getDispatcherPreferences, getNotificationsPreferences, getOrganizationsSettings, getUserProfile, inviteMember, login, logout, register, registerInvitedMember, resetPassword, updateDispatcherPreferences, updateNotificationsPreferences, updateOrganizationsSettings, updateUserProfile, validateMemberInvite, verifyPasswordReset } from "./requests";
import { queryClient } from "@/shared/providers/TanstackQueryProvider";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/shared/lib/appRoutes";

export const AUTH_QUERY_KEY = {
  user: ["user"],
  validateInviteMember: ["validateMember"],
  notificationPreferences: ["notificationPreferences"],
  dispatcherPreferences: ["dispatcherPreferences"],
  organizationSettings: ["organizationSettings"]
}

export function useRegister() {
 const setTokens = useAuthStore((state) => state.setTokens);

 return useMutation({
  mutationFn: register,
  onSuccess: (data) => {
    setTokens({
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    });
    const message  = data.message
    toast.success(message, {
      description: "You can now sign in with your credentials.",
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
      const message = data.message
      toast.success(message)
    }
  })
}

export function validateMemberInviteQueryOptions () {
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
  })
}

export function useVerifyPasswordReset() {
  return useMutation({
    mutationFn: verifyPasswordReset,
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
