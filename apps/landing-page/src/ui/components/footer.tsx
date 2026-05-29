import { Link, NavLink } from "react-router"
import { Button } from "../shadcn/button"
import Logo from "./logo"
import { appLinks } from "@/lib/app-links"
import { GmailIcon, InstagramIcon, LinkedinIcon, XIcon } from "../svgs"

const FOOTER_LINK = [
 {
  label: "Privacy Policy",
  to: "#"
 },
 {
  label: "Terms of Service",
  to: "#"
 },
 {
  label: "Contact",
  to: "#"
 },
]

export default function Footer() {
 return (
  <footer className="w-full">
   <main className="container mx-auto space-y-8">
    <section className="flex gap-10 items-start">
     <section className="flex flex-col gap-1">
      <Logo />
      <p className="font-medium text-xs text-primary-300">
       AI-powered logistics intelligence for modern, multi-tenant fleet operations.
      </p>
      <div className="flex items-center gap-1.5">
       <LinkedinIcon />
       <InstagramIcon />
       <XIcon />
       <GmailIcon />
      </div>
     </section>
     <section className="flex gap-2 items-start justify-between w-full">
      {appLinks.map(link => (
       <div key={link.title} className="space-x-3">
        <h1 className="uppercase font-bold text-base">{link.title}</h1>
        <div className="space-y-1">
         {link.children.map(child => (
          <NavLink to={child.href} key={child.title} className="text-sm block">{child.title}</NavLink>
         ))}
        </div>
       </div>
      ))}
     </section>
    </section>
    <section className="py-2 border-t border-border flex items-center justify-between gap-2">
     <p className="text-xs">
      © 2026 FleetPro Enterprise. All rights reserved.
     </p>
     <section className="flex items-center">
      {
       FOOTER_LINK.map(link => (
        <Button
         key={link.label}
         variant={"link"}
        >
         <Link
          to={link.to}
         >
          {link.label}
         </Link>
        </Button>
       ))
      }
     </section>
    </section>
   </main>
  </footer>
 )
}
