import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type {
  DeviceRequestValues,
  VehicleValues,
} from "@/features/apply/utils/applySchemas";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingVehicleImportColumnsQueryOptions,
  getOnboardingVehicleImportTemplate,
} from "@truckmoov/api/auth";
import {
  PURCHASE_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
} from "@truckmoov/app-core/apply/applyTypes";
import {
  Download,
  FileSpreadsheet,
  FileText,
  UploadCloud,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";

import { toast } from "sonner";
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
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Explain how these devices will be used across your fleet."
                      {...field}
                    />
                  </FormControl>
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

const MAX_CSV_BYTES = 2 * 1024 * 1024;

export type VehicleImportResult = {
  message: string;
  skipped: {
    line: number; message: string;
  }[];
};

/**
 * Bulk vehicle import. The server parses the CSV: rows match on registration number, so
 * re-uploading a corrected file updates vehicles instead of duplicating them, and bad rows
 * come back in `skipped` while the good ones still import.
 */
export function VehicleImportModal({
  open,
  onOpenChange,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rejects with the server error on failure. */
  onUpload: (file: File) => Promise<VehicleImportResult>;
}) {
  const [
    dragging,
    setDragging,
  ] = useState(false);
  const [
    uploading,
    setUploading,
  ] = useState(false);
  const [
    result,
    setResult,
  ] = useState<VehicleImportResult | null>(null);
  const [
    error,
    setError,
  ] = useState<string | null>(null);
  const columnsQuery = useQuery({
    ...getOnboardingVehicleImportColumnsQueryOptions(),
    enabled: open,
  });
  const columns = columnsQuery.data?.data.columns ?? [];

  useEffect(
    () => {
      if (open) {
        setResult(null);
        setError(null);
      }
    },
    [open],
  );

  async function downloadTemplate() {
    try {
      const blob = await getOnboardingVehicleImportTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "fleetpro_vehicle_template.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    }
    catch {
      toast.error("The template couldn't be downloaded. Try again.");
    }
  }

  async function handleFile(file: File) {
    setResult(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only CSV files are supported. Download the template to get started.");
      return;
    }
    if (file.size > MAX_CSV_BYTES) {
      setError("The CSV must be 2 MB or smaller.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const outcome = await onUpload(file);
      setResult(outcome);
      if (outcome.skipped.length === 0) {
        toast.success(outcome.message);
        onOpenChange(false);
      }
    }
    catch (err) {
      const serverError = err as ServerErrorResponse;
      setError(serverError.statusCode === 413 ? "The CSV must be 2 MB or smaller." : serverError.message || "The file couldn't be imported.");
    }
    finally {
      setUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => !uploading && onOpenChange(next)}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Upload Vehicles</DialogTitle>
          <DialogDescription>
            Upload a CSV of your vehicles. Rows are matched on registration number, so uploading a
            corrected file again updates those vehicles rather than adding them twice.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
          <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Need a template?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Download the Fleet Pro template so every column is in the expected format.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={downloadTemplate}
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV Template
          </Button>
        </div>

        {columns.length > 0 && (
          <div className="rounded-xl border border-border/60">
            <p className="border-b border-border/60 px-3 py-2 text-xs font-semibold text-foreground">Columns</p>
            <ul className="divide-y divide-border/60 text-xs">
              {columns.map(column => (
                <li
                  key={column.header}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-1.5"
                >
                  <span className="font-mono text-foreground">
                    {column.header}
                    {column.required && <span className="ml-1 text-destructive">*</span>}
                  </span>
                  <span className="text-muted-foreground">{column.note || `e.g. ${column.example}`}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file)
              void handleFile(file);
          }}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          )}
        >
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UploadCloud className="h-6 w-6 text-primary" />
          </span>
          <p className="text-sm font-medium text-foreground">
            {uploading ? "Importing…" : "Drag and drop your file here"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">or click to browse · CSV up to 2 MB</p>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={uploading}
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file)
                void handleFile(file);
              event.target.value = "";
            }}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && result.skipped.length > 0 && (
          <div className="space-y-2 rounded-xl border border-warning/40 bg-warning/5 p-3">
            <p className="text-sm font-medium text-foreground">{result.message}</p>
            <p className="text-xs text-muted-foreground">
              These rows couldn't be read and were skipped. Fix them and upload the file again.
            </p>
            <ul className="space-y-1 text-xs">
              {result.skipped.map(row => (
                <li key={row.line}>
                  <span className="font-medium text-foreground">{`Line ${row.line}: `}</span>
                  <span className="text-muted-foreground">{row.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={uploading}
            onClick={() => onOpenChange(false)}
          >
            {result ? "Done" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
