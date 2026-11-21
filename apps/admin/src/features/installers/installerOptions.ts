import type {
  InstallerCapability, InstallerJobStatus, SystemInstaller,
} from "@truckmoov/api/auth";
import { NIGERIAN_STATES } from "@truckmoov/api/auth";

export const CAPABILITY_LABELS: Record<InstallerCapability, string> = {
  tracker_installation_wiring: "Tracker installation & wiring",
  sim_installation_activation: "SIM installation & activation",
  device_configuration_provisioning: "Device configuration & provisioning",
  fuel_sensor_installation_calibration: "Fuel sensor installation & calibration",
  camera_accessory_installation: "Camera & accessory installation",
  diagnostics_repairs_troubleshooting: "Diagnostics, repairs & troubleshooting",
  device_replacement_deinstallation: "Device replacement & de-installation",
  onsite_customer_training_handover: "On-site customer training & handover",
};

export const CAPABILITY_OPTIONS = Object.values(CAPABILITY_LABELS);

export function capabilityValue(label: string) {
  return (Object.keys(CAPABILITY_LABELS) as InstallerCapability[]).find(key => CAPABILITY_LABELS[key] === label);
}

export const capabilityLabel = (value: string) => CAPABILITY_LABELS[value as InstallerCapability] ?? value;

// The API's state enum spells Abuja as "FCT"; every other option already matches.
export const toApiState = (state: string) => (state === "Abuja (FCT)" ? "FCT" : state);
export const fromApiState = (state: string) => (state === "FCT" ? "Abuja (FCT)" : state);

export const STATE_OPTIONS = NIGERIAN_STATES.map(fromApiState);

export function installerName(installer: Pick<SystemInstaller, "firstName" | "lastName">) {
  return `${installer.firstName} ${installer.lastName}`;
}

export const AVAILABILITY_LABEL: Record<SystemInstaller["availability"], string> = {
  available: "Available",
  at_capacity: "At capacity",
  unavailable: "Unavailable",
  not_onboarded: "Not yet onboarded",
};

export const STATUS_LABEL: Record<SystemInstaller["status"], string> = {
  active: "Active",
  invited: "Invitation Sent",
  suspended: "Suspended",
};

export const JOB_STATUS_LABEL: Record<InstallerJobStatus, string> = {
  unassigned: "Awaiting assignment",
  assigned: "Offer pending",
  scheduled: "Scheduled",
  in_progress: "In progress",
  overdue: "Overdue",
  issue_reported: "Issue reported",
  completed: "Completed",
  cancelled: "Cancelled",
};
