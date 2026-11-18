import type { ProductPageData } from "@/ui/components/product-layout/product-types";
import {
  Brain,
  Cpu,
  MapPin,
  MapTrifold,
  Truck,
} from "@phosphor-icons/react";
import { FileChartPie } from "lucide-react";

/*
 * Copy for the six product feature pages (/products/*), rendered by <ProductLayout>.
 * Verbatim from the Figma "Landing Page (<product>)" frames; each array item is one
 * Figma text line so the large-screen wrap matches the design.
 */

export const fleetManagement: ProductPageData = {
  hero: {
    title: "Fleet Management",
    icon: Truck,
    description: [
      "Streamline vehicle operations with real-time fleet visibility and",
      "proactive maintenance management to ensure reliability,",
      "efficiency, and continuous operational performance.",
    ],
  },
  capabilities: [
    "Asset registry",
    "Maintenance schedules",
    "Document expiry alerts",
    "Service history",
  ],
  howItFits: [
    "Fleet Management integrates deeply with the broader FleetPro ecosystem, continuously synchronizing telemetry data, asset identity, and real-time",
    "event streams across all connected modules. This ensures every team operates from a unified source of truth, enabling consistent decision-making,",
    "improved coordination, and full operational visibility across the entire logistics network.",
  ],
};

export const liveTracking: ProductPageData = {
  hero: {
    title: "Live Tracking",
    icon: MapPin,
    description: [
      "Provide real-time GPS, IoT-powered tracking, and live trip",
      "visibility, giving full insight into vehicle location, movement, and",
      "operational status across every journey.",
    ],
  },
  capabilities: [
    "Sub-minute pings",
    "Geofencing",
    "Route monitoring",
    "Trip playback",
  ],
  howItFits: [
    "Live Tracking integrates seamlessly with the FleetPro ecosystem, sharing telemetry, identity, and event data across connected modules to provide a",
    "unified operational view. This ensures teams can monitor vehicles, drivers, and trips in real time while working from a single source of truth for faster,",
    "more informed decision-making.",
  ],
  howItFitsClassName: "lg:mt-0.5",
};

export const dispatchManagement: ProductPageData = {
  hero: {
    title: "Dispatch Management",
    icon: MapTrifold,
    description: [
      "Dispatch workflows, job assignment, and operational",
      "coordination. Enable smooth task allocation and real-time",
      "coordination across teams for faster, more efficient operations.",
    ],
  },
  capabilities: [
    "Job board",
    "Auto-assignment",
    "Driver acceptance",
    "Proof of delivery",
  ],
  howItFits: [
    "Dispatch Management integrates seamlessly with the FleetPro ecosystem, sharing telemetry, identity, and event streams across modules so your",
    "operations team works from a single source of truth. This enables real-time coordination, smarter job allocation, and smoother collaboration between",
    "dispatchers, drivers, and fleet managers for more efficient operations.",
  ],
  howItFitsClassName: "lg:mt-0.5",
};

export const aiOptimization: ProductPageData = {
  hero: {
    // Figma frame spells it "AI Optimisation"; the h1 follows the nav/route name.
    title: "AI Optimization",
    icon: Brain,
    description: [
      "AI route optimisation, predictive logistics, and operational",
      "intelligence. Improve routing, forecast demand, and make faster,",
      "data-driven decisions.",
    ],
  },
  capabilities: [
    "Route ETA prediction",
    "Load matching",
    "Anomaly detection",
    "Smart suggestions",
  ],
  howItFits: [
    "AI Optimisation integrates seamlessly with the FleetPro ecosystem, sharing telemetry, identity, and event streams across modules so your operations",
    "team works from a single source of truth. This enables smarter routing, predictive logistics, and real-time operational intelligence that improves",
    "efficiency and decision-making across the entire fleet.",
  ],
  howItFitsClassName: "lg:mt-0.5",
};

export const analyticsReporting: ProductPageData = {
  hero: {
    title: "Analytics & Reporting",
    icon: FileChartPie,
    description: [
      "Operational analytics, fleet insights, and revenue-grade exports.",
      "Gain actionable insights, track performance, and generate",
      "export-ready reports with ease.",
    ],
  },
  capabilities: [
    "Utilisation metrics",
    "Driver scorecards",
    "Cost-per-km",
    "Custom dashboards",
  ],
  howItFits: [
    "Analytics & Reporting integrates seamlessly with the FleetPro ecosystem, sharing telemetry, identity, and event streams across modules to provide a",
    "unified view of fleet operations. By drawing from a single source of truth, teams can access accurate, real-time insights, generate reliable reports, and",
    "make more informed operational and business decisions.",
  ],
  howItFitsClassName: "lg:mt-0.5",
};

export const iotSimsDevices: ProductPageData = {
  hero: {
    title: "IoT SIMs & Devices",
    icon: Cpu,
    description: [
      "IoT SIM management, device provisioning, and connectivity",
      "systems. Manage devices, SIMs, and connectivity from a single",
      "platform with ease and reliability.",
    ],
  },
  capabilities: [
    "MTN SIM provisioning",
    "Device fleet status",
    "Tamper alerts",
    "Firmware management",
  ],
  howItFits: [
    "IoT SIMs & Devices integrates seamlessly with the FleetPro ecosystem, sharing telemetry, identity, and event streams across modules so your operations",
    "team works from a single source of truth. This enables real-time visibility into device health, connectivity, and performance across the entire fleet,",
    "supporting smarter monitoring and faster operational decisions.",
  ],
  howItFitsClassName: "lg:mt-0.5",
};
