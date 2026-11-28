import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type {
  DeviceRequestValues,
  VehicleValues,
} from "@/features/apply/utils/applySchemas";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  deviceUseCaseOptions,
  PURCHASE_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
} from "@truckmoov/app-core/apply/applyTypes";
import { DeviceStockModelSelects } from "@truckmoov/reusables/components/devices-stock-model-selects";
import {
  FileText,
  UploadCloud,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/shadcn/textarea";
import {
  checkFile,
  deviceRequestSchema,
  SERVER_VEHICLE_FIELD,
  vehicleSchema,
} from "@/features/apply/utils/applySchemas";
import { cn } from "@/lib/utils";

const EMPTY_VEHICLE: VehicleValues = {
  registrationNumber: "",
  vehicleType: "",
  make: "",
  model: "",
  year: "",
  engineNumber: "",
  chassisNumber: "",
  color: "",
  engineCapacity: "",
  odometer: "",
  purchaseType: "",
  otherPurchaseType: "",
};

export const ADD_VEHICLE_FORM_ID = "apply-add-vehicle-form";

const LICENCE_REQUIRED = "Upload the vehicle licence to add this vehicle.";

/** Add a vehicle, or edit one when `initial` is set. Server field errors land on their input. */
export function VehicleModal({
  open,
  initial,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  initial?: VehicleValues | null;
  onOpenChange: (open: boolean) => void;
  /** `licence` is required when adding and only present when replacing on edit. Rejects with the server error on failure. */
  onSubmit: (values: VehicleValues, licence: File | null) => Promise<unknown>;
}) {
  const form = useForm<VehicleValues>({
    resolver: zodResolver(vehicleSchema),
    mode: "onTouched",
    defaultValues: EMPTY_VEHICLE,
  });
  const [
    saving,
    setSaving,
  ] = useState(false);
  const [
    formError,
    setFormError,
  ] = useState<string | null>(null);
  const [
    licence,
    setLicence,
  ] = useState<File | null>(null);
  const [
    licenceError,
    setLicenceError,
  ] = useState<string | null>(null);
  const licenceInput = useRef<HTMLInputElement>(null);

  function pickLicence(file: File | undefined) {
    if (!file)
      return;
    const problem = checkFile(file);
    setLicenceError(problem);
    setLicence(problem ? null : file);
  }

  useEffect(
    () => {
      if (open) {
        form.reset(initial ?? EMPTY_VEHICLE);
        setFormError(null);
        setLicence(null);
        setLicenceError(null);
      }
    },
    [
      open,
      initial,
      form,
    ],
  );

  const purchaseType = form.watch("purchaseType");

  async function handleSubmit(values: VehicleValues) {
    if (!initial && !licence)
      return;
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit(
        values,
        licence,
      );
      onOpenChange(false);
    }
    catch (error) {
      const err = error as ServerErrorResponse;
      if (err.field === "vehicleLicense") {
        setLicenceError(err.message);
        return;
      }
      const field = err.field ? SERVER_VEHICLE_FIELD[err.field] : undefined;
      // A 409 "<registration> has already been added" belongs on the registration input.
      const target = field ?? (err.statusCode === 409 && /already been added/i.test(err.message) ? "registrationNumber" : undefined);
      if (target) {
        form.setError(
          target,
          { message: err.message },
        );
      }
      else {
        setFormError(err.message || "The vehicle couldn't be saved.");
      }
    }
    finally {
      setSaving(false);
    }
  }

  const textField = (name: keyof VehicleValues, label: string, placeholder?: string, required = false) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1.5">
          <FormLabel
            className="text-sm"
            required={required}
          >
            {label}
          </FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog
      open={open}
      onOpenChange={next => !saving && onOpenChange(next)}
    >
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Update the vehicle's details. Choose a file only to replace its licence."
              : "Enter the details of the vehicle you want to onboard."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={ADD_VEHICLE_FORM_ID}
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              if (!initial && !licence)
                setLicenceError(licenceError ?? LICENCE_REQUIRED);
              return form.handleSubmit(handleSubmit)(event);
            }}
          >
            {textField(
              "registrationNumber",
              "Registration Number",
              "LAG-123-ABC",
              true,
            )}

            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel
                    className="text-sm"
                    required
                  >
                    Vehicle Type
                  </FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(VEHICLE_TYPE_LABELS).map(([
                        value,
                        label,
                      ]) => (
                        <SelectItem
                          key={value}
                          value={value}
                        >
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {textField(
              "make",
              "Vehicle Make",
              "Toyota",
              true,
            )}
            {textField(
              "model",
              "Vehicle Model",
              "Hilux",
              true,
            )}
            {textField(
              "year",
              "Vehicle Year",
              "2021",
            )}
            {textField(
              "engineNumber",
              "Engine Number",
              "ENG-000123",
            )}
            {textField(
              "chassisNumber",
              "Chassis Number",
              "JTEBU5JR9...",
            )}
            {textField(
              "color",
              "Vehicle Color",
              "White",
            )}
            {textField(
              "engineCapacity",
              "Engine Capacity",
              "2.8L",
            )}
            {textField(
              "odometer",
              "Odometer Reading",
              "84,500 km",
            )}

            <FormField
              control={form.control}
              name="purchaseType"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm">Type of Purchase</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purchase type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PURCHASE_TYPE_LABELS).map(([
                        value,
                        label,
                      ]) => (
                        <SelectItem
                          key={value}
                          value={value}
                        >
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {purchaseType === "other" && textField(
              "otherPurchaseType",
              "Specify Purchase Type",
              "e.g. Company pool vehicle",
              true,
            )}

            <div className="space-y-1.5 sm:col-span-2">
              <Label
                className={cn(
                  "text-sm",
                  licenceError && "text-destructive",
                )}
                required={!initial}
              >
                Vehicle License Document
              </Label>
              <input
                ref={licenceInput}
                type="file"
                accept="application/pdf,.pdf,image/jpeg,image/png,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(event) => {
                  pickLicence(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              {licence
                ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{licence.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {`Vehicle License Document · ${(licence.size / 1024 / 1024).toFixed(2)} MB`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setLicence(null)}
                      >
                        Remove document
                      </Button>
                    </div>
                  )
                : (
                    <div className={cn(
                      "rounded-xl border border-dashed border-border/70 p-4",
                      licenceError && "border-destructive",
                    )}
                    >
                      <button
                        type="button"
                        onClick={() => licenceInput.current?.click()}
                        onDragOver={event => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          pickLicence(event.dataTransfer.files?.[0]);
                        }}
                        className="flex w-full cursor-pointer flex-col items-center gap-1 text-center"
                      >
                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm font-medium">Upload vehicle license</span>
                        <span className="text-xs text-muted-foreground">
                          {initial ? "Leave empty to keep the licence already uploaded" : "PDF, JPG or PNG, max 10MB"}
                        </span>
                      </button>
                    </div>
                  )}
              {licenceError && <p className="text-xs text-destructive">{licenceError}</p>}
            </div>
          </form>
        </Form>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={ADD_VEHICLE_FORM_ID}
            loading={saving}
          >
            {initial ? "Save Changes" : "Add Vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const EMPTY_DEVICE_REQUEST: DeviceRequestValues = {
  deviceModelId: "",
  quantity: 1,
  useCase: "",
  notes: "",
};

export const REQUEST_DEVICES_FORM_ID = "apply-request-devices-form";

/**
 * Devices are fitted one per vehicle, so a request can never take the total past the
 * vehicles added (TRU-FE-12). `maxQuantity` stops it early; the server enforces it too.
 */
export function RequestDevicesModal({
  open,
  initial,
  maxQuantity,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  /** Set to edit an existing request ("Edit Device Request"). */
  initial?: DeviceRequestValues | null;
  maxQuantity: number;
  onOpenChange: (open: boolean) => void;
  /** Rejects with the server error on failure. */
  onSubmit: (values: DeviceRequestValues) => Promise<unknown>;
}) {
  const form = useForm<DeviceRequestValues>({
    resolver: zodResolver(deviceRequestSchema.refine(
      values => values.quantity <= maxQuantity,
      {
        message: `You can request at most ${maxQuantity} more device${maxQuantity === 1 ? "" : "s"}, one per vehicle.`,
        path: ["quantity"],
      },
    )),
    mode: "onTouched",
    defaultValues: EMPTY_DEVICE_REQUEST,
  });
  const [
    saving,
    setSaving,
  ] = useState(false);

  useEffect(
    () => {
      if (open)
        form.reset(initial ?? EMPTY_DEVICE_REQUEST);
    },
    [
      open,
      initial,
      form,
    ],
  );

  async function handleSubmit(values: DeviceRequestValues) {
    setSaving(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    }
    catch (error) {
      const err = error as ServerErrorResponse;
      const field = err.field === "useCase" || err.field === "notes" ? err.field : "quantity";
      form.setError(
        field,
        { message: err.message || "The request couldn't be saved." },
      );
    }
    finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => !saving && onOpenChange(next)}
    >
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Device Request" : "Request Devices"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Update the details of this device request."
              : "Request tracking devices to be supplied by Fleet Pro."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={REQUEST_DEVICES_FORM_ID}
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="deviceModelId"
              render={({ field }) => (
                <FormItem>
                  <DeviceStockModelSelects
                    key={open ? "open" : "closed"}
                    value={field.value}
                    disabled={saving}
                    onChange={model => field.onChange(model?.id ?? "")}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel
                    className="text-sm"
                    required
                  >
                    Number of Devices
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={maxQuantity}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="useCase"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel
                    className="text-sm"
                    required
                  >
                    Use Case
                  </FormLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select use case" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {deviceUseCaseOptions(initial?.useCase).map(option => (
                        <SelectItem
                          key={option}
                          value={option}
                        >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm">Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Optional"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={REQUEST_DEVICES_FORM_ID}
            loading={saving}
          >
            {initial ? "Save Changes" : "Submit Device Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
