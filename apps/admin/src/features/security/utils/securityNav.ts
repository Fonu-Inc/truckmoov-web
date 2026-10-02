export type SecurityTab = {
  to: string;
  label: string;
};

export const SECURITY_TABS: SecurityTab[] = [
  {
    to: "/security", label: "Overview",
  },
  {
    to: "/security/payments-access", label: "Payments and Access",
  },
  {
    to: "/security/devices-sims", label: "Devices and SIMs",
  },
];
