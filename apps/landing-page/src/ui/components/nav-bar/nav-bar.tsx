import {
  ArrowRight,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { appLinks } from "@/lib/app-links";
import { cn } from "@/lib/utils";
import { Button } from "../../shadcn/button";
import ContactDialog from "../contact-dialog/contact-dialog";
import Logo from "../logo";
import MegaMenu from "./mega-menu";
import MobileMenu from "./mobile-menu";

const SIGN_IN_URL = "#";

/** Fixed 80px top bar with hover mega menus (desktop) and a slide-down menu (mobile). */
export default function NavBar() {
  const [
    openMenu,
    setOpenMenu,
  ] = useState<string | null>(null);
  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const close = () => {
    setOpenMenu(null);
    setMobileOpen(false);
  };

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background shadow-nav"
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="page-container flex h-20 items-center justify-between gap-4">
        <Link
          to="/"
          aria-label="Go to home"
          onClick={close}
          className="shrink-0"
        >
          <Logo className="h-14 w-auto lg:h-[77px] lg:w-[210px]" />
        </Link>

        <ul className="hidden items-center gap-[30px] lg:absolute lg:left-1/2 lg:flex lg:-translate-x-1/2">
          {appLinks.map(group => (
            <li
              key={group.title}
              onMouseEnter={() => setOpenMenu(group.title)}
              onFocus={() => setOpenMenu(group.title)}
            >
              <Link
                to={group.sections[0].links[0].href}
                aria-expanded={openMenu === group.title}
                onClick={close}
                className="flex h-20 items-center gap-[5px] text-sm leading-[14px] font-medium text-foreground transition-colors hover:text-brand-deep focus-visible:text-brand-deep focus-visible:outline-none"
              >
                {group.title}
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "size-4 transition-transform duration-200",
                    openMenu === group.title && "rotate-180",
                  )}
                />
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2.5 lg:flex min-[1440px]:-mr-[15px]">
          <Button
            asChild
            variant="pill"
            size="pill"
            className="px-[24px]"
          >
            <a href={SIGN_IN_URL}>Sign In</a>
          </Button>
          <ContactDialog>
            <Button
              variant="brand"
              size="pill"
              className="px-[26px] shadow-none"
            >
              Contact Us
              <ArrowRight />
            </Button>
          </ContactDialog>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(open => !open)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {appLinks.map(group => (
        <div
          key={group.title}
          className={cn(
            "absolute inset-x-0 top-full hidden border-y border-border-faint bg-background shadow-nav lg:block",
            "pointer-events-none invisible opacity-0 transition-opacity duration-150",
            openMenu === group.title && "pointer-events-auto visible opacity-100",
          )}
        >
          <MegaMenu
            group={group}
            onNavigate={close}
          />
        </div>
      ))}

      {mobileOpen && (
        <MobileMenu
          signInUrl={SIGN_IN_URL}
          onNavigate={close}
        />
      )}
    </nav>
  );
}
