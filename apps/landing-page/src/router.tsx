import { createBrowserRouter } from "react-router"

import Layout from "./ui/components/layout"
import Home from "./ui/pages/home"
import FleetProvider from "./ui/pages/fleet-provider"
import EnterpriseAdmin from "./ui/pages/enterprise-admin"
import OwnerOperator from "./ui/pages/owner-operator"
import AggregatorAdmin from "./ui/pages/aggregator-admin"

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
    ],
  },
])
