import { createBrowserRouter } from "react-router"

import Layout from "./ui/components/layout"
import Home from "./ui/pages/home"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },
])
