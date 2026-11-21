import type { LucideIcon } from "lucide-react";
import {
  ChevronRight, Cpu, MapPin, Package, Truck, Users,
} from "lucide-react";
import { Link } from "react-router";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";

type QuickAction = {
  title: string;
  description: string;
  linkLabel: string;
  href: string;
  icon: LucideIcon;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Manage Jobs", description: "Create, dispatch and track jobs.", linkLabel: "Open jobs", href: "/jobs", icon: Package,
  },
  {
    title: "My Vehicles", description: "View vehicles, fleets, trips and maintenance.", linkLabel: "Open vehicles", href: "/fleet", icon: Truck,
  },
  {
    title: "My Drivers", description: "Manage drivers, groups and violations.", linkLabel: "Open drivers", href: "/drivers", icon: Users,
  },
  {
    title: "My Devices", description: "Track devices and request new hardware.", linkLabel: "Open devices", href: "/devices", icon: Cpu,
  },
  {
    title: "Live Tracking", description: "See where your vehicles are right now.", linkLabel: "Open map", href: "/map", icon: MapPin,
  },
];

export function QuickActionsCard() {
  return (
    <Card className="rounded-2xl surface-sleek">
      <CardHeader className="space-y-1.5 p-6 pb-3">
        <CardTitle className="font-display text-base">Quick Actions</CardTitle>
        <CardDescription>Jump into common workflows</CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex gap-3 overflow-x-auto pb-2 -mb-2 snap-x snap-mandatory [scrollbar-width:thin]">
          {QUICK_ACTIONS.map(action => (
            <Link
              key={action.href}
              to={action.href}
              className="group text-left rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/30 shrink-0 w-[260px] snap-start"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{action.description}</p>
                  <span className="text-xs text-primary mt-2 inline-flex items-center gap-1 group-hover:underline">
                    {action.linkLabel}
                    {" "}
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
