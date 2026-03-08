import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Job } from "@/types";
import { mockDrivers } from "@/data/mockData";
import { format } from "date-fns";
import { 
  MapPin, Package, Calendar, MoreHorizontal, Eye, Pencil, 
  Trash2, Sparkles, User, Clock, ArrowRight, CheckCircle
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface JobCardProps {
  job: Job;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMatch: () => void;
  onComplete?: () => void;
}

const statusColors: Record<string, string> = {
  created: "bg-muted text-muted-foreground border-muted",
  assigned: "bg-primary/20 text-primary border-primary/30",
  accepted: "bg-success/20 text-success border-success/30",
  in_progress: "bg-warning/20 text-warning border-warning/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

export function JobCard({ job, onView, onEdit, onDelete, onMatch, onComplete }: JobCardProps) {
  const { format: formatCurrency } = useCurrency();
  const driver = job.driverId ? mockDrivers.find(d => d.id === job.driverId) : null;
  const canComplete = job.status === "in_progress" || job.status === "assigned";

  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-mono font-medium text-sm">{job.reference}</p>
            <Badge className={statusColors[job.status]}>
              {job.status.replace("_", " ")}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {job.status === "created" && (
                <DropdownMenuItem onClick={onMatch}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Match
                </DropdownMenuItem>
              )}
              {canComplete && onComplete && (
                <DropdownMenuItem onClick={onComplete}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Job
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Route */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{job.pickup.address}</span>
          </div>
          <div className="flex items-center gap-2 pl-2">
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-accent shrink-0" />
            <span className="truncate">{job.delivery.address}</span>
          </div>
        </div>

        {/* Cargo & Amount */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{job.cargo.type} • {job.cargo.weight}t</span>
          </div>
          <p className="font-bold text-primary">{formatCurrency(job.amount)}</p>
        </div>

        {/* Driver & Deadline */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          {driver ? (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-medium text-primary-foreground">
                {driver.name.split(" ").map(n => n[0]).join("")}
              </div>
              <span className="text-sm">{driver.name}</span>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              onClick={onMatch}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Find Driver
            </Button>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{format(new Date(job.deadline), "MMM dd, HH:mm")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
