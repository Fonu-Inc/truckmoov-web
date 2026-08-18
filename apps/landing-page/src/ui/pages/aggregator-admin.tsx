import type { StalkholderData } from "../components/stalkholder-layout";
import StalkholderLayout from "../components/stalkholder-layout";

const AGGREGATOR: StalkholderData = {
  titleIcon: "/stalkholders/aggregator.svg",
  title: "Aggregator",
  description: "Orchestrate an independent operator network as a unified fleet, coordinating multiple operators into a single, connected logistics system with shared visibility and seamless execution.",
  definition: "An Aggregator coordinates a distributed network of independent owner operators and small transporters, bringing them together into a unified logistics ecosystem for efficient matching, routing, and execution of deliveries. Rather than owning fleet infrastructure directly, it focuses on aggregation, coordination, and seamless orchestration of third-party capacity to fulfil transport demand at scale.",
  responsibilities: [
    "Onboard and KYC owner operators into the network.",
    "Match incoming jobs to the right operator using AI.",
    "Track network-wide deliveries and SLA performance.",
    "Provision SIMs and bundles across the network.",
    "Consolidate analytics and invoicing across operators.",
  ],
  permissions: [
    "Dispatch jobs across the network",
    "Match jobs to operators",
    "Track network deliveries",
    "Onboard owner operators",
    "Recommend drivers using AI",
    "View network-wide vehicles and drivers",
    "Manage SIMs & bundles",
    "View analytics & invoices",
    "Configure maintenance schedules",
  ],
  limitations: [
    "Own enterprise fleets",
    "Create enterprise depot structures",
    "Manage enterprise client systems",
    "Access other tenant workspaces",
  ],
  roles: [
    "Operations Manager",
    "Analyst",
  ],
};

export default function AggregatorAdmin() {
  return (
    <StalkholderLayout
      data={AGGREGATOR}
    />
  );
}
