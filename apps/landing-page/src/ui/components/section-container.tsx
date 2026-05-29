import { cn } from "@/lib/utils";
import type { JSX, PropsWithChildren, ReactNode } from "react";

type SectionContainerProps = {
 rootClassName?: string
 containerClassName?: string;
 rootAs?: keyof JSX.IntrinsicElements;
 containerAs?: keyof JSX.IntrinsicElements;
 rootChildren?: ReactNode;
} & PropsWithChildren

export default function SectionContainer({
 rootClassName,
 containerClassName,
 rootAs: Root = "section",
 containerAs: Container = "main",
 children,
 rootChildren,
}: SectionContainerProps) {
 return (
  <Root className={cn("w-full px-4 py-2 h-auto", rootClassName)}>
   {rootChildren}
   <Container className={cn("container mx-auto py-8", containerClassName)}>
    {children}
   </Container>
  </Root>
 )
}
