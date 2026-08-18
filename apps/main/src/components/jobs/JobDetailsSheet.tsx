import type { Job } from "@/types";
import {
  useJob, useJobTimeline,
} from "@truckmoov/api/dispatch";
import { useVehicle } from "@truckmoov/api/fleet";
import { formatDayMonthTime } from "@truckmoov/app-core/utils/time-utils";

import {
  Activity, Banknote, Calendar, CheckCircle, Clock,
  FileText, Hash, MapPin, MessageSquare, Package, Phone,
  Truck, User, Weight,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent,
} from "@/components/shadcn/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Progress } from "@/components/shadcn/progress";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";

type JobDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
};

const statusColors: Record<string, string> = {
  "created": "bg-muted text-muted-foreground border-muted",
  "assigned": "bg-primary/20 text-primary border-primary/30",
  "en-route": "bg-warning/20 text-warning border-warning/30",
  "arrived": "bg-warning/20 text-warning border-warning/30",
  "loaded": "bg-warning/20 text-warning border-warning/30",
  "delivered": "bg-success/20 text-success border-success/30",
  "cancelled": "bg-destructive/20 text-destructive border-destructive/30",
};

const statusSteps = [
  {
    key: "pending", label: "Pending",
  },
  {
    key: "assigned", label: "Assigned",
  },
  {
    key: "accepted", label: "Accepted",
  },
  {
    key: "in_progress", label: "In Progress",
  },
  {
    key: "completed", label: "Completed",
  },
] as const;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function FieldLabel({
  icon: Icon, children,
}: {
  icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <Icon className="h-3 w-3 text-primary" />
      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
        {children}
      </p>
    </div>
  );
}

function toUiStage(status?: string, acknowledgedAt?: string) {
  if (status === "delivered")
    return "completed";
  if (status === "en-route" || status === "arrived" || status === "loaded")
    return "in_progress";
  if (acknowledgedAt)
    return "accepted";
  if (status === "assigned")
    return "assigned";
  return "pending";
}

function statusLabel(status?: string) {
  if (!status || status === "created")
    return "pending";
  return status.replace(
    "_",
    " ",
  );
}

function toTonnes(kg?: number) {
  if (!kg)
    return 0;
  return Number((kg / 1000).toFixed(2));
}

export function JobDetailsSheet({
  open, onOpenChange, job,
}: JobDetailsSheetProps) {
  const { format: formatCurrency } = useCurrency();
  const jobQuery = useJob(open && job?.id ? job.id : "");
  const timelineQuery = useJobTimeline(open && job?.id ? job.id : "");
  const apiJob = jobQuery.data?.data;
  const assignedVehicleId = apiJob?.assigned_vehicle_id || job?.vehicleId || "";
  const vehicleQuery = useVehicle(open ? assignedVehicleId : "");
  const vehicle = vehicleQuery.data?.data;

  if (!job)
    return null;

  const reference = apiJob?.reference || job.reference;
  const status = apiJob?.status || job.status;
  const amount = apiJob?.amount_ngn ?? job.amount;
  const pickupAddress = apiJob?.pickup?.address || job.pickup.address;
  const deliveryAddress = apiJob?.dropoff?.address || job.delivery.address;
  const cargoType = apiJob?.cargo_type || job.cargo.type;
  const cargoWeight = apiJob ? toTonnes(apiJob.load_weight_kg) : job.cargo.weight;
  const cargoDescription = apiJob?.cargo_description || job.cargo.description;
  const deadline = apiJob?.deadline || job.deadline;
  const driverId = apiJob?.assigned_driver_id || job.driverId;
  const driverName = apiJob?.assigned_driver_name || job.driverName;
  const driverPhone = apiJob?.assigned_driver_phone || job.driverPhone;
  const driverDisplayName = driverName || driverId || "Assigned driver";
  const driverInitials = driverDisplayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(
      0,
      2,
    )
    .map(part => part[0])
    .join("")
    .toUpperCase();
  const uiStage = toUiStage(
    status,
    apiJob?.acknowledged_at,
  );
  const currentStepIndex = Math.max(
    0,
    statusSteps.findIndex(step => step.key === uiStage),
  );
  const progressPercent = ((currentStepIndex + 1) / statusSteps.length) * 100;
  const timeline = timelineQuery.data?.data?.timeline ?? apiJob?.timeline ?? [];

  const handleWhatsApp = () => {
    if (!driverPhone)
      return toast.error("Driver phone unavailable");
    const phone = driverPhone.replace(
      /\D/g,
      "",
    );
    window.open(
      `https://wa.me/${phone}`,
      "_blank",
    );
  };

  const handleSMS = () => {
    if (!driverPhone)
      return toast.error("Driver phone unavailable");
    window.location.href = `sms:${driverPhone}`;
  };

  const handleCall = () => {
    if (!driverPhone)
      return toast.error("Driver phone unavailable");
    window.location.href = `tel:${driverPhone}`;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="sr-only">
            Job Details -
            {reference}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4">
              <FieldLabel icon={Activity}>Status Progress</FieldLabel>
              <Progress
                value={progressPercent}
                className="h-2 mb-3"
              />
              <div className="flex justify-between">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div
                      key={step.key}
                      className="flex flex-col items-center"
                    >
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      } ${isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                      />
                      <span className={`text-[10px] mt-1 ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-border/50">
            <div>
              <FieldLabel icon={Hash}>Reference</FieldLabel>
              <p className="font-mono font-medium text-sm">{reference}</p>
            </div>
            <div>
              <FieldLabel icon={Activity}>Status</FieldLabel>
              <Badge className={statusColors[status] ?? "bg-muted text-muted-foreground border-muted"}>
                {statusLabel(status)}
              </Badge>
            </div>
            <div>
              <FieldLabel icon={Banknote}>Amount</FieldLabel>
              <p className="font-bold text-foreground text-sm">{formatCurrency(amount)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel icon={MapPin}>Pickup Location</FieldLabel>
              <p className="text-sm pl-4">{pickupAddress}</p>
            </div>
            <div>
              <FieldLabel icon={MapPin}>Delivery Location</FieldLabel>
              <p className="text-sm pl-4">{deliveryAddress}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-border/50">
            <div>
              <FieldLabel icon={Package}>Cargo Type</FieldLabel>
              <p className="text-sm">{cargoType}</p>
            </div>
            <div>
              <FieldLabel icon={Weight}>Weight</FieldLabel>
              <p className="text-sm">
                {cargoWeight}
                {" "}
                t
              </p>
            </div>
            <div>
              <FieldLabel icon={Banknote}>Amount</FieldLabel>
              <p className="text-sm font-medium">{formatCurrency(amount)}</p>
            </div>
            <div>
              <FieldLabel icon={Calendar}>Deadline</FieldLabel>
              <p className="text-sm">{formatDayMonthTime(deadline)}</p>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <FieldLabel icon={FileText}>Description</FieldLabel>
              <p className="text-sm pl-4">{cargoDescription || "No description"}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-border/50">
            <FieldLabel icon={User}>Assigned Driver For Job</FieldLabel>
            {driverId || driverName || driverPhone
              ? (
                  <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-medium text-primary-foreground shrink-0">
                          {driverInitials || "DR"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{driverDisplayName}</p>
                          <p className="text-xs text-muted-foreground truncate">{driverPhone || "Phone unavailable"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleWhatsApp}
                          title="WhatsApp"
                        >
                          <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleSMS}
                          title="SMS"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleCall}
                          title="Call"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              : (
                  <p className="text-sm text-muted-foreground pl-4">No driver assigned yet.</p>
                )}
          </div>

          {assignedVehicleId && (
            <div className="pt-3 border-t border-border/50">
              <FieldLabel icon={Truck}>Assigned Vehicle</FieldLabel>
              <div className="grid grid-cols-2 gap-4 pl-4">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Registration</p>
                  {vehicleQuery.isLoading
                    ? (
                        <Skeleton className="mt-1 h-5 w-32" />
                      )
                    : (
                        <p className="text-sm font-medium">
                          {vehicle?.registrationNumber || vehicle?.plateNumber || "Unavailable"}
                        </p>
                      )}
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Make &amp; Model</p>
                  {vehicleQuery.isLoading
                    ? (
                        <Skeleton className="mt-1 h-5 w-40" />
                      )
                    : (
                        <p className="text-sm font-medium">
                          {vehicle ? `${vehicle.make || ""} ${vehicle.model || ""}`.trim() || "Unavailable" : "Unavailable"}
                        </p>
                      )}
                </div>
              </div>
              {vehicleQuery.isError && (
                <p className="mt-2 pl-4 text-xs text-destructive">
                  Vehicle details could not be loaded.
                </p>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-border/50">
            <FieldLabel icon={Clock}>Activity Timeline</FieldLabel>
            {timelineQuery.isLoading
              ? (
                  <div className="space-y-3 pl-4">
                    {[
                      1,
                      2,
                      3,
                    ].map(i => (
                      <div
                        key={i}
                        className="flex items-start gap-3"
                      >
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              : timeline.length === 0
                ? (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      No activity recorded yet
                    </p>
                  )
                : (
                    <div className="space-y-3 pl-4">
                      {timeline.map((entry, index) => (
                        <div
                          key={entry.id ?? `${entry.type}-${index}`}
                          className="flex items-start gap-3"
                        >
                          <div className="flex flex-col items-center">
                            <CheckCircle className="h-4 w-4 text-success" />
                            {index < timeline.length - 1 && (
                              <div className="w-0.5 h-6 bg-border" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{entry.summary || entry.type || "Job activity"}</p>
                            {entry.occurred_at && (
                              <div className="text-xs text-muted-foreground">
                                {formatDayMonthTime(entry.occurred_at)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
