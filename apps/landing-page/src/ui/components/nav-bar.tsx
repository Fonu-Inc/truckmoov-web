import { ArrowRight, ChevronDown } from "lucide-react";

import Logo from "./logo";
import { Link } from "react-router";
import { Button } from "../shadcn/button";
import { appLinks } from "@/lib/app-links";
import SectionContainer from "./section-container";

export default function NavBar() {
 return (
  <SectionContainer
   rootAs="nav"
   rootClassName="fixed top-0 left-0 bg-background shadow z-50"
   containerClassName="flex items-center justify-between gap-2 py-0"
  >
   <Logo />
   <ul className="flex items-center gap-8 text-sm font-medium text-foreground">
    {appLinks.map(({ title, href }) => (
     <li key={title}>
      <Link
       to={href}
       className="flex items-center gap-2"
      >
       {title}
       <ChevronDown className="size-5" aria-hidden="true" strokeWidth={1.75} />
      </Link>
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
