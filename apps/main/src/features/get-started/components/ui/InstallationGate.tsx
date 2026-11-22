import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/shadcn/tooltip";
import {
  GET_STARTED_PATH, INSTALLATION_PENDING_HINT,
} from "@/features/get-started/utils/installationProgress";

/** Explains a control disabled while the installation is pending, with a way to Get Started. */
export function InstallationGate({
  pending, children,
}: {
  pending: boolean; children: ReactNode;
}) {
  if (!pending)
    return children;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex"
            tabIndex={0}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {INSTALLATION_PENDING_HINT}
          {" "}
          <Link
            to={GET_STARTED_PATH}
            className="text-primary underline"
          >
            Go to Get Started
          </Link>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** The same explanation as a line of text, for places a tooltip would hide it. */
export function InstallationPendingNote() {
  return (
    <p className="text-xs text-muted-foreground">
      {INSTALLATION_PENDING_HINT}
      {" "}
      <Link
        to={GET_STARTED_PATH}
        className="text-primary underline"
      >
        Go to Get Started
      </Link>
    </p>
  );
}
