import { create } from "zustand";
import type { FleetStatus } from "../api/types";

type VehicleFilters = {
  search: string;
  status: FleetStatus | "";
  setSearch: (search: string) => void;
  setStatus: (status: FleetStatus | "") => void;
};

export const useVehicleStore = create<VehicleFilters>((set) => ({
  search: "",
  status: "",
  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status }),
}));
