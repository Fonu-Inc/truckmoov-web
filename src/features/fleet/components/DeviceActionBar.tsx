import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BulkUploadModal } from "@/shared/components/BulkUploadModal";
import { Filter, Plus, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import DeviceFormModal from "./DeviceFormModal";

export default function DeviceActionBar() {
 const [openDeviceFormModal, setOpenDeviceFormModal] = useState(false)

 return (
  <>
   <Card>
    <CardContent className="p-4">
     <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-3">
       <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
         placeholder="Search by IMEI, manufacturer, model..."
         className="pl-9"
        />
       </div>
       <Select>
        <SelectTrigger className="w-40">
         <Filter className="h-4 w-4" />
         <SelectValue placeholder="Manufacturer" />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="all">All Manufacturers</SelectItem>
        </SelectContent>
       </Select>
       <Button variant="outline" size="icon">
        <RefreshCw className="h-4 w-4" />
       </Button>
      </div>

      <div className="flex items-center gap-2">
       <BulkUploadModal
        title="Bulk Import Devices"
        description="Upload a CSV file to register multiple IoT devices at once."
        templateUrl="/templates/device_import_template.csv"
        onUpload={async (data) => {
        }}
       />
       <Button onClick={() => setOpenDeviceFormModal(true)}>
        <Plus className="h-4 w-4" />
        Add Device
       </Button>
      </div>
     </div>
    </CardContent>
   </Card>
   <DeviceFormModal open={openDeviceFormModal} onOpenChange={setOpenDeviceFormModal} />
  </>
 )
}
