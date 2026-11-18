import { createBrowserRouter } from "react-router";

import Layout from "./ui/components/layout";
import Home from "./ui/pages/home";

type PageModule = Promise<{ default: () => React.JSX.Element }>;

/** Code-split a page: every inner page is loaded on demand. */
function page(load: () => PageModule) {
  return { lazy: async () => ({ Component: (await load()).default }) };
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "stalkholder",
        children: [
          {
            path: "enterprise-admin",
            ...page(() => import("./ui/pages/stakeholders/enterprise-admin")),
          },
          {
            path: "owner-operator",
            ...page(() => import("./ui/pages/stakeholders/owner-operator")),
          },
          {
            path: "fleet-provider",
            ...page(() => import("./ui/pages/stakeholders/fleet-provider")),
          },
          {
            path: "aggregator-admin",
            ...page(() => import("./ui/pages/stakeholders/aggregator-admin")),
          },
        ],
      },
      {
        path: "roles",
        children: [
          {
            path: "operations-manager",
            ...page(() => import("./ui/pages/roles/operations-manager")),
          },
          {
            path: "dispatcher",
            ...page(() => import("./ui/pages/roles/dispatcher")),
          },
          {
            path: "finance-officer",
            ...page(() => import("./ui/pages/roles/finance-officer")),
          },
          {
            path: "maintenance-supervisor",
            ...page(() => import("./ui/pages/roles/maintenance-supervisor")),
          },
          {
            path: "viewer",
            ...page(() => import("./ui/pages/roles/viewer")),
          },
          {
            path: "driver",
            ...page(() => import("./ui/pages/roles/driver")),
          },
          {
            path: "analyst",
            ...page(() => import("./ui/pages/roles/analyst")),
          },
        ],
      },
      {
        path: "product",
        children: [
          {
            path: "fleet-management",
            ...page(() => import("./ui/pages/products/fleet-management")),
          },
          {
            path: "live-tracking",
            ...page(() => import("./ui/pages/products/live-tracking")),
          },
          {
            path: "dispatch-management",
            ...page(() => import("./ui/pages/products/dispatch-management")),
          },
          {
            path: "ai-optimisation",
            ...page(() => import("./ui/pages/products/ai-optimization")),
          },
          {
            path: "analytics-reporting",
            ...page(() => import("./ui/pages/products/analytics-reporting")),
          },
          {
            path: "iot-sims-devices",
            ...page(() => import("./ui/pages/products/iot-sims-devices")),
          },
        ],
      },
      {
        path: "solutions",
        children: [
          {
            path: "enterprise-logistics",
            ...page(() => import("./ui/pages/solutions/enterprise-logistics")),
          },
          {
            path: "delivery-operations",
            ...page(() => import("./ui/pages/solutions/delivery-operations")),
          },
          {
            path: "fleet-operations",
            ...page(() => import("./ui/pages/solutions/fleet-operations")),
          },
          {
            path: "third-party-logistics",
            ...page(() => import("./ui/pages/solutions/third-party-logistics")),
          },
          {
            path: "smart-fleet-tracking",
            ...page(() => import("./ui/pages/solutions/smart-fleet-tracking")),
          },
          {
            path: "ai-logistics-operations",
            ...page(() => import("./ui/pages/solutions/ai-logistics-operations")),
          },
        ],
      },
      {
        path: "resources",
        children: [
          {
            path: "documentation",
            ...page(() => import("./ui/pages/resources/documentation")),
          },
          {
            path: "faqs",
            ...page(() => import("./ui/pages/resources/faqs")),
          },
          {
            path: "help-articles",
            ...page(() => import("./ui/pages/resources/help-articles")),
          },
        ],
      },
      {
        path: "*",
        ...page(() => import("./ui/pages/not-found")),
      },
    ],
  },
]);
