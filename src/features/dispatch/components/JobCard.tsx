import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import AppAvatar from "@/shared/components/AppAvatar";
import StatusBadge from "@/shared/components/StatusBadge";
import { AlertCircle, CheckCircle, Clock, Ellipsis, Eye, MapPin, Package, Pencil, Trash, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import JobDetailSheet from "./JobDetailSheet";
import ReassignJobModal from "./ReassignJobModal";

const STATUS_ICON = {
 "completed": <CheckCircle className="h-4 w-4 text-success" />,
 "in_progress": <Clock className="h-4 w-4 text-primary" />,
 "created": <AlertCircle className="h-4 w-4 text-warning" />,
 "cancelled": <XCircle className="h-4 w-4 text-destructive" />
}

export default function JobCard() {
 const [openJobDetailSheet, setOpenJobDetailSheet] = useState(false)
 const [openReassignJob, setOpenReassignJob] = useState(false)

 return (
  <>
   <Card>
    <CardContent className="p-4 space-y-4">
     <div
      className="flex justify-between gap-3"
     >
      <section className="flex items-start gap-3">
       {STATUS_ICON?.completed ?? (
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
         <DropdownMenuItem
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
  </>
 )
}
