import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { ActivationTab } from "@/components/sims/activation/ActivationTab";
import { SimInventoryTab } from "@/components/sims/inventory/SimInventoryTab";
import { PageTitle } from "@/shared/components/layout/PageTitle";

export default function PlatformSIMs() {
  const [
    activeTab,
    setActiveTab,
  ] = useState("inventory");
  const heading = activeTab === "activation"
    ? {
        title: "SIMs Activation",
        description: "Monitor and manage IoT SIM activation requests, including activation status and provisioning progress.",
      }
    : {
        title: "SIM Inventory",
        description: "View and manage available IoT SIM cards, monitor stock levels, and track SIM inventory across the platform.",
      };
  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-6"
    >
      <div className="flex justify-center">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="inventory">SIM Inventory</TabsTrigger>
          <TabsTrigger value="activation">Activation</TabsTrigger>
        </TabsList>
      </div>
      <PageTitle {...heading} />

      <TabsContent
        value="inventory"
        className="space-y-6"
      >
        <SimInventoryTab />
      </TabsContent>

      <TabsContent value="activation">
        <ActivationTab />
      </TabsContent>

    </Tabs>
  );
}
