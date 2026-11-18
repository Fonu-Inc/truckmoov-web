import type { StakeholderPageData } from "@/features/stakeholders/utils/stakeholderTypes";
import {
  ChartPieSlice,
  Eye,
  Gear,
  MapTrifold,
  MoneyWavy,
  Users,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";

/*
 * Copy for the seven role pages (/roles/*), rendered by <StakeholderLayout>.
 * All copy is verbatim from the Figma "Landing Page (<Role>)" frames.
 * Hero description widths reproduce the Figma line breaks; `bands` carries each frame's
 * own bottom paddings (permissions → limitations, last card → CTA band).
 */

const EYEBROW = "Other roles";

const operationsManager: StakeholderPageData = {
  headingSize: "lg",
  hero: {
    eyebrow: EYEBROW,
    title: "Operations Manager",
    description: "The operational backbone of the tenant workspace. Centralizing the tools, workflows, and controls teams rely on to manage day-to-day fleet operations efficiently.",
    icon: Gear,
    descriptionClassName: "lg:max-w-[600px]",
  },
  definition: {
    title: "Who Is An Operations Manager?",
    body: "The operational backbone of the organization, serving as the central workspace for managing fleet operations, driver activities, dispatch workflows, SIM and device management, live tracking, and team administration. It provides the visibility, control, and coordination needed to keep day-to-day operations running efficiently across the entire fleet.",
  },
  responsibilities: [
    "Coordinate fleet, driver and dispatch operations end-to-end",
    "Plan capacity, shifts and maintenance windows",
    "Manage SIM and connectivity operations",
    "Own KPI reporting and exception management",
    "Lead the operations team day-to-day",
  ],
  permissions: [
    "Full job management",
    "Full vehicle management",
    "Full driver management",
    "Dispatch oversight",
    "SIM & data management",
    "Maintenance scheduling",
    "Geofence management",
    "Fuel monitoring",
    "Analytics & reporting",
    "Team and user management",
    "Client management (Fleet Provider only)",
    "Depot management (Enterprise only)",
  ],
  limitations: [
    "Access the Platform Admin console",
    "Access other tenants",
    "Approve global SIM provisioning",
    "Invite users",
  ],
  bands: {
    permissions: { section: "lg:pb-[99px]" },
    limitations: { section: "lg:pb-10" },
  },
};

const dispatcher: StakeholderPageData = {
  headingSize: "lg",
  hero: {
    eyebrow: EYEBROW,
    title: "Dispatcher",
    description: "Move jobs from board to wheel, fast and accurately, ensuring every assignment transitions smoothly into execution with precision, speed, and full operational control.",
    icon: MapTrifold,
    descriptionClassName: "lg:max-w-[600px]",
  },
  definition: {
    title: "Who Is A Dispatcher?",
    body: "Focused entirely on dispatch execution, AI matching, route coordination, and driver communication. It streamlines the entire dispatch process from job assignment to completion, ensuring the right jobs are matched to the right drivers, routes are optimized in real time, and communication between dispatchers and drivers stays clear and continuous for smooth, efficient operations.",
  },
  responsibilities: [
    "Build the dispatch board and assign drivers to jobs",
    "Use AI matching to optimize driver-to-job pairing",
    "Monitor live trips and reroute on delays",
    "Communicate with drivers via WhatsApp",
    "Share live ETAs and locations with customers",
  ],
  permissions: [
    "Assign and Reassign Drivers to Jobs",
    "Use AI driver recommendations",
    "Monitor the dispatch board",
    "View live tracking maps",
    "Replay trip routes",
    "Communicate with drivers via WhatsApp",
    // Figma reads "hare locations with customers" (clipped "S").
    "Share locations with customers",
    "Monitor alerts & incidents",
  ],
  limitations: [
    "Add drivers",
    "Register vehicles",
    "Configure organization settings",
    "Manage SIMs",
    "Access invoices",
    "Create users and Jobs",
    "Configure geofences",
    "Create maintenance schedules",
    "Invite users",
  ],
  bands: {
    // This paragraph wraps narrower than the other frames' (1240 vs 1248).
    definition: { content: "min-[1440px]:-mr-10" },
    permissions: { section: "lg:pb-[80px]" },
    // Figma: the last card sits 113px above the CTA band (less than its own 119px margin).
    limitations: { section: "lg:-mb-[5px] lg:pb-0" },
  },
};

const financeOfficer: StakeholderPageData = {
  headingSize: "lg",
  hero: {
    eyebrow: EYEBROW,
    title: "Finance Officer",
    description: "Financial clarity across subscriptions, SIMs, and operations. Get a unified view of costs and usage to improve visibility, accountability, and financial control across the platform.",
    icon: MoneyWavy,
    descriptionClassName: "lg:max-w-[600px]",
  },
  definition: {
    title: "Who Is A Finance Officer?",
    body: "A Finance Officer Handles financial visibility and billing oversight only. Provides centralized control over billing activity, ensuring clear visibility into transactions, usage, and charges across the platform. It helps maintain accurate financial tracking, accountability, and transparency across all operational components.",
  },
  responsibilities: [
    "Review and download invoices on time",
    "Monitor subscription and SIM/data spend",
    "Export billing and consumption reports for finance systems",
    "Receive and triage invoice notifications",
    "Maintain audit-ready financial visibility",
  ],
  permissions: [
    "View invoices",
    "Download invoices",
    "Monitor subscription costs",
    "View SIM and data usage costs",
    "Export billing reports",
    "View consumption reports",
    "Receive invoice notifications",
  ],
  limitations: [
    "Create jobs",
    "Manage fleets",
    "Access the dispatch board",
    "View live maps",
    "Manage SIMs",
    "Invite users",
  ],
  bands: { permissions: { section: "lg:pb-[80px]" } },
};

const maintenanceSupervisor: StakeholderPageData = {
  headingSize: "lg",
  hero: {
    eyebrow: EYEBROW,
    title: "Maintenance Supervisor",
    description: "Keeps every vehicle roadworthy, compliant, and operationally ready. Monitor vehicle health, maintenance schedules, and compliance requirements to ensure maximum uptime, safety, and fleet reliability.",
    // The Figma tile is empty; the frame's separate "Wrench" export is the intended icon.
    icon: Wrench,
    descriptionClassName: "lg:max-w-[660px]",
  },
  definition: {
    title: "Who Is A Maintenance Supervisor?",
    body: "Responsible for the health and compliance of the entire fleet. The Maintenance Supervisor oversees vehicle diagnostics, preventive and corrective maintenance, vendor coordination, and service schedules to ensure every asset remains roadworthy, compliant, and operationally ready. They also help maintain uptime by tracking regulatory certifications and addressing issues before they impact operations.",
  },
  responsibilities: [
    "Monitor vehicle health diagnostics and telematics alerts",
    "Schedule preventive and corrective maintenance services",
    "Ensure regulatory compliance and certification upkeep",
    "Manage workshop and vendor relationships and cost control",
    "Predict component failure through utilisation trend analysis",
  ],
  permissions: [
    "View vehicle health diagnostics and alerts",
    "Schedule and manage maintenance services",
    "Track service history and compliance records",
    "Configure maintenance reminders and schedules",
    "Monitor fuel and utilisation trends for wear prediction",
    "Manage workshop and vendor relationships",
    "Approve or reject maintenance requests",
    "Export compliance and service reports",
  ],
  limitations: [
    "Dispatch jobs or manage fleet operations",
    "Manage drivers or billing",
    "Access subscription or invoice management",
    "Invite users or configure organisation settings",
  ],
  bands: {
    permissions: { section: "lg:pb-[110px]" },
    limitations: { section: "lg:pb-4" },
  },
};

const viewer: StakeholderPageData = {
  headingSize: "lg",
  hero: {
    eyebrow: EYEBROW,
    title: "Viewer",
    description: "Read-only oversight for executives, auditors, and stakeholders. Secure access to key operational and financial data for transparency and informed decision-making without system changes.",
    icon: Eye,
    descriptionClassName: "lg:max-w-[600px]",
  },
  definition: {
    title: "Who Is A Viewer?",
    body: "A strictly read-only oversight role for executives, auditors, and management visibility. It provides secure, non-editable access to critical operational and financial data, enabling monitoring, auditing, and high-level decision-making while ensuring system integrity and preventing any modifications to core records.",
  },
  responsibilities: [
    "Monitor live maps and dashboards without intervening",
    "Review analytics and historical trip replays",
    "Audit maintenance history and operational records",
    "Export reports for executive briefings",
    "Provide independent oversight of the operation",
  ],
  permissions: [
    "View live maps",
    "View dashboards",
    "View analytics",
    "View maintenance history",
    "Replay historical routes",
    "Export reports",
  ],
  limitations: [
    "Create, edit or delete anything",
    "Dispatch jobs",
    "Manage fleets",
    "Access billing",
    "Invite users",
  ],
};

const driver: StakeholderPageData = {
  headingSize: "lg",
  hero: {
    eyebrow: EYEBROW,
    title: "Driver",
    description: "All on WhatsApp , no app, no portal, no friction. Manage operations, receive updates, and coordinate with drivers instantly through a familiar channel, removing complexity while keeping everything fast and accessible.",
    icon: Users,
    descriptionClassName: "lg:max-w-[640px]",
  },
  definition: {
    title: "Who Is A Driver?",
    body: "Drivers have no portal access whatsoever. All interaction happens through WhatsApp and SMS. This keeps communication simple and reliable through familiar channels, enabling fast job updates, clear instructions, and real-time coordination without requiring any additional apps, logins, or training.",
  },
  responsibilities: [
    "Receive dispatch instructions on WhatsApp",
    "Accept or decline incoming jobs",
    "Share live location during active trips",
    "Capture and submit Proof of Delivery",
    "Respond to alerts and reminders",
  ],
  permissions: [
    "Receive dispatches via WhatsApp",
    "Accept or decline jobs",
    "Share live location",
    "Submit Proof of Delivery",
    "Receive alerts and reminders",
  ],
  limitations: [
    "Access the portal",
    "Create jobs",
    "Manage fleets",
    "View dashboards",
    "Invite users",
  ],
};

const analyst: StakeholderPageData = {
  headingSize: "lg",
  hero: {
    eyebrow: EYEBROW,
    title: "Analyst",
    description: "Turns network telemetry into decisions that move the business forward. Transform connectivity data into actionable insights that improve performance and support smarter operational decisions.",
    icon: ChartPieSlice,
    descriptionClassName: "lg:max-w-[620px]",
  },
  definition: {
    title: "Who Is An Analyst?",
    body: "Analysts turn fleet, dispatch, and IoT telemetry into actionable insights, surfacing optimization opportunities across routes, asset utilization, fuel consumption, maintenance planning, and revenue performance. By transforming operational data into clear intelligence, they help teams identify inefficiencies, improve decision-making, and drive continuous operational improvement across the fleet.",
  },
  responsibilities: [
    "Generate weekly and monthly network performance insights",
    "Identify optimization opportunities across routes, fuel and utilisation",
    "Benchmark fleets, depots and clients against network averages",
    "Surface anomalies and trends for Operations and Finance",
    "Maintain analytical dashboards and shared reports",
  ],
  permissions: [
    "Query network-wide analytics and dashboards",
    "Build custom reports and cohorts",
    "Export raw datasets for deeper analysis",
    "Identify route, utilization and fuel optimization opportunities",
    "Share insights with Operations and Finance",
    "Configure KPI alerts and benchmarks",
  ],
  limitations: [
    "Dispatch jobs or edit operational records",
    "Manage fleets, drivers or vehicles",
    "Access billing or subscriptions",
    "Invite users",
  ],
  bands: { limitations: { section: "lg:pb-4" } },
};

/** URL slugs under /roles/ — must stay in sync with `routes.roles`. */
export const ROLE_SLUGS = [
  "operations-manager",
  "dispatcher",
  "finance-officer",
  "maintenance-supervisor",
  "viewer",
  "driver",
  "analyst",
] as const;

export type RoleSlug = (typeof ROLE_SLUGS)[number];

const ROLES: Record<RoleSlug, StakeholderPageData> = {
  "operations-manager": operationsManager,
  "dispatcher": dispatcher,
  "finance-officer": financeOfficer,
  "maintenance-supervisor": maintenanceSupervisor,
  "viewer": viewer,
  "driver": driver,
  "analyst": analyst,
};

function isRoleSlug(slug: string): slug is RoleSlug {
  return (ROLE_SLUGS as readonly string[]).includes(slug);
}

/** The page data for a /roles/<slug> URL, or null for an unknown slug. */
export function getRoleContent(slug: string): StakeholderPageData | null {
  return isRoleSlug(slug) ? ROLES[slug] : null;
}
