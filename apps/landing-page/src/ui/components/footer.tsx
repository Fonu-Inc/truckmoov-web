import { Link } from "react-router"
import { Button } from "../shadcn/button"

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
   <section className="container mx-auto">
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
   </section>
  </footer>
 )
}
