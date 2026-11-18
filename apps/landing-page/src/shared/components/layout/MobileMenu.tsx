"use client";

import {
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DialogTrigger } from "@/shared/components/DialogTrigger";
import { Button } from "@/shared/components/shadcn/button";
import { buttonVariants } from "@/shared/components/shadcn/button-variants";
import {
  appLinks,
  SIGN_IN_URL,
} from "@/shared/utils/routes";

/**
 * Hamburger + slide-down link list below the `lg` breakpoint. The only stateful part of the
 * header; it closes itself on navigation.
 */
export function MobileMenu() {
  const [
    open,
    setOpen,
  ] = useState(false);
  const pathname = usePathname();
  const [
    openedOn,
    setOpenedOn,
  ] = useState(pathname);

  // Close on navigation without an effect: adjust state while rendering (no extra render pass).
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    if (open)
      setOpen(false);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        {open ? <X /> : <Menu />}
      </Button>

      {open && (
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
                        href={link.href}
                        onClick={() => setOpen(false)}
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
                <a href={SIGN_IN_URL}>Sign In</a>
              </Button>
              <DialogTrigger
                dialog="contact"
                onClick={() => setOpen(false)}
                className={buttonVariants({
                  variant: "brand",
                  size: "pill",
                  className: "flex-1",
                })}
              >
                Contact Us
              </DialogTrigger>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
