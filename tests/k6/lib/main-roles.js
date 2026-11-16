// What each main-app role should see, mirrored from
// apps/main/src/features/dashboard/utils/sidebarNav.ts (SIDEBAR_ENTRIES +
// labelByRole) and features/auth/utils/authRedirect.ts (role home).
// When the sidebar changes, update this table.
//
// pages: [href, header <h1>, group?] — `group` is the collapsible sidebar
//   group the link lives in (its children only render once it is opened).
// denied: a page the role must NOT reach (expects /not-authorized).

const COMMS = "Communications";

export const MAIN_ROLES = {
  ENTERPRISE_ADMIN: {
    home: ["/", "Overview"],
    pages: [
      ["/jobs", "Jobs"],
      ["/fleet", "My Vehicles"],
      ["/drivers", "My Drivers"],
      ["/devices", "My Devices"],
      ["/map", "Live Tracking"],
      ["/data-bundles", "M2M IoT Bundles"],
      ["/whatsapp", "WhatsApp Setup", COMMS],
      ["/inbox", "Messaging Center", COMMS],
      ["/reports", "Reports"],
      ["/analytics", "Analytics"],
      ["/subscription", "Billing"],
      ["/settings", "Settings"],
    ],
    denied: "/sims",
  },
  OWNER_OPERATOR: {
    home: ["/", "Overview"],
    pages: [
      ["/jobs", "Jobs"],
      ["/fleet", "My Vehicles"],
      ["/drivers", "My Drivers"],
      ["/devices", "My Devices"],
      ["/map", "Live Tracking"],
      ["/data-bundles", "M2M IoT Bundles"],
      ["/whatsapp", "WhatsApp Setup", COMMS],
      ["/inbox", "Messaging Center", COMMS],
      ["/reports", "Reports"],
      ["/analytics", "Analytics"],
      ["/subscription", "Billing"],
      ["/settings", "Settings"],
    ],
    denied: "/wallet",
  },
  DISPATCHER: {
    home: ["/jobs", "Dispatch"],
    pages: [
      ["/jobs", "Dispatch"],
      ["/drivers", "Drivers"],
      ["/map", "Live Map & Zones"],
      ["/dispatcher/messages", "Messaging Center", COMMS],
      ["/dispatcher/inbox", "Omnichannel Inbox", COMMS],
      ["/settings", "Profile"],
    ],
    denied: "/fleet",
  },
  OPERATIONS_MANAGER: {
    home: ["/overview", "Fleet Operations"],
    pages: [
      ["/overview", "Fleet Operations"],
      ["/jobs", "Dispatch"],
      ["/fleet", "Vehicles"],
      ["/drivers", "Drivers"],
      ["/devices", "Devices"],
      ["/installation", "Installation"],
      ["/sims", "IoT SIMS"],
      ["/data-bundles", "M2M IoT Bundles"],
      ["/map", "Live Map & Zones"],
      ["/whatsapp", "WhatsApp Setup", COMMS],
      ["/inbox", "Messaging Center", COMMS],
      ["/reports", "Reports"],
      ["/analytics", "Analytics"],
      ["/settings", "Profile"],
    ],
    denied: "/subscription",
  },
  FINANCE_VIEWER: {
    // /fleet redirects this role to /fleet/analytics (no Vehicles tab).
    home: ["/fleet/analytics", "Fleets"],
    pages: [
      ["/fleet", "Fleets"],
      ["/devices", "Devices"],
      ["/sims", "IoT SIMS"],
      ["/wallet", "Wallet & Billing"],
      ["/analytics", "Analytics"],
      ["/settings", "Profile"],
    ],
    denied: "/jobs",
  },
};

/** Roles to run: all of MAIN_ROLES, or a comma list in MAIN_ROLES env. */
export function selectedRoles() {
  const wanted = (__ENV.MAIN_ROLES || "").split(",").map(s => s.trim()).filter(Boolean);
  const all = Object.keys(MAIN_ROLES);
  if (!wanted.length) return all;
  const unknown = wanted.filter(r => !all.includes(r));
  if (unknown.length) throw new Error(`Unknown MAIN_ROLES: ${unknown.join(", ")} (known: ${all.join(", ")})`);
  return wanted;
}
