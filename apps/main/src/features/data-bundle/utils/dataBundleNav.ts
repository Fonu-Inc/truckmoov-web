export const DATA_BUNDLE_TABS = [
  {
    to: "/data-bundles", label: "My Bundles", key: "bundles",
  },
  {
    to: "/data-bundles/topups", label: "Transaction History", key: "topups",
  },
  {
    to: "/data-bundles/analytics", label: "Analytics", key: "analytics",
  },
  {
    to: "/data-bundles/rates", label: "Current Rates", key: "rates",
  },
] as const;

export type DataBundleTabKey = typeof DATA_BUNDLE_TABS[number]["key"];
