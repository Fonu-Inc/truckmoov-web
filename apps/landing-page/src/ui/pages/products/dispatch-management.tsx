import ProductLayout from "@/ui/components/product-layout/product-layout";
import { dispatchManagement } from "./products-data";

export default function DispatchManagement() {
  return <ProductLayout data={dispatchManagement} />;
}
