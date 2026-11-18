import { ChatCircle } from "@phosphor-icons/react";
import ContactDialog from "./contact-dialog/contact-dialog";

/** Floating "Need help? Let's talk" widget (bottom-right on every page). Opens the contact dialog. */
export default function SupportPill() {
  return (
    <ContactDialog>
      <button
        type="button"
        aria-label="Contact FleetPro support"
        className="group fixed right-4 bottom-6 z-40 flex cursor-pointer items-center gap-2 md:right-[46px]"
      >
        <span className="hidden h-[50px] w-[230px] flex-col justify-center rounded-[20px] bg-background px-[21px] text-left shadow-float md:flex">
          <span className="text-2xs leading-[10px] font-medium text-brand uppercase">
            fleet pro support
          </span>
          <span className="mt-[3px] flex items-center gap-1 text-sm leading-[14px] font-semibold text-foreground">
            Need Help? Let’s Talk.
            <span
              aria-hidden="true"
              className="text-[32px] leading-8"
            >
              👋
            </span>
          </span>
        </span>
        <span className="relative flex size-[50px] items-center justify-center rounded-full bg-brand text-ink shadow-glow transition-transform group-hover:scale-105">
          <ChatCircle
            aria-hidden="true"
            className="size-[30px]"
          />
          <span className="absolute -top-0.5 -right-0 size-2.5 rounded-full border-[1.5px] border-background bg-alert" />
        </span>
      </button>
    </ContactDialog>
  );
}
