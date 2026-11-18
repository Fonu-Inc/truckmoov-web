import type { StakeholderSlug } from "@/features/stakeholders/utils/stakeholderSlugs";
import type { StakeholderPageData } from "@/features/stakeholders/utils/stakeholderTypes";
import {
  BuildingOffice,
  Network,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import { UserCog } from "lucide-react";
import { STAKEHOLDER_SLUGS } from "@/features/stakeholders/utils/stakeholderSlugs";

/*
 * Copy for the four stakeholder pages (/stalkholder/*), rendered by <StakeholderLayout>.
 * All copy is verbatim from the Figma frames (Enterprise 155:3525, Owner Operator 212:7714,
 * Fleet Provider and Aggregator from the older full frames).
 */

const enterprise: StakeholderPageData = {
  headingSize: "lg",
  hero: {
    eyebrow: "Customer Type",
    title: "Enterprise",
    description: "The executive command center for enterprise logistics , giving you full visibility, control, and coordination across your entire operations in one unified space.",
    icon: BuildingOffice,
  },
  definition: {
    title: "Who Is An Enterprise?",
    body: "A large-scale enterprise organisation operating a fully internal logistics ecosystem, overseeing its own fleet, depots, drivers, and end-to-end dispatch workflows. All logistics activities are managed within a controlled environment designed for internal efficiency, coordination, and visibility. The Enterprise Admin sits at the top of the hierarchy within the tenant workspace, holding full authority over operations, configurations, and organisational governance across the entire system.",
  },
  responsibilities: [
    "Own the tenant workspace and approve organisation-wide policy.",
    "Authorise subscriptions, quotas and module activation.",
    "Provision portal users and assign internal roles.",
    "Oversee depots, fleet groups and IoT/SIM allocation.",
    "Monitor company-wide operational and financial health.",
  ],
  permissions: [
    "Create, edit and cancel jobs",
    "Manage dispatch operations",
    "Register and manage drivers",
    "Register and manage vehicles",
    "Bulk import vehicles",
    "Assign IoT devices & SIMs",
    "Configure depots & fleet groups",
    "Monitor live tracking and maps",
    "Configure geofences",
    "Manage maintenance",
    "Monitor fuel usage",
    "Configure behavior alerts",
    "Manage SIMs & data bundles",
    "View invoices & analytics",
    "Manage subscriptions",
    "Create portal users",
    "Assign internal roles",
    "Configure organization settings",
  ],
  limitations: [
    "Manage external logistics clients",
    "Access other tenant workspaces",
    "Aggregate independent operators",
  ],
  invites: [
    "maintenanceSupervisor",
    "operationsManager",
    "financeOfficer",
    "viewer",
  ],
  // Figma: 10px white gaps between the bands, and tighter bottoms than the role frames.
  bands: {
    responsibilities: { section: "lg:mt-2.5" },
    permissions: { section: "lg:mt-2.5 lg:pb-[53px]" },
    limitations: { section: "lg:mt-2.5 lg:border-b lg:pb-[43px]" },
    invites: { section: "lg:mt-2.5" },
  },
};

const ownerOperator: StakeholderPageData = {
  headingSize: "lg",
  hero: {
    eyebrow: "Customer Type",
    title: "Owner Operator",
    description: "Your single cockpit for running an independent fleet, giving you a centralized command view to manage operations, track performance, coordinate drivers, and oversee every movement with clarity and control.",
    icon: UserCog,
    descriptionClassName: "lg:max-w-[671px]",
  },
  definition: {
    title: "Who Is An Owner Operator?",
    body: "An independent vehicle owner responsible for managing one or a small number of vehicles, operating either as a standalone operator or as part of a larger aggregator network. They handle day-to-day usage, availability, and assignment of their vehicles, participating in logistics operations while maintaining full ownership and control over their assets.",
  },
  responsibilities: [
    "Register personal vehicles and assign IoT devices.",
    "Accept or decline incoming jobs from aggregators.",
    "Manage drivers, trips and proof of delivery.",
    "Stay on top of maintenance and vehicle health.",
    "Monitor invoices and earnings.",
  ],
  permissions: [
    "Register personal vehicles",
    "Accept or decline jobs",
    "Manage own drivers",
    "Track assigned deliveries",
    "View live tracking maps",
    "Assign SIMs and devices",
    "Manage maintenance",
    "View invoices & billing",
  ],
  limitations: [
    "Create enterprise-scale operations",
    "Aggregate operators",
    "Create depot structures",
    "Access enterprise billing systems",
  ],
  bands: {
    permissions: { section: "lg:pb-[74px]" },
    // Figma: the last card sits 90px above the CTA band (less than its own 119px margin).
    limitations: { section: "lg:-mb-7 lg:pb-0" },
  },
};

const fleetProvider: StakeholderPageData = {
  hero: {
    eyebrow: "Stakeholder",
    title: "Fleet Provider",
    description: "Run client-centric logistics operations at scale with streamlined coordination, intelligent visibility, and enterprise-grade operational control across every delivery touchpoint.",
    icon: Truck,
  },
  definition: {
    title: "Who is a Fleet provider?",
    body: "A logistics company that delivers transport services to a diverse portfolio of external clients, where every operation is structured around distinct client accounts. Each client’s shipments, schedules, and delivery requirements are managed independently, ensuring tailored workflows, clear accountability, and precise coordination across all client-based deliveries.",
  },
  responsibilities: [
    "Onboard and manage client profiles and contracts.",
    "Assign vehicles, drivers and SIMs to client accounts.",
    "Maintain client-specific delivery performance and SLAs.",
    "Operate fleets, geofences and maintenance schedules.",
    "Reconcile client billing and consumption reports.",
  ],
  permissions: [
    "Create, edit and cancel jobs",
    "Manage fleets and drivers",
    "Create client profiles",
    "Assign vehicles to clients",
    "Monitor live tracking and maps",
    "Manage SIMs & bundles",
    "View invoices & analytics",
    "Manage maintenance",
    "Configure geofences",
    "View client-specific reports",
  ],
  limitations: [
    "Create enterprise depot structures",
    "Bulk import enterprise vehicle structures",
    "Aggregate independent operators",
    "Access other tenant workspaces",
  ],
  invites: [
    "operationsManager",
    "financeOfficer",
    "dispatcher",
    "maintenanceSupervisor",
  ],
};

const aggregator: StakeholderPageData = {
  hero: {
    eyebrow: "Stakeholder",
    title: "Aggregator",
    description: "Orchestrate an independent operator network as a unified fleet, coordinating multiple operators into a single, connected logistics system with shared visibility and seamless execution.",
    icon: Network,
  },
  definition: {
    title: "Who is an Aggregator?",
    body: "An Aggregator Coordinates a distributed network of independent owner operators and small transporters, bringing them together into a unified logistics ecosystem for efficient matching, routing, and execution of deliveries. Rather than owning fleet infrastructure directly, it focuses on aggregation, coordination, and seamless orchestration of third-party capacity to fulfil transport demand at scale.",
  },
  responsibilities: [
    "Onboard and KYC owner operators into the network.",
    "Match incoming jobs to the right operator using AI.",
    "Track network-wide deliveries and SLA performance.",
    "Provision SIMs and bundles across the network.",
    "Consolidate analytics and invoicing across operators.",
  ],
  permissions: [
    "Dispatch jobs across the network",
    "Match jobs to operators",
    "Track network deliveries",
    "Onboard owner operators",
    "Recommend drivers using AI",
    "View network-wide vehicles and drivers",
    "Manage SIMs & bundles",
    "View analytics & invoices",
    "Configure maintenance schedules",
  ],
  limitations: [
    "Own enterprise fleets",
    "Create enterprise depot structures",
    "Manage enterprise client systems",
    "Access other tenant workspaces",
  ],
  invites: [
    "operationsManager",
    "analyst",
  ],
};

const STAKEHOLDERS: Record<StakeholderSlug, StakeholderPageData> = {
  "enterprise-admin": enterprise,
  "owner-operator": ownerOperator,
  "fleet-provider": fleetProvider,
  "aggregator-admin": aggregator,
};

function isStakeholderSlug(slug: string): slug is StakeholderSlug {
  return (STAKEHOLDER_SLUGS as readonly string[]).includes(slug);
}

/** The page data for a /stalkholder/<slug> URL, or null for an unknown slug. */
export function getStakeholderContent(slug: string): StakeholderPageData | null {
  return isStakeholderSlug(slug) ? STAKEHOLDERS[slug] : null;
}
