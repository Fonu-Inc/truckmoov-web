import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/shared/lib/appRoutes";
import { siderbarList } from "@/shared/lib/sidebarListItem";
import { useAuthStore } from "@/stores/authStore";
import { AlertTriangle, Briefcase, Car, Users } from "lucide-react";
import { Link } from "react-router-dom";

const ACTIONS = [
 { label: "Manage Fleet", icon: Car, to: APP_ROUTES.fleet },
 { label: "Manage Drivers", icon: Users, to: APP_ROUTES.driver },
 { label: "View Jobs", icon: Briefcase, to: APP_ROUTES.jobs },
 { label: "View Alerts", icon: AlertTriangle, to: APP_ROUTES.alerts },
];

export default function QuickActions() {
 const { user } = useAuthStore();
 const role = user?.role;

 const accessibleRoutes = new Set(
  role
   ? siderbarList(role)
    .filter((item) => item.roleWithAccess.includes(role))
    .map((item) => item.to)
   : []
 );

 const visibleActions = ACTIONS.filter(({ to }) => accessibleRoutes.has(to));

 if (visibleActions.length === 0) return null;

 return (
  <div className="flex flex-wrap gap-3">
   {visibleActions.map(({ label, icon: Icon, to }) => (
    <Button key={label} variant="outline" asChild>
     <Link to={to}>
      <Icon className="h-4 w-4 mr-2" />
      {label}
     </Link>
    </Button>
   ))}
  </div>
 );
}
