import type { LucideIcon } from "lucide-react";
import {
  BrainCircuit,
  Building2,
  CircleHelp,
  ClipboardCheck,
  Database,
  File,
  FileText,
  Flag,
  GitBranch,
  Map,
  MapPin,
  Microchip,
  Network,
  Radio,
  ScrollText,
  Target,
  Truck,
  UserRoundCheck,
  UserRoundCog,
  UsersRound,
} from "lucide-react";

export type AppLinkType = {
  title: string;
  href: string;
  children: Array<{
    title: string;
    href: string;
    description: string;
    icon: LucideIcon;
  }>;
};

export const appLinks: AppLinkType[] = [
  {
    title: "Stakeholders",
    href: "#",
    children: [
      {
        title: "Enterprise Admin",
        href: "/stalkholder/enterprise-admin",
        description: "Oversees the entire organization, billing and performance.",
        icon: Building2,
      },
      {
        title: "Fleet Provider",
        href: "/stalkholder/fleet-provider",
        description: "Operates vehicles & drivers, executes transport jobs.",
        icon: Truck,
      },
      {
        title: "Owner Operator",
        href: "/stalkholder/owner-operator",
        description: "Independent operator with own vehicle(s).",
        icon: UserRoundCog,
      },
      {
        title: "Aggregator Admin",
        href: "/stalkholder/aggregator-admin",
        description: "Coordinates owner-operators, brokers work across fleets.",
        icon: Network,
      },
    ],
  },
  {
    title: "Products",
    href: "#",
    children: [
      {
        title: "Fleet Management",
        href: "/product/fleet-management",
        description:
     "Manage vehicles, drivers, and daily operations from a single platform for better efficiency and control.",
        icon: Truck,
      },
      {
        title: "Live Tracking",
        href: "/product/live-tracking",
        description:
     "Track your vehicles in real time with accurate location updates and movement visibility.",
        icon: MapPin,
      },
      {
        title: "Dispatch Management",
        href: "/product/dispatch-management",
        description: "Easily assign trips, coordinate drivers, and streamline delivery operations.",
        icon: Map,
      },
      {
        title: "AI Optimisation",
        href: "/product/ai-optimisation",
        description: "Use intelligent insights to improve routes, reduce costs, and boost overall fleet performance.",
        icon: BrainCircuit,
      },
      {
        title: "Analytics & Reporting",
        href: "#",
        description: "Access clear reports and insights to understand performance and make informed decisions.",
        icon: ClipboardCheck,
      },
      {
        title: "IoT & Devices.",
        href: "#",
        description:
     "Enable seamless connectivity across your fleet with smart devices and reliable IoT SIM solutions.",
        icon: Microchip,
      },
    ],
  },
  {
    title: "Solutions",
    href: "#",
    children: [
      {
        title: "Enterprise Logistics",
        href: "#",
        description:
     "End-to-end logistics management for large-scale organizations to streamline movement, coordination, and supply chain efficiency.",
        icon: Building2,
      },
      {
        title: "Delivery Operations",
        href: "#",
        description:
     "Manage and optimize the full delivery process from dispatch to final drop-off with speed and accuracy.",
        icon: Truck,
      },
      {
        title: "Fleet Operations",
        href: "#",
        description:
     "Oversee day-to-day fleet activities, ensuring vehicles, drivers, and trips run smoothly and efficiently.",
        icon: Map,
      },
      {
        title: "Third-Party Logistics",
        href: "#",
        description: "Seamlessly coordinate outsourced logistics providers for flexible and scalable delivery execution.",
        icon: GitBranch,
      },
      {
        title: "Smart Fleet Tracking",
        href: "#",
        description:
     "Real-time tracking enhanced with intelligent insights for better visibility, safety, and control.",
        icon: Radio,
      },
      {
        title: "AI Logistics Operations",
        href: "#",
        description:
     "AI-powered systems that automate decisions, optimize routes, and improve overall logistics performance.",
        icon: BrainCircuit,
      },
    ],
  },
  {
    title: "About Us",
    href: "#",
    children: [
      {
        title: "Vision, Mission & Core Values",
        href: "#",
        description: "The Principles guiding Fleet Pro Enterprise.",
        icon: Target,
      },
      {
        title: "Our Journey",
        href: "#",
        description: "From a single-fleet pilot to a multi-tenant Ecosystem.",
        icon: Flag,
      },
      {
        title: "Team & Management",
        href: "#",
        description: "The People behind Fleet Pro Enterprise.",
        icon: UsersRound,
      },
    ],
  },
  {
    title: "Resources",
    href: "#",
    children: [
      {
        title: "Documentation",
        href: "#",
        description: "Comprehensive platform documentation for admins and operators.",
        icon: FileText,
      },
      {
        title: "FAQs",
        href: "#",
        description: "Answers to the most common questions about Fleet Pro Enterprise.",
        icon: CircleHelp,
      },
      {
        title: "Platform Guides",
        href: "#",
        description: "step-by-step guides covering onboarding to advance operations.",
        icon: ScrollText,
      },
      {
        title: "API & Integration Docs",
        href: "#",
        description: "REST APIs, webhooks and SDKs for building on Fleet Pro.",
        icon: Database,
      },
      {
        title: "Support Center",
        href: "#",
        description: "Reach our support team across email, chat and phone.",
        icon: UserRoundCheck,
      },
      {
        title: "Help Articles",
        href: "#",
        description: "Searchable knowledge base and troubleshooting articles.",
        icon: File,
      },
    ],
  },
];
