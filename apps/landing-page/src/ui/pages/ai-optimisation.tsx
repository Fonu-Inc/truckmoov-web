import ProductLayout, { type ProductData } from "../components/product-layout";

const AI_OPTIMISATION: ProductData = {
 titleIcon: "/products/ai-optimisation.svg",
 title: "AI Optimisation",
 description: "AI route optimisation, predictive logistics, and operational intelligence. Improve routing, forecast demand, and make faster, data-driven decisions.",
 capabilitiesHeader: "What Is Included In This Feature",
 capabilities: [
  "Route ETA prediction",
  "Load matching",
  "Anomaly detection",
  "Smart suggestions"
 ],
 fit: "AI Optimisation integrates seamlessly with the FleetPro ecosystem, sharing telemetry, identity, and event streams across modules so your operations team works from a single source of truth. This enables smarter routing, predictive logistics, and real-time operational intelligence that improves efficiency and decision-making across the entire fleet."
};

export default function AiOptimisation() {
 return (
  <ProductLayout
   data={AI_OPTIMISATION}
  />
 )
}
