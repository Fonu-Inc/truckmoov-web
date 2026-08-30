export const FINANCIALS_TABS = [
  {
    to: "/fleet/financials", label: "Overview", key: "overview",
  },
  {
    to: "/fleet/financials/vehicle-pl", label: "Vehicle P&L", key: "vehicle-pl",
  },
  {
    to: "/fleet/financials/cost-breakdown", label: "Cost Breakdown", key: "cost-breakdown",
  },
  {
    to: "/fleet/financials/underperforming", label: "Underperforming", key: "underperforming",
  },
] as const;

export type FinancialsTabKey = typeof FINANCIALS_TABS[number]["key"];
