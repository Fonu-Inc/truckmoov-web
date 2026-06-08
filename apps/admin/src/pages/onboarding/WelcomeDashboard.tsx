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
  ClipboardList,
} from "lucide-react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { OnboardingLayout } from "./OnboardingLayout";
import { useAuthStore } from "@/stores/authStore";

async function resolveDashboardRoute(
  _userId: string | undefined,
  legacyRole: string | undefined,
): Promise<string> {
  switch (legacyRole) {
    case "platform_admin": return "/";
    case "supervisor":
    case "dispatcher": return "/supervisor";
    case "viewer_finance": return "/fleet?tab=analytics";
    case "installer": return "/installation";
    case "driver": return "/driver";
    default: return "/";
  }
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: typeof Truck;
  to: string;
}

const FLEET_PROVIDER_ACTIONS: QuickAction[] = [
  { id: "add-vehicle", title: "Add a vehicle", description: "Register vehicles you'll be managing.", icon: Truck, to: "/fleet" },
  { id: "add-driver", title: "Add a driver", description: "Invite drivers to receive job offers.", icon: Users, to: "/drivers" },
  { id: "request-sim", title: "Request a SIM", description: "Order MTN SIMs for your IoT devices.", icon: Smartphone, to: "/sims" },
  { id: "request-device", title: "Request a device", description: "Order IoT trackers from the platform.", icon: Cpu, to: "/devices" },
  { id: "invite-dispatchers", title: "Invite dispatchers", description: "Bring your dispatch team on board.", icon: Users, to: "/users" },
  { id: "live-map", title: "Open Live Map", description: "Track vehicles in real-time.", icon: Map, to: "/map" },
  { id: "maintenance", title: "Schedule maintenance", description: "Set service intervals to keep vehicles road-worthy.", icon: Wrench, to: "/maintenance" },
  { id: "settings", title: "Configure preferences", description: "Set timezone, currency and notification rules.", icon: SettingsIcon, to: "/settings" },
];

const DISPATCHER_ACTIONS: QuickAction[] = [
  { id: "create-jobs", title: "Create jobs", description: "Build and dispatch loads to drivers.", icon: ClipboardList, to: "/jobs" },
  { id: "assign-drivers", title: "Assign drivers", description: "Match drivers to active jobs.", icon: Users, to: "/jobs" },
  { id: "live-map", title: "Open Live Map", description: "Track vehicles in real-time.", icon: Map, to: "/map" },
  { id: "messages", title: "Open messaging", description: "Talk to drivers via SMS, voice or WhatsApp.", icon: Users, to: "/messaging" },
];

function getActionsFor(role: string | undefined): QuickAction[] {
  if (role === "dispatcher" || role === "supervisor") return DISPATCHER_ACTIONS;
  return FLEET_PROVIDER_ACTIONS;
}

export default function WelcomeDashboard() {
  const navigate = useNavigate();
  const { completeOnboarding } = useOnboardingStore();
  const { user } = useAuthStore();
  const actions = getActionsFor(user?.role);

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



