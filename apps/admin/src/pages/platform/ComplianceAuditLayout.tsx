import {
  NavLink, Outlet,
} from "react-router";
import { cn } from "@/lib/utils";

const AUDIT_TABS = [
  {
    to: "/compliance-audit", label: "Activity log",
  },
  {
    to: "/compliance-audit/sign-ins", label: "Sign-ins",
  },
];

export function ComplianceAuditLayout() {
  return (
    <div className="space-y-6">
      <nav
        aria-label="Audit sections"
        className="bg-secondary/60 text-muted-foreground flex h-auto w-full gap-1 overflow-x-auto rounded-md p-1 md:flex-wrap md:justify-center md:overflow-visible"
      >
        {AUDIT_TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) => cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150",
              "hover:text-foreground/80",
              isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
            )}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
