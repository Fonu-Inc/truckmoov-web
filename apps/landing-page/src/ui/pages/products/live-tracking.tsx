import ProductLayout from "@/ui/components/product-layout/product-layout";
import { liveTracking } from "./products-data";

export default function LiveTracking() {
  return <ProductLayout data={liveTracking} />;
}
