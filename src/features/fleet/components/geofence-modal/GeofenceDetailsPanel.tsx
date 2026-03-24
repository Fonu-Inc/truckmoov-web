import { Pencil, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { geofenceCategoryLabels } from "./constants";
import type { GeofenceModalVehicle, GeofenceModalZone } from "./types";

interface GeofenceDetailsPanelProps {
 onEditZone: (zone: GeofenceModalZone) => void;
 vehicles: GeofenceModalVehicle[];
 zone: GeofenceModalZone;
}

export function GeofenceDetailsPanel({
 onEditZone,
 vehicles,
 zone,
}: GeofenceDetailsPanelProps) {
 const assignedVehicles = vehicles.filter((vehicle) =>
  zone.assignedVehicleIds.includes(vehicle.id),
 );

 return (
  <div className="flex-1 p-4 overflow-auto">
   <div className="space-y-4">
    <div className="flex items-center justify-between">
     <div className="flex items-center gap-3">
      <div
       className="h-10 w-10 rounded-full flex items-center justify-center"
       style={{ backgroundColor: `${zone.color}20` }}
      >
       <Shield className="h-5 w-5" style={{ color: zone.color }} />
      </div>
      <div>
       <h3 className="font-medium">{zone.name}</h3>
       <p className="text-sm text-muted-foreground capitalize">
        {geofenceCategoryLabels[zone.category]}
       </p>
      </div>
     </div>

     <Button size="sm" onClick={() => onEditZone(zone)}>
      <Pencil className="h-4 w-4 mr-1" />
      Edit
     </Button>
    </div>

    <div className="grid grid-cols-2 gap-4">
     <Card>
      <CardContent className="p-4">
       <p className="text-xs text-muted-foreground">Shape</p>
       <p className="font-medium">{zone.geofenceType}</p>
      </CardContent>
     </Card>
     <Card>
      <CardContent className="p-4">
       <p className="text-xs text-muted-foreground">Radius</p>
       <p className="font-medium">{zone.radiusMeters ? `${zone.radiusMeters}m` : "N/A"}</p>
      </CardContent>
     </Card>
    </div>

    <Card>
     <CardHeader className="p-4 pb-2">
      <CardTitle className="text-sm">Alert Configuration</CardTitle>
     </CardHeader>
     <CardContent className="p-4 pt-2 space-y-2">
      <div className="flex items-center justify-between">
       <span className="text-sm">Entry Alerts</span>
       <Badge variant={zone.alertOnEntry ? "default" : "secondary"}>
        {zone.alertOnEntry ? "Enabled" : "Disabled"}
       </Badge>
      </div>
      <div className="flex items-center justify-between">
       <span className="text-sm">Exit Alerts</span>
       <Badge variant={zone.alertOnExit ? "default" : "secondary"}>
        {zone.alertOnExit ? "Enabled" : "Disabled"}
       </Badge>
      </div>
      <div className="flex items-center justify-between">
       <span className="text-sm">Dwell Alerts</span>
       <Badge variant={zone.alertOnDwell ? "default" : "secondary"}>
        {zone.alertOnDwell ? `After ${zone.dwellThresholdMinutes}min` : "Disabled"}
       </Badge>
      </div>
     </CardContent>
    </Card>

    <Card>
     <CardHeader className="p-4 pb-2">
      <CardTitle className="text-sm">Assigned Vehicles</CardTitle>
     </CardHeader>
     <CardContent className="p-4 pt-2">
      {zone.assignedVehicleIds.length === 0 ? (
       <p className="text-sm text-muted-foreground">
        All vehicles (no specific assignment)
       </p>
      ) : assignedVehicles.length > 0 ? (
       <div className="flex flex-wrap gap-2">
        {assignedVehicles.map((vehicle) => (
         <Badge key={vehicle.id} variant="outline">
          {vehicle.registrationNumber}
         </Badge>
        ))}
       </div>
      ) : (
       <p className="text-sm text-muted-foreground">
        Assigned vehicles will appear here once vehicle data is connected.
       </p>
      )}
     </CardContent>
    </Card>
   </div>
  </div>
 );
}
