import type { ReactNode } from "react";
import type { DetailState } from "@/features/apply/components/ui/DetailDialog";
import type {
  DeviceRequestValues, VehicleValues,
} from "@/features/apply/utils/applySchemas";

import type {
  DeviceRequest, VehicleEntry,
} from "@/features/apply/utils/applyTypes";
import {
  ArrowLeft,
  ArrowRight,
  Car,
  ChevronDown,
  Eye,
  HardDrive,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  AddVehicleModal,
  RequestDevicesModal,
  UploadModal,
} from "@/features/apply/components/forms/ApplyModals";
import { DetailDialog } from "@/features/apply/components/ui/DetailDialog";
import { useApplyDraftStore } from "@/features/apply/stores/applyDraftStore";
import {
  PURCHASE_TYPES,
  SIM_CARRIERS,
  uid,
  VEHICLE_TYPES,
} from "@/features/apply/utils/applyTypes";
import { cn } from "@/lib/utils";

const VEHICLE_CSV_HEADERS = [
  "Registration Number",
  "Vehicle Type",
  "Vehicle Make",
  "Vehicle Model",
  "Vehicle Year",
  "Engine Number",
  "Chassis Number",
  "Vehicle Color",
  "Engine Capacity",
  "Odometer Reading",
  "Type of Purchase",
  "License Plan Selected",
];

const VEHICLE_CSV_SAMPLE = [
  "LAG-123-ABC",
  "Truck",
  "Toyota",
  "Hilux",
  "2021",
  "ENG-000123",
  "JTEBU5JR9",
  "White",
  "2.8L",
  "84500",
  "Owned",
  "Standard Fleet",
];
type FleetRequirementsStepProps = {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
};

/**
 * ponytail: there is no fleet endpoint on the public onboarding-application API.
 * Vehicles and device requests are collected in full and persisted to
 * applyDraftStore so nothing the applicant types is lost, then submitted once a
 * `/auth/onboarding/applications/:id/fleet` endpoint exists.
 */
export function FleetRequirementsStep({
  onBack,
  onNext,
  nextLabel,
}: FleetRequirementsStepProps) {
  const fleet = useApplyDraftStore(state => state.fleet);
  const setFleet = useApplyDraftStore(state => state.setFleet);

  const [
    expanded,
    setExpanded,
  ] = useState<"vehicles" | "devices" | null>(null);
  const [
    vehicleOpen,
    setVehicleOpen,
  ] = useState(false);
  const [
    uploadOpen,
    setUploadOpen,
  ] = useState(false);
  const [
    deviceOpen,
    setDeviceOpen,
  ] = useState(false);
  const [
    editingRequest,
    setEditingRequest,
  ] = useState<DeviceRequest | null>(null);
  const [
    detail,
    setDetail,
  ] = useState<DetailState | null>(null);

  const deviceTotal = fleet.deviceRequests.reduce(
    (total, request) => total + request.quantity,
    0,
  );
  const canProceed = fleet.vehicles.length > 0;

  function addVehicle(values: VehicleValues) {
    setFleet(previous => ({
      ...previous,
      vehicles: [
        ...previous.vehicles,
        {
          id: uid(),
          registrationNumber: values.registrationNumber,
          vehicleType: values.vehicleType,
          otherVehicleType: values.otherVehicleType,
          make: values.make,
          model: values.model,
          year: values.year ?? "",
          engineNumber: values.engineNumber ?? "",
          chassisNumber: values.chassisNumber ?? "",
          color: values.color ?? "",
          engineCapacity: values.engineCapacity ?? "",
          odometer: values.odometer ?? "",
          purchaseType: values.purchaseType ?? "",
          otherPurchaseType: values.otherPurchaseType,
        },
      ],
    }));
  }

  function addDeviceRequest(values: DeviceRequestValues) {
    if (editingRequest) {
      setFleet(previous => ({
        ...previous,
        deviceRequests: previous.deviceRequests.map(request => (
          request.id === editingRequest.id
            ? {
                ...request,
                quantity: values.quantity,
                manufacturer: values.manufacturer,
                useCase: values.useCase,
                notes: values.notes ?? "",
              }
            : request
        )),
      }));
      setEditingRequest(null);
      toast.success("Device request updated.");
      return;
    }

    setFleet(previous => ({
      ...previous,
      deviceRequests: [
        ...previous.deviceRequests,
        {
          id: uid(),
          quantity: values.quantity,
          manufacturer: values.manufacturer,
          useCase: values.useCase,
          notes: values.notes ?? "",
          includeSim: true,
          simCarrier: SIM_CARRIERS[0],
        },
      ],
    }));
  }

  function addVehiclesFromRows(rows: string[][]) {
    const parsed: VehicleEntry[] = rows
      .filter(row => (row[0] ?? "").trim())
      .map(row => ({
        id: uid(),
        registrationNumber: (row[0] ?? "").trim(),
        vehicleType: (row[1] ?? "").trim(),
        make: (row[2] ?? "").trim(),
        model: (row[3] ?? "").trim(),
        year: (row[4] ?? "").trim(),
        engineNumber: (row[5] ?? "").trim(),
        chassisNumber: (row[6] ?? "").trim(),
        color: (row[7] ?? "").trim(),
        engineCapacity: (row[8] ?? "").trim(),
        odometer: (row[9] ?? "").trim(),
        purchaseType: (row[10] ?? "").trim(),
      }));

    if (parsed.length === 0) {
      toast.error("No valid vehicle rows found.");
      return 0;
    }

    setFleet(previous => ({
      ...previous,
      vehicles: [
        ...previous.vehicles,
        ...parsed,
      ],
    }));
    return parsed.length;
  }

  function openVehicleDetail(vehicle: VehicleEntry, editing: boolean) {
    setDetail({
      title: `Vehicle · ${vehicle.registrationNumber || "Details"}`,
      editing,
      fields: [
        {
          key: "registrationNumber", label: "Registration Number", value: vehicle.registrationNumber, editable: true,
        },
        {
          key: "vehicleType", label: "Vehicle Type", value: vehicle.vehicleType, editable: true, options: VEHICLE_TYPES,
        },
        {
          key: "make", label: "Vehicle Make", value: vehicle.make, editable: true,
        },
        {
          key: "model", label: "Vehicle Model", value: vehicle.model, editable: true,
        },
        {
          key: "year", label: "Vehicle Year", value: vehicle.year, editable: true,
        },
        {
          key: "engineNumber", label: "Engine Number", value: vehicle.engineNumber, editable: true,
        },
        {
          key: "chassisNumber", label: "Chassis Number", value: vehicle.chassisNumber, editable: true,
        },
        {
          key: "color", label: "Vehicle Color", value: vehicle.color, editable: true,
        },
        {
          key: "engineCapacity", label: "Engine Capacity", value: vehicle.engineCapacity, editable: true,
        },
        {
          key: "odometer", label: "Odometer Reading", value: vehicle.odometer, editable: true,
        },
        {
          key: "purchaseType", label: "Type of Purchase", value: vehicle.purchaseType, editable: true, options: PURCHASE_TYPES,
        },
      ],
      onSave: (values) => {
        setFleet(previous => ({
          ...previous,
          vehicles: previous.vehicles.map(item => (
            item.id === vehicle.id ? {
              ...item, ...values,
            } : item
          )),
        }));
        toast.success("Vehicle updated.");
      },
    });
  }

  function openDeviceDetail(request: DeviceRequest) {
    setDetail({
      title: `Device Request · ${request.quantity} × ${request.manufacturer}`,
      editing: false,
      fields: [
        {
          key: "quantity", label: "Number of Devices", value: String(request.quantity),
        },
        {
          key: "manufacturer", label: "Manufacturer", value: request.manufacturer,
        },
        {
          key: "useCase", label: "Use Case", value: request.useCase,
        },
        {
          key: "notes", label: "Additional Notes", value: request.notes,
        },
      ],
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Fleet Requirements</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your vehicles and request tracking devices. Devices provisioned through Fleet Pro use
          MTN SIM connectivity.
        </p>
      </div>

      <SectionCard
        icon={<Car className="h-5 w-5 text-primary" />}
        title="Vehicles"
        description="Upload your vehicle list in bulk or add vehicles one at a time."
        count={fleet.vehicles.length}
        summary={`${fleet.vehicles.length} Vehicle${fleet.vehicles.length === 1 ? "" : "s"} Added`}
        expanded={expanded === "vehicles"}
        onToggle={() => setExpanded(expanded === "vehicles" ? null : "vehicles")}
        empty={fleet.vehicles.length === 0}
        actions={(
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Vehicles
            </Button>
            <Button
              size="sm"
              onClick={() => setVehicleOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </>
        )}
      >
        {fleet.vehicles.map(vehicle => (
          <Row
            key={vehicle.id}
            primary={vehicle.registrationNumber || "—"}
            secondary={[
              vehicle.make,
              vehicle.model,
              vehicle.vehicleType === "Other" ? vehicle.otherVehicleType : vehicle.vehicleType,
            ].filter(Boolean).join(" · ")}
            onView={() => openVehicleDetail(
              vehicle,
              false,
            )}
            onEdit={() => openVehicleDetail(
              vehicle,
              true,
            )}
            onRemove={() => setFleet(previous => ({
              ...previous,
              vehicles: previous.vehicles.filter(item => item.id !== vehicle.id),
            }))}
          />
        ))}
      </SectionCard>

      <SectionCard
        icon={<HardDrive className="h-5 w-5 text-primary" />}
        title="Devices"
        description="Request fleet devices from Fleet Pro. Devices provisioned through Fleet Pro use MTN SIM connectivity."
        count={deviceTotal}
        summary={`${deviceTotal} Device${deviceTotal === 1 ? "" : "s"} Requested`}
        expanded={expanded === "devices"}
        onToggle={() => setExpanded(expanded === "devices" ? null : "devices")}
        empty={fleet.deviceRequests.length === 0}
        actions={(
          <Button
            size="sm"
            onClick={() => {
              setEditingRequest(null);
              setDeviceOpen(true);
            }}
          >
            Request Device
          </Button>
        )}
      >
        {fleet.deviceRequests.map(request => (
          <Row
            key={request.id}
            primary={`Request · ${request.quantity} × ${request.manufacturer}`}
            secondary={`${request.useCase} · MTN SIM connectivity`}
            badge="Requested"
            onView={() => openDeviceDetail(request)}
            onEdit={() => {
              setEditingRequest(request);
              setDeviceOpen(true);
            }}
            onRemove={() => setFleet(previous => ({
              ...previous,
              deviceRequests: previous.deviceRequests.filter(item => item.id !== request.id),
            }))}
          />
        ))}
      </SectionCard>

      <div className="flex items-center justify-between border-t border-border/60 pt-6">
        <Button
          variant="ghost"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          className="min-w-40"
          disabled={!canProceed}
          onClick={onNext}
        >
          {nextLabel ?? "Next"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {!canProceed && (
        <p className="text-right text-xs text-muted-foreground">
          Add at least one vehicle to continue. Requesting devices is optional.
        </p>
      )}

      <AddVehicleModal
        open={vehicleOpen}
        onOpenChange={setVehicleOpen}
        onAdd={addVehicle}
      />
      <RequestDevicesModal
        open={deviceOpen}
        initial={editingRequest}
        onOpenChange={(next) => {
          setDeviceOpen(next);
          if (!next)
            setEditingRequest(null);
        }}
        onAdd={addDeviceRequest}
      />
      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload Vehicles"
        description="Upload a CSV containing your vehicle records."
        fileName="fleetpro_vehicle_template.csv"
        headers={VEHICLE_CSV_HEADERS}
        sample={VEHICLE_CSV_SAMPLE}
        onRows={addVehiclesFromRows}
      />
      <DetailDialog
        detail={detail}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  count,
  summary,
  actions,
  expanded,
  onToggle,
  empty,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  count: number;
  summary: string;
  actions: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            {icon}
          </span>
          <div>
            <p className="flex items-center gap-2 text-base font-semibold text-foreground">
              {title}
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-full"
                >
                  {count}
                </Badge>
              )}
            </p>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5">
        <span className="text-sm font-medium text-foreground">{summary}</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={empty}
          onClick={onToggle}
        >
          View Details
          <ChevronDown
            className={cn(
              "ml-1 h-4 w-4 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </Button>
      </div>

      {expanded && !empty && (
        <ul className="mt-3 divide-y divide-border/60 rounded-xl border border-border/60">
          {children}
        </ul>
      )}
    </div>
  );
}

function Row({
  primary,
  secondary,
  badge,
  onView,
  onEdit,
  onRemove,
}: {
  primary: string;
  secondary: string;
  badge?: string;
  onView: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{primary}</p>
        <p className="truncate text-xs text-muted-foreground">{secondary}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {badge && (
          <Badge
            variant="outline"
            className="rounded-full text-[10px]"
          >
            {badge}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="View details"
          onClick={onView}
        >
          <Eye className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Edit details"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remove"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </li>
  );
}
