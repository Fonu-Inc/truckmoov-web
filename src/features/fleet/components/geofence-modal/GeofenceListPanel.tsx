import { Archive, Clock, LogIn, LogOut, Pencil, Plus, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { geofenceCategoryLabels } from "./constants";
import type { GeofenceModalZone } from "./types";

interface GeofenceListPanelProps {
 isEditing: boolean;
 onCreateNew: () => void;
 onEditZone: (zone: GeofenceModalZone) => void;
 onRequestArchive: (zoneId: string) => void;
 onSelectZone: (zoneId: string) => void;
 selectedZoneId: string | null;
 zones: GeofenceModalZone[];
}

export function GeofenceListPanel({
 isEditing,
 onCreateNew,
 onEditZone,
 onRequestArchive,
 onSelectZone,
 selectedZoneId,
 zones,
}: GeofenceListPanelProps) {
 return (
  <div className="w-80 border-r border-border bg-muted/20 flex flex-col">
   <div className="p-4 border-b border-border">
    <Button onClick={onCreateNew} className="w-full" disabled={isEditing}>
     <Plus className="h-4 w-4 mr-2" />
     Create New Zone
    </Button>
   </div>

   <ScrollArea className="flex-1">
    <div className="p-3 space-y-2">
     {zones.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground">
       <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
       <p className="text-sm">No geofences configured</p>
       <p className="text-xs mt-1">Create your first zone above</p>
      </div>
     ) : (
      zones.map((zone) => (
       <Card
        key={zone.id}
        className={cn(
         "cursor-pointer transition-all hover:border-primary/50",
         selectedZoneId === zone.id && !isEditing && "border-primary bg-primary/5",
        )}
        onClick={() => !isEditing && onSelectZone(zone.id)}
       >
        <CardContent className="p-3">
         <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
           <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: zone.color }}
           />
           <div>
            <p className="font-medium text-sm">{zone.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
             {geofenceCategoryLabels[zone.category]}
            </p>
           </div>
          </div>
          <Badge variant="outline" className="text-[10px]">
           {zone.assignedVehicleIds.length} vehicles
          </Badge>
         </div>

         <div className="flex items-center gap-2 mt-2">
          {zone.alertOnEntry && (
           <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            <LogIn className="h-2.5 w-2.5 mr-1" />
            Entry
           </Badge>
          )}
          {zone.alertOnExit && (
           <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            <LogOut className="h-2.5 w-2.5 mr-1" />
            Exit
           </Badge>
          )}
          {zone.alertOnDwell && (
           <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            <Clock className="h-2.5 w-2.5 mr-1" />
            Dwell
           </Badge>
          )}
         </div>

         <div className="flex gap-1 mt-2">
          <Button
           size="sm"
           variant="ghost"
           className="h-7 text-xs flex-1"
           onClick={(event) => {
            event.stopPropagation();
            onEditZone(zone);
           }}
          >
           <Pencil className="h-3 w-3 mr-1" />
           Edit
          </Button>
          <Button
           size="sm"
           variant="ghost"
           className="h-7 text-xs text-destructive hover:text-destructive"
           onClick={(event) => {
            event.stopPropagation();
            onRequestArchive(zone.id);
           }}
          >
           <Archive className="h-3 w-3" />
          </Button>
         </div>
        </CardContent>
       </Card>
      ))
     )}
    </div>
   </ScrollArea>
  </div>
 );
}
