import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { router } from "./shared/lib/route";
import "@truckmoov/reusables/index.css";

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
