import { create } from "zustand";

type DeviceFilters = {
  search: string;
  setSearch: (search: string) => void;
};

export const useDeviceStore = create<DeviceFilters>((set) => ({
  search: "",
  setSearch: (search) => set({ search }),
}));
