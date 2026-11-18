import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

type ExploreLinkProps = {
  to: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
};

/** Yellow "Explore more →" link used at the bottom of cards. */
export default function ExploreLink({
  to,
  label = "Explore more",
  size = "md",
  className,
}: ExploreLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-1 text-brand hover:underline after:absolute after:inset-0",
        size === "md" ? "text-sm leading-[21px]" : "text-2xs",
        className,
      )}
    >
      {label}
      <ArrowRight
        aria-hidden="true"
        className="size-[9px]"
        strokeWidth={2.5}
      />
    </Link>
  );
}
