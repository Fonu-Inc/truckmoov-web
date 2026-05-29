export type AppLinkType = {
 title: string;
 href: string;
 children: Array<{
  title: string;
  href: string;
 }>;
};

export const appLinks: AppLinkType[] = [
 {
  title: "Stakeholders",
  href: "/#stalkholders",
  children: [
   { title: "Enterprise Admin", href: "/stakeholders/enterprise-admin" },
   { title: "Fleet Provider", href: "/stakeholders/fleet-provider" },
   { title: "Owner Operator", href: "/stakeholders/owner-operator" },
   { title: "Aggregator Admin", href: "/stakeholders/aggregator-admin" },
  ],
 },
 {
  title: "Products",
  href: "/#products",
  children: [
   { title: "Fleet Management", href: "/products/fleet-management" },
   { title: "Live Tracking", href: "/products/live-tracking" },
   { title: "Dispatch Management", href: "/products/dispatch-management" },
   { title: "AI Optimisation", href: "/products/ai-optimisation" },
   { title: "Analytics & Reporting", href: "/products/analytics-reporting" },
   { title: "IoT & Devices.", href: "/products/iot-devices" },
  ],
 },
 {
  title: "Solutions",
  href: "/#solutions",
  children: [
   { title: "Enterprise Logistics", href: "/solutions/enterprise-logistics" },
   { title: "Delivery Operations", href: "/solutions/delivery-operations" },
   { title: "Fleet Operations", href: "/solutions/fleet-operations" },
   { title: "Third-Party Logistics", href: "/solutions/third-party-logistics" },
   { title: "Smart Fleet Tracking", href: "/solutions/smart-fleet-tracking" },
   { title: "AI Logistics Operations", href: "/solutions/ai-logistics-operations" },
  ],
 },
 {
  title: "About Us",
  href: "/#about-us",
  children: [
   { title: "Vision, Mission & Core Values", href: "/about/vision-mission-core-values" },
   { title: "Our Journey", href: "/about/our-journey" },
   { title: "Team & Management", href: "/about/team-management" },
  ],
 },
 {
  title: "Resources",
  href: "/#resources",
  children: [
   { title: "Documentation", href: "/resources/documentation" },
   { title: "FAQs", href: "/resources/faqs" },
   { title: "Platform Guides", href: "/resources/platform-guides" },
   { title: "API & Integration Docs", href: "/resources/api-integration-docs" },
   { title: "Pricing", href: "/resources/pricing" },
  ],
 },
];
