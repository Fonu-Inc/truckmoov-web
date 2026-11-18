import {
  ChatCircle,
  QuestionMark,
} from "@phosphor-icons/react/dist/ssr";
import { DialogTrigger } from "@/shared/components/DialogTrigger";

/**
 * Floating "Need help? Let's talk" widget (bottom-right on every page; Figma "Group 469375",
 * 288x50: a 230x50 pill + a 50px yellow chat button). Opens the contact dialog.
 */
export function SupportPill() {
  return (
    <DialogTrigger
      dialog="contact"
      aria-label="Contact FleetPro support"
      className="group fixed right-4 bottom-6 z-40 flex h-[50px] cursor-pointer items-center gap-2 text-left md:right-[46px]"
    >
      <span className="relative hidden h-[50px] w-[230px] rounded-[20px] bg-background shadow-float md:block">
        <span className="absolute top-[9px] left-[21px] text-2xs leading-[10px] font-medium whitespace-nowrap text-brand uppercase">
          fleet pro support
        </span>
        <span className="absolute top-[24px] left-[21px] text-sm leading-[14px] font-semibold whitespace-nowrap text-foreground">
          Need Help? Let’s Talk.
        </span>
        <span
          aria-hidden="true"
          className="absolute top-[11px] left-[172px] text-[32px] leading-[31px]"
        >
          👋
        </span>
      </span>
      <span className="relative flex size-[50px] shrink-0 items-center justify-center rounded-full bg-brand shadow-glow transition-transform group-hover:scale-105">
        <ChatCircle
          aria-hidden="true"
          weight="fill"
          className="size-[30px] text-foreground"
        />
        <QuestionMark
          aria-hidden="true"
          weight="bold"
          className="absolute size-[14px] text-brand"
        />
        <span className="absolute top-0.5 right-0 size-2.5 rounded-full border-[1.5px] border-background bg-alert" />
      </span>
    </DialogTrigger>
  );
}
