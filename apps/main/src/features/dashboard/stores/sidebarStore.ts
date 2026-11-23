import { create } from "zustand";
import { persist } from "zustand/middleware";

type SidebarState = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
};

/**
 * Sidebar collapse state, persisted to localStorage so it survives a reload.
 *
 * The key is app-specific: both dev servers are on `localhost`, which shares
 * localStorage across ports, so a shared key would let the two apps overwrite
 * each other's sidebar.
 *
 * ponytail: only `collapsed` is persisted — `mobileOpen` is transient (a
 * reload should not restore an open drawer), and actions are code.
 */
export const useSidebarStore = create<SidebarState>()(persist(
  set => ({
    collapsed: false,
    toggle: () => set(s => ({ collapsed: !s.collapsed })),
    setCollapsed: v => set({ collapsed: v }),
    mobileOpen: false,
    openMobile: () => set({ mobileOpen: true }),
    closeMobile: () => set({ mobileOpen: false }),
  }),
  {
    name: "main-sidebar",
    partialize: s => ({ collapsed: s.collapsed }),
  },
));
