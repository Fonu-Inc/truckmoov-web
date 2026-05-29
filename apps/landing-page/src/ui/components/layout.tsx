import { Outlet } from "react-router"

import NavBar from "./nav-bar";
import Footer from "./footer";
import OptimizeYourFleet from "./optimize-your-fleet";

export default function Layout() {
 return (
  <section className="w-full min-h-dvh text-foreground relative flex flex-col space-y-10">
   <NavBar />
   <main className="mt-25 flex-1 mb-25">
    <Outlet />
   </main>
   <OptimizeYourFleet />
   <Footer />
  </section>
 )
}
