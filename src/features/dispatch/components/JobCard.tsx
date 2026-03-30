import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import AppAvatar from "@/shared/components/AppAvatar";
import StatusBadge from "@/shared/components/StatusBadge";
import { AlertCircle, CheckCircle, Ellipsis, Eye, FileText, Flag, MapPin, Navigation, Package, Pencil, Trash2, Truck, XCircle } from "lucide-react";
import { useState } from "react";
import AddJobNoteModal from "./AddJobNoteModal";
import CancelJobModal from "./CancelJobModal";
import JobDetailSheet from "./JobDetailSheet";
import ReassignJobModal from "./ReassignJobModal";
import SetJobPriorityModal from "./SetJobPriorityModal";
import { JobStatus } from "../api/types";
import { useQuery } from "@tanstack/react-query";
import { listJobsQueryOptions } from "@/features/fleet/api";

const STATUS_ICON: Record<JobStatus, JSX.Element> = {
 "assigned": <Truck className="h-4 w-4 text-info" />,
 "arrived": <MapPin className="h-4 w-4 text-accent" />,
 "loaded": <Package className="h-4 w-4 text-warning" />,
 "delivered": <CheckCircle className="h-4 w-4 text-success" />,
 "en-route": <Navigation className="h-4 w-4 text-primary" />,
 "created": <AlertCircle className="h-4 w-4 text-warning" />,
 "cancelled": <XCircle className="h-4 w-4 text-destructive" />
}

export default function JobCard() {
 const [openJobDetailSheet, setOpenJobDetailSheet] = useState(false)
 const [openReassignJob, setOpenReassignJob] = useState(false)
 const [openSetPriorityModal, setOpenSetPriorityModal] = useState(false)
 const [openAddNoteModal, setOpenAddNoteModal] = useState(false)
 const [openCancelJobModal, setOpenCancelJobModal] = useState(false)

 useQuery(listJobsQueryOptions({ params: {} }))

 return (
  <>
   <Card>
    <CardContent className="p-4 space-y-4">
     <div
      className="flex justify-between gap-3"
     >
      <section className="flex items-start gap-3">
       {STATUS_ICON?.delivered ?? (
        <Package className="h-4 w-4" />
       )}
       <div>
        <div className="flex items-center gap-2 mb-1">
         <p className="font-semibold">TM-2847</p>
         <StatusBadge status="completed" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
         <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Apapa Port, Lagos
         </span>
         <span>→</span>
         <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Ikeja Industrial Estate
         </span>
        </div>
       </div>
      </section>
      <section className="flex items-center gap-2">
       <div className="text-right">
        <p className="text-sm font-medium">Electronics</p>
        <p className="text-xs text-muted-foreground">
         12/11/2024
        </p>
       </div>
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
         <Button variant="ghost">
          <Ellipsis />
         </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
         <DropdownMenuItem onClick={() => setOpenJobDetailSheet(true)}>
          <Eye className="w-4 h-4" />
          View
         </DropdownMenuItem>
         <DropdownMenuItem onClick={() => setOpenReassignJob(true)}>
          <Pencil className="w-4 h-4" />
          Reassign Job
         </DropdownMenuItem>
         <DropdownMenuItem onClick={() => setOpenSetPriorityModal(true)}>
          <Flag className="h-4 w-4" />
          Set Priority
         </DropdownMenuItem>
         <DropdownMenuItem onClick={() => setOpenAddNoteModal(true)}>
          <FileText className="h-4 w-4" />
          Add Note
         </DropdownMenuItem>
         <DropdownMenuSeparator />
         <DropdownMenuItem
          onClick={() => setOpenCancelJobModal(true)}
          className="text-destructive focus:text-destructive"
         >
          <Trash2 className="h-4 w-4" />
          Cancel Job
         </DropdownMenuItem>
        </DropdownMenuContent>
       </DropdownMenu>
      </section>
     </div>
     <Separator />
     <div className="flex items-center gap-2">
      <AppAvatar value="Fisayo Again" />
      <div>
       <p className="text-sm font-medium">Fisayomi Again</p>
       <p className="text-xs text-muted-foreground">+234thisnumbernoreal</p>
      </div>
     </div>
    </CardContent>
   </Card>

   {/* modals */}
   <JobDetailSheet open={openJobDetailSheet} onOpenChange={setOpenJobDetailSheet} />
   <ReassignJobModal open={openReassignJob} onOpenChange={setOpenReassignJob} />
   <SetJobPriorityModal open={openSetPriorityModal} onOpenChange={setOpenSetPriorityModal} />
   <AddJobNoteModal open={openAddNoteModal} onOpenChange={setOpenAddNoteModal} />
   <CancelJobModal open={openCancelJobModal} onOpenChange={setOpenCancelJobModal} />
  </>
 )
}
