import StalkholderLayout, { type StalkholderData } from "../components/stalkholder-layout";

const ENTERPRISE: StalkholderData = {
 titleIcon: "/stalkholders/enterprise.svg",
 title: "Enterprise",
 description: "The executive command center for enterprise logistics , giving you full visibility, control, and coordination across your entire operations in one unified space.",
 definition: "A large-scale enterprise organisation operating a fully internal logistics ecosystem, overseeing its own fleet, depots, drivers, and end-to-end dispatch workflows. All logistics activities are managed within a controlled environment designed for internal efficiency, coordination, and visibility. The Enterprise Admin sits at the top of the hierarchy within the tenant workspace, holding full authority over operations, configurations, and organisational governance across the entire system.",
 responsibilities: [
  "Own the tenant workspace and approve organisation-wide policy.",
  "Authorise subscriptions, quotas and module activation.",
  "Provision portal users and assign internal roles.",
  "Oversee depots, fleet groups and IoT/SIM allocation.",
  "Monitor company-wide operational and financial health."
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
  "Configure organization settings"
 ],
 limitations: [
  "Manage external logistics clients",
  "Access other tenant workspaces",
  "Aggregate independent operators"
 ],
 roles: ["Operations Manager", "Finance Officer", "Viewer"]
}

export default function EnterpriseAdmin() {
 return (
  <StalkholderLayout
   data={ENTERPRISE}
  />
 )
}
