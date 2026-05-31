import { create } from 'zustand';
import type { OrgMembership } from '@/types/orgRoles';

interface ActiveOrgState {
  /** The currently selected org for multi-org users. null = auto-resolved. */
  activeOrgId: string | null;
  /** Set the active org context. Pass null to reset to auto. */
  setActiveOrg: (orgId: string | null) => void;
  /** Resolve the effective org from memberships + activeOrgId */
  resolveActiveOrg: (memberships: OrgMembership[]) => OrgMembership | null;
}

const STORAGE_KEY = 'fleetpro_active_org';

function readPersistedOrgId(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writePersistedOrgId(orgId: string | null) {
  try {
    if (orgId) sessionStorage.setItem(STORAGE_KEY, orgId);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const useActiveOrgStore = create<ActiveOrgState>((set, get) => ({
  activeOrgId: readPersistedOrgId(),

  setActiveOrg: (orgId: string | null) => {
    writePersistedOrgId(orgId);
    set({ activeOrgId: orgId });
  },

  resolveActiveOrg: (memberships: OrgMembership[]) => {
    if (memberships.length === 0) return null;

    const { activeOrgId } = get();

    // If user explicitly selected an org, use it if still valid
    if (activeOrgId) {
      const match = memberships.find(m => m.orgId === activeOrgId);
      if (match) return match;
      // Invalid selection — clear it
      writePersistedOrgId(null);
      set({ activeOrgId: null });
    }

    // Default: first membership
    return memberships[0];
  },
}));



