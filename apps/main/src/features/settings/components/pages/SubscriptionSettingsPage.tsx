import {
  CreditCard, FileText,
} from "lucide-react";
import {
  NavLink, Outlet,
} from "react-router";
import { cn } from "@/lib/utils";

const SUB_TABS = [
  {
    to: "/settings/subscription", label: "Plan", icon: CreditCard, end: true,
  },
  {
    to: "/settings/subscription/invoices", label: "Invoices", icon: FileText, end: true,
  },
];

/**
 * Sub-tabs for the Subscription section: Plan (index) and Invoices. Same
 * NavLink-as-tab pattern as SettingsLayout so both bars look and behave the
 * same. The parent /settings layout still renders the outer tab bar; this one
 * sits inside its Outlet.
 */
export default function SubscriptionSettingsPage() {
  return (
    <div className="space-y-6">
      <nav
        aria-label="Subscription sections"
        className="bg-muted/50 text-muted-foreground flex flex-wrap gap-1 h-auto rounded-md p-1"
      >
        {SUB_TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150",
              "hover:text-foreground/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
