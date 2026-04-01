import { useDebounce } from "@/shared/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Ellipsis, Eye, FileText, Flag, MapPin, Navigation, Package, Pencil, Trash2, Truck, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { listJobQueryOptions } from "../api";
import { useJobStore } from "../stores/job";
import { Job, JobStatus } from "../api/types";
import AddJobNoteModal from "./AddJobNoteModal";
import CancelJobModal from "./CancelJobModal";
import JobDetailSheet from "./JobDetailSheet";
import ReassignJobModal from "./ReassignJobModal";
import SetJobPriorityModal from "./SetJobPriorityModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/shared/components/StatusBadge";

const STATUS_ICON: Record<JobStatus, JSX.Element> = {
 "assigned": <Truck className="h-4 w-4 text-info" />,
 "arrived": <MapPin className="h-4 w-4 text-accent" />,
 "loaded": <Package className="h-4 w-4 text-warning" />,
 "delivered": <CheckCircle className="h-4 w-4 text-success" />,
 "en-route": <Navigation className="h-4 w-4 text-primary" />,
 "created": <AlertCircle className="h-4 w-4 text-warning" />,
 "cancelled": <XCircle className="h-4 w-4 text-destructive" />
};

export default function JobCard() {
 const [openJobDetailSheet, setOpenJobDetailSheet] = useState(false);
 const [openReassignJob, setOpenReassignJob] = useState(false);
 const [openSetPriorityModal, setOpenSetPriorityModal] = useState(false);
 const [openAddNoteModal, setOpenAddNoteModal] = useState(false);
 const [openCancelJobModal, setOpenCancelJobModal] = useState(false);
 const [selectedJob, setSelectedJob] = useState<Job | null>(null);

 function handleActionSelect(job: Job, mode: "view" | "reassign" | "priority" | "note" | "cancel") {
  setSelectedJob(job);
  if (mode === "view") {
   setOpenJobDetailSheet(true);
   return;
  }
  if (mode === "reassign") {
   setOpenReassignJob(true);
   return;
  }
  if (mode === "priority") {
   setOpenSetPriorityModal(true);
   return;
  }
  if (mode === "note") {
   setOpenAddNoteModal(true);
   return;
  }
  setOpenCancelJobModal(true);
 }

 const { search, status } = useJobStore()
 const debouncedSearch = useDebounce(search)

 const { data, isPending: listingJob } = useQuery(listJobQueryOptions({
  params: {
   ...(debouncedSearch && { query: debouncedSearch }),
   ...(status && { status }),
  }
 }));
 const jobs: Job[] = useMemo(() => data?.data ?? [], [data]);

 return (
  <>
   {listingJob && (
    <>
     {Array.from({ length: 5 }, (_, index) => (
      <Card key={`job-skeleton-${index}`}>
       <CardContent className="p-4 space-y-4">
        <div className="flex justify-between gap-3">
         <section className="flex items-start gap-3 flex-1">
          <Skeleton className="h-4 w-4 rounded-full mt-1" />
          <div className="space-y-2 flex-1">
           <Skeleton className="h-4 w-28" />
           <Skeleton className="h-4 w-full max-w-md" />
          </div>
         </section>
         <section className="space-y-2 text-right">
          <Skeleton className="h-4 w-28 ml-auto" />
          <Skeleton className="h-3 w-24 ml-auto" />
         </section>
        </div>
       </CardContent>
      </Card>
     ))}
    </>
   )}

   {!listingJob && jobs.length === 0 && (
    <Card>
     <CardContent className="p-8 text-center space-y-2">
      <Package className="h-5 w-5 text-muted-foreground mx-auto" />
      <p className="text-sm font-medium">No jobs found</p>
      <p className="text-xs text-muted-foreground">Try changing your filters or create a new job.</p>
     </CardContent>
    </Card>
   )}

   {!listingJob
    && jobs.map((job) => (
     <Card key={job.id}>
      <CardContent className="p-4 space-y-4">
       <div className="flex justify-between gap-3">
        <section className="flex items-start gap-3">
         {STATUS_ICON?.[job.status] ?? <Package className="h-4 w-4" />}
         <div>
          <div className="flex items-center gap-2 mb-1">
           <p className="font-semibold">{job.id}</p>
           <StatusBadge status={job.status} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job.pickup.address}
           </span>
           <span>-&gt;</span>
           <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job.dropoff.address}
           </span>
          </div>
         </div>
        </section>
        <section className="flex items-center gap-2">
         {/* <div className="text-right">
          <p className="text-sm font-medium">{job.cargo_description}</p>
          <p className="text-xs text-muted-foreground">{job.deadline}</p>
         </div> */}
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
           <Button variant="ghost">
            <Ellipsis />
           </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
           <DropdownMenuItem onClick={() => handleActionSelect(job, "view")}>
            <Eye className="w-4 h-4" />
            View
           </DropdownMenuItem>
           {job.status !== "cancelled" && (
            <>
             <DropdownMenuItem onClick={() => handleActionSelect(job, "reassign")}>
              <Pencil className="w-4 h-4" />
              Reassign Job
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => handleActionSelect(job, "priority")}>
              <Flag className="h-4 w-4" />
              Set Priority
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => handleActionSelect(job, "note")}>
              <FileText className="h-4 w-4" />
              Add Note
             </DropdownMenuItem>
             <DropdownMenuSeparator />
             <DropdownMenuItem
              onClick={() => handleActionSelect(job, "cancel")}
              className="text-destructive focus:text-destructive"
             >
              <Trash2 className="h-4 w-4" />
              Cancel Job
             </DropdownMenuItem>
            </>
           )}
          </DropdownMenuContent>
         </DropdownMenu>
        </section>
       </div>
      </CardContent>
     </Card>
    ))}

   <JobDetailSheet open={openJobDetailSheet} onOpenChange={setOpenJobDetailSheet} job={selectedJob} />
   <ReassignJobModal open={openReassignJob} onOpenChange={setOpenReassignJob} job={selectedJob} />
   <SetJobPriorityModal open={openSetPriorityModal} onOpenChange={setOpenSetPriorityModal} job={selectedJob} />
   <AddJobNoteModal open={openAddNoteModal} onOpenChange={setOpenAddNoteModal} job={selectedJob} />
   <CancelJobModal open={openCancelJobModal} onOpenChange={setOpenCancelJobModal} job={selectedJob} />
  </>
 );
}
