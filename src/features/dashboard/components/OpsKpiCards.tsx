import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, Briefcase, Car, CheckCircle, Users } from "lucide-react";
import { deliveryMetricsQueryOptions, operationalDashboardQueryOptions } from "@/features/fleet/api";
import { useAuthStore } from "@/stores/authStore";

type KpiCard = {
 id: string;
 label: string;
 value: string | number;
 sub: string;
 icon: React.ElementType;
 iconClass: string;
};

export default function OpsKpiCards() {
 const { user } = useAuthStore();
 const tenantId = user?.tenantId ?? "";

 const { data: opsData, isLoading: opsLoading } = useQuery(
  operationalDashboardQueryOptions({ params: { tenantId } })
 );
 const { data: deliveryData, isLoading: deliveryLoading } = useQuery(
  deliveryMetricsQueryOptions({ params: { tenantId } })
 );

 const isLoading = opsLoading || deliveryLoading;
 const ops = opsData?.data;
 const delivery = deliveryData?.data;

 const cards: KpiCard[] = [
  {
   id: "vehicles",
   label: "Total Vehicles",
   value: ops?.vehicles?.total ?? 0,
   sub: `${ops?.vehicles?.active ?? 0} active · ${ops?.vehicles?.inactive ?? 0} inactive`,
   icon: Car,
   iconClass: "text-primary",
  },
  {
   id: "drivers",
   label: "Active Drivers",
   value: ops?.drivers ? `${ops.drivers.active ?? 0}/${ops.drivers.total ?? 0}` : "—",
   sub: `${ops?.drivers?.assigned ?? 0} assigned`,
   icon: Users,
   iconClass: "text-blue-500",
  },
  {
   id: "jobs",
   label: "Total Jobs",
   value: ops?.jobs?.total ?? 0,
   sub: "All active periods",
   icon: Briefcase,
   iconClass: "text-yellow-500",
  },
  {
   id: "alerts",
   label: "Open Alerts",
   value: ops?.alerts?.open ?? 0,
   sub: `${ops?.alerts?.escalated ?? 0} escalated`,
   icon: Bell,
   iconClass: ops?.alerts?.open ? "text-destructive" : "text-muted-foreground",
  },
  {
   id: "delivery_rate",
   label: "Delivery Success",
   value: delivery?.deliverySuccessRate != null && !isNaN(delivery.deliverySuccessRate)
    ? `${(delivery.deliverySuccessRate * 100).toFixed(1)}%` : "—",
   sub: `${delivery?.delivered ?? 0} delivered`,
   icon: CheckCircle,
   iconClass: "text-green-500",
  },
  {
   id: "utilization",
   label: "Vehicle Utilization",
   value: delivery?.vehicleUtilizationRate != null && !isNaN(delivery.vehicleUtilizationRate)
    ? `${(delivery.vehicleUtilizationRate * 100).toFixed(1)}%` : "—",
   sub: "Fleet efficiency",
   icon: AlertTriangle,
   iconClass: "text-warning",
  },
 ];

 if (isLoading) {
  return (
   <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
    {Array.from({ length: 6 }).map((_, i) => (
     <Card key={i}>
      <CardContent className="pt-4">
       <Skeleton className="h-4 w-24 mb-2" />
       <Skeleton className="h-7 w-16 mb-1" />
       <Skeleton className="h-3 w-28" />
      </CardContent>
     </Card>
    ))}
   </div>
  );
 }

 return (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
   {cards.map((card) => {
    const Icon = card.icon;
    return (
     <Card key={card.id}>
      <CardContent className="pt-4">
       <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${card.iconClass}`} />
        <p className="text-xs text-muted-foreground">{card.label}</p>
       </div>
       <p className="text-2xl font-bold">{card.value}</p>
       <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
      </CardContent>
     </Card>
    );
   })}
  </div>
 );
}
