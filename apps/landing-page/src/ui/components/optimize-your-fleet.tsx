import { Link } from "react-router";
import { Button } from "../shadcn/button";
import { ArrowRight } from "lucide-react";
import SectionContainerTwo from "./section-container-two";

export default function OptimizeYourFleet() {

 return (
  <SectionContainerTwo
   rootClassName="relative flex h-[400px] flex-col"
   containerClassName="grid flex-1 lg:grid-cols-2 grid-cols-1 gap-2 items-center  justify-center text-background"
  >
   <section className="space-y-8">
    <h1 className="text-background font-bold text-6xl w-full max-w-[550px]">
     Ready to Optimize your fleet management?
    </h1>
    <div className="flex items-center gap-4">
     <Button asChild>
      <Link to={"#"}>
       Get Started
       <ArrowRight />
      </Link>
     </Button>
     <Button asChild variant={"outline"}>
      <Link to={"#"}>
       Contact us
       <ArrowRight />
      </Link>
     </Button>
    </div>
   </section>
   <section className="relative hidden flex-1 h-full lg:block">
    <img
     src="/truck-image.png"
     className="absolute w-full max-w-[840px] -top-50 h-[620px]"
    />
   </section>
  </SectionContainerTwo>
 )
}
