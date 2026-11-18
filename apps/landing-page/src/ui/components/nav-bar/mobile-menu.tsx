import { ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { appLinks } from "@/lib/app-links";
import { Button } from "../../shadcn/button";
import ContactDialog from "../contact-dialog/contact-dialog";

type MobileMenuProps = {
  signInUrl: string;
  onNavigate: () => void;
};

/** Collapsible link list shown under the nav bar below the `lg` breakpoint. */
export default function MobileMenu({
  signInUrl,
  onNavigate,
}: MobileMenuProps) {
  return (
    <div className="absolute inset-x-0 top-full max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-border bg-background shadow-nav lg:hidden">
      <div className="page-container flex flex-col py-4">
        {appLinks.map(group => (
          <details
            key={group.title}
            className="group border-b border-border-faint"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-medium">
              {group.title}
              <ChevronDown
                aria-hidden="true"
                className="size-4 transition-transform group-open:rotate-180"
              />
            </summary>
            <ul className="flex flex-col gap-3 pb-4">
              {group.sections.flatMap(section => section.links).map(link => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    onClick={onNavigate}
                    className="text-sm text-foreground-soft"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ))}
        <div className="flex gap-2.5 pt-4">
          <Button
            asChild
            variant="pill"
            size="pill"
            className="flex-1"
          >
            <a href={signInUrl}>Sign In</a>
          </Button>
          <ContactDialog>
            <Button
              variant="brand"
              size="pill"
              className="flex-1"
            >
              Contact Us
            </Button>
          </ContactDialog>
        </div>
      </div>
    </div>
  );
}
