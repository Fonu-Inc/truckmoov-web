import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search } from "lucide-react";
import { AlertSeverity, AlertStatus } from "../api/types";

type RealTimeAlertsActionsProps = {
 search: string;
 onSearchChange: (value: string) => void;
 severity: AlertSeverity | "all";
 onSeverityChange: (value: AlertSeverity | "all") => void;
 status: AlertStatus | "all";
 onStatusChange: (value: AlertStatus | "all") => void;
};

export default function RealTimeAlertsActions({
 search,
 onSearchChange,
 severity,
 onSeverityChange,
 status,
 onStatusChange,
}: RealTimeAlertsActionsProps) {
 return (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
   <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
     placeholder="Search alerts..."
     className="pl-9"
     value={search}
     onChange={(e) => onSearchChange(e.target.value)}
    />
   </div>
   <Select value={severity} onValueChange={(v) => onSeverityChange(v as AlertSeverity | "all")}>
    <SelectTrigger className="w-full sm:w-44">
     <Filter className="h-4 w-4 mr-2" />
     <SelectValue placeholder="All Severity" />
    </SelectTrigger>
    <SelectContent>
     <SelectItem value="all">All Severity</SelectItem>
     <SelectItem value="critical">Critical</SelectItem>
     <SelectItem value="high">High</SelectItem>
     <SelectItem value="medium">Medium</SelectItem>
     <SelectItem value="low">Low</SelectItem>
    </SelectContent>
   </Select>
   <Select value={status} onValueChange={(v) => onStatusChange(v as AlertStatus | "all")}>
    <SelectTrigger className="w-full sm:w-44">
     <SelectValue placeholder="All Status" />
    </SelectTrigger>
    <SelectContent>
     <SelectItem value="all">All Status</SelectItem>
     <SelectItem value="open">Open</SelectItem>
     <SelectItem value="acknowledged">Acknowledged</SelectItem>
     <SelectItem value="resolved">Resolved</SelectItem>
     <SelectItem value="excalated">Escalated</SelectItem>
    </SelectContent>
   </Select>
  </div>
 );
}
