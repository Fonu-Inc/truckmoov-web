import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Job } from "@/types";
import { mockDrivers, mockVehicles } from "@/data/mockData";
import { format } from "date-fns";
import { 
  MapPin, Package, Calendar, DollarSign, User, Truck,
  Clock, CheckCircle, Circle, ArrowRight, MessageSquare, Phone
} from "lucide-react";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { useCurrency } from "@/contexts/CurrencyContext";

interface JobDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

const statusColors: Record<string, string> = {
  created: "bg-muted text-muted-foreground border-muted",
  assigned: "bg-primary/20 text-primary border-primary/30",
  accepted: "bg-success/20 text-success border-success/30",
  in_progress: "bg-warning/20 text-warning border-warning/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const statusSteps = [
  { key: "created", label: "Created" },
  { key: "assigned", label: "Assigned" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export function JobDetailsSheet({ open, onOpenChange, job }: JobDetailsSheetProps) {
  const { format: formatCurrency } = useCurrency();
  const { logs: activityLogs, isLoading: isLoadingActivity } = useActivityLogs({
    entityType: 'job',
    entityId: job?.id || '',
    enabled: open && !!job,
  });

  if (!job) return null;

  const driver = job.driverId ? mockDrivers.find(d => d.id === job.driverId) : null;
  const vehicle = job.vehicleId ? mockVehicles.find(v => v.id === job.vehicleId) : null;

  const currentStepIndex = statusSteps.findIndex(s => s.key === job.status);
  const progressPercent = ((currentStepIndex + 1) / statusSteps.length) * 100;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-card border-border">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl font-mono">{job.reference}</SheetTitle>
              <Badge className={statusColors[job.status]}>
                {job.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{formatCurrency(job.amount)}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Progress Tracker */}
          <Card className="bg-muted/30 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercent} className="h-2 mb-4" />
              <div className="flex justify-between">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      } ${isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`} />
                      <span className={`text-xs mt-1 ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

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
                    <p className="font-medium">{job.pickup.address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Delivery</p>
                    <p className="font-medium">{job.delivery.address}</p>
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
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{job.cargo.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Weight</p>
                <p className="font-medium">{job.cargo.weight} tons</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Description</p>
                <p className="font-medium">{job.cargo.description || "No description"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Resources */}
          {(driver || vehicle) && (
            <Card className="bg-muted/30 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Assigned Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {driver && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-sm font-medium text-primary-foreground">
                        {driver.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">{driver.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {vehicle && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Truck className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                      <p className="text-sm text-muted-foreground">{vehicle.registrationNumber}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card className="bg-muted/30 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingActivity ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activityLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activity recorded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log, index) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <CheckCircle className="h-4 w-4 text-success" />
                        {index < activityLogs.length - 1 && (
                          <div className="w-0.5 h-6 bg-border" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{log.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(new Date(log.created_at), "MMM dd, HH:mm")}</span>
                          {log.actor_name && (
                            <>
                              <span>•</span>
                              <span>{log.actor_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deadline */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Deadline</span>
            </div>
            <span className="font-medium">{format(new Date(job.deadline), "MMM dd, yyyy HH:mm")}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
