import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Vehicle } from "../api/types";
import { MapPin, Truck, Wrench } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/shared/components/StatusBadge";
import { Badge } from "@/components/ui/badge";

type VehicleDetailSheetProps = {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 vehicle: Vehicle | null;
}

export default function VehicleDetailSheet({ open, onOpenChange, vehicle }: VehicleDetailSheetProps) {
 return (
  <Sheet open={open} onOpenChange={onOpenChange}>
   <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
    <SheetHeader>
     <SheetTitle className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
       <Truck className="h-6 w-6 text-primary" />
      </div>
      <div>
       <span className="block">{vehicle?.registrationNumber}</span>
       <span className="text-sm font-normal text-muted-foreground">
        {vehicle?.make} {vehicle?.model} ({vehicle?.year})
       </span>
      </div>
     </SheetTitle>
     <SheetDescription className="sr-only">Vehicle details and history</SheetDescription>
    </SheetHeader>

    <div className="mt-6">
     <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
       <TabsTrigger value="overview">Overview</TabsTrigger>
       {/* <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
       <TabsTrigger value="trips">Trips</TabsTrigger> */}
      </TabsList>

      <TabsContent value="overview" className="mt-4 space-y-4">
       {/* Status Card */}
       <Card>
        <CardContent className="p-4">
         <div className="flex items-center justify-between">
          <div>
           <p className="text-sm text-muted-foreground">Current Status</p>
           <StatusBadge status={vehicle?.status}/>
          </div>
          {/* {vehicle.fuelLevel !== undefined && (
           <div className="text-right">
            <p className="text-sm text-muted-foreground">Fuel Level</p>
            <div className="flex items-center gap-2 mt-1">
             <Fuel className="h-4 w-4 text-muted-foreground" />
             <span className="font-medium">{vehicle.fuelLevel}%</span>
            </div>
           </div>
          )} */}
         </div>
        </CardContent>
       </Card>

       {/* Vehicle Info */}
       <Card>
        <CardHeader className="pb-3">
         <CardTitle className="text-sm font-medium">Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
         <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">VIN</span>
          <span className="font-mono">{vehicle?.vin}</span>
         </div>
         <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Type</span>
          <span className="capitalize">{vehicle?.type}</span>
         </div>
         <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Capacity</span>
          <span>{vehicle?.capacity} tons</span>
         </div>
         {/* <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Assigned Driver</span>
          <span>{vehicle.assignedDriverId === null ? "Unassigned": ""}</span>
         </div> */}
        </CardContent>
       </Card>

       {/* Location Info */}
       {/* {vehicle.location && (
        <Card>
         <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
           <MapPin className="h-4 w-4 text-primary" />
           Current Location
          </CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
           <span className="text-muted-foreground">Coordinates</span>
           <span className="font-mono text-xs">
            {vehicle.location.lat.toFixed(4)}, {vehicle.location.lng.toFixed(4)}
           </span>
          </div>
          <div className="flex justify-between text-sm">
           <span className="text-muted-foreground">Speed</span>
           <span className="flex items-center gap-1">
            <Gauge className="h-3 w-3" />
            {vehicle.location.speed} km/h
           </span>
          </div>
          <div className="flex justify-between text-sm">
           <span className="text-muted-foreground">Last Update</span>
           <span>{format(vehicle.location.lastUpdate, "PPp")}</span>
          </div>
         </CardContent>
        </Card>
       )} */}
      </TabsContent>

      <TabsContent value="maintenance" className="mt-4 space-y-4">
       {/* <Card>
        <CardHeader>
         <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          Maintenance History
         </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
         {mockMaintenanceHistory.map((record) => (
          <div
           key={record.id}
           className={cn(
            "rounded-lg border border-border p-3",
            record.status === "scheduled" && "border-primary/50 bg-primary/5"
           )}
          >
           <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
             {record.status === "completed" ? (
              <CheckCircle className="h-4 w-4 text-success" />
             ) : (
              <Clock className="h-4 w-4 text-primary" />
             )}
             <span className="font-medium">{record.type}</span>
            </div>
            <Badge variant={record.status === "scheduled" ? "default" : "secondary"}>
             {record.status}
            </Badge>
           </div>
           <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
             <Calendar className="h-3 w-3" />
             {format(record.date, "PPP")}
            </div>
            {record.mileage && (
             <div>Mileage: {record.mileage.toLocaleString()} km</div>
            )}
            {record.cost && (
             <div>Cost: ₦{record.cost.toLocaleString()}</div>
            )}
            {record.notes && (
             <div className="flex items-start gap-1 mt-2">
              <FileText className="h-3 w-3 mt-0.5" />
              {record.notes}
             </div>
            )}
           </div>
          </div>
         ))}
        </CardContent>
       </Card> */}
      </TabsContent>

      <TabsContent value="trips" className="mt-4 space-y-4">
       {/* <Card>
        <CardHeader>
         <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Recent Trips
         </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
         {mockTripHistory.map((trip) => (
          <div key={trip.id} className="rounded-lg border border-border p-3">
           <div className="flex items-start justify-between">
            <div>
             <p className="font-medium text-sm">
              {trip.from} → {trip.to}
             </p>
             <p className="text-xs text-muted-foreground mt-1">
              {format(trip.date, "PPP")}
             </p>
            </div>
            <Badge variant="secondary">{trip.status}</Badge>
           </div>
           <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span>{trip.distance} km</span>
            <span>•</span>
            <span>{trip.duration}</span>
           </div>
          </div>
         ))}
        </CardContent>
       </Card> */}
      </TabsContent>
     </Tabs>
    </div>
   </SheetContent>
  </Sheet>
 )
}
