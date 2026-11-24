import type {
  OnboardingApplication,
  OnboardingApplicationVehicle,
  OnboardingDeviceRequestShortfall,
} from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { ReactNode } from "react";
import type { DetailState } from "@/features/apply/components/ui/DetailDialog";

import { useQuery } from "@tanstack/react-query";
import {
  getPickupLocationsQueryOptions,
  useAddOnboardingDeviceRequest,
  useAddOnboardingVehicle,
  useDeleteOnboardingDeviceRequest,
  useDeleteOnboardingVehicle,
  useImportOnboardingVehicles,
  useSetOnboardingFulfilment,
  useUpdateOnboardingDeviceRequest,
  useUpdateOnboardingVehicle,
  useUploadOnboardingApplicationDocument,
} from "@truckmoov/api/auth";
import {
  fulfilmentComplete,
  fulfilmentToPayload,
  OWNER_OPERATOR_VEHICLE_LIMIT,
  OWNER_OPERATOR_VEHICLE_LIMIT_MESSAGE,
  PURCHASE_TYPE_LABELS,
  requestedDeviceTotal,
  VEHICLE_TYPE_LABELS,
  vehicleSummary,
} from "@truckmoov/app-core/apply/applyTypes";
import {
  ArrowLeft,
  Car,
  ChevronDown,
  Eye,
  HardDrive,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  RequestDevicesModal,
  VehicleImportModal,
  VehicleModal,
} from "@/features/apply/components/forms/ApplyModals";
import { ApplicationSaveButton } from "@/features/apply/components/ui/ApplicationSaveButton";
import { DetailDialog } from "@/features/apply/components/ui/DetailDialog";
import { DeviceFulfilmentCard } from "@/features/apply/components/ui/DeviceFulfilmentCard";
import { useConfirmDialog } from "@/features/apply/hooks/useConfirmDialog";
import { useApplyDraftStore } from "@/features/apply/stores/applyDraftStore";
import {
  vehicleToPayload,
  vehicleToValues,
} from "@/features/apply/utils/applySchemas";
import { cn } from "@/lib/utils";

type FleetRequirementsStepProps = {
  application: OnboardingApplication;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
};

/**
 * Step 2 (TRU-FE-12). Vehicles one at a time or by CSV, then device requests — all
 * saved on the application as they are made. Devices are hard bound to vehicles: the
 * total requested can never exceed the vehicles added.
 */
export function FleetRequirementsStep({
  application,
  onBack,
  onNext,
  nextLabel = "Continue",
}: FleetRequirementsStepProps) {
  const id = application.id;
  const addVehicle = useAddOnboardingVehicle();
  const updateVehicle = useUpdateOnboardingVehicle();
  const uploadDocument = useUploadOnboardingApplicationDocument();
  const deleteVehicle = useDeleteOnboardingVehicle();
  const importVehicles = useImportOnboardingVehicles();
  const addDeviceRequest = useAddOnboardingDeviceRequest();
  const deleteDeviceRequest = useDeleteOnboardingDeviceRequest();
  const updateDeviceRequest = useUpdateOnboardingDeviceRequest();
  const saveFulfilment = useSetOnboardingFulfilment();
  const {
    confirm, dialog: confirmDialog,
  } = useConfirmDialog();

  const [
    expanded,
    setExpanded,
  ] = useState<"vehicles" | "devices" | null>(null);
  const [
    vehicleModal,
    setVehicleModal,
  ] = useState<{ vehicle: OnboardingApplicationVehicle | null } | null>(null);
  const [
    uploadOpen,
    setUploadOpen,
  ] = useState(false);
  const [
    deviceModal,
    setDeviceModal,
  ] = useState<{ request: OnboardingApplication["deviceRequests"][number] | null } | null>(null);
  const [
    detail,
    setDetail,
  ] = useState<DetailState | null>(null);
  const [
    removingId,
    setRemovingId,
  ] = useState<string | null>(null);

  const vehicles = application.vehicles;
  const deviceRequests = application.deviceRequests;
  const deviceTotal = requestedDeviceTotal(application);
  const devicesLeft = Math.max(
    0,
    vehicles.length - deviceTotal,
  );
  const canProceed = vehicles.length > 0;
  const isOwnerOperator = application.applicantType === "owner_operator";
  const atVehicleLimit = isOwnerOperator && vehicles.length >= OWNER_OPERATOR_VEHICLE_LIMIT;
  const fulfilment = useApplyDraftStore(state => state.fulfilment);
  const setFulfilment = useApplyDraftStore(state => state.setFulfilment);

  // A resumed application in a browser without the draft: show the saved pickup point.
  const savedFulfilment = application.fulfilment;
  const pickupLocations = useQuery(getPickupLocationsQueryOptions()).data?.data;
  useEffect(
    () => {
      if (savedFulfilment?.method !== "pickup" || fulfilment.store)
        return;
      const location = pickupLocations?.find(item => item.id === savedFulfilment.pickupLocationId);
      if (location) {
        setFulfilment({
          ...fulfilment,
          method: "pickup",
          state: location.state,
          area: location.area,
          store: location.id,
        });
      }
    },
    [
      savedFulfilment,
      pickupLocations,
      fulfilment,
      setFulfilment,
    ],
  );

  async function handleNext() {
    if (!canProceed)
      return;
    if (deviceTotal > 0) {
      if (!fulfilmentComplete(fulfilment)) {
        toast.error("Choose an MTN Connect Store or Service Centre for device pickup to continue.");
        return;
      }
      try {
        await saveFulfilment.mutateAsync({
          id,
          data: fulfilmentToPayload(fulfilment),
        });
      }
      catch (error) {
        toast.error((error as ServerErrorResponse).message || "Your device pickup couldn't be saved. Try again.");
        return;
      }
    }
    onNext();
  }

  /** Owner Operators stop at 10 vehicles; the design blocks Upload and Add with a toast. */
  function guardVehicleLimit(open: () => void) {
    if (atVehicleLimit) {
      toast.error(OWNER_OPERATOR_VEHICLE_LIMIT_MESSAGE);
      return;
    }
    open();
  }

  async function removeVehicle(vehicle: OnboardingApplicationVehicle) {
    const hasLicence = application.documents.some(document => document.vehicleId === vehicle.id);
    const devicesAfter = vehicles.length - 1;
    if (deviceTotal > devicesAfter) {
      toast.error(`Remove a device request first: ${deviceTotal} devices can't be fitted to ${devicesAfter} vehicle${devicesAfter === 1 ? "" : "s"}.`);
      return;
    }
    if (hasLicence && !(await confirm({
      title: `Remove ${vehicle.registrationNumber}?`,
      description: "The vehicle licence you uploaded for it will be removed too.",
      confirmLabel: "Remove vehicle",
    }))) {
      return;
    }
    setRemovingId(vehicle.id);
    try {
      await deleteVehicle.mutateAsync({
        id,
        vehicleId: vehicle.id,
      });
      toast.success(`${vehicle.registrationNumber} removed.`);
    }
    catch (error) {
      toast.error((error as { message?: string }).message || "The vehicle couldn't be removed.");
    }
    finally {
      setRemovingId(null);
    }
  }

  /**
   * Adds a device request, or with `requestId` changes that one in place; when stock is
   * short, asks before placing it anyway.
   */
  async function placeDeviceRequest(data: {
    quantity: number;
    useCase: string;
    notes?: string;
  }, requestId?: string) {
    const send = (body: typeof data & { confirmAvailableQuantity?: boolean }) => requestId
      ? updateDeviceRequest.mutateAsync({
          id,
          requestId,
          data: body,
        })
      : addDeviceRequest.mutateAsync({
          id,
          data: body,
        });
    const res = await send(data);
    if (res.data.requestSaved)
      return;
    // Stock can't cover it and nothing was saved. Placing it anyway waits for stock.
    const shortfall = res.data as OnboardingDeviceRequestShortfall;
    const accepted = await confirm({
      title: `Only ${shortfall.availableQuantity} device${shortfall.availableQuantity === 1 ? "" : "s"} in stock`,
      description: "Your request can still be placed. Devices are provisioned as stock arrives, which may delay your installation.",
      confirmLabel: `Request ${data.quantity} anyway`,
    });
    if (!accepted) {
      throw Object.assign(
        new Error(shortfall.message),
        { field: "quantity" },
      );
    }
    const confirmed = await send({
      ...data,
      confirmAvailableQuantity: true,
    });
    if (!confirmed.data.requestSaved) {
      throw Object.assign(
        new Error((confirmed.data as OnboardingDeviceRequestShortfall).message),
        { field: "quantity" },
      );
    }
  }

  async function removeDeviceRequest(requestId: string) {
    setRemovingId(requestId);
    try {
      await deleteDeviceRequest.mutateAsync({
        id,
        requestId,
      });
      toast.success("Device request removed.");
    }
    catch (error) {
      toast.error((error as { message?: string }).message || "The request couldn't be removed.");
    }
    finally {
      setRemovingId(null);
    }
  }

  function openVehicleDetail(vehicle: OnboardingApplicationVehicle) {
    setDetail({
      title: `Vehicle · ${vehicle.registrationNumber}`,
      editing: false,
      fields: [
        {
          key: "registrationNumber", label: "Registration Number", value: vehicle.registrationNumber,
        },
        {
          key: "vehicleType", label: "Vehicle Type", value: VEHICLE_TYPE_LABELS[vehicle.vehicleType] ?? vehicle.vehicleType,
        },
        {
          key: "make", label: "Vehicle Make", value: vehicle.make,
        },
        {
          key: "model", label: "Vehicle Model", value: vehicle.model,
        },
        {
          key: "year", label: "Vehicle Year", value: vehicle.year ? String(vehicle.year) : "",
        },
        {
          key: "engineNumber", label: "Engine Number", value: vehicle.engineNumber ?? "",
        },
        {
          key: "chassisNumber", label: "Chassis Number", value: vehicle.chassisNumber ?? "",
        },
        {
          key: "color", label: "Vehicle Color", value: vehicle.color ?? "",
        },
        {
          key: "engineCapacity", label: "Engine Capacity", value: vehicle.engineCapacity ?? "",
        },
        {
          key: "odometer", label: "Odometer Reading", value: vehicle.odometerReading != null ? `${vehicle.odometerReading} km` : "",
        },
        {
          key: "purchaseType",
          label: "Type of Purchase",
          value: vehicle.purchaseType === "other"
            ? (vehicle.purchaseTypeOther ?? "Other")
            : vehicle.purchaseType ? PURCHASE_TYPE_LABELS[vehicle.purchaseType] : "",
        },
      ],
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Fleet Requirements</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your vehicles and, request Tracking devices. Devices provisioned through Fleet Pro use
          MTN SIM connectivity.
        </p>
      </div>

      <SectionCard
        icon={<Car className="h-5 w-5 text-primary" />}
        title="Vehicles"
        description="Upload your vehicle list in bulk or add vehicles one at a time."
        count={vehicles.length}
        summary={`${vehicles.length} Vehicle${vehicles.length === 1 ? "" : "s"} Added`}
        expanded={expanded === "vehicles"}
        onToggle={() => setExpanded(expanded === "vehicles" ? null : "vehicles")}
        empty={vehicles.length === 0}
        actions={(
          <>
            <Button
              variant="outline"
              onClick={() => guardVehicleLimit(() => setUploadOpen(true))}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Vehicles
            </Button>
            <Button
              onClick={() => guardVehicleLimit(() => setVehicleModal({ vehicle: null }))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </>
        )}
      >
        {vehicles.map(vehicle => (
          <Row
            key={vehicle.id}
            primary={vehicle.registrationNumber}
            secondary={vehicleSummary(vehicle)}
            removing={removingId === vehicle.id}
            onView={() => openVehicleDetail(vehicle)}
            onEdit={() => setVehicleModal({ vehicle })}
            onRemove={() => void removeVehicle(vehicle)}
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
        empty={deviceRequests.length === 0}
        actions={(
          <Button
            onClick={() => {
              // The API fits one device per vehicle.
              if (devicesLeft === 0) {
                toast.error(vehicles.length === 0
                  ? "Add a vehicle before requesting devices."
                  : "Every vehicle already has a device requested.");
                return;
              }
              setDeviceModal({ request: null });
            }}
          >
            Request Device
          </Button>
        )}
      >
        {deviceRequests.map(request => (
          <Row
            key={request.id}
            primary={`Device request · ${request.quantity} device${request.quantity === 1 ? "" : "s"}`}
            secondary={`${request.useCase} · MTN SIM connectivity`}
            badge="Requested"
            removing={removingId === request.id}
            onView={() => setDetail({
              title: `Device Request · ${request.quantity} device${request.quantity === 1 ? "" : "s"}`,
              editing: false,
              fields: [
                {
                  key: "quantity", label: "Number of Devices", value: String(request.quantity),
                },
                {
                  key: "useCase", label: "Use Case", value: request.useCase,
                },
                {
                  key: "notes", label: "Additional Notes", value: request.notes || "-",
                },
              ],
            })}
            onEdit={() => setDeviceModal({ request })}
            onRemove={() => void removeDeviceRequest(request.id)}
          />
        ))}
      </SectionCard>

      <DeviceFulfilmentCard
        value={fulfilment}
        onChange={setFulfilment}
        required={deviceTotal > 0}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-6">
        <Button
          variant="ghost"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <ApplicationSaveButton />
        <Button
          size="lg"
          className="min-w-40"
          disabled={!canProceed}
          loading={saveFulfilment.isPending}
          onClick={() => void handleNext()}
        >
          {nextLabel}
        </Button>
      </div>

      {!canProceed && (
        <p className="text-right text-xs text-muted-foreground">
          Add at least one vehicle to continue. Requesting devices is optional.
        </p>
      )}

      <VehicleModal
        open={Boolean(vehicleModal)}
        initial={vehicleModal?.vehicle ? vehicleToValues(vehicleModal.vehicle) : null}
        onOpenChange={open => !open && setVehicleModal(null)}
        onSubmit={async (values, licence) => {
          const editing = vehicleModal?.vehicle;
          if (editing) {
            await updateVehicle.mutateAsync({
              id,
              vehicleId: editing.id,
              data: vehicleToPayload(values),
            });
            if (licence) {
              await uploadDocument.mutateAsync({
                id,
                documentType: "vehicle_license",
                vehicleId: editing.id,
                file: licence,
              });
            }
            toast.success("Vehicle updated.");
          }
          else {
            await addVehicle.mutateAsync({
              id,
              data: vehicleToPayload(values),
              licence: licence as File,
            });
            toast.success(`${values.registrationNumber} added.`);
          }
        }}
      />
      <RequestDevicesModal
        open={Boolean(deviceModal)}
        initial={deviceModal?.request
          ? {
              quantity: deviceModal.request.quantity,
              useCase: deviceModal.request.useCase,
              notes: deviceModal.request.notes ?? "",
            }
          : null}
        // Editing frees the request's own devices for the new quantity.
        maxQuantity={devicesLeft + (deviceModal?.request?.quantity ?? 0)}
        onOpenChange={open => !open && setDeviceModal(null)}
        onSubmit={async (values) => {
          const data = {
            quantity: values.quantity,
            useCase: values.useCase.trim(),
            notes: values.notes?.trim() || undefined,
          };
          const editing = deviceModal?.request;
          await placeDeviceRequest(
            data,
            editing?.id,
          );
          toast.success(editing ? "Device request updated." : "Device request added.");
        }}
      />
      <VehicleImportModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={async (file) => {
          const res = await importVehicles.mutateAsync({
            id,
            file,
          });
          return {
            message: res.message,
            skipped: res.data.skipped ?? [],
          };
        }}
      />
      <DetailDialog
        detail={detail}
        onClose={() => setDetail(null)}
      />
      {confirmDialog}
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
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              {title}
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-full"
                >
                  {count}
                </Badge>
              )}
            </h3>
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
  removing,
  onView,
  onEdit,
  onRemove,
}: {
  primary: string;
  secondary: string;
  badge?: string;
  removing?: boolean;
  onView: () => void;
  onEdit?: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{primary}</p>
        <p className="truncate text-xs text-muted-foreground">{secondary}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
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
        {onEdit && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Edit details"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remove"
          loading={removing}
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </li>
  );
}
