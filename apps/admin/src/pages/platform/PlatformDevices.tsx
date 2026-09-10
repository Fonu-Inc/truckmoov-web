import {
  BookOpen,
  ClipboardCheck,
  Cpu,
} from "lucide-react";
import { useState } from "react";
import { DeviceCatalogManager } from "@/components/devices/DeviceCatalogManager";
// TRU-FE-5 § 1 — the old ProvisioningQueue read a table nothing wrote to; the
// real queue lives in DeviceSetupRequestsQueue, which is wired to the new
// /auth/system/support/device-setup endpoint and the new payload shape.
import { DeviceSetupRequestsQueue } from "@/components/devices/DeviceSetupRequestsQueue";
import { PlatformDeviceManagement } from "@/components/devices/PlatformDeviceManagement";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";

export default function PlatformDevices() {
  const [
    activeTab,
    setActiveTab,
  ] = useState("management");

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger
              value="management"
              className="flex items-center gap-2"
            >
              <Cpu className="h-4 w-4" />
              Device Inventory
            </TabsTrigger>
            <TabsTrigger
              value="approval"
              className="flex items-center gap-2"
            >
              <ClipboardCheck className="h-4 w-4" />
              Approval Queue
            </TabsTrigger>
            <TabsTrigger
              value="catalog"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Device Catalog
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="management"
          className="mt-4"
        >
          <PlatformDeviceManagement />
        </TabsContent>

        <TabsContent
          value="approval"
          className="mt-4"
        >
          <DeviceSetupRequestsQueue />
        </TabsContent>

        <TabsContent
          value="catalog"
          className="mt-4"
        >
          <DeviceCatalogManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
