import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/features/auth/api/types';
import { toStakeholderType } from '@/features/auth/lib/roleUtils';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  setTokens: (tokens: {
    accessToken: string;
    refreshToken: string,
  }) => void;
  setUser: (user: User) => void
  clearTokens: () => void;
  logout: () => void;
  setRole: (role: UserRole, stakeholderType?: DemoStakeholderType) => void;
}

// Lagos Express Logistics tenant UUID (from Supabase)
const LAGOS_EXPRESS_TENANT_ID = 'f7f5af88-fd76-4439-aae3-0461be52f63f';

// Demo auth persistence (for "Quick Demo Access" on /auth)
const DEMO_ROLE_STORAGE_KEY = "truckmoov_demo_role";
const DEMO_STAKEHOLDER_KEY = "truckmoov_demo_stakeholder";

export type DemoStakeholderType = 'ENTERPRISE' | 'AGGREGATOR' | 'OWNER_OPERATOR' | null;
export const DEMO_ACCESS_TOKEN = 'demo_access_token';
const DEMO_REFRESH_TOKEN = 'demo_refresh_token';

function readDemoRole(): UserRole | null {
  try {
    if (typeof window === "undefined") return null;
    const value = window.sessionStorage.getItem(DEMO_ROLE_STORAGE_KEY);
    return (value as UserRole | null) ?? null;
  } catch {
    return null;
  }
}

function writeDemoRole(role: UserRole | null) {
  try {
    if (typeof window === "undefined") return;
    if (role) window.sessionStorage.setItem(DEMO_ROLE_STORAGE_KEY, role);
    else window.sessionStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function readDemoStakeholder(): DemoStakeholderType {
  try {
    if (typeof window === "undefined") return null;
    const value = window.sessionStorage.getItem(DEMO_STAKEHOLDER_KEY);
    return (value as DemoStakeholderType) ?? null;
  } catch {
    return null;
  }
}

function writeDemoStakeholder(type: DemoStakeholderType) {
  try {
    if (typeof window === "undefined") return;
    if (type) window.sessionStorage.setItem(DEMO_STAKEHOLDER_KEY, type);
    else window.sessionStorage.removeItem(DEMO_STAKEHOLDER_KEY);
  } catch {
    // ignore
  }
}

// Mock users for demo
const mockUsers: Record<UserRole, User> = {
  PLATFORM_ADMIN: {
    id: 'pa1',
    email: 'admin@truckmoov.com',
    name: 'System Administrator',
    role: 'PLATFORM_ADMIN',
    avatar: '',
    createdAt: new Date(),
  },
  FLEET_ADMIN: {
    id: 'ta1',
    email: 'fleet@lagoslogistics.com',
    name: 'Olumide Adeyemi',
    role: 'FLEET_ADMIN',
    tenantId: LAGOS_EXPRESS_TENANT_ID,
    avatar: '',
    createdAt: new Date(),
  },
  OPERATIONS_MANAGER: {
    id: 'om1',
    email: 'operations@lagoslogistics.com',
    name: 'Adebayo Ogundimu',
    role: 'OPERATIONS_MANAGER',
    tenantId: LAGOS_EXPRESS_TENANT_ID,
    avatar: '',
    createdAt: new Date(),
  },
  DISPATCHER: {
    id: 'dp1',
    email: 'dispatch@lagoslogistics.com',
    name: 'Emeka Nwosu',
    role: 'DISPATCHER',
    tenantId: LAGOS_EXPRESS_TENANT_ID,
    avatar: '',
    createdAt: new Date(),
  },
  FINANCE_VIEWER: {
    id: 'vf1',
    email: 'finance@lagoslogistics.com',
    name: 'Ngozi Eze',
    role: 'FINANCE_VIEWER',
    tenantId: LAGOS_EXPRESS_TENANT_ID,
    avatar: '',
    createdAt: new Date(),
  },
  ENTERPRISE_ADMIN: {
    id: 'ent1',
    email: 'enterprise@dangote.com',
    name: 'Enterprise Admin',
    role: 'ENTERPRISE_ADMIN',
    tenantId: LAGOS_EXPRESS_TENANT_ID,
    avatar: '',
    createdAt: new Date(),
  },
  AGGREGATOR_ADMIN: {
    id: 'agg1',
    email: 'aggregator@network.com',
    name: 'Aggregator Admin',
    role: 'AGGREGATOR_ADMIN',
    tenantId: LAGOS_EXPRESS_TENANT_ID,
    avatar: '',
    createdAt: new Date(),
  },
  OWNER_OPERATOR: {
    id: 'oo1',
    email: 'owner.operator@email.com',
    name: 'Owner Operator',
    role: 'OWNER_OPERATOR',
    tenantId: LAGOS_EXPRESS_TENANT_ID,
    avatar: '',
    createdAt: new Date(),
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAuthReady: false,
      setTokens: ({ accessToken, refreshToken }) => {
        set({
          accessToken,
          refreshToken,
          isAuthenticated: Boolean(accessToken && refreshToken),
          isAuthReady: true,
        });
      },
      clearTokens: () => {
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
      setUser: (user) => {
        set({
          user
        })
      },
      logout: async () => {
        writeDemoRole(null);
        writeDemoStakeholder(null);
        void supabase.auth.signOut();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isAuthReady: true,
        });
      },
      setRole: (role: UserRole, stakeholderType?: DemoStakeholderType) => {
        // Demo-only auth (no backend)
        const resolvedStakeholder = stakeholderType ?? toStakeholderType(role);
        writeDemoRole(role);
        writeDemoStakeholder(resolvedStakeholder ?? null);
        set({
          user: mockUsers[role],
          accessToken: DEMO_ACCESS_TOKEN,
          refreshToken: DEMO_REFRESH_TOKEN,
          isAuthenticated: true,
          isAuthReady: true,
        });
      },
    }),
    {
      name: 'truckmoov-auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.isAuthenticated = Boolean(state.accessToken && state.refreshToken);
        state.isAuthReady = true;
      },
    }
  )
);
