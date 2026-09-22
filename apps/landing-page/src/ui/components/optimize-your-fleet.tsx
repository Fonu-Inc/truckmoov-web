import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "../shadcn/button";
import GetStartedDialog from "./get-started/get-started-dialog";
import SectionContainerTwo from "./section-container-two";

export default function OptimizeYourFleet() {
  return (
    <SectionContainerTwo
      rootClassName="relative flex h-[400px] flex-col"
      containerClassName="grid flex-1 lg:grid-cols-2 grid-cols-1 gap-2 items-center  justify-center text-background"
    >
      <section className="space-y-8">
        <h1 className="text-background font-bold text-6xl w-full max-w-137.5">
          Ready to Optimize your fleet management?
        </h1>
        <div className="flex items-center gap-4">
          <GetStartedDialog>
            <Button>
              Get Started
              <ArrowRight />
            </Button>
          </GetStartedDialog>
          <Button
            asChild
            variant="outline"
          >
            <Link to="#">
              Contact us
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
      <section className="relative hidden flex-1 h-full lg:block">
        <img
          src="/truck-image.png"
          className="absolute w-full max-w-210 -top-50 h-155"
        />
      </section>
    </SectionContainerTwo>
  );
}
