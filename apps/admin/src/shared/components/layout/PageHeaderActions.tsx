import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { create } from "zustand";

/**
 * Page actions in the top bar. DashboardLayout is a pathless route, so a page
 * can't pass props to DashboardHeader — instead the header mounts
 * `PageHeaderActionsSlot` and a page renders `<PageHeaderActions>` anywhere
 * in its body; the children are portalled into the slot and leave with the page.
 */
const useSlotStore = create<{
  node: HTMLElement | null; setNode: (node: HTMLElement | null) => void;
}>(set => ({
  node: null,
  setNode: node => set({ node }),
}));

export function PageHeaderActionsSlot() {
  const setNode = useSlotStore(s => s.setNode);
  return (
    <div
      ref={setNode}
      className="mr-2 flex items-center gap-2 empty:hidden"
    />
  );
}

export function PageHeaderActions({ children }: { children: ReactNode }) {
  const node = useSlotStore(s => s.node);
  return node ? createPortal(
    children,
    node,
  ) : null;
}
