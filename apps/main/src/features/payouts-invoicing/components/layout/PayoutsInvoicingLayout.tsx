import {
  NavLink, Outlet,
} from "react-router";
import { useAuthStore } from "@/features/auth/stores/authStore";
import {
  canSeeTab, PAYOUTS_INVOICING_TABS,
} from "@/features/payouts-invoicing/utils/payoutsInvoicingNav";
import { cn } from "@/lib/utils";

/**
 * Payouts & invoicing shell, mounted as a pathful layout route at
 * `/waybill-invoices` (see `shared/lib/route.tsx`). The tab bar stays put while
 * each tab's chunk loads into the `Outlet`. Tab pages render only their own
 * content. Modelled on `SettingsLayout`.
 */
export function PayoutsInvoicingLayout() {
  const role = useAuthStore(s => s.user?.role);
  const visibleTabs = PAYOUTS_INVOICING_TABS.filter(tab => canSeeTab(
    tab,
    role,
  ));

  return (
    <div className="space-y-6 p-6">
      {visibleTabs.length > 1 && (
        <nav
          aria-label="Payouts and invoicing sections"
          className="bg-muted/50 text-muted-foreground flex flex-wrap gap-1 h-auto rounded-md p-1 justify-center"
        >
          {visibleTabs.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
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
      )}

      <Outlet />
    </div>
  );
}
