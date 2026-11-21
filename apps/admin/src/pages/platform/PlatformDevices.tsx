import {
  BookOpen,
  ClipboardCheck,
  Cpu,
} from "lucide-react";
import { useState } from "react";
import { DeviceCatalogManager } from "@/components/devices/DeviceCatalogManager";
import { DeviceSetupRequestsQueue } from "@/components/devices/DeviceSetupRequestsQueue";
import { PlatformDeviceManagement } from "@/components/devices/PlatformDeviceManagement";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { PageTitle } from "@/shared/components/layout/PageTitle";

const TAB_HEADINGS: Record<string, {
  title: string;
  description: string;
}> = {
  management: {
    title: "Devices Assigned",
    description: "View and manage devices that have been assigned to customers and their respective fleets.",
  },
  approval: {
    title: "Device Requests",
    description: "Review and manage device requests submitted by customers, including their request status and approval progress.",
  },
  catalog: {
    title: "Device Inventory",
    description: "Monitor available devices, track stock levels, and manage the platform's device inventory.",
  },
};

export default function PlatformDevices() {
  const [
    activeTab,
    setActiveTab,
  ] = useState("management");
  const heading = TAB_HEADINGS[activeTab] ?? TAB_HEADINGS.management;

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="flex justify-center">
          <TabsList className="h-auto max-w-full flex-wrap gap-1">
            <TabsTrigger
              value="management"
              className="flex items-center gap-2"
            >
              <Cpu className="h-4 w-4" />
              Assigned Devices
            </TabsTrigger>
            <TabsTrigger
              value="approval"
              className="flex items-center gap-2"
            >
              <ClipboardCheck className="h-4 w-4" />
              Device Request
            </TabsTrigger>
            <TabsTrigger
              value="catalog"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Device Inventory
            </TabsTrigger>
          </TabsList>
        </div>

        <PageTitle
          title={heading.title}
          description={heading.description}
        />

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
