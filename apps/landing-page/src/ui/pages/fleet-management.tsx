import type { ProductData } from "../components/product-layout";
import ProductLayout from "../components/product-layout";

const FLEET_MANAGEMENT: ProductData = {
  titleIcon: "/stalkholders/fleet-provider.svg",
  title: "Fleet Management",
  description: "Streamline vehicle operations with real-time fleet visibility and proactive maintenance management to ensure reliability, efficiency, and continuous operational performance.",
  capabilities: [
    "Asset registry",
    "Maintenance schedules",
    "Document expiry alerts",
    "Service history",
  ],
  fit: "Fleet Management integrates deeply with the broader FleetPro ecosystem, continuously synchronizing telemetry data, asset identity, and real-time event streams across all connected modules. This ensures every team operates from a unified source of truth, enabling consistent decision-making, improved coordination, and full operational visibility across the entire logistics network.",
};

export default function FleetManagement() {
  return (
    <ProductLayout
      data={FLEET_MANAGEMENT}
    />
  );
}
