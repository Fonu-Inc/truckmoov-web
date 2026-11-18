import type { IconType } from "@/lib/app-links";
import type { FaqItem } from "@/ui/components/faq-accordion";
import {
  Brain,
  BuildingOffice,
  ClipboardText,
  CloudSun,
  Cpu,
  HardHat,
  HeadCircuit,
  Heartbeat,
  MapPin,
  MapPinArea,
  MapTrifold,
  NavigationArrow,
  Package,
  Plant,
  ShoppingBagOpen,
  Stack,
  Truck,
  WebhooksLogo,
} from "@phosphor-icons/react";
import {
  BarChart3,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { routes } from "@/lib/app-links";

/** All copy, icons and images for the home page (Figma frame "Landing Page"). */

export type SectionCopy = {
  eyebrow: string;
  title: string;
  description?: string;
};

export type HomeCard = {
  title: string;
  description?: string;
  icon: IconType;
  href?: string;
};

export type IndustryCard = HomeCard & {
  image: string;
  imageAlt: string;
};

export const hero = {
  title: "Modern Fleet Management Built for Africa",
  description: "Fleet Pro Enterprise helps organizations manage fleets, optimize logistics, monitor live operations, automate dispatch, and scale intelligently across regions and stakeholders.",
  image: "/home-section.jpg",
  highlights: [
    "10+ GPS Device Brands",
    "WhatsApp Integration",
    "AI Load Matching",
    "Real-time Analytics",
  ],
};

export const customersCopy: SectionCopy = {
  eyebrow: "Customers",
  title: "Designed for customers in the logistics ecosystem",
  description: "Built to connect every hand in the logistics chain, so nothing gets lost between planning, movement, and delivery",
};

export const customerCards: HomeCard[] = [
  {
    title: "Enterprise",
    icon: BuildingOffice,
    href: routes.stakeholders.enterprise,
  },
  {
    title: "Owner Operator",
    icon: UserCog,
    href: routes.stakeholders.ownerOperator,
  },
];

export const productFeaturesCopy: SectionCopy = {
  eyebrow: "Product features",
  title: "Everything your fleet needs, in one console.",
};

export const productFeatures: HomeCard[] = [
  {
    title: "Fleet Management",
    description: "Vehicle operations, fleet visibility and maintenance management.",
    icon: Truck,
    href: routes.products.fleetManagement,
  },
  {
    title: "Live Tracking",
    description: "Real-time GPS, IoT Tracking of devices and trips visibility.",
    icon: MapPin,
    href: routes.products.liveTracking,
  },
  {
    title: "Dispatch Management",
    description: "Dispatch workflows, job assignment and operational coordination.",
    icon: MapTrifold,
    href: routes.products.dispatchManagement,
  },
  {
    title: "AI Optimization",
    description: "AI Route optimization, predictive logistics and operational intelligence.",
    icon: Brain,
    href: routes.products.aiOptimization,
  },
  {
    title: "Analytics & Reporting",
    description: "Operational analytics, fleet insights and revenue-grade exports.",
    icon: ClipboardText,
    href: routes.products.analyticsReporting,
  },
  {
    title: "IoT SIMs & Devices",
    description: "IoT SIM management, devices provisioning and connectivity systems.",
    icon: Cpu,
    href: routes.products.iotSimsDevices,
  },
];

export const operationsIntelligence: {
  title: string;
  items: HomeCard[];
} = {
  title: "How Businesses and operations Think using fleet Pro",
  items: [
    {
      title: "Predictive routing",
      description: "AI Adaptive ETAs that learn from traffic, driver behaviour and historical corridors.",
      icon: MapPinArea,
    },
    {
      title: "Smart dispatch",
      description: "Recommends the best-fit driver, vehicle and trip sequence in real time.",
      icon: HeadCircuit,
    },
    {
      title: "Operational forecasting",
      description: "Forecast demand, capacity and SLA risk before it impacts customers.",
      icon: CloudSun,
    },
    {
      title: "Anomaly detection",
      description: "Surface fuel theft, route deviation and idling anomalies automatically.",
      icon: Plant,
    },
  ],
};

export const industryUseCasesCopy: SectionCopy = {
  eyebrow: "Industry usecases",
  title: "Built for every industry that moves goods.",
};

export const industryUseCases: IndustryCard[] = [
  {
    title: "Logistics & Haulage",
    description: "Coordinate multi-stop dispatch operations with real-time proof-of-delivery verification and SLA tracking to ensure timely, accurate, and accountable deliveries.",
    icon: Truck,
    image: "/home/industries/logistics-haulage.jpg",
    imageAlt: "Haulage trucks on the road",
  },
  {
    title: "Retail Distribution",
    description: "Enable high-frequency restocking operations with intelligent route density optimisation to maximize delivery efficiency, reduce travel time, and improve overall fleet utilization.",
    icon: ShoppingBagOpen,
    image: "/home/industries/retail-distribution.jpg",
    imageAlt: "Shopper with a grocery trolley in a supermarket aisle",
  },
  {
    title: "Construction Logistics",
    description: "Maintain heavy-vehicle compliance while gaining real-time visibility into on-site assets, fleet activity, and operational status across logistics environments.",
    icon: HardHat,
    image: "/home/industries/construction-logistics.jpg",
    imageAlt: "Heavy vehicles on a construction site",
  },
  {
    title: "Enterprise Fleet",
    description: "Ensure corporate fleet uptime with streamlined audits, operational transparency, and revenue accountability across all logistics activities.",
    icon: BuildingOffice,
    image: "/home/industries/enterprise-fleet.jpg",
    imageAlt: "Corporate office towers",
  },
  {
    title: "Healthcare Logistics",
    description: "Monitor cold-chain conditions with real-time telemetry while maintaining end-to-end chain-of-custody reporting for full visibility, compliance, and product integrity throughout transit.",
    icon: Heartbeat,
    image: "/home/industries/healthcare-logistics.jpg",
    imageAlt: "Healthcare worker with a patient",
  },
  {
    title: "Supply Chain Operations",
    description: "Deliver end-to-end supply chain visibility with seamless orchestration across every stage of movement, enabling real-time tracking, coordination, and control from origin to final delivery.",
    icon: Package,
    image: "/home/industries/supply-chain-operations.jpg",
    imageAlt: "Three white lorries driving in line",
  },
];

export const integrationsCopy: SectionCopy = {
  eyebrow: "Integrations & ecosystem",
  title: "How Fleet Pro fits into your operational ecosystem.",
};

export const integrations: HomeCard[] = [
  {
    title: "APIs & Webhooks",
    description: "Connect FleetPro to your ERP, WMS or finance systems.",
    icon: WebhooksLogo,
  },
  {
    title: "GPS providers",
    description: "Bring your own GPS hardware or use FleetPro-issued IoT devices.",
    icon: NavigationArrow,
  },
  {
    title: "IoT telematics",
    description: "Plug into MTN-managed IoT SIMs and certified sensor platforms.",
    icon: Cpu,
  },
  {
    title: "Enterprise tooling",
    description: "Single sign-on, audit log streaming and identity provider integrations.",
    icon: Stack,
  },
  {
    title: "Analytics platforms",
    description: "Stream operational data into Snowflake, BigQuery and S3.",
    icon: BarChart3,
  },
  {
    title: "Compliance systems",
    description: "Export KYC and audit trails for regulators and partners.",
    icon: ShieldCheck,
  },
];

export const faqCopy: SectionCopy = {
  eyebrow: "Frequently Asked questions",
  title: "everything you need to know about Fleet pro",
};

export const faqMoreLink = {
  prompt: "Have more questions?",
  label: "View More FAQs",
  href: routes.resources.faqs,
};

export const homeFaqs: FaqItem[] = [
  {
    question: "What is Fleet pro Enterprise?",
    answer: "Fleet pro Enterprise is a multi-tenant logistics and fleet operations platform that helps organizations manage vehicles, dispatch operations, live tracking, IoT devices, drivers, subscriptions, and operational workflows from one centralized system.",
  },
  {
    question: "Who can use Fleet pro Enterprise?",
    answer: "Fleet Pro Enterprise is built for enterprises running their own fleets and for independent owner operators. Each organization gets its own workspace, with role-based access for operations managers, dispatchers, finance officers, maintenance supervisors, drivers and analysts.",
  },
  {
    question: "How do I get started on Fleet Pro?",
    answer: "Select \"Apply for Account Creation\", choose your customer type and submit your organization details. Once your application is approved and your subscription is paid, your workspace is activated and you can invite your team, register vehicles and connect devices.",
  },
  {
    question: "What happens after I complete payment?",
    answer: "Your subscription is activated and your organization's workspace is provisioned. You receive your sign-in details by email, then set up users and roles, add vehicles and drivers, and start dispatching and tracking trips.",
  },
  {
    question: "Can I upgrade or change my subscription plan later?",
    answer: "Yes. You can move to a different plan or add capacity, such as more vehicles, users or IoT SIMs, from your organization's subscription settings as your operations grow. Plan changes are reflected in your billing.",
  },
  {
    question: "Is my company data secure?",
    answer: "Yes. Each organization's data is isolated in its own tenant, access is controlled through role-based permissions, and data is encrypted in transit. Key actions are recorded in audit logs so administrators can see who changed what and when.",
  },
];
