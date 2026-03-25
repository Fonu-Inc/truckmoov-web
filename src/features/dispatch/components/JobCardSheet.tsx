import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import StatusBadge from "@/shared/components/StatusBadge";
import { Calendar, CheckCircle, Clock, Package } from "lucide-react";

type JobCardSheetProps = {
 open: boolean;
 onOpenChange: (open: boolean) => void;
}

const statusSteps = [
 { key: "created", label: "Created" },
 { key: "assigned", label: "Assigned" },
 { key: "accepted", label: "Accepted" },
 { key: "in_progress", label: "In Progress" },
 { key: "completed", label: "Completed" },
];

export default function JobCardSheet({ open, onOpenChange }: JobCardSheetProps) {
 const currentStepIndex = 0;
 return (
  <Sheet open={open} onOpenChange={onOpenChange}>
   <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-card border-border">
    <SheetHeader className="space-y-4 mt-4">
     <div className="flex items-start justify-between">
      <div>
       <SheetTitle className="text-xl font-mono">TM-2849</SheetTitle>
       <StatusBadge status="created" />
      </div>
      <div className="text-right">
       {/* <p className="text-2xl font-bold text-primary">{formatCurrency(job.amount)}</p> */}
       <p className="text-2xl font-bold text-primary">#95,000</p>
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
       <Progress value={25} className="h-2 mb-4" />
       <div className="flex justify-between">
        {statusSteps.map((step, index) => {
         const isCompleted = index <= currentStepIndex;
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
          <p className="font-medium">Oshodi Market</p>
         </div>
         <div>
          <p className="text-xs text-muted-foreground uppercase">Delivery</p>
          <p className="font-medium">Ikorodu</p>
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
        <p className="font-medium">Food Products</p>
       </div>
       <div>
        <p className="text-muted-foreground">Weight</p>
        <p className="font-medium">12 tons</p>
       </div>
       <div className="col-span-2">
        <p className="text-muted-foreground">Description</p>
        <p className="font-medium">No description</p>
       </div>
      </CardContent>
     </Card>

     {/* Assigned Resources */}
     {/* {(driver || vehicle) && (
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
     )} */}

     {/* Timeline */}
     <Card className="bg-muted/30 border-border/50">
      <CardHeader className="pb-2">
       <CardTitle className="text-sm font-medium flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        Activity Timeline
       </CardTitle>
      </CardHeader>
      <CardContent>
       {/* {isLoadingActivity ? (
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
            {index < div activityLogs.length - 1 && (
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
       )} */}
      </CardContent>
     </Card>

     {/* Deadline */}
     {/* <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2">
       <Calendar className="h-5 w-5 text-primary" />
       <span className="text-sm font-medium">Deadline</span>
      </div>
      <span className="font-medium">{format(new Date(job.deadline), "MMM dd, yyyy HH:mm")}</span>
     </div> */}
    </div>
   </SheetContent>
  </Sheet>
 )
}
