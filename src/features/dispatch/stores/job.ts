import { create } from "zustand";
import type { JobStatus } from "../api/types";

type JobFilters = {
 search: string;
 status: JobStatus | "";
 setSearch: (search: string) => void;
 setStatus: (status: JobStatus | "") => void;
};

export const useJobStore = create<JobFilters>((set) => ({
 search: "",
 status: "",
 setSearch: (search) => set({ search }),
 setStatus: (status) => set({ status }),
}));
