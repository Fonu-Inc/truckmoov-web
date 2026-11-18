import { cacheLife } from "next/cache";
import Link from "next/link";
import { GmailIcon } from "@/shared/components/icons/GmailIcon";
import { InstagramIcon } from "@/shared/components/icons/InstagramIcon";
import { LinkedinIcon } from "@/shared/components/icons/LinkedinIcon";
import { XIcon } from "@/shared/components/icons/XIcon";
import { Logo } from "@/shared/components/Logo";
import {
  footerColumns,
  legalLinks,
} from "@/shared/utils/routes";

const SOCIALS = [
  {
    label: "LinkedIn",
    href: "#",
    icon: LinkedinIcon,
  },
  {
    label: "Instagram",
    href: "#",
    icon: InstagramIcon,
  },
  {
    label: "X",
    href: "#",
    icon: XIcon,
  },
  {
    label: "Email",
    href: "#",
    icon: GmailIcon,
  },
];

export async function SiteFooter() {
  "use cache";
  cacheLife("max");

  return (
    <footer className="relative rounded-t-[50px] bg-background pt-[60px] pb-[78px]">
      <div className="mx-auto w-full max-w-[1324px] px-4">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-[120px]">
          <div className="flex w-full max-w-[288px] flex-col gap-2.5">
            <Logo />
            <p className="text-xs leading-[16.8px] text-muted-foreground">
              AI-powered logistics intelligence for modern, multi-tenant fleet operations.
            </p>
            <div className="flex items-center gap-[13px]">
              {SOCIALS.map(({
                label,
                href,
                icon: Icon,
              }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4 lg:flex lg:gap-5">
            {footerColumns.map(column => (
              <div
                key={column.title}
                className="flex flex-col gap-2.5 lg:w-[177px]"
              >
                <h2 className="h-[29px] text-base leading-[19.5px] font-bold text-foreground uppercase">
                  {column.title}
                </h2>
                <ul className="flex flex-col gap-[5px]">
                  {column.links.map(link => (
                    <li key={link.title}>
                      <Link
                        href={link.href}
                        className="block h-[29px] text-sm leading-[17.1px] text-foreground capitalize hover:text-brand-deep"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-[57px] flex flex-col gap-3 border-t border-border/50 pt-5 sm:flex-row sm:items-center sm:justify-between lg:mr-[-2px]">
          <p className="h-[29px] text-sm leading-[17.1px] text-foreground">
            © 2026 FleetPro Enterprise. All Rights Reserved.
          </p>
          <ul className="flex items-center gap-5">
            {legalLinks.map(link => (
              <li key={link.title}>
                <Link
                  href={link.href}
                  className="block h-[29px] text-sm leading-[17.1px] text-foreground capitalize underline underline-offset-2 hover:text-brand-deep"
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
