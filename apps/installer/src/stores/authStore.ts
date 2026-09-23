import type { AuthUser } from "@truckmoov/api/auth";
import { useAuthStore as useApiAuthStore } from "@truckmoov/api/lib/auth-store";
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
    set({
      user: null,
      isAuthenticated: false,
      isAuthReady: true,
    });
  },
}));
