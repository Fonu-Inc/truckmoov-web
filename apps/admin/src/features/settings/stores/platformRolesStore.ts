import type {
  PermissionKey, PlatformRole,
} from "@/features/settings/utils/platformPermissions";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BUILT_IN_ROLES } from "@/features/settings/utils/platformPermissions";

type PlatformRolesState = {
  roles: PlatformRole[];
  /** Extra permission keys granted directly to a user, on top of their role. Keyed by userId. */
  userGrants: Record<string, PermissionKey[]>;
  /**
   * Role picked for a team member in the invite dialog, keyed by email so it
   * carries over from the invitation to the accepted admin. Not in fleetflow
   * (its role comes from the database) — here the API has one admin role.
   */
  userRoles: Record<string, string>;
  upsertRole: (role: PlatformRole) => void;
  deleteRole: (key: string) => void;
  resetRoles: () => void;
  setUserGrants: (userId: string, keys: PermissionKey[]) => void;
  setUserRole: (email: string, roleKey: string) => void;
};

/**
 * Settings → Team & Access roles, matrix and per-user grants — a port of
 * fleetflow's `stores/platformRolesStore.ts`.
 *
 * ponytail: mock data from fleetflow parity port — wire to packages/api.
 * The API has no platform roles or permission grants; this persists to
 * localStorage only, so edits are per-browser and enforce nothing. The key is
 * app-prefixed (`admin-…`) because both dev servers share localhost storage —
 * see `sidebarStore`.
 */
export const usePlatformRolesStore = create<PlatformRolesState>()(persist(
  set => ({
    roles: BUILT_IN_ROLES,
    userGrants: {},
    userRoles: {},
    upsertRole: role =>
      set((s) => {
        const exists = s.roles.some(r => r.key === role.key);
        return {
          roles: exists
            ? s.roles.map(r => (r.key === role.key ? {
                ...r, ...role,
              } : r))
            : [
                ...s.roles,
                role,
              ],
        };
      }),
    deleteRole: key =>
      set(s => ({ roles: s.roles.filter(r => r.key !== key || r.builtIn) })),
    resetRoles: () => set({ roles: BUILT_IN_ROLES }),
    setUserGrants: (userId, keys) =>
      set(s => ({
        userGrants: {
          ...s.userGrants, [userId]: keys,
        },
      })),
    setUserRole: (email, roleKey) =>
      set(s => ({
        userRoles: {
          ...s.userRoles, [email.toLowerCase()]: roleKey,
        },
      })),
  }),
  {
    name: "admin-platform-roles",
    merge: (persisted, current) => {
      const p = (persisted ?? {}) as Partial<PlatformRolesState>;
      const persistedRoles = p.roles ?? [];
      // Always keep built-in roles present, preferring persisted edits.
      const merged = BUILT_IN_ROLES.map(
        b => persistedRoles.find(r => r.key === b.key) ?? b,
      );
      const customs = persistedRoles.filter(r => !r.builtIn);
      return {
        ...current, ...p, roles: [
          ...merged,
          ...customs,
        ],
      };
    },
  },
));
