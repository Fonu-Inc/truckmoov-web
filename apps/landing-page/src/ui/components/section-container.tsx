import type {
  JSX,
  PropsWithChildren,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type SectionContainerProps = {
  rootClassName?: string;
  containerClassName?: string;
  rootAs?: keyof JSX.IntrinsicElements;
  containerAs?: keyof JSX.IntrinsicElements;
  /** Rendered inside the root but outside the centred container (backgrounds, decorations). */
  rootChildren?: ReactNode;
  id?: string;
} & PropsWithChildren;

/**
 * Full-width band with a centred 1200px content column (`page-container`).
 * Every page section is built on this.
 */
export default function SectionContainer({
  rootClassName,
  containerClassName,
  rootAs: Root = "section",
  containerAs: Container = "div",
  children,
  rootChildren,
  id,
}: SectionContainerProps) {
  return (
    <Root
      id={id}
      className={cn(
        "relative w-full",
        rootClassName,
      )}
    >
      {rootChildren}
      <Container className={cn(
        "page-container relative",
        containerClassName,
      )}
      >
        {children}
      </Container>
    </Root>
  );
}
