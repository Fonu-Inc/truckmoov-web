import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { ActivationTab } from "@/components/sims/activation/ActivationTab";
import { SimInventoryTab } from "@/components/sims/inventory/SimInventoryTab";

export default function PlatformSIMs() {
  return (
    <Tabs
      defaultValue="inventory"
      className="space-y-6"
    >
      <div className="flex justify-center">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="inventory">SIM Inventory</TabsTrigger>
          <TabsTrigger value="activation">Activation</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="inventory" className="space-y-6">
        <SimInventoryTab />
      </TabsContent>

      <TabsContent value="activation">
        <ActivationTab />
      </TabsContent>

    </Tabs>
  );
}
