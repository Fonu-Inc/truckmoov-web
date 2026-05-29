import { ArrowRight, ChevronDown } from "lucide-react";

import Logo from "./logo";
import { Link } from "react-router";
import { Button } from "../shadcn/button";

const NAVLINKS = [
 { label: "Stakeholders", href: "/#stakeholders" },
 { label: "Products", href: "/#products" },
 { label: "Solutions", href: "/#solutions" },
 { label: "About Us", href: "/#about" },
 { label: "Resources", href: "/#resources" },
]

export default function NavBar() {
 return (
  <section className="w-full px-4 py-2 fixed top-0 left-0">
   <nav className="container mx-auto flex items-center justify-between gap-2">
    <Logo />
    <ul className="flex items-center gap-8 text-sm font-medium text-foreground">
     {NAVLINKS.map(({ label, href }) => (
      <li key={label}>
       <Link
        to={href}
        className="flex items-center gap-2"
       >
        {label}
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
   </nav>
  </section>
 )
}
