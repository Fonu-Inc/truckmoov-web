export type DeviceCatalogEntry = {
  model: string;
  manufacturer: string;
  firmwareVersion: string;
  installSteps: string[];
  configChecklist: string[];
  verificationChecklist: string[];
};

export const DEVICE_CATALOG: DeviceCatalogEntry[] = [
  {
    model: "FMC130",
    manufacturer: "Teltonika",
    firmwareVersion: "3.28.07",
    installSteps: [
      "Mount the unit under the dashboard with zip ties.",
      "Connect power to the vehicle ignition and ground.",
      "Insert activated SIM and lock the SIM tray.",
      "Attach the GPS antenna on the windshield edge.",
    ],
    configChecklist: [
      "Set server IP and port in configurator.",
      "Confirm APN is correct for the SIM.",
      "Enable periodic GPS reporting every 30 seconds.",
    ],
    verificationChecklist: [
      "Device shows online within 5 minutes.",
      "Signal strength above 40 percent.",
      "First location ping matches install site.",
    ],
  },
  {
    model: "FMB920",
    manufacturer: "Teltonika",
    firmwareVersion: "3.27.10",
    installSteps: [
      "Mount device behind the glove box.",
      "Connect power and ignition wires.",
      "Insert SIM card and attach GPS antenna.",
      "Secure cables to avoid vibration damage.",
    ],
    configChecklist: [
      "Apply default configuration template.",
      "Enable towing alert profile.",
      "Set reporting interval to 60 seconds.",
    ],
    verificationChecklist: [
      "Device reports online within 10 minutes.",
      "Battery backup passes self-test.",
      "Geofence alert triggers from dashboard.",
    ],
  },
  {
    model: "GT06N",
    manufacturer: "Concox",
    firmwareVersion: "2.5.4",
    installSteps: [
      "Mount the device near the fuse box.",
      "Connect ACC and ground wires.",
      "Place GPS antenna on dash top.",
      "Insert SIM and confirm signal light.",
    ],
    configChecklist: [
      "Program server IP and APN via SMS.",
      "Enable overspeed alerts.",
      "Confirm device time sync.",
    ],
    verificationChecklist: [
      "LED status shows GPS fix.",
      "Server receives heartbeat packets.",
      "Test SOS button response.",
    ],
  },
];

export function findCatalogEntry(model: string) {
  return DEVICE_CATALOG.find((entry) => entry.model === model);
}
