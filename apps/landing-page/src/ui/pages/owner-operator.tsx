import type { StalkholderData } from "../components/stalkholder-layout";
import StalkholderLayout from "../components/stalkholder-layout";

const OWNER_OPERATOR: StalkholderData = {
  titleIcon: "/stalkholders/owner-operator.svg",
  title: "Owner Operator",
  description: "Your single cockpit for running an independent fleet, giving you a centralized command view to manage operations, track performance, coordinate drivers, and oversee every movement with clarity and control.",
  definitionHeader: "Who is an Owner Operator?",
  definition: "An independent vehicle owner responsible for managing one or a small number of vehicles, operating either as a standalone operator or as part of a larger aggregator network. They handle day-to-day usage, availability, and assignment of their vehicles, participating in logistics operations while maintaining full ownership and control over their assets.",
  responsibilities: [
    "Register personal vehicles and assign IoT devices.",
    "Accept or decline incoming jobs from aggregators.",
    "Manage drivers, trips and proof of delivery.",
    "Stay on top of maintenance and vehicle health.",
    "Monitor invoices and earnings.",
  ],
  permissions: [
    "Register personal vehicles",
    "Accept or decline jobs",
    "Manage own drivers",
    "Track assigned deliveries",
    "View live tracking maps",
    "Assign SIMs and devices",
    "Manage maintenance",
    "View invoices & billing",
  ],
  limitations: [
    "Create enterprise-scale operations",
    "Aggregate operators",
    "Create depot structures",
    "Access enterprise billing systems",
  ],
  roles: ["Driver"],
};

export default function OwnerOperator() {
  return (
    <StalkholderLayout
      data={OWNER_OPERATOR}
    />
  );
}
