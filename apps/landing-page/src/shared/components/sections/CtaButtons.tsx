import { ArrowRight } from "lucide-react";
import { DialogTrigger } from "@/shared/components/DialogTrigger";
import { buttonVariants } from "@/shared/components/shadcn/button-variants";
import { cn } from "@/shared/utils";

type CtaButtonsProps = { className?: string };

/** "Apply for Account Creation" + "Apply as Returning Customer" pair used in heroes and the CTA band. */
export function CtaButtons({ className }: CtaButtonsProps) {
  return (
    <div className={cn(
      "flex flex-wrap items-center gap-5",
      className,
    )}
    >
      <DialogTrigger
        dialog="get-started"
        className={buttonVariants({
          variant: "brand",
          size: "pill",
          className: "px-[30px]",
        })}
      >
        Apply for Account Creation
        <ArrowRight />
      </DialogTrigger>
      <DialogTrigger
        dialog="get-started"
        intent="returning"
        className={buttonVariants({
          variant: "onDark",
          size: "pill",
          className: "px-[19px]",
        })}
      >
        Apply as Returning Customer
        <ArrowRight />
      </DialogTrigger>
    </div>
  );
}
