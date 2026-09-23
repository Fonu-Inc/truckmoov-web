/**
 * Local stand-in data for the installer portal's job domain.
 *
 * `packages/api` has no installer domain at all — no installer entity, no
 * installation-job endpoint, no checklist or evidence storage, and no
 * notification feed. The reference app at `:8080/installer/*` is equally
 * backendless: it renders a persisted zustand store seeded with these same
 * rows and makes no network calls for any of it.
 *
 * ponytail: mock data from the fleetflow parity port — wire to packages/api.
 * Going live needs endpoints for: the installer's own record, their assigned
 * installation jobs (customer/vehicle/device/SIM per unit), checklist state,
 * evidence upload, issue reports, and the notification feed. Delete this file
 * and its imports when those land.
 *
 * Types are declared locally on purpose: importing them from
 * `@truckmoov/api/auth` would imply this app talks to that module. The
 * `Installer` shape is kept in step with
 * `apps/admin/src/features/installers/demoData.ts`, which renders the
 * platform-admin side of the same domain.
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
  avatarUrl?: string;
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

export type EvidenceItem = {
  id: string;
  category: string;
  name: string;
  dataUrl: string;
  notes?: string;
  uploadedAt: string;
};

export type InstallationIssue = {
  type: string;
  description: string;
  reportedAt: string;
  photos: EvidenceItem[];
};

export type InstallationJob = {
  id: string;
  installerId: string | null;
  status: InstallationJobStatus;
  createdAt: string;
  scheduledDate: string;
  scheduledTime: string;
  completedAt?: string;
  customer: {
    name: string;
    type: "Enterprise" | "Owner-Operator";
    phone: string;
    email: string;
    address: string;
    state: string;
    city: string;
  };
  vehicle: {
    registration: string;
    type: string;
    make: string;
    model: string;
    year: string;
    engineNumber: string;
    chassisNumber: string;
    color: string;
    engineCapacity: string;
    odometer: string;
  };
  device: {
    id: string;
    imei: string;
    manufacturer: string;
    model: string;
    status: string;
    type: string;
  };
  sim?: {
    iccid: string;
    imsi: string;
    msisdn: string;
    carrier: string;
    activation: string;
  };
  checklist: Record<string, boolean>;
  evidence: EvidenceItem[];
  installerNotes: string;
  issue?: InstallationIssue;
  history: {
    at: string; label: string;
  }[];
};

export type InstallerNotification = {
  id: string;
  installerId: string;
  jobId?: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type ChecklistSection = {
  id: string;
  title: string;
  items: {
    id: string; label: string;
  }[];
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

export const INSTALLATION_CHECKLIST: ChecklistSection[] = [
  {
    id: "before",
    title: "Before Installation",
    items: [
      {
        id: "b1", label: "Confirm customer and vehicle details",
      },
      {
        id: "b2", label: "Confirm vehicle is available",
      },
      {
        id: "b3", label: "Confirm device details",
      },
      {
        id: "b4", label: "Confirm required installation equipment",
      },
      {
        id: "b5", label: "Confirm installation location",
      },
    ],
  },
  {
    id: "install",
    title: "Installation",
    items: [
      {
        id: "i1", label: "Install device",
      },
      {
        id: "i2", label: "Connect device correctly",
      },
      {
        id: "i3", label: "Install / connect SIM where applicable",
      },
      {
        id: "i4", label: "Verify device power",
      },
      {
        id: "i5", label: "Verify device communication",
      },
      {
        id: "i6", label: "Perform required installation checks",
      },
    ],
  },
  {
    id: "verify",
    title: "Verification",
    items: [
      {
        id: "v1", label: "Confirm device is communicating",
      },
      {
        id: "v2", label: "Confirm device information matches job",
      },
      {
        id: "v3", label: "Confirm installation is complete",
      },
      {
        id: "v4", label: "Capture installation evidence",
      },
    ],
  },
];

export const CHECKLIST_TOTAL = INSTALLATION_CHECKLIST.reduce(
  (n, s) => n + s.items.length,
  0,
);

export const EVIDENCE_CATEGORIES = [
  "Device installation",
  "Vehicle",
  "Device serial / IMEI",
  "Installation location",
  "Completed installation",
];

export const ISSUE_TYPES = [
  "Vehicle unavailable",
  "Device problem",
  "SIM / connectivity issue",
  "Installation obstruction",
  "Incorrect customer information",
  "Incorrect vehicle information",
  "Unable to complete installation",
  "Other",
];

export function installerName(i: Installer) {
  return `${i.firstName} ${i.lastName}`;
}

export function checklistProgress(job: InstallationJob) {
  const done = Object.values(job.checklist).filter(Boolean).length;
  return {
    done, total: CHECKLIST_TOTAL,
  };
}

/**
 * The signed-in installer. Until an installer API exists there is nothing to
 * look the real user up against, so the portal renders this record.
 */
export const CURRENT_INSTALLER: Installer = {
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
};

const allChecked = Object.fromEntries(
  INSTALLATION_CHECKLIST.flatMap(s => s.items.map(i => [
    i.id,
    true,
  ])),
);

export const SEED_JOBS: InstallationJob[] = [
  {
    id: "FL-1024",
    installerId: "INS-1001",
    status: "scheduled",
    createdAt: "2026-09-13T08:12:00.000Z",
    scheduledDate: "2026-09-18",
    scheduledTime: "10:00",
    customer: {
      name: "Lagos Express Logistics",
      type: "Enterprise",
      phone: "+234 701 445 2219",
      email: "ops@lagosexpress.ng",
      address: "14 Kudirat Abiola Way, Oregun",
      state: "Lagos",
      city: "Ikeja",
    },
    vehicle: {
      registration: "LSD-442-XA",
      type: "Truck",
      make: "Mercedes-Benz",
      model: "Actros 1844",
      year: "2021",
      engineNumber: "OM471-884213",
      chassisNumber: "WDB9634031L772210",
      color: "White",
      engineCapacity: "12.8L",
      odometer: "148,220 km",
    },
    device: {
      id: "DEV-77120",
      imei: "356938035643809",
      manufacturer: "Teltonika",
      model: "FMB920",
      status: "Configured",
      type: "GPS Tracker",
    },
    sim: {
      iccid: "8923401234567890123",
      imsi: "621301234567890",
      msisdn: "+234 703 000 1122",
      carrier: "MTN Nigeria",
      activation: "Activated",
    },
    checklist: {},
    evidence: [],
    installerNotes: "",
    history: [
      {
        at: "2026-09-13T08:12:00.000Z", label: "Installation job created",
      },
      {
        at: "2026-09-13T08:12:30.000Z", label: "System assigned installer Tunde Akinwale",
      },
    ],
  },
  {
    id: "FL-1025",
    installerId: "INS-1001",
    status: "scheduled",
    createdAt: "2026-09-10T10:02:00.000Z",
    scheduledDate: "2026-09-14",
    scheduledTime: "13:30",
    customer: {
      name: "Adebayo Haulage",
      type: "Owner-Operator",
      phone: "+234 802 993 1180",
      email: "adebayo@haulage.ng",
      address: "5 Alaka Street, Surulere",
      state: "Lagos",
      city: "Surulere",
    },
    vehicle: {
      registration: "KJA-889-YZ",
      type: "Pickup",
      make: "Toyota",
      model: "Hilux",
      year: "2019",
      engineNumber: "2GD-0921445",
      chassisNumber: "MR0FZ29G1K1220913",
      color: "Silver",
      engineCapacity: "2.4L",
      odometer: "96,540 km",
    },
    device: {
      id: "DEV-77145",
      imei: "356938035644120",
      manufacturer: "Teltonika",
      model: "FMB920",
      status: "Configured",
      type: "GPS Tracker",
    },
    sim: {
      iccid: "8923401234567890455",
      imsi: "621301234567455",
      msisdn: "+234 703 000 3344",
      carrier: "MTN Nigeria",
      activation: "Activated",
    },
    checklist: {
      b1: true, b2: true, b3: true,
    },
    evidence: [],
    installerNotes: "",
    history: [
      {
        at: "2026-09-10T10:02:00.000Z", label: "Installation job created",
      },
      {
        at: "2026-09-10T10:02:20.000Z", label: "System assigned installer Tunde Akinwale",
      },
      {
        at: "2026-09-11T09:14:00.000Z", label: "Installer accepted the job",
      },
      {
        at: "2026-09-11T09:20:00.000Z", label: "Installation scheduled for 14 Sep 2026, 13:30",
      },
    ],
  },
  {
    id: "FL-1019",
    installerId: "INS-1001",
    status: "in_progress",
    createdAt: "2026-09-08T07:40:00.000Z",
    scheduledDate: "2026-09-14",
    scheduledTime: "09:00",
    customer: {
      name: "Northline Distribution",
      type: "Enterprise",
      phone: "+234 705 221 7788",
      email: "fleet@northline.ng",
      address: "Plot 22 Acme Road, Ogba",
      state: "Lagos",
      city: "Ogba",
    },
    vehicle: {
      registration: "AGL-201-KJA",
      type: "Van",
      make: "Ford",
      model: "Transit",
      year: "2020",
      engineNumber: "FD-772130",
      chassisNumber: "WF0XXXTTGXKS12934",
      color: "Blue",
      engineCapacity: "2.2L",
      odometer: "71,300 km",
    },
    device: {
      id: "DEV-77088",
      imei: "356938035641772",
      manufacturer: "Technoton",
      model: "DUT-E 2Bio",
      status: "Registered",
      type: "Fuel Level Sensor",
    },
    sim: {
      iccid: "8923401234567899001",
      imsi: "621301234569001",
      msisdn: "+234 703 000 9900",
      carrier: "MTN Nigeria",
      activation: "Activated",
    },
    checklist: {
      b1: true, b2: true, b3: true, b4: true, b5: true, i1: true, i2: true,
    },
    evidence: [],
    installerNotes: "Tank sensor mounted, waiting on calibration run.",
    history: [
      {
        at: "2026-09-08T07:40:00.000Z", label: "Installation job created",
      },
      {
        at: "2026-09-08T07:41:00.000Z", label: "System assigned installer Tunde Akinwale",
      },
      {
        at: "2026-09-09T08:02:00.000Z", label: "Installer accepted the job",
      },
      {
        at: "2026-09-14T09:05:00.000Z", label: "Installation started",
      },
    ],
  },
  {
    id: "FL-0998",
    installerId: "INS-1001",
    status: "completed",
    createdAt: "2026-08-21T09:00:00.000Z",
    scheduledDate: "2026-08-24",
    scheduledTime: "11:00",
    completedAt: "2026-08-24T13:12:00.000Z",
    customer: {
      name: "Lagos Express Logistics",
      type: "Enterprise",
      phone: "+234 701 445 2219",
      email: "ops@lagosexpress.ng",
      address: "14 Kudirat Abiola Way, Oregun",
      state: "Lagos",
      city: "Ikeja",
    },
    vehicle: {
      registration: "LSD-118-AA",
      type: "Truck",
      make: "MAN",
      model: "TGS 26.440",
      year: "2018",
      engineNumber: "D2066-441209",
      chassisNumber: "WMA06XZZ8JM662104",
      color: "Red",
      engineCapacity: "10.5L",
      odometer: "212,900 km",
    },
    device: {
      id: "DEV-76540",
      imei: "356938035630021",
      manufacturer: "Teltonika",
      model: "FMB920",
      status: "Active",
      type: "GPS Tracker",
    },
    sim: {
      iccid: "8923401234567812345",
      imsi: "621301234512345",
      msisdn: "+234 703 000 5566",
      carrier: "MTN Nigeria",
      activation: "Activated",
    },
    checklist: allChecked,
    evidence: [],
    installerNotes: "Device fitted behind dashboard, communication verified on site.",
    history: [
      {
        at: "2026-08-21T09:00:00.000Z", label: "Installation job created",
      },
      {
        at: "2026-08-21T09:01:00.000Z", label: "System assigned installer Tunde Akinwale",
      },
      {
        at: "2026-08-22T10:00:00.000Z", label: "Installer accepted the job",
      },
      {
        at: "2026-08-24T11:05:00.000Z", label: "Installation started",
      },
      {
        at: "2026-08-24T13:12:00.000Z", label: "Installation completed",
      },
    ],
  },
  {
    id: "FL-1002",
    installerId: "INS-1002",
    status: "issue_reported",
    createdAt: "2026-09-02T08:00:00.000Z",
    scheduledDate: "2026-09-05",
    scheduledTime: "10:00",
    customer: {
      name: "Capital Movers Ltd",
      type: "Enterprise",
      phone: "+234 809 553 1120",
      email: "ops@capitalmovers.ng",
      address: "18 Ahmadu Bello Way, Garki",
      state: "Abuja (FCT)",
      city: "Garki",
    },
    vehicle: {
      registration: "ABJ-330-GW",
      type: "Bus",
      make: "Toyota",
      model: "Hiace",
      year: "2022",
      engineNumber: "1GD-778210",
      chassisNumber: "JTFST22P1N0112884",
      color: "White",
      engineCapacity: "2.8L",
      odometer: "38,110 km",
    },
    device: {
      id: "DEV-77201",
      imei: "356938035647712",
      manufacturer: "Teltonika",
      model: "FMC130",
      status: "Registered",
      type: "GPS Tracker",
    },
    checklist: {
      b1: true, b2: false,
    },
    evidence: [],
    installerNotes: "",
    issue: {
      type: "Vehicle unavailable",
      description: "Vehicle was on a trip at the scheduled time. Customer to confirm a new slot.",
      reportedAt: "2026-09-05T10:30:00.000Z",
      photos: [],
    },
    history: [
      {
        at: "2026-09-02T08:00:00.000Z", label: "Installation job created",
      },
      {
        at: "2026-09-02T08:01:00.000Z", label: "System assigned installer Ngozi Eze",
      },
      {
        at: "2026-09-05T10:30:00.000Z", label: "Issue reported: Vehicle unavailable",
      },
    ],
  },
];

export const SEED_NOTIFICATIONS: InstallerNotification[] = [
  {
    id: "NTF-1",
    installerId: "INS-1001",
    jobId: "FL-1024",
    title: "New job assigned",
    message: "You have been assigned a new installation job (FL-1024).",
    createdAt: "2026-09-13T08:12:30.000Z",
    read: false,
  },
  {
    id: "NTF-2",
    installerId: "INS-1001",
    jobId: "FL-1025",
    title: "Installation scheduled",
    message: "Your installation for Job #FL-1025 is scheduled for 14 September at 13:30.",
    createdAt: "2026-09-11T09:20:00.000Z",
    read: false,
  },
  {
    id: "NTF-3",
    installerId: "INS-1001",
    jobId: "FL-1019",
    title: "Job updated",
    message: "Installation details for Job #FL-1019 have been updated.",
    createdAt: "2026-09-12T16:05:00.000Z",
    read: true,
  },
];
