import {
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { DialogTrigger } from "@/shared/components/DialogTrigger";
import { MegaMenu } from "@/shared/components/layout/MegaMenu";
import { MobileMenu } from "@/shared/components/layout/MobileMenu";
import { Logo } from "@/shared/components/Logo";
import { buttonVariants } from "@/shared/components/shadcn/button-variants";
import {
  appLinks,
  SIGN_IN_URL,
} from "@/shared/utils/routes";

/**
 * Fixed 80px top bar. A Server Component: the desktop mega menus open on hover / keyboard
 * focus with CSS only (no state, no re-renders); only the mobile menu toggle is a client island.
 */
export async function SiteHeader() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background shadow-nav">
      <div className="page-container flex h-20 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="Go to home"
          className="shrink-0"
        >
          <Logo
            priority
            className="h-14 w-auto lg:h-[77px] lg:w-[210px]"
          />
        </Link>

        {/* Centred without a transform, so the fixed menu panels position against the viewport. */}
        <ul className="hidden items-center gap-[30px] lg:absolute lg:inset-x-0 lg:mx-auto lg:flex lg:w-fit">
          {appLinks.map(group => (
            <li
              key={group.title}
              className="group/nav"
            >
              <Link
                href={group.sections[0].links[0].href}
                className="flex h-20 items-center gap-[5px] text-sm leading-[14px] font-medium text-foreground focus-visible:outline-none"
              >
                {group.title}
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 transition-transform duration-200 group-focus-within/nav:rotate-180 group-hover/nav:rotate-180"
                />
              </Link>
              <div className="pointer-events-none invisible fixed inset-x-0 top-20 border-y border-border-faint bg-background opacity-0 shadow-nav transition-opacity duration-150 group-focus-within/nav:pointer-events-auto group-focus-within/nav:visible group-focus-within/nav:opacity-100 group-hover/nav:pointer-events-auto group-hover/nav:visible group-hover/nav:opacity-100">
                <MegaMenu group={group} />
              </div>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2.5 lg:flex min-[1440px]:-mr-[15px]">
          <a
            href={SIGN_IN_URL}
            className={buttonVariants({
              variant: "pill",
              size: "pill",
              className: "px-[24px]",
            })}
          >
            Sign In
          </a>
          <DialogTrigger
            dialog="contact"
            className={buttonVariants({
              variant: "brand",
              size: "pill",
              className: "px-[26px] shadow-none",
            })}
          >
            Contact Us
            <ArrowRight />
          </DialogTrigger>
        </div>

        <MobileMenu />
      </div>
    </nav>
  );
}
