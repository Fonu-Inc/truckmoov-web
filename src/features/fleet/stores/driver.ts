import { create } from "zustand";
import type { DriverStatus } from "../api/types";

type UseDriverState = {
 showInbox: boolean;
 setShowInbox: (open: boolean) => void;
 search: string;
 status: DriverStatus | "";
 setSearch: (search: string) => void;
 setStatus: (status: DriverStatus | "") => void;
}

export const useDriverStore = create<UseDriverState>((set) => ({
 showInbox: false,
 setShowInbox: (open) => set({ showInbox: open }),
 search: "",
 status: "",
 setSearch: (search) => set({ search }),
 setStatus: (status) => set({ status }),
}))
