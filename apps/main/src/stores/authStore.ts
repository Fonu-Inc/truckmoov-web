import { create } from 'zustand';
import { useAuthStore as useApiAuthStore } from '@truckmoov/api/lib/auth-store';
import { AuthUser } from '@truckmoov/api/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  bootstrapFromSession: () => Promise<void>;
  syncFromSession: () => void;
  logout: () => void;
}

function getSessionState() {
  const { accessToken, user: apiUser } = useApiAuthStore.getState();

  if (accessToken && apiUser) {
    return {
      user: apiUser,
      isAuthenticated: true,
      isAuthReady: true,
    };
  }

  return { user: null, isAuthenticated: false, isAuthReady: true };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthReady: false,
  bootstrapFromSession: async () => {
    set(getSessionState());
  },
  syncFromSession: () => {
    set(getSessionState());
  },
  logout: () => {
    useApiAuthStore.getState().logout();
    void import('./onboardingStore').then((m) => m.useOnboardingStore.getState().reset());
    set({ user: null, isAuthenticated: false, isAuthReady: true });
  },
}));
