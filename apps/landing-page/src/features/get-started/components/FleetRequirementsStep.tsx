"use client";

import type {
  OnboardingApplication,
  OnboardingApplicationVehicle,
  OnboardingDeviceRequestShortfall,
} from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import type { DetailState } from "@/features/get-started/components/DetailDialog";
import {
  CaretDown,
  Cpu,
  Eye,
  PencilSimple,
  Plus,
  Trash,
  Truck,
  UploadSimple,
} from "@phosphor-icons/react/dist/ssr";
import {
  useAddOnboardingDeviceRequest,
  useAddOnboardingVehicle,
  useDeleteOnboardingDeviceRequest,
  useDeleteOnboardingVehicle,
  useImportOnboardingVehicles,
  useUpdateOnboardingVehicle,
  useUploadOnboardingApplicationDocument,
} from "@truckmoov/api/auth";
import { useState } from "react";
import { DetailDialog } from "@/features/get-started/components/DetailDialog";
import { DeviceFulfilmentCard } from "@/features/get-started/components/DeviceFulfilmentCard";
import { DialogFooter } from "@/features/get-started/components/DialogFooter";
import { RequestDevicesModal } from "@/features/get-started/components/RequestDevicesModal";
import {
  Pill,
  StepHeading,
  StepLayout,
} from "@/features/get-started/components/StepParts";
import { VehicleImportModal } from "@/features/get-started/components/VehicleImportModal";
import { VehicleModal } from "@/features/get-started/components/VehicleModal";
import { useConfirmDialog } from "@/features/get-started/hooks/useConfirmDialog";
import {
  vehicleToPayload,
  vehicleToValues,
} from "@/features/get-started/schemas/applySchemas";
import { useApplyDraftStore } from "@/features/get-started/stores/applyDraftStore";
import { requestedDeviceTotal } from "@/features/get-started/utils/applyHelpers";
import {
  fulfilmentComplete,
  OWNER_OPERATOR_VEHICLE_LIMIT,
  OWNER_OPERATOR_VEHICLE_LIMIT_MESSAGE,
  PURCHASE_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
  vehicleSummary,
} from "@/features/get-started/utils/applyTypes";
import {
  CARD_CLASS,
  ICON_BUTTON_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

/**
 * Vehicles one at a time or by CSV, then device requests, all saved on the application as
 * they are made (main app: FleetRequirementsStep). Devices are bound to vehicles: the total
 * requested can never exceed the vehicles added. The main app's toasts show in the dialog's
 * banner (`onError`) here.
 */
export function FleetRequirementsStep({
  application,
  onBack,
  onNext,
  onError,
}: {
  application: OnboardingApplication;
  onBack: () => void;
  onNext: () => void;
  onError: (message: string) => void;
}) {
  const id = application.id;
  const addVehicle = useAddOnboardingVehicle();
  const updateVehicle = useUpdateOnboardingVehicle();
  const uploadDocument = useUploadOnboardingApplicationDocument();
  const deleteVehicle = useDeleteOnboardingVehicle();
  const importVehicles = useImportOnboardingVehicles();
  const addDeviceRequest = useAddOnboardingDeviceRequest();
  const deleteDeviceRequest = useDeleteOnboardingDeviceRequest();
  const {
    confirm,
    dialog: confirmDialog,
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
  const editingRequest = deviceModal?.request ?? null;
  const deviceInitial = editingRequest
    ? {
        quantity: editingRequest.quantity,
        useCase: editingRequest.useCase,
        notes: editingRequest.notes ?? "",
      }
    : null;

  function handleNext() {
    if (!canProceed)
      return;
    if (deviceTotal > 0 && !fulfilmentComplete(
      fulfilment,
      isOwnerOperator,
    )) {
      onError("Complete the Device Fulfilment details to continue.");
      return;
    }
    onNext();
  }

  /** Owner Operators stop at 10 vehicles; the design blocks Upload and Add with a message. */
  function guardVehicleLimit(open: () => void) {
    if (atVehicleLimit) {
      onError(OWNER_OPERATOR_VEHICLE_LIMIT_MESSAGE);
      return;
    }
    open();
  }

  async function removeVehicle(vehicle: OnboardingApplicationVehicle) {
    const hasLicence = application.documents.some(document => document.vehicleId === vehicle.id);
    const devicesAfter = vehicles.length - 1;
    if (deviceTotal > devicesAfter) {
      onError(`Remove a device request first: ${deviceTotal} devices can't be fitted to ${devicesAfter} vehicle${devicesAfter === 1 ? "" : "s"}.`);
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
    }
    catch (error) {
      onError((error as { message?: string }).message || "The vehicle couldn't be removed.");
    }
    finally {
      setRemovingId(null);
    }
  }

  /** Adds a device request; when stock is short, asks before placing it anyway. */
  async function placeDeviceRequest(data: {
    quantity: number;
    useCase: string;
    notes?: string;
  }) {
    const res = await addDeviceRequest.mutateAsync({
      id,
      data,
    });
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
    const confirmed = await addDeviceRequest.mutateAsync({
      id,
      data: {
        ...data,
        confirmAvailableQuantity: true,
      },
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
    }
    catch (error) {
      onError((error as { message?: string }).message || "The request couldn't be removed.");
    }
    finally {
      setRemovingId(null);
    }
  }

  function openVehicleDetail(vehicle: OnboardingApplicationVehicle) {
    setDetail({
      title: `Vehicle · ${vehicle.registrationNumber}`,
      fields: [
        {
          key: "registrationNumber",
          label: "Registration Number",
          value: vehicle.registrationNumber,
        },
        {
          key: "vehicleType",
          label: "Vehicle Type",
          value: VEHICLE_TYPE_LABELS[vehicle.vehicleType] ?? vehicle.vehicleType,
        },
        {
          key: "make",
          label: "Vehicle Make",
          value: vehicle.make,
        },
        {
          key: "model",
          label: "Vehicle Model",
          value: vehicle.model,
        },
        {
          key: "year",
          label: "Vehicle Year",
          value: vehicle.year ? String(vehicle.year) : "",
        },
        {
          key: "engineNumber",
          label: "Engine Number",
          value: vehicle.engineNumber ?? "",
        },
        {
          key: "chassisNumber",
          label: "Chassis Number",
          value: vehicle.chassisNumber ?? "",
        },
        {
          key: "color",
          label: "Vehicle Color",
          value: vehicle.color ?? "",
        },
        {
          key: "engineCapacity",
          label: "Engine Capacity",
          value: vehicle.engineCapacity ?? "",
        },
        {
          key: "odometer",
          label: "Odometer Reading",
          value: vehicle.odometerReading != null ? `${vehicle.odometerReading} km` : "",
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
    <StepLayout
      footer={(
        <DialogFooter
          onBack={onBack}
          continueLabel="Continue"
          continueArrow={false}
          continueDisabled={!canProceed}
          onContinue={handleNext}
        />
      )}
    >
      <StepHeading
        title="Fleet Requirements"
        description="Add Your Vehicles And, Request Tracking Devices. Devices Provisioned Through Fleet Pro Use MTN SIM Connectivity."
      />

      <div className="mt-[30px] space-y-4">
        <SectionCard
          icon={<Truck className="size-5 text-brand-deep" />}
          title="Vehicles"
          description="Upload your vehicle list in bulk or add vehicles one at a time."
          count={vehicles.length}
          summary={`${vehicles.length} Vehicle${vehicles.length === 1 ? "" : "s"} Added`}
          expanded={expanded === "vehicles"}
          onToggle={() => setExpanded(expanded === "vehicles" ? null : "vehicles")}
          empty={vehicles.length === 0}
          actions={(
            <>
              <button
                type="button"
                className={SECONDARY_BUTTON_CLASS}
                onClick={() => guardVehicleLimit(() => setUploadOpen(true))}
              >
                <UploadSimple className="size-4" />
                Upload Vehicles
              </button>
              <button
                type="button"
                className={cn(
                  PRIMARY_BUTTON_CLASS,
                  "h-[37.5px] px-4 text-xs",
                )}
                onClick={() => guardVehicleLimit(() => setVehicleModal({ vehicle: null }))}
              >
                <Plus className="size-4" />
                Add Vehicle
              </button>
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
          icon={<Cpu className="size-5 text-brand-deep" />}
          title="Devices"
          description="Request fleet devices from Fleet Pro. Devices provisioned through Fleet Pro use MTN SIM connectivity."
          count={deviceTotal}
          summary={`${deviceTotal} Device${deviceTotal === 1 ? "" : "s"} Requested`}
          expanded={expanded === "devices"}
          onToggle={() => setExpanded(expanded === "devices" ? null : "devices")}
          empty={deviceRequests.length === 0}
          actions={(
            <button
              type="button"
              className={cn(
                PRIMARY_BUTTON_CLASS,
                "h-[37.5px] px-4 text-xs",
              )}
              onClick={() => {
                // The API fits one device per vehicle.
                if (devicesLeft === 0) {
                  onError(vehicles.length === 0
                    ? "Add a vehicle before requesting devices."
                    : "Every vehicle already has a device requested.");
                  return;
                }
                setDeviceModal({ request: null });
              }}
            >
              Request Device
            </button>
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
                fields: [
                  {
                    key: "quantity",
                    label: "Number of Devices",
                    value: String(request.quantity),
                  },
                  {
                    key: "useCase",
                    label: "Use Case",
                    value: request.useCase,
                  },
                  {
                    key: "notes",
                    label: "Additional Notes",
                    value: request.notes || "—",
                  },
                ],
              })}
              onEdit={() => setDeviceModal({ request })}
              onRemove={() => void removeDeviceRequest(request.id)}
            />
          ))}
        </SectionCard>

        <DeviceFulfilmentCard
          isOwnerOperator={isOwnerOperator}
          value={fulfilment}
          onChange={setFulfilment}
        />

        {!canProceed && (
          <p className="text-xs text-muted-foreground">
            Add at least one vehicle to continue. Requesting devices is optional.
          </p>
        )}
      </div>

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
            return;
          }
          await addVehicle.mutateAsync({
            id,
            data: vehicleToPayload(values),
            licence: licence as File,
          });
        }}
      />
      <RequestDevicesModal
        open={Boolean(deviceModal)}
        initial={deviceInitial}
        // Editing frees the request's own devices for the new quantity.
        maxQuantity={devicesLeft + (editingRequest?.quantity ?? 0)}
        onOpenChange={open => !open && setDeviceModal(null)}
        onSubmit={async (values) => {
          const data = {
            quantity: values.quantity,
            useCase: values.useCase.trim(),
            notes: values.notes?.trim() || undefined,
          };
          const editing = editingRequest;
          // TODO(api): no update endpoint for device requests — an edit replaces the request.
          // Remove first so the one-device-per-vehicle check sees the freed devices.
          if (editing) {
            await deleteDeviceRequest.mutateAsync({
              id,
              requestId: editing.id,
            });
          }
          try {
            await placeDeviceRequest(data);
          }
          catch (error) {
            if (editing) {
              // Put the original back so a failed edit loses nothing.
              await addDeviceRequest.mutateAsync({
                id,
                data: {
                  quantity: editing.quantity,
                  useCase: editing.useCase,
                  notes: editing.notes ?? undefined,
                  confirmAvailableQuantity: true,
                },
              }).catch(() => undefined);
            }
            throw error;
          }
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
    </StepLayout>
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
    <section className={CARD_CLASS}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-tint">{icon}</span>
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-base leading-5 font-semibold text-heading">
              {title}
              {count > 0 && <Pill>{count}</Pill>}
            </h3>
            <p className="mt-1 text-xs leading-[17px] text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[12px] bg-surface py-1.5 pr-1.5 pl-4">
        <span className="text-sm font-medium text-heading">{summary}</span>
        <button
          type="button"
          disabled={empty}
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex cursor-pointer items-center gap-1 rounded-[10px] px-3 py-1.5 text-xs font-medium text-heading hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          View Details
          <CaretDown className={cn(
            "size-3.5 transition-transform",
            expanded && "rotate-180",
          )}
          />
        </button>
      </div>

      {expanded && !empty && (
        <ul className="mt-3 divide-y divide-border rounded-[12px] border-[0.5px] border-border">{children}</ul>
      )}
    </section>
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
        <p className="truncate text-sm font-medium text-heading">{primary}</p>
        <p className="truncate text-xs text-muted-foreground">{secondary}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {badge && <Pill tone="success">{badge}</Pill>}
        <button
          type="button"
          aria-label="View details"
          className={ICON_BUTTON_CLASS}
          onClick={onView}
        >
          <Eye className="size-4" />
        </button>
        {onEdit && (
          <button
            type="button"
            aria-label="Edit details"
            className={ICON_BUTTON_CLASS}
            onClick={onEdit}
          >
            <PencilSimple className="size-4" />
          </button>
        )}
        <button
          type="button"
          aria-label="Remove"
          className={cn(
            ICON_BUTTON_CLASS,
            "hover:text-destructive",
          )}
          disabled={removing}
          onClick={onRemove}
        >
          <Trash className={cn(
            "size-4",
            removing && "animate-pulse",
          )}
          />
        </button>
      </div>
    </li>
  );
}
