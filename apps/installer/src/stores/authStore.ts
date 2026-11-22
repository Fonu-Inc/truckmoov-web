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
  logout: () => Promise<void>;
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
  logout: async () => {
    // Revoke first — the request needs the bearer token we are about to clear. A failed
    // revoke must not strand the user signed in, so local state clears regardless.
    const { refreshToken } = useApiAuthStore.getState();
    if (refreshToken)
      await revokeSession({ data: { refreshToken } }).catch(() => {});
    useApiAuthStore.getState().logout();
    queryClient.clear();
    set({
      user: null,
      isAuthenticated: false,
      isAuthReady: true,
    });
  },
}));
