import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  GripVertical, MapPin, Clock, Route, Truck, ArrowRight,
  Play, RotateCcw, Zap, Navigation, Plus, X, CheckCircle,
  Brain, Sparkles, AlertTriangle, TrendingDown
} from "lucide-react";
import { toast } from "sonner";
import { useRouteOptimization, Waypoint } from "@/hooks/useRouteOptimization";

interface RouteOptimizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWaypoints?: Waypoint[];
  onOptimize?: (waypoints: Waypoint[]) => void;
}

// Sortable waypoint item

// Sortable waypoint item
function SortableWaypoint({ 
  waypoint, 
  index, 
  onRemove,
  totalWaypoints 
}: { 
  waypoint: Waypoint; 
  index: number;
  onRemove: (id: string) => void;
  totalWaypoints: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: waypoint.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getTypeStyles = () => {
    switch (waypoint.type) {
      case "pickup":
        return "bg-success/10 border-success/30 text-success";
      case "delivery":
        return "bg-primary/10 border-primary/30 text-primary";
      default:
        return "bg-warning/10 border-warning/30 text-warning";
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Connector line */}
      {index < totalWaypoints - 1 && (
        <div className="absolute left-5 top-full w-0.5 h-4 bg-border z-0" />
      )}
      
      <Card className={`border ${isDragging ? "ring-2 ring-primary shadow-lg" : "border-border/50"}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Drag handle */}
            <button
              className="mt-1 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Stop number */}
            <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${getTypeStyles()}`}>
              {index + 1}
            </div>

            {/* Waypoint details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={`text-xs capitalize ${getTypeStyles()}`}>
                  {waypoint.type}
                </Badge>
                {waypoint.jobReference && (
                  <span className="text-xs text-muted-foreground">{waypoint.jobReference}</span>
                )}
              </div>
              <p className="text-sm font-medium truncate">{waypoint.address}</p>
              
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {waypoint.estimatedArrival && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ETA: {waypoint.estimatedArrival}
                  </span>
                )}
                {waypoint.distance !== undefined && index > 0 && (
                  <span className="flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    {waypoint.distance.toFixed(1)} km
                  </span>
                )}
                {waypoint.duration !== undefined && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {waypoint.duration} min stop
                  </span>
                )}
              </div>
            </div>

            {/* Remove button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(waypoint.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Mock waypoints for demo
const mockWaypoints: Waypoint[] = [
  {
    id: "w1",
    type: "pickup",
    address: "123 Industrial Rd, Johannesburg",
    lat: -26.2041,
    lng: 28.0473,
    jobReference: "JOB-001",
    duration: 15,
  },
  {
    id: "w2",
    type: "delivery",
    address: "Sandton City Mall, Sandton",
    lat: -26.1076,
    lng: 28.0567,
    jobReference: "JOB-001",
    duration: 20,
  },
  {
    id: "w3",
    type: "pickup",
    address: "45 Main St, Randburg",
    lat: -26.0933,
    lng: 27.9807,
    jobReference: "JOB-002",
    duration: 10,
  },
  {
    id: "w4",
    type: "delivery",
    address: "OR Tambo International Airport",
    lat: -26.1392,
    lng: 28.2460,
    jobReference: "JOB-002",
    duration: 25,
  },
  {
    id: "w5",
    type: "stop",
    address: "Fuel Station, N1 Highway",
    lat: -26.1500,
    lng: 28.1000,
    duration: 15,
  },
];

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate ETAs based on distances (assuming 50 km/h average speed)
function calculateETAs(waypoints: Waypoint[], startTime: Date = new Date()): Waypoint[] {
  const avgSpeed = 50; // km/h
  let currentTime = new Date(startTime);
  
  return waypoints.map((wp, index) => {
    let distance = 0;
    if (index > 0) {
      const prev = waypoints[index - 1];
      distance = calculateDistance(prev.lat, prev.lng, wp.lat, wp.lng);
      const travelTime = (distance / avgSpeed) * 60; // minutes
      currentTime = new Date(currentTime.getTime() + travelTime * 60 * 1000);
    }
    
    const eta = currentTime.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false 
    });
    
    // Add stop duration for next calculation
    if (wp.duration) {
      currentTime = new Date(currentTime.getTime() + wp.duration * 60 * 1000);
    }
    
    return {
      ...wp,
      distance: index > 0 ? distance : undefined,
      estimatedArrival: eta,
    };
  });
}

// Simple greedy optimization (nearest neighbor)
function optimizeRoute(waypoints: Waypoint[]): Waypoint[] {
  if (waypoints.length <= 2) return waypoints;
  
  const optimized: Waypoint[] = [waypoints[0]];
  const remaining = [...waypoints.slice(1)];
  
  while (remaining.length > 0) {
    const last = optimized[optimized.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    
    remaining.forEach((wp, index) => {
      const dist = calculateDistance(last.lat, last.lng, wp.lat, wp.lng);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = index;
      }
    });
    
    optimized.push(remaining[nearestIndex]);
    remaining.splice(nearestIndex, 1);
  }
  
  return optimized;
}

export function RouteOptimizationDialog({
  open,
  onOpenChange,
  initialWaypoints = mockWaypoints,
  onOptimize,
}: RouteOptimizationDialogProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>(
    calculateETAs(initialWaypoints)
  );
  const [aiAnalysis, setAiAnalysis] = useState<{
    reasoning?: string;
    traffic_considerations?: string[];
    warnings?: string[];
    savings_percentage?: string;
  } | null>(null);
  
  const { optimizeRoute: aiOptimize, isOptimizing } = useRouteOptimization();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate route stats
  const routeStats = useMemo(() => {
    let totalDistance = 0;
    let totalDuration = 0;
    
    waypoints.forEach((wp, index) => {
      if (index > 0) {
        const prev = waypoints[index - 1];
        totalDistance += calculateDistance(prev.lat, prev.lng, wp.lat, wp.lng);
      }
      if (wp.duration) {
        totalDuration += wp.duration;
      }
    });
    
    // Add travel time (50 km/h average)
    const travelTime = (totalDistance / 50) * 60;
    totalDuration += travelTime;
    
    const hours = Math.floor(totalDuration / 60);
    const minutes = Math.round(totalDuration % 60);
    
    return {
      totalDistance: totalDistance.toFixed(1),
      totalDuration: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      stopCount: waypoints.length,
      pickups: waypoints.filter(w => w.type === "pickup").length,
      deliveries: waypoints.filter(w => w.type === "delivery").length,
    };
  }, [waypoints]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = waypoints.findIndex(w => w.id === active.id);
      const newIndex = waypoints.findIndex(w => w.id === over.id);
      
      const newWaypoints = arrayMove(waypoints, oldIndex, newIndex);
      setWaypoints(calculateETAs(newWaypoints));
      setAiAnalysis(null);
    }
  };

  const handleRemoveWaypoint = (id: string) => {
    const newWaypoints = waypoints.filter(w => w.id !== id);
    setWaypoints(calculateETAs(newWaypoints));
    setAiAnalysis(null);
  };

  const handleAIOptimize = async () => {
    const result = await aiOptimize(waypoints, {
      startTime: new Date().toISOString(),
      preferences: {
        minimizeDistance: true,
        minimizeTime: true,
      },
    });

    if (result) {
      setWaypoints(result.optimized_waypoints);
      setAiAnalysis({
        reasoning: result.analysis.reasoning,
        traffic_considerations: result.analysis.traffic_considerations,
        warnings: result.analysis.warnings,
        savings_percentage: result.analysis.actual_savings_percentage,
      });
    }
  };

  const handleBasicOptimize = () => {
    const optimized = optimizeRoute(waypoints);
    setWaypoints(calculateETAs(optimized));
    setAiAnalysis(null);
    toast.success("Route optimized using nearest-neighbor algorithm");
  };

  const handleReset = () => {
    setWaypoints(calculateETAs(initialWaypoints));
    setAiAnalysis(null);
    toast.info("Route reset to original order");
  };

  const handleApply = () => {
    onOptimize?.(waypoints);
    onOpenChange(false);
    toast.success("Route applied successfully");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            Route Optimization
          </DialogTitle>
          <DialogDescription>
            Drag and drop waypoints to reorder, or use AI optimization for the best route.
          </DialogDescription>
        </DialogHeader>

        {/* Route Stats */}
        <div className="grid grid-cols-5 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{routeStats.stopCount}</p>
              <p className="text-xs text-muted-foreground">Stops</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-success">{routeStats.pickups}</p>
              <p className="text-xs text-muted-foreground">Pickups</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-primary">{routeStats.deliveries}</p>
              <p className="text-xs text-muted-foreground">Deliveries</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{routeStats.totalDistance}</p>
              <p className="text-xs text-muted-foreground">km Total</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{routeStats.totalDuration}</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleAIOptimize}
            disabled={isOptimizing}
            className="flex-1 gap-2"
          >
            <Brain className={`h-4 w-4 ${isOptimizing ? "animate-pulse" : ""}`} />
            {isOptimizing ? "AI Analyzing..." : "AI Optimize"}
            <Sparkles className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBasicOptimize}
            disabled={isOptimizing}
          >
            <Zap className="h-4 w-4 mr-2" />
            Quick
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* AI Analysis Results */}
        {aiAnalysis && (
          <div className="space-y-2">
            {aiAnalysis.savings_percentage && parseFloat(aiAnalysis.savings_percentage) > 0 && (
              <Alert className="border-green-500/30 bg-green-500/10">
                <TrendingDown className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400">
                  Route optimized! Saved {aiAnalysis.savings_percentage}% travel distance
                </AlertDescription>
              </Alert>
            )}
            
            {aiAnalysis.reasoning && (
              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <p className="font-medium text-foreground mb-1 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Analysis
                </p>
                {aiAnalysis.reasoning}
              </div>
            )}

            {aiAnalysis.traffic_considerations && aiAnalysis.traffic_considerations.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Traffic Considerations:</p>
                <ul className="list-disc list-inside space-y-1">
                  {aiAnalysis.traffic_considerations.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiAnalysis.warnings && aiAnalysis.warnings.length > 0 && (
              <Alert variant="destructive" className="border-yellow-500/30 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-400">
                  {aiAnalysis.warnings.join('. ')}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Separator />

        {/* Waypoints list */}
        <ScrollArea className="h-[350px] pr-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={waypoints.map(w => w.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {waypoints.map((waypoint, index) => (
                  <SortableWaypoint
                    key={waypoint.id}
                    waypoint={waypoint}
                    index={index}
                    onRemove={handleRemoveWaypoint}
                    totalWaypoints={waypoints.length}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>Estimated fuel: ~{(parseFloat(routeStats.totalDistance) * 0.12).toFixed(1)}L</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleApply}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Apply Route
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
