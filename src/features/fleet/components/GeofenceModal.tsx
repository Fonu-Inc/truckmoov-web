import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Shield } from "lucide-react";

export default function GeofenceModal() {
 return (
  <Dialog>
   <DialogTrigger asChild>
    <Button variant="outline">
     <MapPin className="h-4 w-4" />
     Geofences
    </Button>
   </DialogTrigger>
   <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
    <DialogHeader className="p-6 pb-0">
     <DialogTitle className="flex items-center gap-2">
      <Shield className="h-5 w-5 text-primary" />
      Geofence Management
     </DialogTitle>
     <DialogDescription>
      Create, edit, and configure geofence zones with custom alerts
     </DialogDescription>
    </DialogHeader>
   </DialogContent>
  </Dialog>
 )
}
