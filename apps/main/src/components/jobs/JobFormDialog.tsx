import type { LatLngTuple } from "leaflet";
import type { MapLocation } from "@/components/maps/MapLocationInput";
import type { RoutePreviewMapMarker } from "@/components/maps/RoutePreviewMap";
import type { JobFormPrefill } from "@/features/jobs/utils/jobPayload";
import type { Job } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  formatWithPattern, toDateTimeInputValue,
} from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ClipboardList,
  DollarSign,
  Lock,
  MapPin,
  Package,
  Paperclip,
  Plus,
  Route,
  ShieldAlert,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { MapLocationInput } from "@/components/maps/MapLocationInput";
import { RoutePreviewMap } from "@/components/maps/RoutePreviewMap";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
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
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Switch } from "@/components/shadcn/switch";
import { Textarea } from "@/components/shadcn/textarea";
import { cn } from "@/lib/utils";
import {
  ANY_VEHICLE_TYPE,
  CARGO_CATEGORIES,
  CARGO_UNITS,
  EQUIPMENT_OPTIONS,
  MAX_FILE_BYTES,
  SPECIAL_HANDLING,
  VEHICLE_TYPES,
} from "./jobFormOptions";

// Everything the wizard collects beyond the core fields flows into `metadata`
// and `attachmentFiles`. The Jobs page turns them into the dispatch payload
// (features/jobs/utils/jobPayload.ts) and uploads the files after the job is saved.

const jobSchema = z.object({
  reference: z.string().min(3).max(50),
  pickupAddress: z.string().min(
    5,
    "Pickup address required",
  ).max(200),
  pickupLat: z.coerce.number().min(-90).max(90),
  pickupLng: z.coerce.number().min(-180).max(180),
  deliveryAddress: z.string().min(
    5,
    "Delivery address required",
  ).max(200),
  deliveryLat: z.coerce.number().min(-90).max(90),
  deliveryLng: z.coerce.number().min(-180).max(180),
  cargoType: z.string().max(100).optional(),
  cargoWeight: z.coerce.number().min(
    0.1,
    "Weight must be positive",
  ),
  cargoDescription: z.string().max(500).optional(),
  amount: z.coerce.number().min(
    0,
    "Amount must be positive",
  ),
  deadline: z.string().min(
    1,
    "Deadline required",
  ),
  priority: z.enum([
    "low",
    "medium",
    "high",
    "urgent",
  ]),
  cargoCategory: z.string().optional(),
  cargoCategoryOther: z.string().optional(),
  packagesCount: z.coerce.number().min(0).optional(),
  cargoUnit: z.string().optional(),
  cargoValue: z.coerce.number().min(0).optional(),
  vehicleType: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

type LocationDetails = {
  include: boolean;
  contactName?: string;
  companyName?: string;
  contactPhone?: string;
  date?: string;
  timeFrom?: string;
  timeTo?: string;
  instructions?: string;
};

type StopKind = "simple" | "pickup-delivery";

type IntermediateStop = {
  id: string;
  kind: StopKind;
  address: string;
  lat: number;
  lng: number;
  details: LocationDetails;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  pickupDetails: LocationDetails;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  deliveryDetails: LocationDetails;
};

type Dimensions = {
  length?: number; width?: number; height?: number;
};

export type JobFormSubmitData = JobFormData & {
  stops: Array<{
    address: string;
    latitude: number;
    longitude: number;
    contact_name?: string;
    contact_phone?: string;
    notes?: string;
  }>;
  metadata: Record<string, unknown>;
  attachmentFiles: File[];
};

/** The job as the wizard shows it: the legacy shape plus what the old shape cannot hold. */
export type JobFormJob = Job & {
  priority?: JobFormData["priority"];
  prefill?: JobFormPrefill;
};

type JobFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: JobFormJob | null;
  onSubmit: (data: JobFormSubmitData) => void;
  isSubmitting?: boolean;
};

type JobRoutePoint = {
  lat: number;
  lng: number;
  label: string;
  type: "pickup" | "stop" | "delivery";
};

const STEPS = [
  {
    id: 1, label: "Locations", icon: MapPin,
  },
  {
    id: 2, label: "Details", icon: ClipboardList,
  },
  {
    id: 3, label: "Review", icon: Check,
  },
] as const;

function generateReference() {
  return `JOB-${Date.now().toString(36).toUpperCase()}`;
}

function emptyDetails(): LocationDetails {
  return { include: false };
}

function makeStop(kind: StopKind): IntermediateStop {
  return {
    id: crypto.randomUUID(),
    kind,
    address: "", lat: 0, lng: 0, details: emptyDetails(),
    pickupAddress: "", pickupLat: 0, pickupLng: 0, pickupDetails: emptyDetails(),
    deliveryAddress: "", deliveryLat: 0, deliveryLng: 0, deliveryDetails: emptyDetails(),
  };
}

export function JobFormDialog({
  open, onOpenChange, job, onSubmit, isSubmitting = false,
}: JobFormDialogProps) {
  const isEditing = !!job;
  const [
    step,
    setStep,
  ] = useState(1);
  const [
    stops,
    setStops,
  ] = useState<IntermediateStop[]>([]);
  const [
    pickupDetails,
    setPickupDetails,
  ] = useState<LocationDetails>(emptyDetails);
  const [
    deliveryDetails,
    setDeliveryDetails,
  ] = useState<LocationDetails>(emptyDetails);

  const [
    dimensionsOn,
    setDimensionsOn,
  ] = useState(false);
  const [
    dimensions,
    setDimensions,
  ] = useState<Dimensions>({});
  const [
    specialHandlingOn,
    setSpecialHandlingOn,
  ] = useState(false);
  const [
    specialHandling,
    setSpecialHandling,
  ] = useState<string[]>([]);
  const [
    specialHandlingOther,
    setSpecialHandlingOther,
  ] = useState("");
  const [
    equipmentOn,
    setEquipmentOn,
  ] = useState(false);
  const [
    equipment,
    setEquipment,
  ] = useState<string[]>([]);
  const [
    equipmentOther,
    setEquipmentOther,
  ] = useState("");
  const [
    attachments,
    setAttachments,
  ] = useState<File[]>([]);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      reference: generateReference(),
      pickupAddress: "", pickupLat: 0, pickupLng: 0,
      deliveryAddress: "", deliveryLat: 0, deliveryLng: 0,
      cargoType: "", cargoWeight: 0, cargoDescription: "",
      amount: 0, deadline: "", priority: "medium",
      cargoCategory: "", cargoCategoryOther: "",
      packagesCount: undefined, cargoUnit: "kg", cargoValue: undefined,
      vehicleType: ANY_VEHICLE_TYPE,
    },
  });

  useEffect(
    () => {
      if (!open)
        return;
      setStep(1);
      setStops([]);
      setPickupDetails(emptyDetails());
      setDeliveryDetails(emptyDetails());
      setDimensionsOn(false);
      setDimensions({});
      setSpecialHandlingOn(false);
      setSpecialHandling([]);
      setSpecialHandlingOther("");
      setEquipmentOn(false);
      setEquipment([]);
      setEquipmentOther("");
      setAttachments([]);
      if (job) {
        const prefill = job.prefill;
        const jobStops = (job as Job & {
          stops?: Array<{
            address?: string; latitude?: number; longitude?: number; lat?: number; lng?: number;
          }>;
        }).stops ?? [];
        form.reset({
          reference: job.reference,
          pickupAddress: job.pickup.address,
          pickupLat: job.pickup.lat, pickupLng: job.pickup.lng,
          deliveryAddress: job.delivery.address,
          deliveryLat: job.delivery.lat, deliveryLng: job.delivery.lng,
          cargoType: job.cargo.type,
          cargoWeight: job.cargo.weight,
          cargoDescription: job.cargo.description,
          amount: job.amount,
          deadline: toDateTimeInputValue(job.deadline),
          priority: job.priority ?? "medium",
          cargoCategory: prefill?.cargoCategory ?? "", cargoCategoryOther: prefill?.cargoCategoryOther ?? "",
          packagesCount: prefill?.packagesCount, cargoUnit: prefill?.cargoUnit ?? "kg", cargoValue: prefill?.cargoValue,
          vehicleType: prefill?.vehicleType ?? ANY_VEHICLE_TYPE,
        });
        if (prefill) {
          setPickupDetails(prefill.pickupDetails);
          setDeliveryDetails(prefill.deliveryDetails);
          if (prefill.dimensions) {
            setDimensionsOn(true);
            setDimensions(prefill.dimensions);
          }
          if (prefill.specialHandling.length > 0) {
            setSpecialHandlingOn(true);
            setSpecialHandling(prefill.specialHandling);
            setSpecialHandlingOther(prefill.specialHandlingOther);
          }
          if (prefill.equipment.length > 0) {
            setEquipmentOn(true);
            setEquipment(prefill.equipment);
            setEquipmentOther(prefill.equipmentOther);
          }
          setStops(prefill.stops.map(stop => ({
            ...makeStop("simple"),
            address: stop.address,
            lat: stop.lat,
            lng: stop.lng,
            details: stop.details,
          })));
        }
        else {
          setStops(jobStops.map(stop => ({
            ...makeStop("simple"),
            address: stop.address ?? "",
            lat: stop.latitude ?? stop.lat ?? 0,
            lng: stop.longitude ?? stop.lng ?? 0,
          })));
        }
      }
      else {
        form.reset({
          reference: generateReference(),
          pickupAddress: "", pickupLat: 0, pickupLng: 0,
          deliveryAddress: "", deliveryLat: 0, deliveryLng: 0,
          cargoType: "", cargoWeight: 0, cargoDescription: "",
          amount: 0, deadline: "", priority: "medium",
          cargoCategory: "", cargoCategoryOther: "",
          packagesCount: undefined, cargoUnit: "kg", cargoValue: undefined,
          vehicleType: ANY_VEHICLE_TYPE,
        });
      }
    },
    [
      open,
      job,
      form,
    ],
  );

  const values = form.watch();

  const pickupValue = useMemo<MapLocation>(
    () => ({
      address: values.pickupAddress || "", lat: values.pickupLat || 0, lng: values.pickupLng || 0,
    }),
    [
      values.pickupAddress,
      values.pickupLat,
      values.pickupLng,
    ],
  );

  const deliveryValue = useMemo<MapLocation>(
    () => ({
      address: values.deliveryAddress || "", lat: values.deliveryLat || 0, lng: values.deliveryLng || 0,
    }),
    [
      values.deliveryAddress,
      values.deliveryLat,
      values.deliveryLng,
    ],
  );

  const routePoints: JobRoutePoint[] = useMemo(
    () => {
      const arr: JobRoutePoint[] = [];
      if (pickupValue.lat && pickupValue.lng) {
        arr.push({
          lat: pickupValue.lat, lng: pickupValue.lng, label: pickupValue.address, type: "pickup",
        });
      }
      stops.forEach((s) => {
        if (s.kind === "simple" && s.lat && s.lng) {
          arr.push({
            lat: s.lat, lng: s.lng, label: s.address, type: "stop",
          });
        }
        else if (s.kind === "pickup-delivery") {
          if (s.pickupLat && s.pickupLng) {
            arr.push({
              lat: s.pickupLat, lng: s.pickupLng, label: s.pickupAddress, type: "stop",
            });
          }
          if (s.deliveryLat && s.deliveryLng) {
            arr.push({
              lat: s.deliveryLat, lng: s.deliveryLng, label: s.deliveryAddress, type: "stop",
            });
          }
        }
      });
      if (deliveryValue.lat && deliveryValue.lng) {
        arr.push({
          lat: deliveryValue.lat, lng: deliveryValue.lng, label: deliveryValue.address, type: "delivery",
        });
      }
      return arr;
    },
    [
      pickupValue,
      deliveryValue,
      stops,
    ],
  );

  const mapMarkers = useMemo<RoutePreviewMapMarker[]>(
    () => routePoints.map(point => ({
      position: [
        point.lat,
        point.lng,
      ] as LatLngTuple,
      label: point.label,
      color: point.type === "pickup" ? "#22c55e" : point.type === "delivery" ? "#ef4444" : "#f59e0b",
    })),
    [routePoints],
  );

  const mapWaypoints = useMemo<LatLngTuple[]>(
    () => routePoints.map(p => [
      p.lat,
      p.lng,
    ]),
    [routePoints],
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
      if (!ok)
        return;
      setStep(2);
    }
    else if (step === 2) {
      const ok = await form.trigger([
        "priority",
        "cargoWeight",
        "amount",
        "deadline",
      ]);
      if (!ok)
        return;
      setStep(3);
    }
  };

  const handleBack = () => setStep(s => Math.max(
    1,
    s - 1,
  ));

  const handleFinalSubmit = (data: JobFormData) => {
    const metadata: Record<string, unknown> = {
      priority: data.priority,
      cargoCategory: data.cargoCategory === "Other" ? data.cargoCategoryOther : data.cargoCategory,
      packagesCount: data.packagesCount,
      cargoUnit: data.cargoUnit,
      cargoValue: data.cargoValue,
      vehicleType: data.vehicleType,
      dimensions: dimensionsOn ? dimensions : undefined,
      specialHandling: specialHandlingOn ? specialHandling : undefined,
      specialHandlingOther: specialHandlingOn && specialHandling.includes("Other") ? specialHandlingOther : undefined,
      equipment: equipmentOn ? equipment : undefined,
      equipmentOther: equipmentOn && equipment.includes("Other") ? equipmentOther : undefined,
      pickupDetails: pickupDetails.include ? pickupDetails : undefined,
      deliveryDetails: deliveryDetails.include ? deliveryDetails : undefined,
      stops: stops.map(s => ({
        kind: s.kind,
        ...(s.kind === "simple"
          ? {
              address: s.address, lat: s.lat, lng: s.lng, details: s.details.include ? s.details : undefined,
            }
          : {
              pickupAddress: s.pickupAddress, pickupLat: s.pickupLat, pickupLng: s.pickupLng,
              pickupDetails: s.pickupDetails.include ? s.pickupDetails : undefined,
              deliveryAddress: s.deliveryAddress, deliveryLat: s.deliveryLat, deliveryLng: s.deliveryLng,
              deliveryDetails: s.deliveryDetails.include ? s.deliveryDetails : undefined,
            }),
      })),
      attachments: attachments.map(f => ({
        name: f.name, size: f.size, type: f.type,
      })),
    };
    const flatStops = stops.flatMap((s) => {
      if (s.kind === "simple" && s.address.trim()) {
        return [
          {
            address: s.address, latitude: s.lat, longitude: s.lng,
          },
        ];
      }
      const out: Array<{
        address: string; latitude: number; longitude: number;
      }> = [];
      if (s.pickupAddress.trim()) {
        out.push({
          address: s.pickupAddress, latitude: s.pickupLat, longitude: s.pickupLng,
        });
      }
      if (s.deliveryAddress.trim()) {
        out.push({
          address: s.deliveryAddress, latitude: s.deliveryLat, longitude: s.deliveryLng,
        });
      }
      return out;
    });
    onSubmit({
      ...data, stops: flatStops, metadata, attachmentFiles: attachments,
    });
  };

  const addStop = (kind: StopKind) => setStops(p => [
    ...p,
    makeStop(kind),
  ]);
  const removeStop = (id: string) => setStops(p => p.filter(s => s.id !== id));
  const patchStop = (id: string, patch: Partial<IntermediateStop>) =>
    setStops(p => p.map(s => s.id === id ? {
      ...s, ...patch,
    } : s));

  const toggleMulti = (list: string[], setter: (v: string[]) => void, value: string) => setter(list.includes(value) ? list.filter(v => v !== value) : [
    ...list,
    value,
  ]);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const kept = files.filter(f => f.size <= MAX_FILE_BYTES);
    if (kept.length !== files.length) {
      // ponytail: silent skip on oversized files; wire toast when file endpoint lands
    }
    setAttachments(prev => [
      ...prev,
      ...kept,
    ]);
    e.target.value = "";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto bg-card border-border p-5">
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

        <div className="flex items-center justify-between gap-1 py-1">
          {STEPS.map((s, idx) => {
            const isActive = step === s.id;
            const isComplete = step > s.id;
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className="flex items-center flex-1"
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
                    isActive && "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20",
                    isComplete && "bg-primary/20 text-primary border-primary",
                    !isActive && !isComplete && "bg-muted text-muted-foreground border-border",
                  )}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="hidden sm:block leading-tight">
                    <p className={cn(
                      "text-xs font-medium",
                      isActive ? "text-foreground" : isComplete ? "text-foreground/80" : "text-muted-foreground",
                    )}
                    >
                      {s.id}
                      .
                      {" "}
                      {s.label}
                    </p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    step > s.id ? "bg-primary" : "bg-border",
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
                    Step 1 · Locations
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Build the route: pickup, delivery, and any intermediate stops.
                    Contact details, dates, and time windows are collected in Step 2.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <MapLocationInput
                    label="Pickup address"
                    placeholder="e.g. Apapa Port, Lagos"
                    pinColor="#22c55e"
                    value={pickupValue}
                    onLocationSelect={(v) => {
                      form.setValue(
                        "pickupAddress",
                        v.address,
                        { shouldValidate: true },
                      );
                      form.setValue(
                        "pickupLat",
                        v.lat,
                        { shouldValidate: true },
                      );
                      form.setValue(
                        "pickupLng",
                        v.lng,
                        { shouldValidate: true },
                      );
                    }}
                  />
                  <MapLocationInput
                    label="Delivery address"
                    placeholder="e.g. Wuse Zone 5, Abuja"
                    pinColor="#ef4444"
                    value={deliveryValue}
                    onLocationSelect={(v) => {
                      form.setValue(
                        "deliveryAddress",
                        v.address,
                        { shouldValidate: true },
                      );
                      form.setValue(
                        "deliveryLat",
                        v.lat,
                        { shouldValidate: true },
                      );
                      form.setValue(
                        "deliveryLng",
                        v.lng,
                        { shouldValidate: true },
                      );
                    }}
                  />
                </div>

                {stops.length > 0 && (
                  <div className="space-y-3 p-3 rounded-md bg-muted/30 border border-border/50">
                    <p className="text-xs font-medium uppercase text-muted-foreground tracking-wide">
                      Intermediate stops
                    </p>
                    {stops.map((s, idx) => (
                      <div
                        key={s.id}
                        className="rounded-md border border-border/60 p-3 bg-background/60 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-primary border-primary/40 shrink-0"
                          >
                            Stop
                            {" "}
                            {idx + 1}
                          </Badge>
                          <Select
                            value={s.kind}
                            onValueChange={(v: StopKind) => patchStop(
                              s.id,
                              { kind: v },
                            )}
                          >
                            <SelectTrigger className="h-8 flex-1 max-w-[280px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="simple">Quick stop (fuel, rest, inspection…)</SelectItem>
                              <SelectItem value="pickup-delivery">Pickup &amp; delivery stop</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStop(s.id)}
                            className="ml-auto text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {s.kind === "simple"
                          ? (
                              <MapLocationInput
                                label="Stop location"
                                placeholder="e.g. Fuel station, Lokoja"
                                pinColor="#f59e0b"
                                value={{
                                  address: s.address, lat: s.lat, lng: s.lng,
                                }}
                                onLocationSelect={v => patchStop(
                                  s.id,
                                  {
                                    address: v.address, lat: v.lat, lng: v.lng,
                                  },
                                )}
                              />
                            )
                          : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <MapLocationInput
                                  label="Intermediate pickup"
                                  placeholder="e.g. Warehouse B"
                                  pinColor="#3b82f6"
                                  value={{
                                    address: s.pickupAddress, lat: s.pickupLat, lng: s.pickupLng,
                                  }}
                                  onLocationSelect={v => patchStop(
                                    s.id,
                                    {
                                      pickupAddress: v.address, pickupLat: v.lat, pickupLng: v.lng,
                                    },
                                  )}
                                />
                                <MapLocationInput
                                  label="Intermediate delivery"
                                  placeholder="e.g. Store C"
                                  pinColor="#a855f7"
                                  value={{
                                    address: s.deliveryAddress, lat: s.deliveryLat, lng: s.deliveryLng,
                                  }}
                                  onLocationSelect={v => patchStop(
                                    s.id,
                                    {
                                      deliveryAddress: v.address, deliveryLat: v.lat, deliveryLng: v.lng,
                                    },
                                  )}
                                />
                              </div>
                            )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addStop("simple")}
                    className="text-primary"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Quick stop
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addStop("pickup-delivery")}
                    className="text-primary"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add pickup &amp; delivery stop
                  </Button>
                </div>

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
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        {routePoints.length}
                        {" "}
                        points
                      </Badge>
                    )}
                  </div>

                  {routePoints.length === 0
                    ? (
                        <div className="h-[280px] rounded-md border border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center px-6">
                          <MapPin className="h-6 w-6 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">Map is idle</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Enter a pickup address above — the first pin will drop here.
                          </p>
                        </div>
                      )
                    : (
                        <div className="relative h-[280px] overflow-hidden rounded-md border border-border">
                          <RoutePreviewMap
                            className="h-full w-full"
                            center={mapWaypoints[0]}
                            zoom={12}
                            markers={mapMarkers}
                            fitMarkers
                            routeWaypoints={mapWaypoints.length >= 2 ? mapWaypoints : undefined}
                            routeColor="#facc15"
                          />
                        </div>
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
                    Add optional contact details for each stop, then cargo, vehicle
                    preference, pricing and any special handling requirements. The
                    route map is available on the Review step.
                  </p>
                </div>

                {/* Location Details */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Location Details
                  </h4>
                  <LocationDetailsCard
                    title="Pickup"
                    subtitle={values.pickupAddress}
                    value={pickupDetails}
                    onChange={setPickupDetails}
                  />
                  {stops.map((s, i) => (
                    s.kind === "simple"
                      ? (
                          <LocationDetailsCard
                            key={s.id}
                            title={`Stop ${i + 1}`}
                            subtitle={s.address}
                            value={s.details}
                            onChange={d => patchStop(
                              s.id,
                              { details: d },
                            )}
                          />
                        )
                      : (
                          <div
                            key={s.id}
                            className="grid grid-cols-1 md:grid-cols-2 gap-3"
                          >
                            <LocationDetailsCard
                              title={`Stop ${i + 1} · Pickup`}
                              subtitle={s.pickupAddress}
                              value={s.pickupDetails}
                              onChange={d => patchStop(
                                s.id,
                                { pickupDetails: d },
                              )}
                            />
                            <LocationDetailsCard
                              title={`Stop ${i + 1} · Delivery`}
                              subtitle={s.deliveryAddress}
                              value={s.deliveryDetails}
                              onChange={d => patchStop(
                                s.id,
                                { deliveryDetails: d },
                              )}
                            />
                          </div>
                        )
                  ))}
                  <LocationDetailsCard
                    title="Delivery"
                    subtitle={values.deliveryAddress}
                    value={deliveryDetails}
                    onChange={setDeliveryDetails}
                  />
                </div>

                {/* Job Information */}
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
                            <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
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

                {/* Cargo Information */}
                <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Cargo Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="cargoCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CARGO_CATEGORIES.map(c => (
                                <SelectItem
                                  key={c}
                                  value={c}
                                >
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {values.cargoCategory === "Other" && (
                      <FormField
                        control={form.control}
                        name="cargoCategoryOther"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specify other category</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Custom category"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name="cargoDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Contents, packaging notes, handling remarks…"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Cargo Measurements */}
                <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Cargo Measurements
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="packagesCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Packages count</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cargoWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cargoUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "kg"}
                          >
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {CARGO_UNITS.map(u => (
                                <SelectItem
                                  key={u}
                                  value={u}
                                >
                                  {u}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cargoValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated value (NGN)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={dimensionsOn}
                      onCheckedChange={setDimensionsOn}
                      id="dim-toggle"
                    />
                    <Label
                      htmlFor="dim-toggle"
                      className="text-sm"
                    >
                      Add package dimensions (L × W × H)
                    </Label>
                  </div>
                  {dimensionsOn && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Length (cm)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={dimensions.length ?? ""}
                          onChange={e => setDimensions(d => ({
                            ...d, length: e.target.value ? Number(e.target.value) : undefined,
                          }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Width (cm)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={dimensions.width ?? ""}
                          onChange={e => setDimensions(d => ({
                            ...d, width: e.target.value ? Number(e.target.value) : undefined,
                          }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Height (cm)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={dimensions.height ?? ""}
                          onChange={e => setDimensions(d => ({
                            ...d, height: e.target.value ? Number(e.target.value) : undefined,
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Vehicle Requirements */}
                <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    Vehicle Requirements
                  </h4>
                  <FormField
                    control={form.control}
                    name="vehicleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ANY_VEHICLE_TYPE}
                        >
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {VEHICLE_TYPES.map(v => (
                              <SelectItem
                                key={v}
                                value={v}
                              >
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Special Handling */}
                <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-primary" />
                      Special Handling (optional)
                    </h4>
                    <Switch
                      checked={specialHandlingOn}
                      onCheckedChange={setSpecialHandlingOn}
                    />
                  </div>
                  {specialHandlingOn && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {SPECIAL_HANDLING.map(option => (
                          <label
                            key={option}
                            className={cn(
                              "flex items-center gap-2 rounded-md border border-border/60 p-2 text-sm cursor-pointer",
                              specialHandling.includes(option) && "border-primary bg-primary/5",
                            )}
                          >
                            <Checkbox
                              checked={specialHandling.includes(option)}
                              onCheckedChange={() => toggleMulti(
                                specialHandling,
                                setSpecialHandling,
                                option,
                              )}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                      {specialHandling.includes("Other") && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Specify other special handling</Label>
                          <Input
                            value={specialHandlingOther}
                            onChange={e => setSpecialHandlingOther(e.target.value)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Equipment */}
                <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      Required Equipment (optional)
                    </h4>
                    <Switch
                      checked={equipmentOn}
                      onCheckedChange={setEquipmentOn}
                    />
                  </div>
                  {equipmentOn && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {EQUIPMENT_OPTIONS.map(option => (
                          <label
                            key={option}
                            className={cn(
                              "flex items-center gap-2 rounded-md border border-border/60 p-2 text-sm cursor-pointer",
                              equipment.includes(option) && "border-primary bg-primary/5",
                            )}
                          >
                            <Checkbox
                              checked={equipment.includes(option)}
                              onCheckedChange={() => toggleMulti(
                                equipment,
                                setEquipment,
                                option,
                              )}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                      {equipment.includes("Other") && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Specify other equipment</Label>
                          <Input
                            value={equipmentOther}
                            onChange={e => setEquipmentOther(e.target.value)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Pricing & deadline */}
                <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Pricing &amp; deadline
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (NGN)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="100"
                              {...field}
                            />
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
                            <Input
                              type="datetime-local"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Attachments */}
                <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-primary" />
                    Attachments (optional)
                  </h4>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileAdd}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-primary file:font-medium hover:file:bg-primary/20"
                  />
                  {attachments.length > 0 && (
                    <ul className="space-y-1">
                      {attachments.map((f, i) => (
                        <li
                          key={`${f.name}-${i}`}
                          className="flex items-center justify-between rounded-md border border-border/60 px-3 py-1.5 text-xs"
                        >
                          <span className="truncate">
                            {f.name}
                            {" "}
                            <span className="text-muted-foreground">
                              ·
                              {" "}
                              {(f.size / 1024).toFixed(0)}
                              {" "}
                              KB
                            </span>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[11px] text-muted-foreground">Max 3 MB per file.</p>
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
                    Full summary of the job. Go back to adjust anything.
                  </p>
                </div>

                {/* Route */}
                <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Route className="h-4 w-4 text-primary" />
                      Route
                    </h4>
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {routePoints.length}
                      {" "}
                      stops
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
                    <RouteRow
                      color="bg-success"
                      label="Pickup"
                      value={values.pickupAddress}
                    />
                    {stops.map((s, i) => (
                      s.kind === "simple"
                        ? (
                            <RouteRow
                              key={s.id}
                              color="bg-warning"
                              label={`Stop ${i + 1}`}
                              value={s.address}
                            />
                          )
                        : (
                            <div
                              key={s.id}
                              className="space-y-1"
                            >
                              <RouteRow
                                color="bg-primary"
                                label={`Stop ${i + 1} pickup`}
                                value={s.pickupAddress}
                              />
                              <RouteRow
                                color="bg-accent"
                                label={`Stop ${i + 1} delivery`}
                                value={s.deliveryAddress}
                              />
                            </div>
                          )
                    ))}
                    <RouteRow
                      color="bg-destructive"
                      label="Delivery"
                      value={values.deliveryAddress}
                    />
                  </div>
                </div>

                {/* Location Details */}
                {(pickupDetails.include || deliveryDetails.include
                  || stops.some(s => s.details.include || s.pickupDetails.include || s.deliveryDetails.include)) && (
                  <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-3">
                    <h4 className="font-medium text-sm">Location Details</h4>
                    <ReviewLocationBlock
                      title="Pickup"
                      details={pickupDetails}
                    />
                    {stops.map((s, i) => (
                      s.kind === "simple"
                        ? (
                            <ReviewLocationBlock
                              key={s.id}
                              title={`Stop ${i + 1}`}
                              details={s.details}
                            />
                          )
                        : (
                            <div
                              key={s.id}
                              className="grid grid-cols-1 md:grid-cols-2 gap-3"
                            >
                              <ReviewLocationBlock
                                title={`Stop ${i + 1} · Pickup`}
                                details={s.pickupDetails}
                              />
                              <ReviewLocationBlock
                                title={`Stop ${i + 1} · Delivery`}
                                details={s.deliveryDetails}
                              />
                            </div>
                          )
                    ))}
                    <ReviewLocationBlock
                      title="Delivery"
                      details={deliveryDetails}
                    />
                  </div>
                )}

                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <SummaryCard
                    label="Reference"
                    value={values.reference}
                    mono
                  />
                  <SummaryCard
                    label="Priority"
                    value={values.priority?.toUpperCase()}
                  />
                  <SummaryCard
                    label="Cargo category"
                    value={values.cargoCategory === "Other" ? values.cargoCategoryOther : values.cargoCategory}
                  />
                  <SummaryCard
                    label="Weight"
                    value={values.cargoWeight ? `${values.cargoWeight} ${values.cargoUnit || "kg"}` : undefined}
                  />
                  <SummaryCard
                    label="Packages"
                    value={values.packagesCount != null ? String(values.packagesCount) : undefined}
                  />
                  <SummaryCard
                    label="Estimated value"
                    value={values.cargoValue ? `₦ ${Number(values.cargoValue).toLocaleString()}` : undefined}
                  />
                  <SummaryCard
                    label="Vehicle type"
                    value={values.vehicleType}
                  />
                  <SummaryCard
                    label="Job price"
                    value={values.amount ? `₦ ${Number(values.amount).toLocaleString()}` : undefined}
                  />
                  <SummaryCard
                    label="Deadline"
                    value={values.deadline ? formatWithPattern(
                      values.deadline,
                      "PPp",
                    ) : undefined}
                  />
                </div>

                {values.cargoDescription && (
                  <div className="p-3 rounded-md bg-muted/30 border border-border/50">
                    <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1">Description</p>
                    <p className="text-sm">{values.cargoDescription}</p>
                  </div>
                )}

                {dimensionsOn && (dimensions.length || dimensions.width || dimensions.height) && (
                  <div className="p-3 rounded-md bg-muted/30 border border-border/50">
                    <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1">Dimensions</p>
                    <p className="text-sm">
                      {dimensions.length ?? "—"}
                      {" "}
                      ×
                      {" "}
                      {dimensions.width ?? "—"}
                      {" "}
                      ×
                      {" "}
                      {dimensions.height ?? "—"}
                      {" "}
                      cm
                    </p>
                  </div>
                )}

                {specialHandlingOn && specialHandling.length > 0 && (
                  <div className="p-3 rounded-md bg-muted/30 border border-border/50">
                    <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1.5">Special handling</p>
                    <div className="flex flex-wrap gap-1.5">
                      {specialHandling.map(h => (
                        <Badge
                          key={h}
                          variant="outline"
                          className="text-xs"
                        >
                          {h === "Other" && specialHandlingOther ? specialHandlingOther : h}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {equipmentOn && equipment.length > 0 && (
                  <div className="p-3 rounded-md bg-muted/30 border border-border/50">
                    <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1.5">Required equipment</p>
                    <div className="flex flex-wrap gap-1.5">
                      {equipment.map(e => (
                        <Badge
                          key={e}
                          variant="outline"
                          className="text-xs"
                        >
                          {e === "Other" && equipmentOther ? equipmentOther : e}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {attachments.length > 0 && (
                  <div className="p-3 rounded-md bg-muted/30 border border-border/50">
                    <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1.5">Attachments</p>
                    <ul className="space-y-0.5 text-xs">
                      {attachments.map((f, i) => (
                        <li key={`${f.name}-${i}`}>
                          {f.name}
                          {" "}
                          <span className="text-muted-foreground">
                            ·
                            {" "}
                            {(f.size / 1024).toFixed(0)}
                            {" "}
                            KB
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

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
                  <Button
                    type="button"
                    onClick={handleNext}
                    variant="gradient"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
                {step === 3 && (
                  <Button
                    type="submit"
                    variant="gradient"
                    loading={isSubmitting}
                  >
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
  );
}

function LocationDetailsCard({
  title, subtitle, value, onChange,
}: {
  title: string;
  subtitle?: string;
  value: LocationDetails;
  onChange: (d: LocationDetails) => void;
}) {
  const set = (patch: Partial<LocationDetails>) => onChange({
    ...value, ...patch,
  });
  return (
    <div className="rounded-md border border-border/60 p-3 space-y-3 bg-background/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold">{title}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
        </div>
        <label className="flex items-center gap-1.5 text-xs">
          <Checkbox
            checked={value.include}
            onCheckedChange={c => set({ include: !!c })}
          />
          Include Details
        </label>
      </div>
      <fieldset
        disabled={!value.include}
        className={cn(
          "space-y-2",
          !value.include && "opacity-50",
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Contact person</Label>
            <Input
              value={value.contactName ?? ""}
              onChange={e => set({ contactName: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Company (optional)</Label>
            <Input
              value={value.companyName ?? ""}
              onChange={e => set({ companyName: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Phone number</Label>
            <Input
              value={value.contactPhone ?? ""}
              onChange={e => set({ contactPhone: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input
              type="date"
              value={value.date ?? ""}
              onChange={e => set({ date: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Time from</Label>
            <Input
              type="time"
              value={value.timeFrom ?? ""}
              onChange={e => set({ timeFrom: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Time to</Label>
            <Input
              type="time"
              value={value.timeTo ?? ""}
              onChange={e => set({ timeTo: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Instructions</Label>
          <Textarea
            rows={2}
            value={value.instructions ?? ""}
            onChange={e => set({ instructions: e.target.value })}
          />
        </div>
      </fieldset>
    </div>
  );
}

function ReviewLocationBlock({
  title, details,
}: {
  title: string; details: LocationDetails;
}) {
  if (!details.include)
    return null;
  const rows: Array<[string, string | undefined]> = [
    [
      "Contact",
      details.contactName,
    ],
    [
      "Company",
      details.companyName,
    ],
    [
      "Phone",
      details.contactPhone,
    ],
    [
      "Date",
      details.date,
    ],
    [
      "Time window",
      details.timeFrom && details.timeTo ? `${details.timeFrom} → ${details.timeTo}` : details.timeFrom ?? details.timeTo,
    ],
    [
      "Instructions",
      details.instructions,
    ],
  ];
  const filled = rows.filter(([
    , v,
  ]) => v && v.trim());
  if (filled.length === 0)
    return null;
  return (
    <div className="rounded-md border border-border/50 p-2.5 space-y-1">
      <p className="text-[11px] uppercase text-muted-foreground tracking-wide">{title}</p>
      {filled.map(([
        k,
        v,
      ]) => (
        <p
          key={k}
          className="text-xs"
        >
          <span className="text-muted-foreground">
            {k}
            :
          </span>
          {" "}
          {v}
        </p>
      ))}
    </div>
  );
}

function RouteRow({
  color, label, value,
}: {
  color: string; label: string; value?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className={cn(
        "h-2 w-2 rounded-full mt-1.5",
        color,
      )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase text-muted-foreground tracking-wide">{label}</p>
        <p className="font-medium truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

function SummaryCard({
  label, value, mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="p-3 rounded-md bg-muted/30 border border-border/50">
      <p className="text-xs uppercase text-muted-foreground tracking-wide">{label}</p>
      <p className={cn(
        "text-sm font-medium mt-0.5",
        mono && "font-mono",
      )}
      >
        {value || "—"}
      </p>
    </div>
  );
}
