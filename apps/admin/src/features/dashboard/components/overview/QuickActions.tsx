import type { LucideIcon } from "lucide-react";
import {
  Building2, ChevronRight, Cpu, ShieldCheck, Smartphone,
} from "lucide-react";
import { Link } from "react-router";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";

type QuickAction = {
  title: string;
  desc: string;
  icon: LucideIcon;
  cta: string;
  to: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Manage Tenants",
    desc: "Onboard, edit and review tenant organisations.",
    icon: Building2,
    cta: "Open tenants",
    to: "/tenants",
  },
  {
    title: "IoT Devices",
    desc: "Track inventory, lifecycle and connectivity.",
    icon: Cpu,
    cta: "Open devices",
    to: "/devices",
  },
  {
    title: "SIM Management",
    desc: "Approve, activate and assign SIMs.",
    icon: Smartphone,
    cta: "Open SIMs",
    to: "/sims",
  },
  {
    title: "Audit & Compliance",
    desc: "Review security events, SIM activity and the audit trail.",
    icon: ShieldCheck,
    cta: "Open audit log",
    to: "/audit-compliance",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
        <CardDescription>Jump into common platform workflows</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-2 -mb-2 snap-x snap-mandatory [scrollbar-width:thin]">
          {QUICK_ACTIONS.map(action => (
            <Link
              key={action.title}
              to={action.to}
              className="group text-left rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/30 shrink-0 w-[260px] snap-start"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{action.desc}</p>
                  <span className="text-xs text-primary mt-2 inline-flex items-center gap-1 group-hover:underline">
                    {action.cta}
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
