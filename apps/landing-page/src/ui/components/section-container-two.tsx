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
   rootClassName={cn("bg-fleet-gradient", rootClassName)}
   containerClassName={containerClassName}
   rootChildren={
    <img
     src="/grid-bg.png"
     className="absolute inset-0 h-full w-full"
    />
   }
  >
   {children}
  </SectionContainer>
 )
}
