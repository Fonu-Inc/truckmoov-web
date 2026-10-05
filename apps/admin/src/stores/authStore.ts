import type { AuthUser } from "@truckmoov/api/auth";
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
    useApiAuthStore.getState().logout();
    // Drop every cached server answer, capabilities included, so the next
    // user signing in on this tab is never judged by the last one's grants.
    queryClient.clear();
    set({
      user: null,
      isAuthenticated: false,
      isAuthReady: true,
    });
  },
}));
