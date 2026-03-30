import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useState } from "react";
import RealTimeAlertsActions from "./RealTimeAlertsActions";
import AlertsCard from "./AlertsCard";
import { AlertSeverity, AlertStatus } from "../api/types";
import { useQuery } from "@tanstack/react-query";
import { listAlertsQueryOptions } from "../api";

export default function RealTimeAlerts() {
 const [search, setSearch] = useState("");
 const [severity, setSeverity] = useState<AlertSeverity | "all">("all");
 const [status, setStatus] = useState<AlertStatus | "all">("all");

 // const { data } = useQuery(listAlertsQueryOptions({ params: { status: status !== "all" ? status : undefined } }))

 return (
  <Card>
   <CardHeader>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
     <CardTitle>Real-Time Alerts</CardTitle>
     <Button variant="outline">
      <CheckCircle className="h-4 w-4 mr-2" />
      Acknowledge All
     </Button>
    </div>
   </CardHeader>
   <CardContent>
    <RealTimeAlertsActions
     search={search}
     onSearchChange={setSearch}
     severity={severity}
     onSeverityChange={setSeverity}
     status={status}
     onStatusChange={setStatus}
    />

    <div className="space-y-3">
     <AlertsCard search={search} severity={severity} status={status} />
    </div>
   </CardContent>
  </Card>
 );
}
