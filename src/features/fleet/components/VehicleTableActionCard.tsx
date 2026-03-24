import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Plus, Search } from "lucide-react";
import GeofenceModal from "./GeofenceModal";
import VehicleFormModal from "./VehicleFormModal";
import { BulkUploadModal } from "@/shared/components/BulkUploadModal";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function VehicleTableActionCard() {
 const [openVehicleForm, setOpenVehicleForm] = useState(false)
 return (
  <>
   <Card>
    <CardContent className="p-4">
     <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-3">
       <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
         placeholder="Search by registration, make, model..."
         className="pl-9"
        />
       </div>
       <Select>
        <SelectTrigger className="w-35">
         <Filter className="mr-2 h-4 w-4" />
         <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="all">All Types</SelectItem>
         <SelectItem value="truck">Truck</SelectItem>
         <SelectItem value="van">Van</SelectItem>
         <SelectItem value="trailer">Trailer</SelectItem>
        </SelectContent>
       </Select>
      </div>

      <div className="flex items-center gap-2">
       <GeofenceModal />
       <BulkUploadModal
        title="Bulk Import Vehicles"
        description="Upload a CSV file to import multiple vehicles at once."
        templateUrl="/templates/vehicle_import_template.csv"
        onUpload={async (file) => {
         const content = await file.text();
        }}
       />
       <Button onClick={() => setOpenVehicleForm(true)}>
        <Plus className="h-4 w-4" />
        Add Vehicle
       </Button>
      </div>
     </div>
    </CardContent>
   </Card>
   <VehicleFormModal open={openVehicleForm} onOpenChange={setOpenVehicleForm} />
  </>
 )
}
