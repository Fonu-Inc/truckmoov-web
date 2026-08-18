import type { StalkholderData } from "../components/stalkholder-layout";
import StalkholderLayout from "../components/stalkholder-layout";

const FLEET_PROVIDER: StalkholderData = {
  titleIcon: "/stalkholders/fleet-provider.svg",
  title: "Fleet Provider",
  description: "Run client-centric logistics operations at scale with streamlined coordination, intelligent visibility, and enterprise-grade operational control across every delivery touchpoint.",
  definitionHeader: "Who is a Fleet Provider?",
  definition: "A logistics company that delivers transport services to a diverse portfolio of external clients, where every operation is structured around distinct client accounts. Each client's shipments, schedules, and delivery requirements are managed independently, ensuring tailored workflows, clear accountability, and precise coordination across all client-based deliveries.",
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
  roles: [
    "Operations Manager",
    "Finance Officer",
    "Dispatcher",
    "Maintenance Supervisor",
    "Driver",
  ],
};

export default function FleetProvider() {
  return (
    <StalkholderLayout
      data={FLEET_PROVIDER}
    />
  );
}
