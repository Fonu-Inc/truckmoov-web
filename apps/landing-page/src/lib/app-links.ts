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
  href: "#",
  children: [
   { title: "Enterprise Admin", href: "#" },
   { title: "Fleet Provider", href: "#" },
   { title: "Owner Operator", href: "#" },
   { title: "Aggregator Admin", href: "#" },
  ],
 },
 {
  title: "Products",
  href: "#",
  children: [
   { title: "Fleet Management", href: "#" },
   { title: "Live Tracking", href: "#" },
   { title: "Dispatch Management", href: "#" },
   { title: "AI Optimisation", href: "#" },
   { title: "Analytics & Reporting", href: "#" },
   { title: "IoT & Devices.", href: "#" },
  ],
 },
 {
  title: "Solutions",
  href: "#",
  children: [
   { title: "Enterprise Logistics", href: "#" },
   { title: "Delivery Operations", href: "#" },
   { title: "Fleet Operations", href: "#" },
   { title: "Third-Party Logistics", href: "#" },
   { title: "Smart Fleet Tracking", href: "#" },
   { title: "AI Logistics Operations", href: "#" },
  ],
 },
 {
  title: "About Us",
  href: "#",
  children: [
   { title: "Vision, Mission & Core Values", href: "#" },
   { title: "Our Journey", href: "#" },
   { title: "Team & Management", href: "#" },
  ],
 },
 {
  title: "Resources",
  href: "#",
  children: [
   { title: "Documentation", href: "#" },
   { title: "FAQs", href: "#" },
   { title: "Platform Guides", href: "#" },
   { title: "API & Integration Docs", href: "#" },
   { title: "Pricing", href: "#" },
  ],
 },
];
