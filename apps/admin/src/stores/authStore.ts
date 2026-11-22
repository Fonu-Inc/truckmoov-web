import type { AuthUser } from "@truckmoov/api/auth";
import { revokeSession } from "@truckmoov/api/auth";
import { useAuthStore as useApiAuthStore } from "@truckmoov/api/lib/auth-store";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { create } from "zustand";

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  bootstrapFromSession: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isAuthenticated: false,
  isAuthReady: false,
  bootstrapFromSession: async () => {
    const {
      accessToken,
      user: apiUser,
    } = useApiAuthStore.getState();
    if (accessToken && apiUser) {
      set({
        user: apiUser,
        isAuthenticated: true,
        isAuthReady: true,
      });
      return;
    }
    set({
      user: null,
      isAuthenticated: false,
      isAuthReady: true,
    });
  },
  logout: () => {
    // Fire-and-forget: a slow or failed revoke must never keep the user signed in here.
    const { refreshToken } = useApiAuthStore.getState();
    if (refreshToken)
      void revokeSession({ data: { refreshToken } }).catch(() => {});
    useApiAuthStore.getState().logout();
    queryClient.clear();
    set({
      user: null,
      isAuthenticated: false,
      isAuthReady: true,
    });
  },
}));
