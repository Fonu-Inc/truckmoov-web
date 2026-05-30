import { createBrowserRouter } from "react-router"

import Layout from "./ui/components/layout"
import Home from "./ui/pages/home"
import FleetProvider from "./ui/pages/fleet-provider"
import EnterpriseAdmin from "./ui/pages/enterprise-admin"
import OwnerOperator from "./ui/pages/owner-operator"
import AggregatorAdmin from "./ui/pages/aggregator-admin"
import FleetManagement from "./ui/pages/fleet-management"
import LiveTracking from "./ui/pages/live-tracking"
import DispatchManagement from "./ui/pages/dispatch-management"
import AiOptimisation from "./ui/pages/ai-optimisation"

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
        path: "/stalkholder/fleet-provider",
        element: <FleetProvider />
      },
      {
        path: "/stalkholder/enterprise-admin",
        element: <EnterpriseAdmin />
      },
      {
        path: "/stalkholder/owner-operator",
        element: <OwnerOperator />
      },
      {
        path: "/stalkholder/aggregator-admin",
        element: <AggregatorAdmin />
      },
      {
        path: "/product/fleet-management",
        element: <FleetManagement />
      },
      {
        path: "/product/live-tracking",
        element: <LiveTracking />
      },
      {
        path: "/product/dispatch-management",
        element: <DispatchManagement />
      },
      {
        path: "/product/ai-optimisation",
        element: <AiOptimisation />
      },
    ],
  },
])
