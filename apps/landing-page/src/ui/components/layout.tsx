import { Outlet } from "react-router"

import NavBar from "./nav-bar";

export default function Layout() {
 return (
  <section className="w-full h-dvh text-foreground">
   <NavBar />
   <Outlet />
  </section>
 )
}
