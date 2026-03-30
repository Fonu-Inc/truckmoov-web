import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportExportQueryOptions } from "@/features/fleet/api";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { Car, Download, Loader2, Users, Briefcase } from "lucide-react";

type ExportEntity = "vehicles" | "drivers" | "jobs";

const EXPORTS: { entity: ExportEntity; label: string; icon: React.ElementType }[] = [
 { entity: "vehicles", label: "Export Vehicles", icon: Car },
 { entity: "drivers", label: "Export Drivers", icon: Users },
 { entity: "jobs", label: "Export Jobs", icon: Briefcase },
];

function ExportButton({ entity, label, icon: Icon, tenantId }: { entity: ExportEntity; label: string; icon: React.ElementType; tenantId: string }) {
 const { isFetching, refetch } = useQuery({
  ...reportExportQueryOptions({ entity, params: { tenantId } }),
  enabled: false,
  refetchOnWindowFocus: false,
 });

 return (
  <Button
   variant="outline"
   className="w-full justify-start"
   disabled={isFetching}
   onClick={() => refetch()}
  >
   {isFetching ? (
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
   ) : (
    <Icon className="h-4 w-4 mr-2" />
   )}
   {label}
   {!isFetching && <Download className="h-3 w-3 ml-auto text-muted-foreground" />}
  </Button>
 );
}

export default function ExportCard() {
 const { user } = useAuthStore();
 const tenantId = user?.tenantId ?? "";

 return (
  <Card>
   <CardHeader>
    <CardTitle className="text-base">Export Data</CardTitle>
    <p className="text-xs text-muted-foreground">Download fleet data as CSV for external use</p>
   </CardHeader>
   <CardContent className="space-y-2">
    {EXPORTS.map((exp) => (
     <ExportButton key={exp.entity} {...exp} tenantId={tenantId} />
    ))}
   </CardContent>
  </Card>
 );
}
