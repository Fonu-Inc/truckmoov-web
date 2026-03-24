import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_ROUTES } from "@/shared/lib/appRoutes"
import { BarChart3, Fuel, Shield, TrendingUp, Truck, Wrench } from "lucide-react"
import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";

const FLEET_TAB_LIST = [
 {
  label: "Vehicles",
  icon: Truck,
  to: APP_ROUTES.fleet
 },
 {
  label: "Schedules",
  icon: Wrench,
 },
 {
  label: "Maintenance",
  icon: Wrench,
 },
 {
  label: "Fuel",
  icon: Fuel,
 },
 {
  label: "Compliance",
  icon: Shield,
 },
 {
  label: "Financials",
  icon: TrendingUp,
 },
 {
  label: "Analytics",
  icon: BarChart3,
 },
]

export default function FleetTabs() {
 const { pathname } = useLocation();
 const activeTab = useMemo(() => FLEET_TAB_LIST.find(tab => tab.to === pathname).label, [pathname])

 return (
  <Tabs value={activeTab} className="space-y-6">
   <TabsList className="bg-muted/50 flex flex-wrap gap-1 h-auto p-1">
    {FLEET_TAB_LIST.map(tab => (
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
    ))}
   </TabsList>
  </Tabs>
 )
}
