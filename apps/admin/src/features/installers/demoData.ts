/**
 * Local stand-in data for the Installers page.
 *
 * `packages/api` has no installer domain at all — no installer entity, no list
 * endpoint, no job-assignment hook, and no installer member in `UserRole`. The
 * closest surface is system device setup requests, which models "a device needs
 * installing somewhere" but carries no installer identity (`assignedTo` is an
 * admin, not a field technician). The reference app at
 * `:8080/platform/installers` is equally backendless: it renders a persisted
 * zustand store seeded with these same rows and makes no network calls.
 *
 * Creating an installer is live (TRU-FE-18): AddInstallerDialog posts to
 * POST /auth/system/installers, which stores the installer and emails the
 * portal invite. The list, suspend and resend below are not yet — the API has
 * them (`/auth/system/installers*`), this page does not call them.
 *
 * ponytail: mock data from the fleetflow parity port — wire to packages/api.
 * Going live needs an endpoint exposing the installer entity, its installation
 * jobs (for the workload/completed counts and the Job History tab) and an
 * availability signal. Delete this file and its imports when that lands.
 *
 * Types are declared locally on purpose: importing them from
 * `@truckmoov/api/auth` would imply this app talks to that module.
 */

export type InstallerStatus = "active" | "suspended" | "pending_activation";

export type InstallationJobStatus
  = | "created"
    | "awaiting_assignment"
    | "accepted"
    | "scheduled"
    | "in_progress"
    | "completed"
    | "issue_reported"
    | "unable_to_complete";

export type Installer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  serviceAreas: string[];
  deviceTypes: string[];
  vehicleTypes: string[];
  capabilities: string[];
  status: InstallerStatus;
  loginEmail: string;
  accountSetup: "activation_email" | "temporary_password";
  dateAdded: string;
  lastActivity: string;
};

/**
 * Only the fields the Job History tab renders. The reference's job type also
 * carries checklist / evidence / issue / history for the installer-side app,
 * none of which this page reads.
 */
export type InstallationJob = {
  id: string;
  installerId: string | null;
  status: InstallationJobStatus;
  scheduledDate: string;
  completedAt?: string;
  customer: {
    name: string;
    state: string;
    city: string;
  };
  vehicle: { registration: string };
  device: {
    manufacturer: string;
    model: string;
  };
};

export const JOB_STATUS_LABEL: Record<InstallationJobStatus, string> = {
  created: "Created",
  awaiting_assignment: "Awaiting assignment",
  accepted: "Accepted",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  issue_reported: "Issue reported",
  unable_to_complete: "Unable to complete",
};

export const DEVICE_TYPE_OPTIONS = [
  "GPS Tracker",
  "Fuel Level Sensor",
  "Dashcam",
  "Temperature Sensor",
  "Driver ID Reader",
];

export const VEHICLE_TYPE_OPTIONS = [
  "Car",
  "SUV",
  "Van",
  "Pickup",
  "Truck",
  "Trailer",
  "Bus",
  "Motorcycle",
];

export const CAPABILITY_OPTIONS = [
  "Tracker installation & wiring",
  "SIM installation & activation",
  "Device configuration & provisioning",
  "Fuel sensor installation & calibration",
  "Camera & accessory installation",
  "Diagnostics, repairs & troubleshooting",
  "Device replacement & de-installation",
  "On-site customer training & handover",
];

export const STATE_OPTIONS = [
  "Lagos",
  "Ogun",
  "Oyo",
  "Abuja (FCT)",
  "Rivers",
  "Kano",
  "Kaduna",
  "Enugu",
];

export function installerName(i: Installer) {
  return `${i.firstName} ${i.lastName}`;
}

/**
 * Seeded capabilities are real `CAPABILITY_OPTIONS` members. The reference
 * seeds free-text strings ("Device installation") that are not in its own
 * option list, so opening its edit wizard silently drops them.
 */
export const SEED_INSTALLERS: Installer[] = [
  {
    id: "INS-1001",
    firstName: "Tunde",
    lastName: "Akinwale",
    email: "installer@lagoslogistics.com",
    phone: "+234 803 221 4478",
    state: "Lagos",
    city: "Ikeja",
    serviceAreas: [
      "Lagos",
      "Ogun",
    ],
    deviceTypes: [
      "GPS Tracker",
      "Fuel Level Sensor",
      "Dashcam",
    ],
    vehicleTypes: [
      "Truck",
      "Van",
      "Pickup",
      "Trailer",
    ],
    capabilities: [
      "Tracker installation & wiring",
      "SIM installation & activation",
      "Device configuration & provisioning",
    ],
    status: "active",
    loginEmail: "installer@lagoslogistics.com",
    accountSetup: "activation_email",
    dateAdded: "2026-02-11T09:00:00.000Z",
    lastActivity: "2026-09-14T07:40:00.000Z",
  },
  {
    id: "INS-1002",
    firstName: "Ngozi",
    lastName: "Eze",
    email: "ngozi.eze@fieldops.ng",
    phone: "+234 806 774 9021",
    state: "Abuja (FCT)",
    city: "Garki",
    serviceAreas: [
      "Abuja (FCT)",
      "Kaduna",
    ],
    deviceTypes: [
      "GPS Tracker",
      "Temperature Sensor",
    ],
    vehicleTypes: [
      "Truck",
      "Bus",
      "Van",
    ],
    capabilities: [
      "Tracker installation & wiring",
      "Diagnostics, repairs & troubleshooting",
    ],
    status: "active",
    loginEmail: "ngozi.eze@fieldops.ng",
    accountSetup: "activation_email",
    dateAdded: "2026-03-02T09:00:00.000Z",
    lastActivity: "2026-09-12T15:10:00.000Z",
  },
  {
    id: "INS-1003",
    firstName: "Ibrahim",
    lastName: "Sule",
    email: "ibrahim.sule@fieldops.ng",
    phone: "+234 812 556 3390",
    state: "Kano",
    city: "Nassarawa",
    serviceAreas: ["Kano"],
    deviceTypes: ["GPS Tracker"],
    vehicleTypes: [
      "Truck",
      "Trailer",
    ],
    capabilities: ["Tracker installation & wiring"],
    status: "pending_activation",
    loginEmail: "ibrahim.sule@fieldops.ng",
    accountSetup: "activation_email",
    dateAdded: "2026-08-28T09:00:00.000Z",
    lastActivity: "2026-08-28T09:00:00.000Z",
  },
  {
    id: "INS-1004",
    firstName: "Bola",
    lastName: "Adeyemi",
    email: "bola.adeyemi@fieldops.ng",
    phone: "+234 809 118 2264",
    state: "Rivers",
    city: "Port Harcourt",
    serviceAreas: [
      "Rivers",
      "Enugu",
    ],
    deviceTypes: [
      "GPS Tracker",
      "Fuel Level Sensor",
    ],
    vehicleTypes: [
      "Truck",
      "Pickup",
    ],
    capabilities: [
      "Tracker installation & wiring",
      "Fuel sensor installation & calibration",
    ],
    status: "suspended",
    loginEmail: "bola.adeyemi@fieldops.ng",
    accountSetup: "temporary_password",
    dateAdded: "2026-01-19T09:00:00.000Z",
    lastActivity: "2026-07-04T11:22:00.000Z",
  },
];

export const SEED_JOBS: InstallationJob[] = [
  {
    id: "FL-1024",
    installerId: "INS-1001",
    status: "scheduled",
    scheduledDate: "2026-09-18",
    customer: {
      name: "Lagos Express Logistics",
      state: "Lagos",
      city: "Ikeja",
    },
    vehicle: { registration: "LSD-442-XA" },
    device: {
      manufacturer: "Teltonika",
      model: "FMB920",
    },
  },
  {
    id: "FL-1025",
    installerId: "INS-1001",
    status: "scheduled",
    scheduledDate: "2026-09-14",
    customer: {
      name: "Adebayo Haulage",
      state: "Lagos",
      city: "Surulere",
    },
    vehicle: { registration: "KJA-889-YZ" },
    device: {
      manufacturer: "Teltonika",
      model: "FMB920",
    },
  },
  {
    id: "FL-1019",
    installerId: "INS-1001",
    status: "in_progress",
    scheduledDate: "2026-09-14",
    customer: {
      name: "Northline Distribution",
      state: "Lagos",
      city: "Ogba",
    },
    vehicle: { registration: "AGL-201-KJA" },
    device: {
      manufacturer: "Technoton",
      model: "DUT-E 2Bio",
    },
  },
  {
    id: "FL-0998",
    installerId: "INS-1001",
    status: "completed",
    scheduledDate: "2026-08-24",
    completedAt: "2026-08-24T13:12:00.000Z",
    customer: {
      name: "Lagos Express Logistics",
      state: "Lagos",
      city: "Ikeja",
    },
    vehicle: { registration: "LSD-118-AA" },
    device: {
      manufacturer: "Teltonika",
      model: "FMB920",
    },
  },
  {
    id: "FL-1002",
    installerId: "INS-1002",
    status: "issue_reported",
    scheduledDate: "2026-09-05",
    customer: {
      name: "Capital Movers Ltd",
      state: "Abuja (FCT)",
      city: "Garki",
    },
    vehicle: { registration: "ABJ-774-KM" },
    device: {
      manufacturer: "Teltonika",
      model: "FMB920",
    },
  },
];
