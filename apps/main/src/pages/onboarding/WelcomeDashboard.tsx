import { useNavigate } from "react-router-dom";
import { Button } from "@/components/shadcn/button";
import {
  ArrowRight,
  Truck,
  Users,
  Map,
  Settings as SettingsIcon,
  Info,
  Cpu,
  Smartphone,
  Wrench,
  Package,
  Receipt,
  BarChart3,
  Code2,
  MapPinned,
  FileText,
  CreditCard,
  Gauge,
  Bell,
  Telescope,
  Wifi,
} from "lucide-react";
import { OnboardingLayout } from "./OnboardingLayout";
import { useAuthStore } from "@/stores/authStore";
import { getSidebarConfig } from "@/lib/sidebarConfig";
import type { AuthUser } from "@truckmoov/api/auth";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: typeof Truck;
  to: string;
}

const FLEET_ADMIN_ACTIONS: QuickAction[] = [
  { id: "add-vehicle", title: "Add a vehicle", description: "Register vehicles you'll be managing.", icon: Truck, to: "/admin/fleet" },
  { id: "add-driver", title: "Add a driver", description: "Invite drivers to receive job offers.", icon: Users, to: "/admin/drivers" },
  { id: "request-sim", title: "Request a SIM", description: "Order MTN SIMs for your IoT devices.", icon: Smartphone, to: "/admin/sims" },
  { id: "request-device", title: "Request a device", description: "Order IoT trackers from the platform.", icon: Cpu, to: "/admin/devices" },
  { id: "live-map", title: "Live Map & Zones", description: "Track vehicles and manage zones in real-time.", icon: MapPinned, to: "/admin/map" },
  { id: "payouts", title: "Payouts & Invoicing", description: "View waybills and manage invoices.", icon: Receipt, to: "/admin/waybill-invoices" },
  { id: "installation", title: "Schedule installation", description: "Coordinate device installation for vehicles.", icon: Wrench, to: "/admin/installation" },
  { id: "settings", title: "Organization Settings", description: "Set timezone, currency and notification rules.", icon: SettingsIcon, to: "/admin/settings" },
];

const ENTERPRISE_ADMIN_ACTIONS: QuickAction[] = [
  { id: "shipments", title: "Shipments", description: "View and manage all active shipments.", icon: Package, to: "/admin/jobs" },
  { id: "fleet", title: "Fleet Providers", description: "Manage your network of fleet providers.", icon: Truck, to: "/admin/fleet" },
  { id: "devices", title: "Devices", description: "Monitor IoT devices across your fleet.", icon: Cpu, to: "/admin/devices" },
  { id: "live-map", title: "Live Tracking", description: "Track shipments and vehicles in real-time.", icon: Map, to: "/admin/map" },
  { id: "reports", title: "Reports", description: "View logistics performance reports.", icon: BarChart3, to: "/admin/reports" },
  { id: "integrations", title: "Integrations", description: "Connect third-party tools and APIs.", icon: Code2, to: "/admin/integrations" },
  { id: "settings", title: "Organization Settings", description: "Configure your enterprise preferences.", icon: SettingsIcon, to: "/admin/settings" },
];

const AGGREGATOR_ADMIN_ACTIONS: QuickAction[] = [
  { id: "jobs", title: "Job Coordination", description: "Coordinate jobs across your network.", icon: Package, to: "/admin/jobs" },
  { id: "members", title: "Network Members", description: "Manage drivers and operators in your network.", icon: Users, to: "/admin/drivers" },
  { id: "fleet", title: "Network Fleet", description: "View and manage fleet across the network.", icon: Truck, to: "/admin/fleet" },
  { id: "payouts", title: "Payouts & Invoicing", description: "Handle waybills and network invoicing.", icon: Receipt, to: "/admin/waybill-invoices" },
  { id: "zones", title: "Zones", description: "Define and manage operational zones.", icon: MapPinned, to: "/admin/map" },
  { id: "reports", title: "Reports", description: "Analyse network performance.", icon: BarChart3, to: "/admin/reports" },
  { id: "settings", title: "Organization Settings", description: "Configure aggregator preferences.", icon: SettingsIcon, to: "/admin/settings" },
];

const OWNER_OPERATOR_ACTIONS: QuickAction[] = [
  { id: "my-jobs", title: "My Jobs", description: "View your current and past jobs.", icon: Package, to: "/owner-operator/jobs" },
  { id: "job-offers", title: "Job Offers", description: "Browse and accept available job offers.", icon: Bell, to: "/admin/job-offers" },
  { id: "vehicles", title: "My Vehicles", description: "Manage the vehicles you own.", icon: Truck, to: "/owner-operator/vehicles" },
  { id: "devices", title: "Devices", description: "Manage IoT devices on your vehicles.", icon: Cpu, to: "/admin/devices" },
  { id: "payouts", title: "Payouts & Invoicing", description: "Track your earnings and invoices.", icon: Receipt, to: "/admin/waybill-invoices" },
  { id: "documents", title: "Documents", description: "Upload and manage your compliance documents.", icon: FileText, to: "/owner-operator/documents" },
  { id: "profile", title: "Profile", description: "Update your personal and business details.", icon: Users, to: "/admin/settings" },
];

const OPERATIONS_MANAGER_ACTIONS: QuickAction[] = [
  { id: "fleet", title: "Fleet", description: "View and manage the vehicle fleet.", icon: Truck, to: "/admin/fleet" },
  { id: "live-map", title: "Live Map", description: "Track vehicles in real-time.", icon: Map, to: "/admin/map" },
  { id: "drivers", title: "Drivers", description: "Manage drivers and their assignments.", icon: Users, to: "/admin/drivers" },
  { id: "jobs", title: "Jobs", description: "View and manage active jobs.", icon: Package, to: "/admin/jobs" },
  { id: "installation", title: "Installation", description: "Coordinate device installation for vehicles.", icon: Wrench, to: "/admin/installation" },
  { id: "analytics", title: "Analytics", description: "Review fleet performance analytics.", icon: BarChart3, to: "/admin/analytics" },
  { id: "devices", title: "Devices", description: "Monitor IoT device status.", icon: Cpu, to: "/admin/devices" },
];

const DISPATCHER_ACTIONS: QuickAction[] = [
  { id: "dispatch", title: "Dispatch", description: "Assign and dispatch loads to drivers.", icon: Telescope, to: "/dispatcher/dispatch" },
  { id: "live-map", title: "Live Map", description: "Track vehicles in real-time.", icon: Map, to: "/dispatcher/map" },
  { id: "drivers", title: "Drivers", description: "View driver status and availability.", icon: Users, to: "/dispatcher/drivers" },
  { id: "devices", title: "Devices", description: "Monitor IoT devices.", icon: Cpu, to: "/dispatcher/devices" },
  { id: "sims", title: "SIM Cards", description: "Manage SIM cards for devices.", icon: Wifi, to: "/dispatcher/sims" },
  { id: "alerts", title: "Alerts", description: "Review and respond to active alerts.", icon: Bell, to: "/dispatcher/alerts" },
  { id: "reports", title: "Reports", description: "View dispatch and operational reports.", icon: BarChart3, to: "/dispatcher/reports" },
];

const FINANCE_VIEWER_ACTIONS: QuickAction[] = [
  { id: "fleet", title: "Fleet", description: "View fleet assets and status.", icon: Truck, to: "/admin/fleet" },
  { id: "devices", title: "Devices", description: "Monitor IoT devices and their costs.", icon: Cpu, to: "/admin/devices" },
  { id: "fuel", title: "Fuel Costs", description: "Track and analyse fuel expenses.", icon: Gauge, to: "/admin/fuel" },
  { id: "maintenance", title: "Maintenance", description: "View scheduled and completed maintenance.", icon: Wrench, to: "/admin/fleet?tab=maintenance" },
  { id: "analytics", title: "Analytics", description: "Review financial and operational analytics.", icon: BarChart3, to: "/admin/analytics" },
  { id: "wallet", title: "Wallet & Billing", description: "Manage wallet balance and billing details.", icon: CreditCard, to: "/admin/wallet" },
];

function getActionsFor(role: AuthUser["role"] | undefined): QuickAction[] {
  switch (role) {
    case "FLEET_ADMIN":       return FLEET_ADMIN_ACTIONS;
    case "ENTERPRISE_ADMIN":  return ENTERPRISE_ADMIN_ACTIONS;
    case "AGGREGATOR_ADMIN":  return AGGREGATOR_ADMIN_ACTIONS;
    case "OWNER_OPERATOR":    return OWNER_OPERATOR_ACTIONS;
    case "OPERATIONS_MANAGER": return OPERATIONS_MANAGER_ACTIONS;
    case "DISPATCHER":        return DISPATCHER_ACTIONS;
    case "FINANCE_VIEWER":    return FINANCE_VIEWER_ACTIONS;
    default:                  return FLEET_ADMIN_ACTIONS;
  }
}

export default function WelcomeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const actions = getActionsFor(user?.role);

  const goToDashboard = () => {
    const config = getSidebarConfig(user ?? null);
    navigate(config?.homeRoute ?? "/admin");
  };

  return (
    <OnboardingLayout
      step={4}
      title={`Welcome Aboard${user?.name ? `, ${user.name.split(" ")[0]}` : ""} 🎉`}
      subtitle="Jump straight to what matters most. These shortcuts are tailored to your role — you can always reach them from the sidebar later."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                navigate(a.to);
              }}
              className="group flex items-start gap-3 rounded-xl border border-border bg-background/40 p-4 text-left transition-all hover:border-primary/60 hover:bg-accent/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{a.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 border-t border-border/60 pt-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 text-primary" />
          You can revisit any of these from the sidebar at any time.
        </div>
        <Button onClick={goToDashboard} size="lg" className="min-w-[200px]">
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </OnboardingLayout>
  );
}
