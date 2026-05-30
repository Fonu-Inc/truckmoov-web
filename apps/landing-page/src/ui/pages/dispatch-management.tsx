import ProductLayout, { type ProductData } from "../components/product-layout";

const DISPATCH_MANAGEMENT: ProductData = {
 titleIcon: "/products/dispatch-management.svg",
 title: "Dispatch Management",
 description: "Dispatch workflows, job assignment, and operational coordination. Enable smooth task allocation and real-time coordination across teams for faster, more efficient operations.",
 capabilitiesHeader: "What Is Included In This Feature",
 capabilities: [
  "Job board",
  "Auto-assignment",
  "Driver acceptance",
  "Proof of delivery"
 ],
 fit: "Dispatch Management integrates seamlessly with the FleetPro ecosystem, sharing telemetry, identity, and event streams across modules so your operations team works from a single source of truth. This enables real-time coordination, smarter job allocation, and smoother collaboration between dispatchers, drivers, and fleet managers for more efficient operations."
};

export default function DispatchManagement() {
 return (
  <ProductLayout
   data={DISPATCH_MANAGEMENT}
  />
 )
}
