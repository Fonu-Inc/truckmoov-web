import { useEffect, useMemo, useState } from "react";
import type { LatLngTuple } from "leaflet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { Button } from "@/components/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Badge } from "@/components/shadcn/badge";
import { Separator } from "@/components/shadcn/separator";
import {
  RoutePreviewMap,
  type RoutePreviewMapMarker,
} from "@/components/maps/RoutePreviewMap";
import {
  MapLocationInput,
  type MapLocation,
} from "@/components/maps/MapLocationInput";
import { Job } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Package,
  ClipboardList,
  Route,
  Calendar,
  DollarSign,
  Lock,
  Plus,
  X,
} from "lucide-react";

const jobSchema = z.object({
  reference: z.string().min(3).max(50),
  pickupAddress: z.string().min(5, "Pickup address required").max(200),
  pickupLat: z.coerce.number().min(-90).max(90),
  pickupLng: z.coerce.number().min(-180).max(180),
  deliveryAddress: z.string().min(5, "Delivery address required").max(200),
  deliveryLat: z.coerce.number().min(-90).max(90),
  deliveryLng: z.coerce.number().min(-180).max(180),
  cargoType: z.string().min(2, "Cargo type required").max(100),
  cargoWeight: z.coerce.number().min(0.1, "Weight must be positive"),
  cargoDescription: z.string().max(500).optional(),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  deadline: z.string().min(1, "Deadline required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

type JobFormData = z.infer<typeof jobSchema>;

export type JobFormSubmitData = JobFormData & {
  stops: Array<{
    address: string;
    latitude: number;
    longitude: number;
    contact_name?: string;
    contact_phone?: string;
    notes?: string;
  }>;
};

interface JobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job | null;
  onSubmit: (data: JobFormSubmitData) => void;
  isSubmitting?: boolean;
}

interface IntermediateStop {
  id: string;
  address: string;
  lat: number;
  lng: number;
}

interface JobRoutePoint {
  lat: number;
  lng: number;
  label: string;
  type: "pickup" | "stop" | "delivery";
}

const STEPS = [
  { id: 1, label: "Locations", icon: MapPin, description: "Pickup & delivery" },
  { id: 2, label: "Details", icon: ClipboardList, description: "Cargo & pricing" },
  { id: 3, label: "Review", icon: Check, description: "Confirm & create" },
] as const;

function generateReference() {
  return `JOB-${Date.now().toString(36).toUpperCase()}`;
}

export function JobFormDialog({
  open,
  onOpenChange,
  job,
  onSubmit,
  isSubmitting = false,
}: JobFormDialogProps) {
  const isEditing = !!job;
  const [step, setStep] = useState(1);
  const [stops, setStops] = useState<IntermediateStop[]>([]);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      reference: generateReference(),
      pickupAddress: "",
      pickupLat: 0,
      pickupLng: 0,
      deliveryAddress: "",
      deliveryLat: 0,
      deliveryLng: 0,
      cargoType: "",
      cargoWeight: 0,
      cargoDescription: "",
      amount: 0,
      deadline: "",
      priority: "medium",
    },
  });

  // Reset on open / job change
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setStops([]);
    if (job) {
      const jobStops =
        (job as Job & {
          stops?: Array<{
            address?: string;
            latitude?: number;
            longitude?: number;
            lat?: number;
            lng?: number;
          }>;
        }).stops ?? [];
      form.reset({
        reference: job.reference,
        pickupAddress: job.pickup.address,
        pickupLat: job.pickup.lat,
        pickupLng: job.pickup.lng,
        deliveryAddress: job.delivery.address,
        deliveryLat: job.delivery.lat,
        deliveryLng: job.delivery.lng,
        cargoType: job.cargo.type,
        cargoWeight: job.cargo.weight,
        cargoDescription: job.cargo.description,
        amount: job.amount,
        deadline: format(new Date(job.deadline), "yyyy-MM-dd'T'HH:mm"),
        priority: "medium",
      });
      setStops(
        jobStops.map((stop) => ({
          id: crypto.randomUUID(),
          address: stop.address ?? "",
          lat: stop.latitude ?? stop.lat ?? 0,
          lng: stop.longitude ?? stop.lng ?? 0,
        })),
      );
    } else {
      form.reset({
        reference: generateReference(),
        pickupAddress: "",
        pickupLat: 0,
        pickupLng: 0,
        deliveryAddress: "",
        deliveryLat: 0,
        deliveryLng: 0,
        cargoType: "",
        cargoWeight: 0,
        cargoDescription: "",
        amount: 0,
        deadline: "",
        priority: "medium",
      });
    }
  }, [open, job, form]);

  const values = form.watch();

  const pickupValue = useMemo<MapLocation>(
    () => ({
      address: values.pickupAddress || "",
      lat: values.pickupLat || 0,
      lng: values.pickupLng || 0,
    }),
    [values.pickupAddress, values.pickupLat, values.pickupLng]
  );
  const deliveryValue = useMemo<MapLocation>(
    () => ({
      address: values.deliveryAddress || "",
      lat: values.deliveryLat || 0,
      lng: values.deliveryLng || 0,
    }),
    [values.deliveryAddress, values.deliveryLat, values.deliveryLng]
  );

  const routePoints: JobRoutePoint[] = useMemo(() => {
    const arr: JobRoutePoint[] = [];
    if (pickupValue.lat && pickupValue.lng) {
      arr.push({
        lat: pickupValue.lat,
        lng: pickupValue.lng,
        label: pickupValue.address,
        type: "pickup",
      });
    }
    stops.forEach((s) => {
      if (s.lat && s.lng) {
        arr.push({ lat: s.lat, lng: s.lng, label: s.address, type: "stop" });
      }
    });
    if (deliveryValue.lat && deliveryValue.lng) {
      arr.push({
        lat: deliveryValue.lat,
        lng: deliveryValue.lng,
        label: deliveryValue.address,
        type: "delivery",
      });
    }
    return arr;
  }, [pickupValue, deliveryValue, stops]);

  const mapMarkers = useMemo<RoutePreviewMapMarker[]>(
    () =>
      routePoints.map((point) => ({
        position: [point.lat, point.lng] as LatLngTuple,
        label: point.label,
        color:
          point.type === "pickup"
            ? "#22c55e"
            : point.type === "delivery"
              ? "#ef4444"
              : "#f59e0b",
      })),
    [routePoints]
  );

  const mapWaypoints = useMemo<LatLngTuple[]>(
    () => routePoints.map((point) => [point.lat, point.lng]),
    [routePoints]
  );

  const handleNext = async () => {
    if (step === 1) {
      const ok = await form.trigger([
        "pickupAddress",
        "pickupLat",
        "pickupLng",
        "deliveryAddress",
        "deliveryLat",
        "deliveryLng",
      ]);
      if (!ok) return;
      setStep(2);
    } else if (step === 2) {
      const ok = await form.trigger([
        "priority",
        "cargoType",
        "cargoWeight",
        "amount",
        "deadline",
      ]);
      if (!ok) return;
      setStep(3);
    }
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleFinalSubmit = (data: JobFormData) => {
    onSubmit({
      ...data,
      stops: stops
        .filter((stop) => stop.address.trim())
        .map((stop) => ({
          address: stop.address,
          latitude: stop.lat,
          longitude: stop.lng,
        })),
    });
  };

  const addStop = () => {
    setStops((prev) => [
      ...prev,
      { id: crypto.randomUUID(), address: "", lat: 0, lng: 0 },
    ]);
  };

  const removeStop = (id: string) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStop = (id: string, value: MapLocation) => {
    setStops((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, address: value.address, lat: value.lat, lng: value.lng }
          : s
      )
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[680px] max-h-[88vh] overflow-y-auto bg-card border-border p-5">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditing ? "Edit Job" : "Create New Job"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the shipment details across the steps below."
                : "Plan a new shipment in three quick steps — locations, details, then review."}
            </DialogDescription>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center justify-between gap-1 py-1">
            {STEPS.map((s, idx) => {
              const isActive = step === s.id;
              const isComplete = step > s.id;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
                        isActive &&
                          "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20",
                        isComplete &&
                          "bg-primary/20 text-primary border-primary",
                        !isActive &&
                          !isComplete &&
                          "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {isComplete ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="hidden sm:block leading-tight">
                      <p
                        className={cn(
                          "text-xs font-medium",
                          isActive
                            ? "text-foreground"
                            : isComplete
                              ? "text-foreground/80"
                              : "text-muted-foreground"
                        )}
                      >
                        {s.id}. {s.label}
                      </p>
                    </div>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2 transition-colors",
                        step > s.id ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <Separator />

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFinalSubmit)}
              className="space-y-5"
            >
              {/* STEP 1 — LOCATIONS */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Step 1 · Enter pickup &amp; delivery
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Search for an address or drag the pin on the map. Add
                      stops if you need to refuel or break the trip.
                    </p>
                  </div>

                  {/* Pickup + Delivery side-by-side on md+ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <MapLocationInput
                      label="Pickup address"
                      placeholder="e.g. Apapa Port, Lagos"
                      pinColor="#22c55e"
                      value={pickupValue}
                      onLocationSelect={(v) => {
                        form.setValue("pickupAddress", v.address, {
                          shouldValidate: true,
                        });
                        form.setValue("pickupLat", v.lat, {
                          shouldValidate: true,
                        });
                        form.setValue("pickupLng", v.lng, {
                          shouldValidate: true,
                        });
                      }}
                    />
                    <MapLocationInput
                      label="Delivery address"
                      placeholder="e.g. Wuse Zone 5, Abuja"
                      pinColor="#ef4444"
                      value={deliveryValue}
                      onLocationSelect={(v) => {
                        form.setValue("deliveryAddress", v.address, {
                          shouldValidate: true,
                        });
                        form.setValue("deliveryLat", v.lat, {
                          shouldValidate: true,
                        });
                        form.setValue("deliveryLng", v.lng, {
                          shouldValidate: true,
                        });
                      }}
                    />
                  </div>

                  {/* Intermediate stops */}
                  {stops.length > 0 && (
                    <div className="space-y-2 p-3 rounded-md bg-muted/30 border border-border/50">
                      <p className="text-xs font-medium uppercase text-muted-foreground tracking-wide">
                        Intermediate stops
                      </p>
                      {stops.map((s, idx) => (
                        <div key={s.id} className="flex items-end gap-2">
                          <div className="flex-1">
                            <MapLocationInput
                              label={`Stop ${idx + 1}`}
                              placeholder="e.g. Fuel station, Lokoja"
                              pinColor="#f59e0b"
                              value={{
                                address: s.address,
                                lat: s.lat,
                                lng: s.lng,
                              }}
                              onLocationSelect={(v) => updateStop(s.id, v)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStop(s.id)}
                            className="text-muted-foreground hover:text-destructive mb-0.5"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addStop}
                    className="text-primary"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add intermediate stop
                  </Button>

                  {/* Progressive route map */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Route className="h-4 w-4 text-primary" />
                        {routePoints.length === 0
                          ? "Map preview"
                          : routePoints.length === 1
                            ? "Pickup location"
                            : "Route preview"}
                      </p>
                      {routePoints.length >= 2 && (
                        <Badge variant="outline" className="text-xs">
                          {routePoints.length} points
                        </Badge>
                      )}
                    </div>

                    <div className="relative h-[280px] overflow-hidden rounded-md border border-border">
                      <RoutePreviewMap
                        className="h-full w-full"
                        center={mapWaypoints[0]}
                        zoom={12}
                        markers={mapMarkers}
                        fitMarkers
                        routeWaypoints={
                          mapWaypoints.length >= 2 ? mapWaypoints : undefined
                        }
                        routeColor="#facc15"
                      />
                      {routePoints.length === 0 && (
                        <div className="pointer-events-none absolute bottom-3 left-1/2 z-[500] -translate-x-1/2 rounded-full bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-md backdrop-blur">
                          Centered on your current location
                        </div>
                      )}
                    </div>

                    {routePoints.length === 1 && (
                      <p className="text-xs text-muted-foreground">
                        Add a delivery address to generate the optimized route.
                      </p>
                    )}
                    {routePoints.length >= 2 && (
                      <p className="text-xs text-muted-foreground">
                        Use Optimize route on the map to compare available routes.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2 — DETAILS */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Step 2 · Job details
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Reference is auto-generated. Fill in cargo, pricing and
                      deadline.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="reference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Lock className="h-3 w-3" />
                            Job Reference (system-generated)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              readOnly
                              disabled
                              className="font-mono bg-muted/60"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Cargo (vertical) */}
                  <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      Cargo Details
                    </h4>
                    <FormField
                      control={form.control}
                      name="cargoType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo Type</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Electronics, Food, Construction…"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cargoWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (tons)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cargoDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Special handling notes, dimensions, fragility…"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Amount + Deadline (vertical inside group, side-by-side on md) */}
                  <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Pricing &amp; deadline
                    </h4>
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (NGN)</FormLabel>
                          <FormControl>
                            <Input type="number" step="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            Deadline
                          </FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3 — REVIEW */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Step 3 · Review &amp; create
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Double-check the details below before creating the job.
                    </p>
                  </div>

                  {/* Route summary */}
                  <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Route className="h-4 w-4 text-primary" />
                        Route
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {routePoints.length} stops
                      </Badge>
                    </div>
                    <div className="h-[220px] overflow-hidden rounded-md border border-border">
                      <RoutePreviewMap
                        className="h-full w-full"
                        center={mapWaypoints[0]}
                        zoom={11}
                        markers={mapMarkers}
                        fitMarkers
                        routeCoordinates={mapWaypoints}
                        routeColor="#facc15"
                        showRouteOptimizer={false}
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-success mt-1.5" />
                        <div className="flex-1">
                          <p className="text-xs uppercase text-muted-foreground tracking-wide">
                            Pickup
                          </p>
                          <p className="font-medium">
                            {values.pickupAddress || "—"}
                          </p>
                        </div>
                      </div>
                      {stops.map((s, i) => (
                        <div key={s.id} className="flex items-start gap-2">
                          <span className="h-2 w-2 rounded-full bg-warning mt-1.5" />
                          <div className="flex-1">
                            <p className="text-xs uppercase text-muted-foreground tracking-wide">
                              Stop {i + 1}
                            </p>
                            <p className="font-medium">
                              {s.address || "Unset"}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-destructive mt-1.5" />
                        <div className="flex-1">
                          <p className="text-xs uppercase text-muted-foreground tracking-wide">
                            Delivery
                          </p>
                          <p className="font-medium">
                            {values.deliveryAddress || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <SummaryCard label="Reference" value={values.reference} mono />
                    <SummaryCard
                      label="Priority"
                      value={values.priority?.toUpperCase()}
                    />
                    <SummaryCard label="Cargo type" value={values.cargoType} />
                    <SummaryCard
                      label="Weight"
                      value={`${values.cargoWeight} tons`}
                    />
                    <SummaryCard
                      label="Amount"
                      value={`₦ ${Number(values.amount || 0).toLocaleString()}`}
                    />
                    <SummaryCard
                      label="Deadline"
                      value={
                        values.deadline
                          ? format(new Date(values.deadline), "PPp")
                          : "—"
                      }
                    />
                  </div>

                  {values.cargoDescription && (
                    <div className="p-3 rounded-md bg-muted/30 border border-border/50">
                      <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1">
                        Description
                      </p>
                      <p className="text-sm">{values.cargoDescription}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Actions */}
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  )}
                  {step < 3 && (
                    <Button type="button" onClick={handleNext} variant="gradient">
                      Next
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                  {step === 3 && (
                    <Button type="submit" variant="gradient" loading={isSubmitting}>
                      <Check className="h-4 w-4 mr-1" />
                      {isEditing ? "Update Job" : "Create Job"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </>
  );
}

function SummaryCard({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="p-3 rounded-md bg-muted/30 border border-border/50">
      <p className="text-xs uppercase text-muted-foreground tracking-wide">
        {label}
      </p>
      <p className={cn("text-sm font-medium mt-0.5", mono && "font-mono")}>
        {value || "—"}
      </p>
    </div>
  );
}
