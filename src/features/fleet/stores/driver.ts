import { create } from "zustand";

type UseDriverState = {
 showInbox: boolean,
 setShowInbox: (open: boolean) => void,
}

export const useDriverStore = create<UseDriverState>((set) => ({
 showInbox: false,
 setShowInbox(open) {
  set({
   showInbox: open
  })
 },
}))