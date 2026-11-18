import { useEffect } from "react";
import {
  Outlet,
  useLocation,
} from "react-router";

import CtaBand from "./cta-band";
import Footer from "./footer";
import NavBar from "./nav-bar/nav-bar";
import SupportPill from "./support-pill";

/** Site shell: fixed nav, page content, CTA band, footer and the floating support widget. */
export default function Layout() {
  const { pathname } = useLocation();

  useEffect(
    () => {
      window.scrollTo({
        top: 0,
        left: 0,
      });
    },
    [pathname],
  );

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip text-foreground">
      <NavBar />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <CtaBand />
      <Footer />
      <SupportPill />
    </div>
  );
}
