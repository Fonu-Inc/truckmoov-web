import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { DemoStakeholderType, useAuthStore } from "@/stores/authStore";
import { UserRole } from "@/features/auth/api/types";
import {
  Car,
  Calculator,
  ChevronDown,
  Factory,
  Headphones,
  Network,
  Settings,
  UserCheck,
  Users,
  Building2,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type DemoRoleOption = {
  role: UserRole;
  label: string;
  description: string;
  icon: LucideIcon;
};

type StakeholderDemoRoleOption = {
  label: string;
  description: string;
  icon: LucideIcon;
  stakeholderType: DemoStakeholderType;
};

const demoRoles: DemoRoleOption[] = [
  {
    role: "PLATFORM_ADMIN",
    label: "Platform Admin",
    description: "Read-only oversight of devices",
    icon: Building2,
  },
  {
    role: "FLEET_ADMIN",
    label: "Fleet Admin",
    description: "Full CRUD on devices & fleet",
    icon: Car,
  },
  {
    role: "OPERATIONS_MANAGER",
    label: "Operations Manager",
    description: "Full CRUD on devices & fleet",
    icon: Settings,
  },
  {
    role: "DISPATCHER",
    label: "Dispatcher",
    description: "Read-only device tracking",
    icon: Headphones,
  },
  {
    role: "FINANCE_VIEWER",
    label: "Finance/Viewer",
    description: "Read-only device data",
    icon: Calculator,
  },
];

const stakeholderDemoRoles: StakeholderDemoRoleOption[] = [
  {
    label: "Enterprise Admin",
    description: "Cargo owner - create jobs & send offers",
    icon: Factory,
    stakeholderType: "ENTERPRISE",
  },
  {
    label: "Aggregator Admin",
    description: "Manage linked owner-operators",
    icon: Network,
    stakeholderType: "AGGREGATOR",
  },
  {
    label: "Owner-Operator",
    description: "Accept job offers & track deliveries",
    icon: UserCheck,
    stakeholderType: "OWNER_OPERATOR",
  },
];

export default function QuickDemoAccessDropdown() {
  const navigate = useNavigate();
  const { setRole } = useAuthStore();

  const handleDemoLogin = async (role: UserRole, stakeholderType?: DemoStakeholderType) => {
    await supabase.auth.signOut();
    setRole(role, stakeholderType);

    if (stakeholderType === "ENTERPRISE") {
      toast.success("Logged in as Enterprise Admin");
      navigate("/enterprise");
      return;
    }
    if (stakeholderType === "AGGREGATOR") {
      toast.success("Logged in as Aggregator Admin");
      navigate("/aggregator");
      return;
    }
    if (stakeholderType === "OWNER_OPERATOR") {
      toast.success("Logged in as Owner-Operator");
      navigate("/owner-operator");
      return;
    }

    toast.success(`Logged in as ${role.replace("_", " ")}`);
    switch (role) {
      case "PLATFORM_ADMIN":
        navigate("/platform");
        break;
      case "FLEET_ADMIN":
      case "OPERATIONS_MANAGER":
        navigate("/admin");
        break;
      case "DISPATCHER":
        navigate("/supervisor");
        break;
      case "FINANCE_VIEWER":
        navigate("/admin/fleet?tab=analytics");
        break;
      case "ENTERPRISE_ADMIN":
        navigate("/enterprise");
        break;
      case "AGGREGATOR_ADMIN":
        navigate("/aggregator");
        break;
      case "OWNER_OPERATOR":
        navigate("/owner-operator");
        break;
    }
  };

  return (
    <div className="flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full max-w-xs gap-2">
            <Users className="h-4 w-4" />
            Quick Demo Access
            <ChevronDown className="h-4 w-4 ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          side="top"
          sideOffset={8}
          className="w-72 max-h-[80vh] overflow-y-auto"
        >
          <DropdownMenuLabel>Multi-Stakeholder Roles</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {stakeholderDemoRoles.map(({ label, description, icon: Icon, stakeholderType }) => (
            <DropdownMenuItem
              key={label}
              onSelect={() =>
                handleDemoLogin(
                  stakeholderType === "ENTERPRISE"
                    ? "ENTERPRISE_ADMIN"
                    : stakeholderType === "AGGREGATOR"
                      ? "AGGREGATOR_ADMIN"
                      : "OWNER_OPERATOR",
                  stakeholderType
                )
              }
              className="flex flex-col items-start gap-0.5 cursor-pointer py-2"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-accent-foreground" />
                <span className="font-medium">{label}</span>
              </div>
              <span className="text-xs text-muted-foreground pl-6">{description}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Fleet Provider Roles</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {demoRoles.map(({ role, label, description, icon: Icon }) => (
            <DropdownMenuItem
              key={role}
              onSelect={() => handleDemoLogin(role)}
              className="flex flex-col items-start gap-0.5 cursor-pointer py-2"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{label}</span>
              </div>
              <span className="text-xs text-muted-foreground pl-6">{description}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
