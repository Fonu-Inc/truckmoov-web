import { Outlet } from "react-router"

import NavBar from "./nav-bar";
import Footer from "./footer";

export default function Layout() {
 return (
  <section className="w-full min-h-dvh text-foreground relative flex flex-col">
   <NavBar />
   <main className="mt-25 flex-1">
    <Outlet />
   </main>
   <Footer />
  </section>
 )
}
