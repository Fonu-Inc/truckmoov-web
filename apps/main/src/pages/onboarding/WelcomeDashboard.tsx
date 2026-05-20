import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  ClipboardList,
} from "lucide-react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { OnboardingLayout } from "./OnboardingLayout";
import { useAuthStore, readDemoStakeholder } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve the correct dashboard route for the current user based on their
 * stakeholder/tenant type and legacy role. Mirrors AuthPage.resolvePostLoginRoute.
 */
async function resolveDashboardRoute(
  userId: string | undefined,
  legacyRole: string | undefined,
): Promise<string> {
  if (legacyRole === "platform_admin") return "/platform";

  // Demo stakeholder selection (Quick Demo Access) — use immediately.
  const demoStakeholder = readDemoStakeholder();
  if (demoStakeholder === "ENTERPRISE") return "/enterprise";
  if (demoStakeholder === "AGGREGATOR") return "/aggregator";
  if (demoStakeholder === "OWNER_OPERATOR") return "/owner-operator";

  if (userId) {
    try {
      const { data: memberships } = await supabase
        .from("user_org_memberships")
        .select("organizations!user_org_memberships_org_id_fkey(organization_type)")
        .eq("user_id", userId)
        .eq("membership_status", "active");

      if (memberships && memberships.length > 0) {
        const orgTypes = memberships.map(
          (m: any) => m.organizations?.organization_type,
        );
        if (orgTypes.includes("ENTERPRISE")) return "/enterprise";
        if (orgTypes.includes("AGGREGATOR")) return "/aggregator";
        if (orgTypes.includes("OWNER_OPERATOR")) return "/owner-operator";
      }
    } catch (err) {
      console.warn("Failed to resolve dashboard route from memberships:", err);
    }
  }

  switch (legacyRole) {
    case "supervisor":
    case "dispatcher":
      return "/supervisor";
    case "viewer_finance":
      return "/admin/fleet?tab=analytics";
    case "installer":
      return "/admin/installation";
    case "driver":
      return "/driver";
    case "tenant_admin":
    case "operations_manager":
    default:
      return "/admin";
  }
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: typeof Truck;
  to: string;
}

const ENTERPRISE_ACTIONS: QuickAction[] = [
  { id: "create-fleet", title: "Create a fleet", description: "Spin up a fleet and assign managers to run it.", icon: Truck, to: "/enterprise" },
  { id: "add-vehicle", title: "Add a vehicle", description: "Register vehicles across your fleets.", icon: Truck, to: "/admin/fleet" },
  { id: "add-driver", title: "Add a driver", description: "Invite drivers and assign them to vehicles.", icon: Users, to: "/admin/drivers" },
  { id: "request-sim", title: "Request a SIM", description: "Order MTN SIMs for your IoT devices.", icon: Smartphone, to: "/admin/sims" },
  { id: "request-device", title: "Request a device", description: "Order IoT trackers from the platform.", icon: Cpu, to: "/admin/devices" },
  { id: "live-map", title: "Open Live Map", description: "Track all vehicles in real-time.", icon: Map, to: "/admin/map" },
];

const FLEET_PROVIDER_ACTIONS: QuickAction[] = [
  { id: "add-vehicle", title: "Add a vehicle", description: "Register vehicles you'll be managing.", icon: Truck, to: "/admin/fleet" },
  { id: "add-driver", title: "Add a driver", description: "Invite drivers to receive job offers.", icon: Users, to: "/admin/drivers" },
  { id: "request-sim", title: "Request a SIM", description: "Order MTN SIMs for your IoT devices.", icon: Smartphone, to: "/admin/sims" },
  { id: "request-device", title: "Request a device", description: "Order IoT trackers from the platform.", icon: Cpu, to: "/admin/devices" },
  { id: "invite-dispatchers", title: "Invite dispatchers", description: "Bring your dispatch team on board.", icon: Users, to: "/admin/users" },
  { id: "live-map", title: "Open Live Map", description: "Track vehicles in real-time.", icon: Map, to: "/admin/map" },
  { id: "maintenance", title: "Schedule maintenance", description: "Set service intervals to keep vehicles road-worthy.", icon: Wrench, to: "/admin/maintenance" },
  { id: "settings", title: "Configure preferences", description: "Set timezone, currency and notification rules.", icon: SettingsIcon, to: "/admin/settings" },
];

const AGGREGATOR_ACTIONS: QuickAction[] = [
  { id: "add-members", title: "Add network members", description: "Onboard partner fleets into your network.", icon: Users, to: "/aggregator" },
  { id: "set-zones", title: "Set service zones", description: "Define where your network operates.", icon: Map, to: "/aggregator" },
  { id: "request-sim", title: "Request a SIM", description: "Order MTN SIMs for partner devices.", icon: Smartphone, to: "/admin/sims" },
  { id: "request-device", title: "Request a device", description: "Order IoT trackers for partners.", icon: Cpu, to: "/admin/devices" },
  { id: "settings", title: "Configure preferences", description: "Set timezone, currency and notification rules.", icon: SettingsIcon, to: "/admin/settings" },
];

const OWNER_OPERATOR_ACTIONS: QuickAction[] = [
  { id: "add-vehicle", title: "Add a vehicle", description: "Register your trucks (up to 10).", icon: Truck, to: "/owner-operator/vehicles" },
  { id: "upload-docs", title: "Upload documents", description: "Submit vehicle and driver paperwork.", icon: SettingsIcon, to: "/owner-operator/documents" },
  { id: "request-sim", title: "Request a SIM", description: "Order an MTN SIM for your tracker.", icon: Smartphone, to: "/admin/sims" },
  { id: "request-device", title: "Request a device", description: "Order an IoT tracker.", icon: Cpu, to: "/admin/devices" },
  { id: "jobs", title: "View available jobs", description: "Find and accept loads.", icon: ClipboardList, to: "/owner-operator/jobs" },
];

const DISPATCHER_ACTIONS: QuickAction[] = [
  { id: "create-jobs", title: "Create jobs", description: "Build and dispatch loads to drivers.", icon: ClipboardList, to: "/admin/jobs" },
  { id: "assign-drivers", title: "Assign drivers", description: "Match drivers to active jobs.", icon: Users, to: "/admin/jobs" },
  { id: "live-map", title: "Open Live Map", description: "Track vehicles in real-time.", icon: Map, to: "/admin/map" },
  { id: "messages", title: "Open messaging", description: "Talk to drivers via SMS, voice or WhatsApp.", icon: Users, to: "/admin/messaging" },
];

function getActionsFor(
  role: string | undefined,
  stakeholder: ReturnType<typeof readDemoStakeholder>,
): QuickAction[] {
  if (stakeholder === "ENTERPRISE") return ENTERPRISE_ACTIONS;
  if (stakeholder === "AGGREGATOR") return AGGREGATOR_ACTIONS;
  if (stakeholder === "OWNER_OPERATOR") return OWNER_OPERATOR_ACTIONS;
  if (role === "dispatcher" || role === "supervisor") return DISPATCHER_ACTIONS;
  return FLEET_PROVIDER_ACTIONS;
}

export default function WelcomeDashboard() {
  const navigate = useNavigate();
  const { completeOnboarding } = useOnboardingStore();
  const { user } = useAuthStore();
  const stakeholder = readDemoStakeholder();
  const actions = getActionsFor(user?.role, stakeholder);

  const goToDashboard = async () => {
    const route = await resolveDashboardRoute(user?.id, user?.role);
    completeOnboarding();
    navigate(route);
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
                completeOnboarding();
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
