import type { ElementType } from "react";
import {
  LifeBuoy, Ticket,
} from "lucide-react";

export type HelpTab = {
  to: string; label: string; icon: ElementType;
  /** Needs tenant.support.manage; other tabs need tenant.support.read. */
  requiresManage?: boolean;
};

export const HELP_TABS: HelpTab[] = [
  {
    to: "/help", label: "Tickets", icon: Ticket,
  },
  {
    to: "/help/report-issue", label: "Report Issue", icon: LifeBuoy, requiresManage: true,
  },
];
