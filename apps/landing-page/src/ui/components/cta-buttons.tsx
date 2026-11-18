import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../shadcn/button";
import GetStartedDialog from "./get-started/get-started-dialog";

type CtaButtonsProps = { className?: string };

/** "Apply for Account Creation" + "Apply as Returning Customer" pair used in heroes and the CTA band. */
export default function CtaButtons({ className }: CtaButtonsProps) {
  return (
    <div className={cn(
      "flex flex-wrap items-center gap-5",
      className,
    )}
    >
      <GetStartedDialog>
        <Button
          variant="brand"
          size="pill"
          className="px-[30px]"
        >
          Apply for Account Creation
          <ArrowRight />
        </Button>
      </GetStartedDialog>
      <GetStartedDialog>
        <Button
          variant="onDark"
          size="pill"
          className="px-[19px]"
        >
          Apply as Returning Customer
          <ArrowRight />
        </Button>
      </GetStartedDialog>
    </div>
  );
}
