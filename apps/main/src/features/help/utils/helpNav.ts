import type { ElementType } from "react";
import {
  LifeBuoy, Ticket,
} from "lucide-react";

export type HelpTab = {
  to: string; label: string; icon: ElementType;
};

export const HELP_TABS: HelpTab[] = [
  {
    to: "/help", label: "Tickets", icon: Ticket,
  },
  {
    to: "/help/report-issue", label: "Report Issue", icon: LifeBuoy,
  },
];
