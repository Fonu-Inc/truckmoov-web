import ProductLayout, { type ProductData } from "../components/product-layout";

const LIVE_TRACKING: ProductData = {
 titleIcon: "/stalkholders/fleet-provider.svg",
 title: "Live Tracking",
 description: "Provide real-time GPS, IoT-powered tracking, and live trip visibility, giving full insight into vehicle location, movement, and operational status across every journey.",
 capabilitiesHeader: "What Is Included In This Feature",
 capabilities: [
  "Sub-minute pings",
  "Geofencing",
  "Route monitoring",
  "Trip playback"
 ],
 fit: "Live Tracking integrates seamlessly with the FleetPro ecosystem, sharing telemetry, identity, and event data across connected modules to provide a unified operational view. This ensures teams can monitor vehicles, drivers, and trips in real time while working from a single source of truth for faster, more informed decision-making."
};

export default function LiveTracking() {
 return (
  <ProductLayout
   data={LIVE_TRACKING}
  />
 )
}
