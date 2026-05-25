import Link from "next/link";
import Logo from "./logo";

const NAVLINKS = [
 {
  label: "Stakeholders",
  href: "/#stakeholders",
 },
 {
  label: "Products",
  href: "/#products",
 },
 {
  label: "Solutions",
  href: "/#solutions",
 },
 {
  label: "About Us",
  href: "/#about-us",
 },
 {
  label: "Resources",
  href: "/#resources",
 },
];

export default function NavBar() {
 return (
  <nav className="w-full px-4 py-2">
   <section className="container mx-auto flex items-center justify-between gap-2">
    <Logo />
    <ul className="flex items-center gap-10">
     {NAVLINKS.map((navLink) => (
      <li key={navLink.href}>
       <Link
        href={navLink.href}
        className="flex items-center gap-2 text-sm font-medium "
       >
        <span>{navLink.label}</span>
       </Link>
      </li>
     ))}
    </ul>
   </section>
  </nav>
 );
}
