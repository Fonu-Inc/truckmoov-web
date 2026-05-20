import { create } from 'zustand';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { apiGet, getToken, setToken, clearToken } from '@/lib/backendApi';

interface BackendAuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    tenantId?: string;
  };
}

function mapBackendRole(backendRole: string): UserRole {
  const map: Record<string, UserRole> = {
    fleet_admin: 'tenant_admin',
    platform_admin: 'platform_admin',
    operations_manager: 'operations_manager',
    supervisor: 'supervisor',
    dispatcher: 'dispatcher',
    driver: 'driver',
    installer: 'installer',
    viewer_finance: 'viewer_finance',
  };
  return map[backendRole] ?? 'tenant_admin';
}

function buildUserFromBackend(res: BackendAuthResponse): User {
  return {
    id: res.user.id,
    email: res.user.email,
    name: `${res.user.firstName} ${res.user.lastName}`.trim(),
    role: mapBackendRole(res.user.role),
    tenantId: res.user.tenantId,
    createdAt: new Date(),
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  bootstrapFromSession: () => Promise<void>;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  setRole: (role: UserRole, stakeholderType?: DemoStakeholderType) => void;
}

// Lagos Express Logistics tenant UUID (from Supabase)
const LAGOS_EXPRESS_TENANT_ID = 'f7f5af88-fd76-4439-aae3-0461be52f63f';

// Demo auth persistence (for "Quick Demo Access" on /auth)
const DEMO_ROLE_STORAGE_KEY = "fleetpro_demo_role";
const DEMO_STAKEHOLDER_KEY = "fleetpro_demo_stakeholder";

export type DemoStakeholderType = 'ENTERPRISE' | 'AGGREGATOR' | 'OWNER_OPERATOR' | null;

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
  platform_admin: {
    id: 'pa1',
    email: 'admin@fleetpro.com',
    name: 'System Administrator',
    role: 'platform_admin',
    avatar: '',
    createdAt: new Date(),
  },
  tenant_admin: {
    id: 'ta1',
    email: 'fleet@lagoslogistics.com',
    name: 'Olumide Adeyemi',
    role: 'tenant_admin',
    tenantId: LAGOS_EXPRESS_TENANT_ID,
    avatar: '',
    createdAt: new Date(),
  },
  operations_manager: {
    id: 'om1',
    email: 'operations@lagoslogistics.com',
    name: 'Adebayo Ogundimu',
    role: 'operations_manager',
    tenantId: LAGOS_EXPRESS_TENANT_ID,
    avatar: '',
    createdAt: new Date(),
  },
  supervisor: {
    id: 's1',
    email: 'supervisor@lagoslogistics.com',
    name: 'Chidinma Okonkwo',
    role: 'supervisor',
    tenantId: LAGOS_EXPRESS_TENANT_ID,
    avatar: '',
    createdAt: new Date(),
  },
  dispatcher: {
    id: 'dp1',
    email: 'dispatch@lagoslogistics.com',
    name: 'Emeka Nwosu',
    role: 'dispatcher',
    tenantId: LAGOS_EXPRESS_TENANT_ID,
    avatar: '',
    createdAt: new Date(),
  },
  viewer_finance: {
    id: 'vf1',
    email: 'finance@lagoslogistics.com',
    name: 'Ngozi Eze',
    role: 'viewer_finance',
    tenantId: LAGOS_EXPRESS_TENANT_ID,
    avatar: '',
    createdAt: new Date(),
  },
  driver: {
    id: 'd1',
    email: 'chukwuemeka.o@email.com',
    name: 'Chukwuemeka Okafor',
    role: 'driver',
    tenantId: LAGOS_EXPRESS_TENANT_ID,
    phone: '+234 801 234 5678',
    createdAt: new Date(),
  },
  installer: {
    id: 'inst1',
    email: 'installer@lagoslogistics.com',
    name: 'Tunde Akinwale',
    role: 'installer',
    tenantId: LAGOS_EXPRESS_TENANT_ID,
    avatar: '',
    createdAt: new Date(),
  },
};

async function buildAppUserFromAuthUser(authUser: { id: string; email?: string | null } | null): Promise<User | null> {
  if (!authUser) return null;

  const email = authUser.email ?? '';

  // Role (required for RBAC)
  const { data: roleRow, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (roleError) {
    console.warn('Failed to fetch user role:', roleError);
  }

  // Profile (nice-to-have for name/tenant)
  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, tenant_id, avatar_url, phone')
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (profileError) {
    console.warn('Failed to fetch user profile:', profileError);
  }

  const role = (roleRow?.role as UserRole | undefined) ?? 'viewer_finance';
  const name = profileRow?.full_name || email.split('@')[0] || 'User';

  return {
    id: authUser.id,
    email,
    name,
    role,
    tenantId: profileRow?.tenant_id ?? undefined,
    avatar: profileRow?.avatar_url ?? undefined,
    phone: profileRow?.phone ?? undefined,
    createdAt: new Date(),
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthReady: false,
  bootstrapFromSession: async () => {
    // 1. Try backend JWT first
    const backendToken = getToken();
    if (backendToken) {
      try {
        const res = await apiGet<BackendAuthResponse>('/auth/me');
        writeDemoRole(null);
        set({ user: buildUserFromBackend(res), isAuthenticated: true, isAuthReady: true });
        return;
      } catch {
        clearToken();
      }
    }

    // 2. Try Supabase session
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const session = data.session;
      const authUser = session?.user ?? null;
      if (authUser && session) {
        setToken(session.access_token);
        writeDemoRole(null);
        const user = await buildAppUserFromAuthUser({ id: authUser.id, email: authUser.email });
        set({ user, isAuthenticated: Boolean(user), isAuthReady: true });
        return;
      }
    } catch (e) {
      console.error('Failed to bootstrap Supabase session:', e);
    }

    // 3. Fall back to demo role
    const demoRole = readDemoRole();
    if (demoRole && demoRole in mockUsers) {
      set({ user: mockUsers[demoRole], isAuthenticated: true, isAuthReady: true });
      return;
    }

    set({ user: null, isAuthenticated: false, isAuthReady: true });
  },
  login: async (_email: string, _password: string, _role: UserRole) => {
    // Use backend auth; AuthPage calls backend directly and sets the token.
    // This method is kept for interface compatibility only.
  },
  logout: () => {
    writeDemoRole(null);
    writeDemoStakeholder(null);
    clearToken();
    void supabase.auth.signOut();
    // Clear onboarding state on logout (lazy import to avoid circular dep)
    void import("./onboardingStore").then((m) => m.useOnboardingStore.getState().reset());
    set({ user: null, isAuthenticated: false, isAuthReady: true });
  },
  setRole: (role: UserRole, stakeholderType?: DemoStakeholderType) => {
    // Demo-only auth (no backend)
    writeDemoRole(role);
    writeDemoStakeholder(stakeholderType ?? null);
    set({ user: mockUsers[role], isAuthenticated: true, isAuthReady: true });
  },
}));
