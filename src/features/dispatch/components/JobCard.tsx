import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AppAvatar from "@/shared/components/AppAvatar";
import StatusBadge from "@/shared/components/StatusBadge";
import { ArrowRight, CheckCircle, Clock, Eye, MapPin, MoreHorizontal, Package, Pencil, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import JobFormModal from "./JobFormModal";
import JobCardSheet from "./JobCardSheet";
import DriverCommunicationActions from "./DriverCommunicationActions";

export default function JobCard() {
  const [openJobForm, setOpenJobForm] = useState(false);
  const [openJobSheet, setOpenJobSheet] = useState(false);

  return (
    <>
      <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-mono font-medium text-sm">TM-2849</p>
              <StatusBadge status="created" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setOpenJobSheet(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenJobForm(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {/* {job.status === "created" && (
        <DropdownMenuItem onClick={onMatch}>
         <Sparkles className="h-4 w-4 mr-2" />
         AI Match
        </DropdownMenuItem>
       )} */}
                {/* {canComplete && onComplete && ( */}
                <DropdownMenuItem>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Job
                </DropdownMenuItem>
                {/* )} */}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Route */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">Oshodi Market</span>
            </div>
            <div className="flex items-center gap-2 pl-2">
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-accent shrink-0" />
              <span className="truncate">Ikorodu</span>
            </div>
          </div>

          {/* Cargo & Amount */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Food Products • 12t</span>
            </div>
            {/* <p className="font-bold text-primary">{formatCurrency(job.amount)}</p> */}
            <p className="font-bold text-primary">₦95,000</p>
          </div>

          {/* Driver & Deadline */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            {/* {job.driver ? ( */}
            <div className="flex items-center gap-2">
              <AppAvatar value="Fisayo Olaleye" />
              <span className="text-sm">Fisayo Olaleye</span>
            </div>
            {/* ) : ( */}
            {/* <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
       >
        <Sparkles className="h-3 w-3" />
        Find Driver
       </Button> */}
            {/* )} */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {/* <span>{format(new Date(job.deadline), "MMM dd, HH:mm")}</span> */}
              <span>Dec 11, 14:00</span>
            </div>
          </div>

        </CardContent>
      </Card>
      <Card className="bg-muted/30 border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppAvatar value="Fisayo Olaleye" />
              <div>
                <p className="text-sm font-medium">Fisayo Olaleye</p>
                <p className="text-xs text-muted-foreground">+2349128956416</p>
              </div>
            </div>
            <DriverCommunicationActions />
          </div>
        </CardContent>
      </Card>

      {/* modals */}
      <JobFormModal open={openJobForm} onOpenChange={setOpenJobForm} mode="edit" />
      <JobCardSheet open={openJobSheet} onOpenChange={setOpenJobSheet} />
    </>
  )
}
