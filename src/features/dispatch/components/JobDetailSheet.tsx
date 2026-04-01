import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getDriverQueryOptions, getVehicleQueryOptions } from "@/features/fleet/api";
import AppAvatar from "@/shared/components/AppAvatar";
import StatusBadge from "@/shared/components/StatusBadge";
import { ModalProps } from "@/shared/types"
import { useQuery } from "@tanstack/react-query";
import { Calendar, Camera, CheckCircle2, Clock, Eye, FileText, Info, MessageSquare, Package, PenLine, Plus, Send, Truck, UserCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { Job, JobPodAttachment, JobStatus } from "../api/types";
import UploadPodModal from "./UploadPodModal";

type JobDetailSheetProps = ModalProps & {
  job: Job | null
}

const statusSteps: Array<{ key: JobStatus; label: string }> = [
  { key: "created", label: "Created" },
  { key: "assigned", label: "Assigned" },
  { key: "en-route", label: "En Route" },
  { key: "arrived", label: "Arrived" },
  { key: "loaded", label: "Loaded" },
  { key: "delivered", label: "Delivered" },
]

type TimelineEventStyle = {
  icon: React.ReactNode
  bg: string
}

function getTimelineEventStyle(type: string): TimelineEventStyle {
  if (type.includes("cancelled"))
    return { icon: <XCircle className="h-3.5 w-3.5" />, bg: "bg-destructive/10 text-destructive" }
  if (type.includes("note"))
    return { icon: <MessageSquare className="h-3.5 w-3.5" />, bg: "bg-blue-500/10 text-blue-500" }
  if (type === "job_assigned")
    return { icon: <UserCheck className="h-3.5 w-3.5" />, bg: "bg-primary/10 text-primary" }
  if (type.includes("instruction") || type.includes("sent"))
    return { icon: <Send className="h-3.5 w-3.5" />, bg: "bg-violet-500/10 text-violet-500" }
  if (type.includes("delivered") || type.includes("acknowledged"))
    return { icon: <CheckCircle2 className="h-3.5 w-3.5" />, bg: "bg-green-500/10 text-green-500" }
  if (type.includes("created"))
    return { icon: <FileText className="h-3.5 w-3.5" />, bg: "bg-green-500/10 text-green-500" }
  if (type.includes("route") || type.includes("loaded") || type.includes("arrived"))
    return { icon: <Truck className="h-3.5 w-3.5" />, bg: "bg-primary/10 text-primary" }
  return { icon: <Info className="h-3.5 w-3.5" />, bg: "bg-muted-foreground/10 text-muted-foreground" }
}

function formatTimelineDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
    hour12: true,
  }).format(new Date(iso))
}

function getPodIcon(kind: string): React.ReactNode {
  if (kind === "photo") return <Camera className="h-4 w-4 text-primary" />
  if (kind === "signature") return <PenLine className="h-4 w-4 text-primary" />
  return <FileText className="h-4 w-4 text-primary" />
}

export default function JobDetailSheet({ open, onOpenChange, job }: JobDetailSheetProps) {
  const [openUploadPod, setOpenUploadPod] = useState(false)
  const [previewPod, setPreviewPod] = useState<JobPodAttachment | null>(null)

  const { data: driverData, isLoading: isDriverLoading } = useQuery(getDriverQueryOptions({ id: job?.assigned_driver_id ?? "" }))
  const { data: vehicleData, isLoading: isVehicleLoading } = useQuery(getVehicleQueryOptions({ id: job?.assigned_vehicle_id ?? "" }))
  const driver = driverData?.data
  const vehicle = vehicleData?.data
  const currentStatus: JobStatus = job?.status
  const currentStepIndex = statusSteps.findIndex((step) => step.key === currentStatus)
  const progressValue = currentStepIndex === -1 ? 0 : ((currentStepIndex + 1) / statusSteps.length) * 100

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-card border-border pt-12">
          <SheetHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-xl font-mono">{job?.id}</SheetTitle>
                <StatusBadge status={job?.status} />
              </div>
              {/* <div className="text-right">
       <p className="text-2xl font-bold text-primary">₦185,000</p>
      </div> */}
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Progress Tracker */}
            {currentStatus !== "cancelled" && <Card className="bg-muted/30 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progressValue} className="h-2 mb-4" />
                <div className="flex justify-between">
                  {statusSteps.map((step, index) => {
                    const isCompleted = currentStepIndex >= 0 && index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    return (
                      <div key={step.key} className="flex flex-col items-center">
                        <div className={`h-3 w-3 rounded-full ${isCompleted ? "bg-primary" : "bg-muted"
                          } ${isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`} />
                        <span className={`text-xs mt-1 ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>}

            {/* Route Info */}
            <Card className="bg-muted/30 border-border/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <div className="w-0.5 h-10 bg-border" />
                    <div className="h-3 w-3 rounded-full bg-accent" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Pickup</p>
                      <p className="font-medium capitalize">{job?.pickup?.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Delivery</p>
                      <p className="font-medium capitalize">{job?.dropoff?.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cargo Details */}
            <Card className="bg-muted/30 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Cargo Details
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{job?.cargo_description}</p>
              </CardContent>
            </Card>

            {/* Assigned Resources */}
            <Card className="bg-muted/30 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Assigned Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Driver */}
                {isDriverLoading ? (
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ) : driver ? (
                  <div className="flex items-center gap-3">
                    <AppAvatar value={`${driver.firstName} ${driver.lastName}`} />
                    <div>
                      <p className="font-medium">{driver.firstName} {driver.lastName}</p>
                      <p className="text-sm text-muted-foreground">{driver.phone}</p>
                    </div>
                  </div>
                ) : null}

                {/* Vehicle */}
                {isVehicleLoading ? (
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ) : vehicle ? (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Truck className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                      <p className="text-sm text-muted-foreground">{vehicle.plateNumber}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No vehicle assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="bg-muted/30 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!job?.timeline || job.timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No activity recorded yet
                  </p>
                ) : (
                  <div>
                    {job.timeline.map((log, index) => {
                      const { icon, bg } = getTimelineEventStyle(log.type)
                      const isLast = index === job.timeline.length - 1
                      return (
                        <div key={log.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                              {icon}
                            </div>
                            {!isLast && <div className="w-px flex-1 bg-border my-1" />}
                          </div>
                          <div className={`flex-1 min-w-0 ${!isLast ? "pb-4" : ""}`}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium capitalize">{log.type.replace(/_/g, " ")}</p>
                              <p className="text-xs text-muted-foreground shrink-0">{formatTimelineDate(log.occurred_at)}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">{log.summary}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="bg-muted/30 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!job?.notes || job.notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
                ) : (
                  job.notes.map((note) => (
                    <div key={note.id} className="rounded-lg border border-border bg-background px-3 py-2.5 space-y-1">
                      <p className="text-sm">{note.text}</p>
                      <p className="text-xs text-muted-foreground">{formatTimelineDate(note.created_at)}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Proof of Delivery */}
            {currentStatus === "delivered" && <Card className="bg-muted/30 border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Proof of Delivery
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setOpenUploadPod(true)}>
                    <Plus className="h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {!job?.pod_attachments || job.pod_attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No attachments yet</p>
                ) : (
                  job.pod_attachments.map((doc) => (
                    <button key={doc.id} onClick={() => setPreviewPod(doc)}
                      className="w-full flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          {getPodIcon(doc.kind)}
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{doc.kind}</p>
                          <p className="text-xs text-muted-foreground">{formatTimelineDate(doc.uploaded_at)}</p>
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))
                )}
              </CardContent>
            </Card>}

            {/* Deadline */}
            {/* <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2">
       <Calendar className="h-5 w-5 text-primary" />
       <span className="text-sm font-medium">Deadline</span>
      </div>
      <span className="font-medium">Dec 11, 2024 18:00</span>
     </div> */}
          </div>
        </SheetContent>
      </Sheet>

      <UploadPodModal open={openUploadPod} onOpenChange={setOpenUploadPod} job={job} />

      <Dialog open={!!previewPod} onOpenChange={(v) => !v && setPreviewPod(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="capitalize">{previewPod?.kind} Preview</DialogTitle>
          </DialogHeader>
          {previewPod && (
            previewPod.kind === "photo" || previewPod.kind === "signature" ? (
              <img src={previewPod.url} alt={previewPod.kind} className="w-full rounded-lg object-contain max-h-[60vh]" />
            ) : (
              <div className="flex flex-col items-center gap-4 py-6">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
                <Button asChild variant="outline">
                  <a href={previewPod.url} target="_blank" rel="noopener noreferrer">Open Document</a>
                </Button>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
