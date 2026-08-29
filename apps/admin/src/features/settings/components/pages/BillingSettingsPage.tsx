import {
  CreditCard, DollarSign, MessageSquare, Wallet,
} from "lucide-react";
import {
  NavLink, Outlet,
} from "react-router";
import { cn } from "@/lib/utils";

const SUB_TABS = [
  {
    to: "/settings/billing", label: "Subscription", icon: DollarSign, end: true,
  },
  {
    to: "/settings/billing/communication", label: "Communication", icon: MessageSquare, end: true,
  },
  {
    to: "/settings/billing/wallet", label: "Wallet", icon: Wallet, end: true,
  },
  {
    to: "/settings/billing/configurations", label: "Configurations", icon: CreditCard, end: true,
  },
];

/**
 * Sub-tabs for `/settings/billing`. Same NavLink-as-tab pattern as
 * SubscriptionSettingsPage in apps/main — routes over query params, one
 * bar for each grouped concern.
 */
export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <nav
        aria-label="Billing sections"
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
