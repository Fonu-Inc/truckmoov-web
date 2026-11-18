import type { ComponentType } from "react";
import {
  Brain,
  BuildingOffice,
  ChartPieSlice,
  Cpu,
  Eye,
  Files,
  Gear,
  MapPin,
  MapTrifold,
  MoneyWavy,
  Question,
  TreeStructure,
  Truck,
  Users,
  WifiHigh,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import {
  FileChartPie,
  FileText,
  UserCog,
} from "lucide-react";
import { env } from "@/shared/env";

export type IconType = ComponentType<{ className?: string }>;

export type AppLink = {
  title: string;
  href: string;
  description: string;
  icon: IconType;
  /** Text width of this item in the desktop mega menu (Figma), so lines break as designed. */
  menuTextWidth?: number;
};

export type AppLinkGroup = {
  /** Label shown in the nav bar. */
  title: string;
  /** Small uppercase label above each block in the mega menu. */
  sections: Array<{
    label: string;
    links: AppLink[];
    /**
     * Mega menu layout (Figma NavBar variants). `columns` = CSS grid template for an even grid;
     * otherwise links flow in rows of `rowSizes` items with `rowGaps` px between items.
     */
    columns?: string;
    rowSizes?: number[];
    rowGaps?: number[];
    /** Section width in px (the left section of a split menu). */
    width?: number;
  }>;
  /** Height of the open mega menu panel in px (Figma: 240, Resources 172). */
  menuHeight: number;
};

/** Login page of the main (tenant) app, where the Sign In buttons send existing customers. */
export const SIGN_IN_URL = new URL(
  "/auth",
  env.NEXT_PUBLIC_MAIN_APP_URL,
).toString();

export const routes = {
  home: "/",
  stakeholders: {
    enterprise: "/stalkholder/enterprise-admin",
    ownerOperator: "/stalkholder/owner-operator",
    fleetProvider: "/stalkholder/fleet-provider",
    aggregator: "/stalkholder/aggregator-admin",
  },
  roles: {
    operationsManager: "/roles/operations-manager",
    dispatcher: "/roles/dispatcher",
    financeOfficer: "/roles/finance-officer",
    maintenanceSupervisor: "/roles/maintenance-supervisor",
    viewer: "/roles/viewer",
    driver: "/roles/driver",
    analyst: "/roles/analyst",
  },
  products: {
    fleetManagement: "/product/fleet-management",
    liveTracking: "/product/live-tracking",
    dispatchManagement: "/product/dispatch-management",
    aiOptimization: "/product/ai-optimisation",
    analyticsReporting: "/product/analytics-reporting",
    iotSimsDevices: "/product/iot-sims-devices",
  },
  solutions: {
    enterpriseLogistics: "/solutions/enterprise-logistics",
    deliveryOperations: "/solutions/delivery-operations",
    fleetOperations: "/solutions/fleet-operations",
    thirdPartyLogistics: "/solutions/third-party-logistics",
    smartFleetTracking: "/solutions/smart-fleet-tracking",
    aiLogisticsOperations: "/solutions/ai-logistics-operations",
  },
  resources: {
    documentation: "/resources/documentation",
    faqs: "/resources/faqs",
    helpArticles: "/resources/help-articles",
  },
  privacy: "#",
  terms: "#",
} as const;

export const customerTypeLinks: AppLink[] = [
  {
    title: "Enterprise",
    href: routes.stakeholders.enterprise,
    description: "Oversees the entire organization, billing and performance.",
    icon: BuildingOffice,
    menuTextWidth: 153,
  },
  {
    title: "Owner Operator",
    href: routes.stakeholders.ownerOperator,
    description: "Independent operator with own vehicle(s).",
    icon: UserCog,
    menuTextWidth: 132,
  },
];

export const roleLinks: AppLink[] = [
  {
    title: "Operations Manager",
    href: routes.roles.operationsManager,
    description: "Oversees daily fleet operations and performance.",
    icon: Gear,
    menuTextWidth: 134,
  },
  {
    title: "Dispatcher",
    href: routes.roles.dispatcher,
    description: "Assigns trips, manages schedules, and coordinates drivers.",
    icon: MapTrifold,
    menuTextWidth: 128,
  },
  {
    title: "Finance Officer",
    href: routes.roles.financeOfficer,
    description: "Monitors billing, payments, and operational reports.",
    icon: MoneyWavy,
    menuTextWidth: 126,
  },
  {
    title: "Maintenance Supervisor",
    href: routes.roles.maintenanceSupervisor,
    description: "Manage Vehicle health, schedules services and track compliance.",
    icon: Wrench,
    menuTextWidth: 126,
  },
  {
    title: "Viewer",
    href: routes.roles.viewer,
    description: "Read-only oversight for executives, auditors, and management.",
    icon: Eye,
    menuTextWidth: 132,
  },
  {
    title: "Driver",
    href: routes.roles.driver,
    description: "Handles deliveries and updates trip progress in real time.",
    icon: Users,
    menuTextWidth: 111,
  },
  {
    title: "Analyst",
    href: routes.roles.analyst,
    description: "Generate network insights and identifies optimization.",
    icon: ChartPieSlice,
    menuTextWidth: 143,
  },
];

export const productLinks: AppLink[] = [
  {
    title: "Fleet Management",
    href: routes.products.fleetManagement,
    description: "Manage vehicles, drivers, and daily operations from a single platform for better efficiency and control.",
    icon: Truck,
    menuTextWidth: 271,
  },
  {
    title: "Live Tracking",
    href: routes.products.liveTracking,
    description: "Track your vehicles in real time with accurate location updates and movement visibility.",
    icon: MapPin,
    menuTextWidth: 293,
  },
  {
    title: "Dispatch Management",
    href: routes.products.dispatchManagement,
    description: "Easily assign trips, coordinate drivers, and streamline delivery operations.",
    icon: MapTrifold,
    menuTextWidth: 249,
  },
  {
    title: "AI Optimization",
    href: routes.products.aiOptimization,
    description: "Use intelligent insights to improve routes, reduce costs, and boost overall fleet performance.",
    icon: Brain,
    menuTextWidth: 274,
  },
  {
    title: "Analytics & Reporting",
    href: routes.products.analyticsReporting,
    description: "Access clear reports and insights to understand performance and make informed decisions.",
    icon: FileChartPie,
    menuTextWidth: 287,
  },
  {
    title: "IoT SIMs & Devices",
    href: routes.products.iotSimsDevices,
    description: "Enable seamless connectivity across your fleet with smart devices and reliable IoT SIM solutions.",
    icon: Cpu,
    menuTextWidth: 251,
  },
];

export const solutionLinks: AppLink[] = [
  {
    title: "Enterprise Logistics",
    href: routes.solutions.enterpriseLogistics,
    description: "End-to-end logistics management for large-scale organizations to streamline movement, coordination, and supply chain efficiency.",
    icon: BuildingOffice,
    menuTextWidth: 319,
  },
  {
    title: "Delivery Operations",
    href: routes.solutions.deliveryOperations,
    description: "Manage and optimize the full delivery process from dispatch to final drop-off with speed and accuracy.",
    icon: Truck,
    menuTextWidth: 293,
  },
  {
    title: "Fleet Operations",
    href: routes.solutions.fleetOperations,
    description: "Oversee day-to-day fleet activities, ensuring vehicles, drivers, and trips run smoothly and efficiently.",
    icon: MapTrifold,
    menuTextWidth: 249,
  },
  {
    title: "Third-Party Logistics",
    href: routes.solutions.thirdPartyLogistics,
    description: "Seamlessly coordinate outsourced logistics providers for flexible and scalable delivery execution.",
    icon: TreeStructure,
    menuTextWidth: 274,
  },
  {
    title: "Smart Fleet Tracking",
    href: routes.solutions.smartFleetTracking,
    description: "Real-time tracking enhanced with intelligent insights for better visibility, safety, and control.",
    icon: WifiHigh,
    menuTextWidth: 287,
  },
  {
    title: "AI Logistics Operations",
    href: routes.solutions.aiLogisticsOperations,
    description: "AI-powered systems that automate decisions, optimize routes, and improve overall logistics performance.",
    icon: Brain,
    menuTextWidth: 271,
  },
];

export const resourceLinks: AppLink[] = [
  {
    title: "Documentation",
    href: routes.resources.documentation,
    description: "Comprehensive platform documentation for admins and operators.",
    icon: Files,
    menuTextWidth: 264,
  },
  {
    title: "FAQs",
    href: routes.resources.faqs,
    description: "Answers to the most common questions about Fleet Pro Enterprise.",
    icon: Question,
    menuTextWidth: 293,
  },
  {
    title: "Help Articles",
    href: routes.resources.helpArticles,
    description: "Searchable knowledge base and troubleshooting articles.",
    icon: FileText,
    menuTextWidth: 271,
  },
];

/** Single source for the nav mega menu and the footer columns. */
export const appLinks: AppLinkGroup[] = [
  {
    title: "Customers",
    menuHeight: 240,
    sections: [
      {
        label: "Customer Types",
        links: customerTypeLinks,
        rowSizes: [2],
        rowGaps: [20],
        width: 393,
      },
      {
        label: "Other roles",
        links: roleLinks,
        rowSizes: [
          4,
          3,
        ],
        rowGaps: [
          20,
          30,
        ],
      },
    ],
  },
  {
    title: "Products",
    menuHeight: 240,
    sections: [
      {
        label: "Products",
        links: productLinks,
        columns: "442px 442px 1fr",
      },
    ],
  },
  {
    title: "Solutions",
    menuHeight: 240,
    sections: [
      {
        label: "Solutions",
        links: solutionLinks,
        columns: "442px 442px 1fr",
      },
    ],
  },
  {
    title: "Resources",
    menuHeight: 172,
    sections: [
      {
        label: "Resources",
        links: resourceLinks,
        columns: "442px 442px 1fr",
      },
    ],
  },
];

/** SiteFooter column contents differ slightly from the menu (Figma footer frame). */
export const footerColumns: Array<{
  title: string;
  links: Array<Pick<AppLink, "title" | "href">>;
}> = [
  {
    title: "Customers",
    links: [
      {
        title: "Enterprise Admin",
        href: routes.stakeholders.enterprise,
      },
      {
        title: "Owner Operator",
        href: routes.stakeholders.ownerOperator,
      },
    ],
  },
  {
    title: "Products",
    links: [
      {
        title: "Fleet Management",
        href: routes.products.fleetManagement,
      },
      {
        title: "Live Tracking",
        href: routes.products.liveTracking,
      },
      {
        title: "Dispatch Management",
        href: routes.products.dispatchManagement,
      },
      {
        title: "AI Optimisation",
        href: routes.products.aiOptimization,
      },
      {
        title: "Analytics & Reporting",
        href: routes.products.analyticsReporting,
      },
      {
        title: "IoT & Devices.",
        href: routes.products.iotSimsDevices,
      },
    ],
  },
  {
    title: "Solutions",
    links: solutionLinks,
  },
  {
    title: "Resources",
    links: [
      {
        title: "Documentation",
        href: routes.resources.documentation,
      },
      {
        title: "FAQs",
        href: routes.resources.faqs,
      },
      {
        title: "help articles",
        href: routes.resources.helpArticles,
      },
    ],
  },
];

export const legalLinks = [
  {
    title: "Privacy Policy",
    href: routes.privacy,
  },
  {
    title: "Terms Of Service",
    href: routes.terms,
  },
  {
    title: "Contact",
    href: "#contact",
  },
];
