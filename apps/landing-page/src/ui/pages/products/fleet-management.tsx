import ProductLayout from "@/ui/components/product-layout/product-layout";
import { fleetManagement } from "./products-data";

export default function FleetManagement() {
  return <ProductLayout data={fleetManagement} />;
}
