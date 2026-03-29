import type { UserRole } from "@/features/auth/api/types";
import {
  LayoutDashboard,
  Package,
  Inbox,
  Truck,
  Receipt,
  FileText,
  BellRing,
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
  MessageSquare,
  Send,
  Code2,
  MapPin,
  BarChart3,
  Gauge,
  DollarSign,
} from "lucide-react";
import { APP_ROUTES } from "./appRoutes";
import { DetailsObjectType, SidebarListItem } from "../types";
import { getRolesFromDetails } from "../composables/getRolesFromDetails";

const DASHBOARD_DETAILS: DetailsObjectType = {
  "ENTERPRISE_ADMIN": {
    label: "Logistic Overview",
    pageTitle: "Dashboard",
    pageDescription: "Enterprise-wide job monitoring & provider performance"
  },
  "AGGREGATOR_ADMIN": {
    label: "Network Overview",
    pageTitle: "Aggregator Dashboard",
    pageDescription: "Manage linked operators & coordinated execution"
  },
  "OWNER_OPERATOR": {
    label: "Overview",
    pageTitle: "Dashboard",
  },
  "PLATFORM_ADMIN": {
    label: "Dashboard",
    pageTitle: "Platform Dashboard",
    pageDescription: "System overview for Super Administrator"
  },
  "FLEET_ADMIN": {
    label: "Fleet Operations",
    pageTitle: "Fleet Dashboard",
  },
  "OPERATIONS_MANAGER": {
    label: "Dashboard",
    pageTitle: "Dashboard",
  },
  "DISPATCHER": {
    label: "Dashboard",
    pageTitle: "Operations Center",
    pageDescription: "Real-time fleet monitoring, dispatch & communications"
  },
}

const JOB_DETAILS: DetailsObjectType = {
  "DISPATCHER": {
    label: "Dispatch",
    pageTitle: "Dispatch Center",
    pageDescription: "Manage and track all dispatches"
  }
}

const FLEET_DETAILS: DetailsObjectType = {
  "ENTERPRISE_ADMIN": {
    label: "Fleet Providers",
    pageTitle: "Fleet Management",
    pageDescription: "Manage your vehicles, maintenance, and fuel"
  },
  "OWNER_OPERATOR": {
    label: "My Vehicles",
    pageTitle: "My Vehicles",
    pageDescription: "View and manage your trucks"
  },
  "FLEET_ADMIN": {
    label: "Vehicles",
    pageTitle: "Fleet Management",
    pageDescription: "Manage your vehicles, maintenance, and fuel"
  },
  "OPERATIONS_MANAGER": {
    label: "Fleet",
    pageTitle: "Fleet Management",
    pageDescription: "Manage your vehicles, maintenance, and fuel"
  },
  "FINANCE_VIEWER": {
    label: "Fleet",
    pageTitle: "Fleet Management",
    pageDescription: "Manage your vehicles, maintenance, and fuel"
  }
}

const MAP_DETAILS: DetailsObjectType = {
  "ENTERPRISE_ADMIN": {
    label: "Live Tracking",
    pageTitle: "Live Fleet Map",
    pageDescription: "Real-time vehicle tracking and monitoring"
  },
  "OPERATIONS_MANAGER": {
    label: "Live Map",
    pageTitle: "Live Fleet Map",
    pageDescription: "Real-time vehicle tracking and monitoring"
  },
  "FLEET_ADMIN": {
    label: "Live Map & Zones",
    pageTitle: "Live Fleet Map",
    pageDescription: "Real-time vehicle tracking and monitoring",
  }
}

const SETTINGS_DETAILS: DetailsObjectType = {
  "ENTERPRISE_ADMIN": {
    label: "Organization Settings",
    pageTitle: "Settings",
  },
  "AGGREGATOR_ADMIN": {
    label: "Organization Settings",
    pageTitle: "Settings",
  },
  "OWNER_OPERATOR": {
    label: "Settings",
    pageTitle: "Settings",
  },
  "PLATFORM_ADMIN": {
    label: "Settings",
    pageTitle: "Platform Settings",
    pageDescription: "Configure global platform settings and integrations"
  },
  "FLEET_ADMIN": {
    label: "Organization Settings",
    pageTitle: "Settings",
  },
  "DISPATCHER": {
    label: "Settings",
    pageTitle: "Settings",
    to: APP_ROUTES.dispatchSettings,
  }
}

const DRIVER_DETAILS: DetailsObjectType = {
  "FLEET_ADMIN": {
    label: "Drivers",
    pageTitle: "Driver Management",
  },
  "AGGREGATOR_ADMIN": {
    label: "Network Members",
    pageTitle: "Driver Management",
  },
  "OPERATIONS_MANAGER": {
    label: "Drivers",
    pageTitle: "Driver Management",
  }
}

const WALLET_BILLING_DETAILS: DetailsObjectType = {
  "ENTERPRISE_ADMIN": {
    label: "Settlements",
    icon: DollarSign,
    pageTitle: "Wallet & Billings",
    pageDescription: "Manage your communication credits and view usage"
  },
  "FINANCE_VIEWER": {
    label: "Wallet & BIlling",
    icon: CreditCard,
    pageTitle: "Wallet & Billings",
    pageDescription: "Manage your communication credits and view usage"
  },
  "PLATFORM_ADMIN": {
    label: "BIlling",
    icon: CreditCard,
    pageTitle: "Wallet & Billings",
    pageDescription: "Manage your communication credits and view usage"
  }
}

const DEVICE_DETAILS: DetailsObjectType = {
  "FLEET_ADMIN": {
    label: "Devices",
    pageTitle: "IoT Device Management",
    pageDescription: "Provision and manage GPS tracking devices"
  },
  "AGGREGATOR_ADMIN": {
    label: "Device Setup Requests"
  },
  "DISPATCHER": {
    label: "Device"
  },
  "OPERATIONS_MANAGER": {
    label: "Device"
  },
  "FINANCE_VIEWER": {
    label: "Device"
  },
}

export function siderbarList(role: UserRole): SidebarListItem[] {
  const dashboardRoleDetail = DASHBOARD_DETAILS[role]
  const jobRoleDetail = JOB_DETAILS[role]
  const fleetRoleDetail = FLEET_DETAILS[role];
  const mapRoleDetail = MAP_DETAILS[role];
  const settingRoleDetail = SETTINGS_DETAILS[role];
  const driverRoleDetail = DRIVER_DETAILS[role];
  const wallingBillingDetails = WALLET_BILLING_DETAILS[role];
  const deviceDetails = DEVICE_DETAILS[role]

  return [
    // Dashboard
    // ...(dashboardRoleDetail ? [{
    //   label: dashboardRoleDetail.label,
    //   roleWithAccess: getRolesFromDetails(DASHBOARD_DETAILS),
    //   to: APP_ROUTES.dashboard,
    //   icon: LayoutDashboard,
    //   pageTitle: dashboardRoleDetail.pageTitle,
    //   pageDescription: dashboardRoleDetail.pageDescription
    // }] : []),

    // Jobs
    ...(jobRoleDetail ? [{
      label: jobRoleDetail.label,
      roleWithAccess: getRolesFromDetails(JOB_DETAILS),
      to: APP_ROUTES.jobs,
      icon: Package,
      pageTitle: jobRoleDetail.pageTitle,
      pageDescription: jobRoleDetail.pageDescription
    }] : []),

    // Fleet
    ...(fleetRoleDetail ? [{
      label: fleetRoleDetail.label,
      roleWithAccess: getRolesFromDetails(FLEET_DETAILS),
      to: APP_ROUTES.fleet,
      icon: Truck,
      pageTitle: fleetRoleDetail.pageTitle,
      pageDescription: fleetRoleDetail.pageDescription
    }] : []),

    // Drivers
    ...(driverRoleDetail ? [{
      label: driverRoleDetail.label,
      roleWithAccess: getRolesFromDetails(DRIVER_DETAILS),
      to: APP_ROUTES.driver,
      icon: Users,
      pageTitle: driverRoleDetail.pageTitle
    }] : []),

    // Device
    ...(deviceDetails ? [{
      label: deviceDetails.label,
      roleWithAccess: getRolesFromDetails(DEVICE_DETAILS),
      to: APP_ROUTES.device,
      icon: Cpu,
      pageTitle: deviceDetails.pageTitle,
      pageDescription: deviceDetails.pageDescription,
    }] : []),

    // Map
    // ...(mapRoleDetail ? [{
    //   label: mapRoleDetail.label,
    //   roleWithAccess: getRolesFromDetails(MAP_DETAILS),
    //   to: APP_ROUTES.map,
    //   icon: MapPin,
    //   pageTitle: mapRoleDetail.pageTitle,
    //   pageDescription: mapRoleDetail.pageDescription
    // }] : []),

    // Settlement
    // ...(wallingBillingDetails ? [{
    //   label: wallingBillingDetails.label,
    //   roleWithAccess: getRolesFromDetails(WALLET_BILLING_DETAILS),
    //   to: APP_ROUTES.settlement,
    //   icon: wallingBillingDetails.icon,
    //   pageTitle: wallingBillingDetails.pageTitle,
    //   pageDescription: wallingBillingDetails.pageDescription
    // }] : []),

    // // Reports
    // {
    //   label: "Reports",
    //   roleWithAccess: ["ENTERPRISE_ADMIN", "AGGREGATOR_ADMIN", "FLEET_ADMIN"],
    //   to: APP_ROUTES.reports,
    //   icon: BarChart3,
    //   pageTitle: "Reports",
    //   pageDescription: "Exportable historical summaries and audits"
    // },

    // // Intergrations
    // {
    //   label: "Integrations",
    //   roleWithAccess: ["FLEET_ADMIN", "ENTERPRISE_ADMIN", "AGGREGATOR_ADMIN"],
    //   to: APP_ROUTES.integrations,
    //   icon: Code2,
    //   pageTitle: "Developer Portal",
    // },

    // {
    //   label: "Job Offers",
    //   roleWithAccess: ["OWNER_OPERATOR"],
    //   to: "/admin/job-offers",
    //   icon: Inbox,
    // },
    // {
    //   label: "Earnings & Invoices",
    //   roleWithAccess: ["OWNER_OPERATOR"],
    //   to: "/admin/waybill-invoices",
    //   icon: Receipt,
    // },
    // {
    //   label: "Documents",
    //   roleWithAccess: ["OWNER_OPERATOR"],
    //   to: "/owner-operator/documents",
    //   icon: FileText,
    // },
    // {
    //   label: "Notifications",
    //   roleWithAccess: ["OWNER_OPERATOR"],
    //   to: "/admin/inbox",
    //   icon: BellRing,
    // },

    // {
    //   label: "Tenants",
    //   roleWithAccess: ["PLATFORM_ADMIN"],
    //   to: "/platform/tenants",
    //   icon: Building2,
    // },
    // {
    //   label: "Simulator",
    //   roleWithAccess: ["PLATFORM_ADMIN"],
    //   to: "/platform/simulator",
    //   icon: Radio,
    // },
    // {
    //   label: "Support & Incidents",
    //   roleWithAccess: ["PLATFORM_ADMIN"],
    //   to: "/platform/support",
    //   icon: Headphones,
    // },
    // {
    //   label: "Security",
    //   roleWithAccess: ["PLATFORM_ADMIN"],
    //   to: "/platform/security",
    //   icon: Shield,
    // },

    // {
    //   label: "Installation",
    //   roleWithAccess: ["FLEET_ADMIN", "OPERATIONS_MANAGER", "INSTALLER" as UserRole],
    //   to: "/admin/installation",
    //   icon: Wrench,
    // },
    // {
    //   label: "IoT SIMs",
    //   roleWithAccess: ["PLATFORM_ADMIN", "FLEET_ADMIN"],
    //   to: "/admin/sims",
    //   icon: Wifi,
    // },
    // {
    //   label: "Revenue & Invoicing",
    //   roleWithAccess: ["FLEET_ADMIN"],
    //   to: "/admin/waybill-invoices",
    //   icon: Receipt,
    // },
    // {
    //   label: "Communications",
    //   roleWithAccess: ["FLEET_ADMIN", "OPERATIONS_MANAGER"],
    //   icon: MessageSquare,
    //   items: [
    //     {
    //       label: "Messaging Center",
    //       roleWithAccess: ["FLEET_ADMIN", "OPERATIONS_MANAGER"],
    //       to: "/admin/messages",
    //       icon: Send,
    //     },
    //     {
    //       label: "Omnichannel Inbox",
    //       roleWithAccess: ["FLEET_ADMIN", "OPERATIONS_MANAGER"],
    //       to: "/admin/inbox",
    //       icon: Inbox,
    //     },
    //   ],
    // },

    // {
    //   label: "IoT SIMs Request",
    //   roleWithAccess: ["OPERATIONS_MANAGER"],
    //   to: "/admin/sims",
    //   icon: Wifi,
    // },
    // {
    //   label: "Compliance",
    //   roleWithAccess: ["OPERATIONS_MANAGER"],
    //   to: "/admin/compliance",
    //   icon: Shield,
    // },

    // {
    //   label: "SIM Cards",
    //   roleWithAccess: ["FINANCE_VIEWER"],
    //   to: "/admin/sims",
    //   icon: Wifi,
    // },
    // {
    //   label: "Fuel Costs",
    //   roleWithAccess: ["FINANCE_VIEWER"],
    //   to: "/admin/fuel",
    //   icon: Gauge,
    // },

    // Settings
    ...(settingRoleDetail ? [{
      label: settingRoleDetail.label,
      roleWithAccess: getRolesFromDetails(SETTINGS_DETAILS),
      to: settingRoleDetail.to ?? APP_ROUTES.organizationsSettings,
      icon: Settings,
      pageTitle: settingRoleDetail.pageTitle,
      pageDescription: settingRoleDetail.pageDescription
    }] : []),
  ]
};
