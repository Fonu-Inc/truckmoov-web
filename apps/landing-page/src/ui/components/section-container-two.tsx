import type { PropsWithChildren } from "react";
import SectionContainer from "./section-container";
import { cn } from "@/lib/utils";

type SectionContainerTwoProps = {
 rootClassName?: string;
 containerClassName?: string;
} & PropsWithChildren

export default function SectionContainerTwo({
 children,
 containerClassName,
 rootClassName
}: SectionContainerTwoProps) {
 return (
  <SectionContainer
   rootClassName={cn("bg-fleet-gradient relative", rootClassName)}
   containerClassName={containerClassName}
   rootChildren={
    <img
     src="/grid-bg.png"
     className="absolute h-full w-full top-0 left-0"
    />
   }
  >
   {children}
  </SectionContainer>
 )
}
