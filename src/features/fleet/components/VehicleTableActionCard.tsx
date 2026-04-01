import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Plus, Search } from "lucide-react";
import GeofenceModal from "./GeofenceModal";
import VehicleFormModal from "./VehicleFormModal";
import { BulkUploadModal } from "@/shared/components/BulkUploadModal";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useBulkCreateVehicle } from "../api";
import type { CreateVehicleData, FleetStatus, VehicleType } from "../api/types";
import { useVehicleStore } from "../stores/vehicle";

export default function VehicleTableActionCard() {
 const [openVehicleForm, setOpenVehicleForm] = useState(false)
 const { search, status, setSearch, setStatus } = useVehicleStore()
 const { mutateAsync: bulkCreateVehicle } = useBulkCreateVehicle()

 async function handleBulkUpload(data: Record<string, string>[]) {
  const items: CreateVehicleData[] = data.map((row) => ({
   registrationNumber: row["Registration Number"],
   plateNumber: row["Plate Number Image URL"],
   vin: row["VIN"],
   make: row["Make"],
   model: row["Model"],
   year: Number(row["Year"]),
   type: row["Type"] as VehicleType,
   capacity: Number(row["Capacity (tons)"]),
   status: (row["Status"] as FleetStatus) ?? "inactive",
  }));

  await bulkCreateVehicle({ data: { items } });
 }

 return (
  <>
   <Card>
    <CardContent className="p-4">
     <div className="flex flex-col flex-wrap gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-3">
       <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
         placeholder="Search by registration, make, model..."
         className="pl-9"
         value={search}
         onChange={(e) => setSearch(e.target.value)}
        />
       </div>
       {/* <Select>
        <SelectTrigger className="w-35">
         <Filter className="h-4 w-4" />
         <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="all">All Types</SelectItem>
         <SelectItem value="truck">Truck</SelectItem>
         <SelectItem value="van">Van</SelectItem>
         <SelectItem value="trailer">Trailer</SelectItem>
        </SelectContent>
       </Select> */}
       <Select value={status} onValueChange={(v) => setStatus(v === "all" ? "" : v as FleetStatus)}>
        <SelectTrigger className="w-30">
         <Filter className="h-4 w-4" />
         <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="all">All</SelectItem>
         <SelectItem value="active">Active</SelectItem>
         <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
       </Select>
      </div>

      <div className="flex items-center gap-2">
       {/* <GeofenceModal /> */}
       <BulkUploadModal
        title="Bulk Import Vehicles"
        description="Upload a CSV file to import multiple vehicles at once."
        templateUrl="/templates/vehicle_import_template.csv"
        onUpload={(data) => handleBulkUpload(data)}
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
