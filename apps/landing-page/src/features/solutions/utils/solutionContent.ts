import type { SolutionPageData } from "@/features/solutions/utils/solutionTypes";
import {
  Brain,
  BuildingOffice,
  MapTrifold,
  TreeStructure,
  Truck,
  WifiHigh,
} from "@phosphor-icons/react/dist/ssr";

/*
 * Copy for the six solution pages (/solutions/*), rendered by <SolutionLayout>.
 * Verbatim from the Figma "Landing Page (…)" frames; "\n" marks a Figma line break.
 */

const enterpriseLogistics: SolutionPageData = {
  hero: {
    title: "Enterprise Logistics",
    description: "One workspace. Every depot. Total accountability. Manage\noperations, monitor performance, and maintain complete\nvisibility across your entire fleet network from a single platform.",
    icon: BuildingOffice,
  },
  premiseClassName: "min-[1440px]:ml-2.5",
  premise: "A control plane that unifies depots, fleets, drivers and dispatch under one tenant,\nbuilt for organizations where logistics is a strategic pillar, not a side process.",
  useCases: [
    "Multi-depot manufacturers coordinating inbound and outbound flows",
    "Distributors operating regional hubs with shared driver pools",
    "Enterprises consolidating fragmented fleet tools into one tenant",
  ],
  workflow: [
    {
      title: "Plan",
      description: "Create jobs, assign depots, allocate driver and vehicle pools across regions.",
    },
    {
      title: "Dispatch",
      description: "Route assignment with capacity, SLA and proximity awareness.",
    },
    {
      title: "Execute",
      description: "Live tracking, geofence events and exception handling in one console.",
    },
    {
      title: "Settle",
      description: "Trip costing, invoicing and analytics rolled up to the executive view.",
    },
  ],
  intelligence: [
    "Predictive ETAs across multi-leg trips",
    "Anomaly detection on depot throughput",
    "Suggested rebalancing of fleet assets",
  ],
};

const deliveryOperations: SolutionPageData = {
  hero: {
    title: "Delivery Operations",
    description: "Every drop accounted for. Every customer informed. Gain\ncomplete visibility into every delivery while keeping customers\nupdated with accurate, real-time information from dispatch to\ncompletion.",
    icon: Truck,
  },
  premise: "A delivery engine purpose-built for high-frequency, time-sensitive drops, with proof-\nof-delivery, customer notifications and exception flows baked in.",
  useCases: [
    "E-commerce and retail last-mile fulfilment",
    "Middle-mile transfers between sortation hubs",
    "Scheduled B2B route deliveries with signature capture",
  ],
  workflow: [
    {
      title: "Intake",
      description: "Bulk import orders or stream via API from your OMS.",
    },
    {
      title: "Route",
      description: "Auto-sequence stops by time window, capacity and traffic.",
    },
    {
      title: "Deliver",
      description: "Driver app captures photo, signature and reason codes.",
    },
    {
      title: "Notify",
      description: "Customer ETAs and outcomes via SMS, WhatsApp and webhook.",
    },
  ],
  intelligence: [
    "Smart stop sequencing",
    "Address-quality scoring",
    "Delivery-risk prediction per stop",
  ],
};

const fleetOperations: SolutionPageData = {
  hero: {
    title: "Fleet Operations",
    description: "Uptime is a discipline. We make it measurable, turning reliability\ninto something you can track, monitor, and improve in real time\nacross every system and operation.",
    icon: MapTrifold,
  },
  premise: "Keep the wheels turning, preventive maintenance, driver scorecards, fuel intelligence\nand compliance tracking unified across the fleet.",
  useCases: [
    "Heavy-vehicle operators managing service intervals at scale",
    "Mixed fleets needing one maintenance backlog",
    "Operators benchmarking driver behaviour and fuel burn",
  ],
  workflow: [
    {
      title: "Monitor",
      description: "Live diagnostics, odometer drift and harsh-event telemetry.",
    },
    {
      title: "Schedule",
      description: "Service plans triggered by km, hours or fault codes.",
    },
    {
      title: "Coach",
      description: "Driver scorecards with speeding, idling and harsh-event trends.",
    },
    {
      title: "Comply",
      description: "Inspection logs, document expiry and audit exports.",
    },
  ],
  intelligence: [
    "Failure prediction from fault-code patterns",
    "Driver-risk scoring",
    "Fuel-anomaly detection",
  ],
};

const thirdPartyLogistics: SolutionPageData = {
  hero: {
    title: "Third-Party Logistics",
    description: "Many clients. One operator. Zero leakage. Centralize control\nacross multiple clients while ensuring complete visibility,\naccountability, and data integrity across every operation.",
    icon: TreeStructure,
  },
  premise: "Run a 3PL like a network: client workspaces, branded portals, SLA tracking and\nsettlement, all isolated, all observable from the operator console.",
  useCases: [
    "3PLs serving multiple shippers from a shared fleet",
    "Aggregators stitching independent operators into one network",
    "Logistics resellers offering branded client portals",
  ],
  workflow: [
    {
      title: "Onboard",
      description: "Spin up a client workspace with isolated data and branding.",
    },
    {
      title: "Allocate",
      description: "Assign vehicles, drivers and SLAs per client contract.",
    },
    {
      title: "Operate",
      description: "Run jobs through the unified operator console.",
    },
    {
      title: "Settle",
      description: "Auto-generated invoices, margin reports and dispute trails.",
    },
  ],
  intelligence: [
    "Client-level demand forecasting",
    "Margin-erosion alerts",
    "Load-matching across the network",
  ],
};

const smartFleetTracking: SolutionPageData = {
  hero: {
    title: "Smart Fleet Tracking",
    description: "Every vehicle, sensor, and SIM, fluent in your workflow,\nseamlessly integrated into your operations to deliver real-time\nvisibility, consistent data flow, and unified control across your\nentire fleet ecosystem.",
    icon: WifiHigh,
  },
  premise: "Beyond a dot on a map, telemetry, sensors, SIM management and geofencing wired\ninto the same operational fabric your team already uses.",
  useCases: [
    "Operators standardizing on a single telematics layer",
    "Cold-chain and high-value cargo requiring sensor alerts",
    "Teams that manage their own SIMs and data bundles",
  ],
  workflow: [
    {
      title: "Provision",
      description: "Bind IoT devices and SIMs to vehicles in bulk.",
    },
    {
      title: "Sense",
      description: "Stream GPS, fuel, door, temperature and harsh-event data.",
    },
    {
      title: "Geofence",
      description: "Define zones with arrival, dwell and departure rules.",
    },
    {
      title: "Alert",
      description: "Push events into dispatch, maintenance and customer flows.",
    },
  ],
  intelligence: [
    "Sensor-anomaly detection",
    "Predictive geofence ETAs",
    "Device-health scoring",
  ],
};

const aiLogisticsOperations: SolutionPageData = {
  hero: {
    title: "AI Logistics Operations",
    description: "Decisions, not just dashboards. Turn operational data into clear,\nactionable intelligence that helps teams make faster, more\nconfident decisions and improve performance across the entire\nfleet.",
    icon: Brain,
  },
  premise: "An intelligence layer woven through dispatch, routing and maintenance — surfacing\nthe next best action, not just dashboards full of charts.",
  useCases: [
    "Operators drowning in manual dispatch decisions",
    "Networks optimising routing across thousands of stops",
    "Teams seeking proactive maintenance and risk signals",
  ],
  workflow: [
    {
      title: "Sense",
      description: "Ingest telemetry, jobs, traffic, weather and historicals.",
    },
    {
      title: "Reason",
      description: "Models score dispatch options, ETAs and risks in real time.",
    },
    {
      title: "Suggest",
      description: "Operators see ranked actions with confidence and reasoning.",
    },
    {
      title: "Learn",
      description: "Outcomes feed back, sharpening recommendations over time.",
    },
  ],
  intelligence: [
    "Predictive ETAs",
    "Intelligent dispatch ranking",
    "Anomaly and risk detection",
    "Demand forecasting",
  ],
};

/** URL slug (`/solutions/<slug>`) → page copy. */
const SOLUTIONS = {
  "enterprise-logistics": enterpriseLogistics,
  "delivery-operations": deliveryOperations,
  "fleet-operations": fleetOperations,
  "third-party-logistics": thirdPartyLogistics,
  "smart-fleet-tracking": smartFleetTracking,
  "ai-logistics-operations": aiLogisticsOperations,
} satisfies Record<string, SolutionPageData>;

export type SolutionSlug = keyof typeof SOLUTIONS;

export const SOLUTION_SLUGS = Object.keys(SOLUTIONS) as SolutionSlug[];

function isSolutionSlug(slug: string): slug is SolutionSlug {
  return Object.hasOwn(
    SOLUTIONS,
    slug,
  );
}

/** Page copy for a `/solutions/<slug>` URL, or null for an unknown slug. */
export function getSolutionContent(slug: string): SolutionPageData | null {
  return isSolutionSlug(slug) ? SOLUTIONS[slug] : null;
}
