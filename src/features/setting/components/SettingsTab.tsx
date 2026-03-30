import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserRole } from "@/features/auth/api/types";
import { APP_ROUTES } from "@/shared/lib/appRoutes";
import { useAuthStore } from "@/stores/authStore";
import { BarChart3, Bell, Bot, Building2, CreditCard, FileCheck, MessageSquare, Package, Palette, Plug, Users, Wrench } from "lucide-react";
import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";

type SettingsObject = {
 label: string;
 icon: any;
 to: string;
 roleWithAccess: UserRole[]
}

const SETTINGS_TAB_LIST: SettingsObject[] = [
 {
  label: "dispatch",
  icon: Package,
  to: APP_ROUTES.dispatchSettings,
  roleWithAccess: ["DISPATCHER"]
 },
 {
  label: "organizations",
  icon: Building2,
  to: APP_ROUTES.organizationsSettings,
  roleWithAccess: ["ENTERPRISE_ADMIN", "FLEET_ADMIN", "DISPATCHER"]
 },
 // {
 //  label: "subscription",
 //  icon: CreditCard,
 //  // to: APP_ROUTES.subscriptionSettings
 // },
 // {
 //  label: "KYC",
 //  icon: FileCheck,
 //  // to: APP_ROUTES.kycSettings
 // },
 // {
 //  label: "Fleet",
 //  icon: Wrench,
 //  // to: APP_ROUTES.fleetSettings
 // },
 // {
 //  label: "AI Matching",
 //  icon: Bot,
 //  // to: APP_ROUTES.aiMatchingSettings
 // },
 // {
 //  label: "AI Usage",
 //  icon: BarChart3,
 //  // to: APP_ROUTES.aiUsageSettings
 // },
 {
  label: "Notifications",
  icon: Bell,
  to: APP_ROUTES.notificationSettings,
  roleWithAccess: ["ENTERPRISE_ADMIN", "FLEET_ADMIN"]
 },
 // {
 //  label: "Communication",
 //  icon: MessageSquare,
 //  // to: APP_ROUTES.communicationSettings
 // },
 {
  label: "Users",
  icon: Users,
  to: APP_ROUTES.userSettings,
  roleWithAccess: ["ENTERPRISE_ADMIN"]
 },
 {
  label: "Branding",
  icon: Palette,
  to: APP_ROUTES.brandingSettings,
  roleWithAccess: ["ENTERPRISE_ADMIN"]
 },
 // {
 //  label: "Integrations",
 //  icon: Plug,
 //  // to: APP_ROUTES.integrationsSettings
 // },
]

export default function SettingsTab() {
 const { user } = useAuthStore();
 const { pathname } = useLocation();
 const activeTab = useMemo(() => SETTINGS_TAB_LIST.find(tab => tab.to === pathname).label, [pathname])

 return (
  <Tabs value={activeTab} className="space-y-6">
   <TabsList className="bg-muted/50 flex flex-wrap gap-1 h-auto p-1">
    {SETTINGS_TAB_LIST.map(tab => (
     <>
      {tab.roleWithAccess.includes(user.role) && (
       <TabsTrigger
        key={tab.label}
        value={tab.label}
        className="flex items-center gap-2 disabled:cursor-not-allowed"
        asChild
       >
        <NavLink
         to={tab.to}
         aria-disabled={!tab.to}
        >
         <tab.icon className="h-4 w-4" />
         <p className="hidden sm:inline capitalize">{tab.label}</p>
        </NavLink>
       </TabsTrigger>
      )}
     </>
    ))}
   </TabsList>
  </Tabs>
 )
}
