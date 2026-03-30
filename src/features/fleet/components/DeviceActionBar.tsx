import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { queryClient } from "@/shared/providers/TanstackQueryProvider";
import { BulkUploadModal } from "@/shared/components/BulkUploadModal";
import { useAuthStore } from "@/stores/authStore";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { FLEET_QUERY_KEY, useBulkCreateDevice } from "../api";
import type { BulkCreateDevicePayload } from "../api/types";
import { useDeviceStore } from "../stores/device";
import DeviceFormModal from "./DeviceFormModal";
import { UserRole } from "@/features/auth/api/types";

export default function DeviceActionBar() {
 const [openDeviceFormModal, setOpenDeviceFormModal] = useState(false)
 const { user } = useAuthStore()
 const { search, setSearch } = useDeviceStore()
 const { mutateAsync: bulkCreateDevice } = useBulkCreateDevice()
  const canAlter = useMemo(() => {
    const rolesWithAccess: UserRole[] = ["FLEET_ADMIN"]
    return rolesWithAccess.includes(user.role)
  }, [user])

 function handleRefresh() {
  queryClient.invalidateQueries({ queryKey: FLEET_QUERY_KEY.devices })
 }

 async function handleBulkUpload(data: Record<string, string>[]) {
  const items: BulkCreateDevicePayload["data"]["items"] = data.map((row) => ({
   imei: row["IMEI"],
   manufacturer: row["Manufacturer"],
   model: row["Model"],
   firmwareVersion: row["Firmware Version"],
   lifecycleStatus: "verified_online"
  }));
  await bulkCreateDevice({ data: { tenantId: user.tenantId, items } });
 }

 return (
  <>
   <Card>
    <CardContent className="p-4">
     <div className="flex flex-wrap flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-3">
       <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
         placeholder="Search by IMEI, manufacturer, model..."
         className="pl-9"
         value={search}
         onChange={(e) => setSearch(e.target.value)}
        />
       </div>
       <Button variant="outline" size="icon" onClick={handleRefresh}>
        <RefreshCw className="h-4 w-4" />
       </Button>
      </div>

      {canAlter && (
       <div className="flex items-center gap-2">
        <BulkUploadModal
         title="Bulk Import Devices"
         description="Upload a CSV file to register multiple IoT devices at once."
         templateUrl="/templates/device_import_template.csv"
         onUpload={handleBulkUpload}
        />
        <Button onClick={() => setOpenDeviceFormModal(true)}>
         <Plus className="h-4 w-4" />
         Add Device
        </Button>
       </div>
      )}
     </div>
    </CardContent>
   </Card>
   <DeviceFormModal open={openDeviceFormModal} onOpenChange={setOpenDeviceFormModal} />
  </>
 )
}
