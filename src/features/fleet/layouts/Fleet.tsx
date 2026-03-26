import { Outlet } from "react-router-dom";
import FleetTabs from "../components/FleetTabs";

export default function Fleet() {
 return (
  <section className="space-y-6">
   {/* <FleetTabs /> */}
   <Outlet />
  </section>
 )
}
