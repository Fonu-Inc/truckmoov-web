import type { UserRole } from "@/features/auth/api/types";
import {
  LayoutDashboard,
  Package,
  Inbox,
  Truck,
  Receipt,
  FileText,
  BellRing,
  User,
  Building2,
  Radio,
  Headphones,
  CreditCard,
  Shield,
  Settings,
  Users,
  Cpu,
  Wrench,
  Wifi,
  MapPinned,
  MessageSquare,
  Send,
  Code2,
  MapPin,
  BarChart3,
  Gauge,
  Handshake,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { APP_ROUTES } from "./appRoutes";

export type SidebarListItem = {
  label: string;
  roleWithAccess: Array<UserRole>;
  to: string;
  icon: React.ElementType;
  items?: SidebarListItem[];
  pageTitle?: string
  pageDescription?: string
};

export const siderbarList: SidebarListItem[] = [
  {
    label: "Logistics Overview",
    roleWithAccess: ["ENTERPRISE_ADMIN"],
    to: "/enterprise",
    icon: LayoutDashboard,
  },
  {
    label: "Shipments",
    roleWithAccess: ["ENTERPRISE_ADMIN"],
    to: "/admin/jobs",
    icon: Package,
  },
  {
    label: "Fleet Providers",
    roleWithAccess: ["ENTERPRISE_ADMIN"],
    to: "/admin/fleet",
    icon: Truck,
  },
  {
    label: "Live Tracking",
    roleWithAccess: ["ENTERPRISE_ADMIN"],
    to: "/admin/map",
    icon: MapPin,
  },
  {
    label: "Performance",
    roleWithAccess: ["ENTERPRISE_ADMIN"],
    to: "/admin/analytics",
    icon: TrendingUp,
  },
  {
    label: "Settlements",
    roleWithAccess: ["ENTERPRISE_ADMIN"],
    to: "/admin/wallet",
    icon: DollarSign,
  },
  {
    label: "Contracts",
    roleWithAccess: ["ENTERPRISE_ADMIN"],
    to: "/admin/compliance",
    icon: Handshake,
  },
  {
    label: "Reports",
    roleWithAccess: ["ENTERPRISE_ADMIN", "FLEET_ADMIN"],
    to: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "My Overview",
    roleWithAccess: ["OWNER_OPERATOR"],
    to: "/owner-operator",
    icon: LayoutDashboard,
  },
  {
    label: "My Jobs",
    roleWithAccess: ["OWNER_OPERATOR"],
    to: "/owner-operator/jobs",
    icon: Package,
  },
  {
    label: "Job Offers",
    roleWithAccess: ["OWNER_OPERATOR"],
    to: "/admin/job-offers",
    icon: Inbox,
  },
  {
    label: "My Vehicle",
    roleWithAccess: ["OWNER_OPERATOR"],
    to: "/owner-operator/vehicles",
    icon: Truck,
  },
  {
    label: "Earnings & Invoices",
    roleWithAccess: ["OWNER_OPERATOR"],
    to: "/admin/waybill-invoices",
    icon: Receipt,
  },
  {
    label: "Documents",
    roleWithAccess: ["OWNER_OPERATOR"],
    to: "/owner-operator/documents",
    icon: FileText,
  },
  {
    label: "Notifications",
    roleWithAccess: ["OWNER_OPERATOR"],
    to: "/admin/inbox",
    icon: BellRing,
  },
  {
    label: "Profile",
    roleWithAccess: ["OWNER_OPERATOR"],
    to: "/admin/settings",
    icon: User,
  },

  {
    label: "Dashboard",
    roleWithAccess: ["PLATFORM_ADMIN", "OPERATIONS_MANAGER", "FINANCE_VIEWER"],
    to: "/platform",
    icon: LayoutDashboard,
  },
  {
    label: "Tenants",
    roleWithAccess: ["PLATFORM_ADMIN"],
    to: "/platform/tenants",
    icon: Building2,
  },
  {
    label: "Simulator",
    roleWithAccess: ["PLATFORM_ADMIN"],
    to: "/platform/simulator",
    icon: Radio,
  },
  {
    label: "Support & Incidents",
    roleWithAccess: ["PLATFORM_ADMIN"],
    to: "/platform/support",
    icon: Headphones,
  },
  {
    label: "Billing",
    roleWithAccess: ["PLATFORM_ADMIN"],
    to: "/platform/billing",
    icon: CreditCard,
  },
  {
    label: "Security",
    roleWithAccess: ["PLATFORM_ADMIN"],
    to: "/platform/security",
    icon: Shield,
  },
  {
    label: "Settings",
    roleWithAccess: ["PLATFORM_ADMIN"],
    to: "/platform/settings",
    icon: Settings,
  },

  {
    label: "Fleet Operations",
    roleWithAccess: ["FLEET_ADMIN"],
    to: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Dispatch",
    roleWithAccess: ["FLEET_ADMIN"],
    to: "/admin/jobs",
    icon: Package,
  },
  {
    label: "Vehicles",
    roleWithAccess: ["FLEET_ADMIN"],
    to: "/admin/fleet",
    icon: Truck,
  },
  {
    label: "Drivers",
    roleWithAccess: ["FLEET_ADMIN", "OPERATIONS_MANAGER"],
    to: "/admin/drivers",
    icon: Users,
  },
  {
    label: "Devices",
    roleWithAccess: ["PLATFORM_ADMIN", "FLEET_ADMIN", "OPERATIONS_MANAGER", "FINANCE_VIEWER", "INSTALLER" as UserRole],
    to: "/admin/devices",
    icon: Cpu,
  },
  {
    label: "Installation",
    roleWithAccess: ["FLEET_ADMIN", "OPERATIONS_MANAGER", "INSTALLER" as UserRole],
    to: "/admin/installation",
    icon: Wrench,
  },
  {
    label: "IoT SIMs",
    roleWithAccess: ["PLATFORM_ADMIN", "FLEET_ADMIN"],
    to: "/admin/sims",
    icon: Wifi,
  },
  {
    label: "Live Map & Zones",
    roleWithAccess: ["FLEET_ADMIN"],
    to: "/admin/map",
    icon: MapPinned,
  },
  {
    label: "Revenue & Invoicing",
    roleWithAccess: ["FLEET_ADMIN"],
    to: "/admin/waybill-invoices",
    icon: Receipt,
  },
  {
    label: "Communications",
    roleWithAccess: ["FLEET_ADMIN", "OPERATIONS_MANAGER"],
    to: "/admin/messages",
    icon: MessageSquare,
    items: [
      {
        label: "Messaging Center",
        roleWithAccess: ["FLEET_ADMIN", "OPERATIONS_MANAGER"],
        to: "/admin/messages",
        icon: Send,
      },
      {
        label: "Omnichannel Inbox",
        roleWithAccess: ["FLEET_ADMIN", "OPERATIONS_MANAGER"],
        to: "/admin/inbox",
        icon: Inbox,
      },
    ],
  },
  {
    label: "Integrations",
    roleWithAccess: ["FLEET_ADMIN", "ENTERPRISE_ADMIN"],
    to: "/admin/integrations",
    icon: Code2,
  },
  {
    label: "Organization Settings",
    roleWithAccess: ["FLEET_ADMIN", "ENTERPRISE_ADMIN"],
    to: APP_ROUTES.organizationsSettings,
    icon: Settings,
    pageTitle: "Settings"
  },

  {
    label: "Fleet",
    roleWithAccess: ["OPERATIONS_MANAGER", "FINANCE_VIEWER"],
    to: "/admin/fleet",
    icon: Truck,
  },
  {
    label: "Live Map",
    roleWithAccess: ["OPERATIONS_MANAGER"],
    to: "/admin/map",
    icon: MapPin,
  },
  {
    label: "IoT SIMs Request",
    roleWithAccess: ["OPERATIONS_MANAGER"],
    to: "/admin/sims",
    icon: Wifi,
  },
  {
    label: "Jobs",
    roleWithAccess: ["OPERATIONS_MANAGER"],
    to: "/admin/jobs",
    icon: Package,
  },
  {
    label: "Compliance",
    roleWithAccess: ["OPERATIONS_MANAGER"],
    to: "/admin/compliance",
    icon: Shield,
  },
  {
    label: "Analytics",
    roleWithAccess: ["OPERATIONS_MANAGER", "FINANCE_VIEWER"],
    to: "/admin/analytics",
    icon: BarChart3,
  },

  {
    label: "SIM Cards",
    roleWithAccess: ["FINANCE_VIEWER"],
    to: "/admin/sims",
    icon: Wifi,
  },
  {
    label: "Fuel Costs",
    roleWithAccess: ["FINANCE_VIEWER"],
    to: "/admin/fuel",
    icon: Gauge,
  },
  {
    label: "Maintenance",
    roleWithAccess: ["FINANCE_VIEWER"],
    to: "/admin/fleet?tab=maintenance",
    icon: Settings,
  },
  {
    label: "Wallet & Billing",
    roleWithAccess: ["FINANCE_VIEWER"],
    to: "/admin/wallet",
    icon: CreditCard,
  },
];
