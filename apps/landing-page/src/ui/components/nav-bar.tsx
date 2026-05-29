import { ArrowRight, ChevronDown } from "lucide-react";
import { useState } from "react";

import Logo from "./logo";
import { Link } from "react-router";
import { Button } from "../shadcn/button";
import { appLinks } from "@/lib/app-links";
import { cn } from "@/lib/utils";
import SectionContainer from "./section-container";

export default function NavBar() {
 const [openMenu, setOpenMenu] = useState<string | null>(null);
 const [dismissedMenu, setDismissedMenu] = useState<string | null>(null);

 const closeMenu = (title: string) => {
  setOpenMenu(null);
  setDismissedMenu(title);
 };

 return (
  <SectionContainer
   rootAs="nav"
   rootClassName="group/nav fixed top-0 left-0 z-50 bg-background py-0 shadow"
   containerClassName="flex h-[72px] items-center justify-between gap-2 py-0"
  >
   <Link to="/" aria-label="Go to home">
    <Logo />
   </Link>
   <ul className="flex items-center gap-8 text-sm font-medium text-foreground">
    {appLinks.map(({ title, href, children }) => (
     <li
      key={title}
      className="group/nav-item"
      onMouseEnter={() => {
       if (dismissedMenu !== title) {
        setOpenMenu(title);
       }
      }}
      onMouseLeave={() => {
       setOpenMenu(null);
       setDismissedMenu(null);
      }}
      onFocus={() => setOpenMenu(title)}
     >
      <Link
       to={href}
       className="flex h-[72px] items-center gap-2 transition-colors hover:text-primary-100 focus-visible:text-primary-100 focus-visible:outline-none"
       onClick={() => closeMenu(title)}
      >
       {title}
       <ChevronDown
        className={cn(
         "size-5 transition-transform duration-200",
         openMenu === title && "rotate-180",
        )}
        aria-hidden="true"
        strokeWidth={1.75}
       />
      </Link>
      <div
       className={cn(
        "pointer-events-none absolute inset-x-0 top-full -z-10 border-t border-border bg-background opacity-0 shadow-sm transition duration-200",
        openMenu === title && "pointer-events-auto z-10 opacity-100",
       )}
      >
       <div className="container mx-auto px-4 py-8">
        <p className="mb-6 text-xs font-medium uppercase text-muted-foreground">
         {title}
        </p>
        <ul className="grid gap-x-10 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
         {children.map(({ title, href, description, icon: Icon }) => (
          <li key={title}>
           <Link
           to={href}
            className="group/menu-link flex items-start gap-4 rounded-md p-2 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
            onClick={() => closeMenu(title)}
           >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-200 text-primary-100 transition-colors group-hover/menu-link:bg-primary group-hover/menu-link:text-foreground">
             <Icon className="size-4" aria-hidden="true" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
             <span className="block text-sm font-medium text-foreground">
              {title}
             </span>
             <span className="mt-1 block max-w-[24rem] text-xs leading-5 text-muted-foreground">
              {description}
             </span>
            </span>
           </Link>
          </li>
         ))}
        </ul>
       </div>
      </div>
     </li>
    ))}
   </ul>
   <section className="flex items-center gap-2">
    <Button variant={"link"} asChild>
     <Link to={"#"}>
      Sign in
     </Link>
    </Button>
    <Button asChild>
     <Link to={"#"}>
      Contact us
      <ArrowRight />
     </Link>
    </Button>
   </section>
  </SectionContainer>
 )
}
