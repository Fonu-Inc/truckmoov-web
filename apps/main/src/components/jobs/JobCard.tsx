import { Card, CardContent } from "@/components/shadcn/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcn/tooltip";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Job } from "@/types";
import { mockDrivers, mockVehicles } from "@/data/mockData";
import { format } from "date-fns";
import {
  MapPin, Package, MoreHorizontal, Eye, Pencil,
  Trash2, Truck,
  Hash, Activity, Weight, Banknote, Calendar, User,
  MessageSquare, Phone, Sparkles,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

interface JobCardProps {
  job: Job;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMatch: () => void;
  onComplete?: () => void;
  /** When true, render the dispatcher-owned workflow:
   *  - Unassigned → "Find Driver" CTA (telescope icon)
   *  - Pre-existing driverId on a non-assigned job is treated as a recommendation
   *  - Recommendation block shows "Recommended by {recommendedBy}" subtext
   */
  dispatcherMode?: boolean;
  recommendedBy?: string;
  /** Role label of whoever assigned the driver — shown as
   *  "Assigned by {assignedByRole}" subtext on assigned cards. */
  assignedByRole?: string;
  /** When true, the CTA label becomes "Recommend Driver" (Enterprise admins). */
  recommendOnly?: boolean;
}

const statusColors: Record<string, string> = {
  created: "bg-muted text-muted-foreground border-muted",
  assigned: "bg-primary/20 text-primary border-primary/30",
  accepted: "bg-success/20 text-success border-success/30",
  in_progress: "bg-warning/20 text-warning border-warning/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

function FieldLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <Icon className="h-3 w-3 text-primary" />
      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
        {children}
      </p>
    </div>
  );
}

// Official WhatsApp logo SVG
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  );
}

export function JobCard({ job, onView, onEdit, onDelete, onMatch, onComplete, dispatcherMode = false, recommendedBy, assignedByRole, recommendOnly = false }: JobCardProps) {
  const { format: formatCurrency } = useCurrency();
  const driver = job.driverId ? mockDrivers.find(d => d.id === job.driverId) : null;
  const vehicle = job.vehicleId ? mockVehicles.find(v => v.id === job.vehicleId) : null;
  // In dispatcher mode, a driver attached to a not-yet-assigned job is a recommendation,
  // not an assignment — only the dispatcher can assign.
  const isRecommendation = !!driver && (dispatcherMode ? job.status === "created" : job.status === "created");
  // Note: onMatch / onComplete intentionally omitted from dropdown actions per product spec.
  void onComplete;

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!driver?.phone) return;
    const phone = driver.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  const handleSMS = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!driver?.phone) return toast.error("Driver phone unavailable");
    window.location.href = `sms:${driver.phone}`;
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!driver?.phone) return toast.error("Driver phone unavailable");
    window.location.href = `tel:${driver.phone}`;
  };

  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all group">
      <CardContent className="p-4">
        {/* Header: Reference + Actions */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <FieldLabel icon={Hash}>Reference No.</FieldLabel>
            <p className="font-mono font-medium text-sm">{job.reference}</p>
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
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status */}
        <div className="mb-3">
          <FieldLabel icon={Activity}>Status</FieldLabel>
          <Badge className={statusColors[job.status]}>
            {job.status === "created" ? "pending" : job.status.replace("_", " ")}
          </Badge>
        </div>

        {/* Route */}
        <div className="mb-3 space-y-2 pt-3 border-t border-border/50">
          <div>
            <FieldLabel icon={MapPin}>Pickup Location</FieldLabel>
            <p className="text-sm truncate pl-4">{job.pickup.address}</p>
          </div>
          <div>
            <FieldLabel icon={MapPin}>Delivery Location</FieldLabel>
            <p className="text-sm truncate pl-4">{job.delivery.address}</p>
          </div>
        </div>

        {/* Cargo details grid */}
        <div className="grid grid-cols-2 gap-3 mb-3 pt-3 border-t border-border/50">
          <div>
            <FieldLabel icon={Package}>Cargo Type</FieldLabel>
            <p className="text-sm truncate">{job.cargo.type}</p>
          </div>
          <div>
            <FieldLabel icon={Weight}>Weight</FieldLabel>
            <p className="text-sm">{job.cargo.weight}t</p>
          </div>
          <div>
            <FieldLabel icon={Banknote}>Amount</FieldLabel>
            <p className="font-bold text-foreground text-sm">{formatCurrency(job.amount)}</p>
          </div>
          <div>
            <FieldLabel icon={Calendar}>Deadline</FieldLabel>
            <p className="text-sm">{format(new Date(job.deadline), "MMM dd, HH:mm")}</p>
          </div>
        </div>

        {/* Assigned / Recommended Driver section */}
        <div className="pt-3 border-t border-border/50 space-y-2 text-primary-foreground bg-white">
          <FieldLabel icon={User}>
            {isRecommendation ? "Recommended Driver" : "Assigned Driver For Job"}
          </FieldLabel>
          {driver && (
            <div className="rounded-lg border border-border/60 bg-background/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-medium text-primary-foreground shrink-0">
                    {driver.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="min-w-0 cursor-default">
                          <p className="text-xs font-medium truncate">{driver.name}</p>
                          {isRecommendation ? (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {driver.phone ? `${driver.phone} · ` : ""}
                              Recommended by {recommendedBy ?? "Fleet Manager"}
                            </p>
                          ) : (
                            <>
                              {vehicle && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Truck className="h-2.5 w-2.5" />
                                  <span className="truncate">
                                    {vehicle.registrationNumber} • {vehicle.make} {vehicle.model}
                                  </span>
                                </div>
                              )}
                              {assignedByRole && (
                                <p className="text-[10px] text-muted-foreground/80 truncate">
                                  Assigned by {assignedByRole}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-xs">
                        <p className="font-medium">{driver.name}</p>
                        {vehicle && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {vehicle.registrationNumber} • {vehicle.make} {vehicle.model}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Contact icon actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleWhatsApp} title="Send WhatsApp">
                    <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSMS} title="Send SMS">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCall} title="Call driver">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Assign / Recommend Driver CTA — visible until a driver is *assigned* (not just recommended) */}
          {(!driver || isRecommendation) && (
            <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-primary-foreground shadow-sm hover:shadow-mtn rounded-md bg-transparent hover:bg-transparent border" onClick={onMatch}>
              <Sparkles className="h-3 w-3 mr-1" />
              {recommendOnly ? "Recommend Driver" : "Assign Driver"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
