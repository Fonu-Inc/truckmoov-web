import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Droplets,
  CheckCircle,
  MapPin,
  Clock,
  Fuel,
  TrendingDown,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useFuelAnomalies, FuelAnomaly, FuelAnomalyType, FuelAnomalySeverity } from "@/hooks/useFuelAnomalies";

const anomalyTypeLabels: Record<FuelAnomalyType, string> = {
  sudden_drop: "Sudden Fuel Drop",
  abnormal_consumption: "Abnormal Consumption",
  suspected_theft: "Suspected Theft",
  sensor_error: "Sensor Error",
};

const anomalyTypeIcons: Record<FuelAnomalyType, React.ReactNode> = {
  sudden_drop: <TrendingDown className="h-4 w-4" />,
  abnormal_consumption: <Fuel className="h-4 w-4" />,
  suspected_theft: <AlertTriangle className="h-4 w-4" />,
  sensor_error: <Droplets className="h-4 w-4" />,
};

const severityColors: Record<FuelAnomalySeverity, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning border-warning/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
  critical: "bg-destructive text-destructive-foreground",
};

export function FuelAnomaliesPanel() {
  const { anomalies, stats, isLoading, acknowledgeAnomaly } = useFuelAnomalies();
  const [selectedAnomaly, setSelectedAnomaly] = useState<FuelAnomaly | null>(null);
  const [isAcknowledgeDialogOpen, setIsAcknowledgeDialogOpen] = useState(false);
  const [acknowledgeNotes, setAcknowledgeNotes] = useState("");

  const handleAcknowledge = async () => {
    if (!selectedAnomaly) return;
    
    try {
      await acknowledgeAnomaly(selectedAnomaly.id, acknowledgeNotes);
      setIsAcknowledgeDialogOpen(false);
      setSelectedAnomaly(null);
      setAcknowledgeNotes("");
    } catch (err) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const unacknowledgedAnomalies = anomalies.filter(a => !a.acknowledged);

  if (unacknowledgedAnomalies.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            Fuel Anomalies
          </CardTitle>
          <CardDescription>Alerts from fuel level monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mb-3 text-success" />
            <p className="font-medium">No anomalies detected</p>
            <p className="text-sm">Fuel levels are within normal parameters</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn(
        "bg-card/50 border-border/50",
        stats.critical > 0 && "border-destructive/50"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            Fuel Anomalies
            {stats.unacknowledged > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unacknowledged} unacknowledged
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Alerts from fuel level monitoring requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {unacknowledgedAnomalies.slice(0, 5).map((anomaly) => (
              <div
                key={anomaly.id}
                className={cn(
                  "p-4 rounded-lg border transition-all cursor-pointer hover:border-primary/50",
                  anomaly.severity === 'critical' && "border-destructive/50 bg-destructive/5",
                  anomaly.severity === 'high' && "border-destructive/30 bg-destructive/5",
                  anomaly.severity === 'medium' && "border-warning/30 bg-warning/5"
                )}
                onClick={() => {
                  setSelectedAnomaly(anomaly);
                  setIsAcknowledgeDialogOpen(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      anomaly.severity === 'critical' ? "bg-destructive/20" : "bg-muted"
                    )}>
                      {anomalyTypeIcons[anomaly.anomaly_type]}
                    </div>
                    <div>
                      <p className="font-medium">
                        {anomalyTypeLabels[anomaly.anomaly_type]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vehicle: {anomaly.vehicle_registration || anomaly.vehicle_id.slice(0, 8)}
                      </p>
                      {anomaly.fuel_drop_percent && (
                        <p className="text-sm text-destructive font-medium mt-1">
                          {anomaly.fuel_drop_percent.toFixed(1)}% fuel drop detected
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={severityColors[anomaly.severity]}>
                      {anomaly.severity}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(anomaly.detected_at), "MMM dd, HH:mm")}
                    </p>
                    {anomaly.confidence_score && (
                      <p className="text-xs text-muted-foreground">
                        Confidence: {(anomaly.confidence_score * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {unacknowledgedAnomalies.length > 5 && (
              <p className="text-sm text-center text-muted-foreground">
                + {unacknowledgedAnomalies.length - 5} more anomalies
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Acknowledge Dialog */}
      <Dialog open={isAcknowledgeDialogOpen} onOpenChange={setIsAcknowledgeDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Acknowledge Anomaly</DialogTitle>
            <DialogDescription>
              Review and acknowledge this fuel anomaly alert.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAnomaly && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="font-medium">
                    {anomalyTypeLabels[selectedAnomaly.anomaly_type]}
                  </span>
                </div>
                {selectedAnomaly.fuel_drop_percent && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Fuel Drop</span>
                    <span className="font-medium text-destructive">
                      {selectedAnomaly.fuel_drop_percent.toFixed(1)}%
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Detected</span>
                  <span className="font-medium">
                    {format(new Date(selectedAnomaly.detected_at), "MMM dd, yyyy HH:mm")}
                  </span>
                </div>
                {selectedAnomaly.location_lat && selectedAnomaly.location_lng && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <span className="font-mono text-xs">
                      {selectedAnomaly.location_lat.toFixed(4)}, {selectedAnomaly.location_lng.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Add investigation notes..."
                  value={acknowledgeNotes}
                  onChange={(e) => setAcknowledgeNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcknowledgeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcknowledge}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}



