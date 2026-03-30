import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search } from "lucide-react";
import { JobStatus } from "../api/types";
import { useJobStore } from "../stores/job";

type JobStatusFilter = "all" | JobStatus

const JOB_STATUS_OPTIONS: Array<{ value: JobStatusFilter; label: string }> = [
 { value: "all", label: "All Status" },
 { value: "created", label: "Created" },
 { value: "assigned", label: "Assigned" },
 { value: "en-route", label: "En Route" },
 { value: "arrived", label: "Arrived" },
 { value: "loaded", label: "Loaded" },
 { value: "delivered", label: "Delivered" },
 { value: "cancelled", label: "Cancelled" },
]

export default function JobActionsBar() {
 const { search, status, setSearch, setStatus } = useJobStore()

 return (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
   <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
     placeholder="Search jobs..."
     className="pl-9"
     value={search}
     onChange={(e) => setSearch(e.target.value)}
    />
   </div>
   <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v as JobStatus)}>
    <SelectTrigger className="w-full sm:w-45">
     <Filter className="h-4 w-4 mr-2" />
     <SelectValue placeholder="Filter by status" />
    </SelectTrigger>
    <SelectContent>
     {JOB_STATUS_OPTIONS.map((s) => (
      <SelectItem key={s.value} value={s.value}>
       {s.label}
      </SelectItem>
     ))}
    </SelectContent>
   </Select>
  </div>
 )
}
