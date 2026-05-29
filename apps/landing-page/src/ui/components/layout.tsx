import { useEffect } from "react";
import { Outlet, useLocation } from "react-router"

import NavBar from "./nav-bar";
import Footer from "./footer";
import OptimizeYourFleet from "./optimize-your-fleet";

export default function Layout() {
 const { pathname } = useLocation();

 useEffect(() => {
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
 }, [pathname]);

 return (
  <section className="w-full min-h-dvh text-foreground relative flex flex-col space-y-10">
   <NavBar />
   <main className="mt-18 flex-1 mb-25">
    <Outlet />
   </main>
   <OptimizeYourFleet />
   <Footer />
  </section>
 )
}
