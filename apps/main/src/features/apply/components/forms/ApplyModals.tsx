import type {
  DeviceRequestValues, VehicleValues,
} from "@/features/apply/utils/applySchemas";
import type { DeviceRequest } from "@/features/apply/utils/applyTypes";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Download,
  FileSpreadsheet,
  Info,
  UploadCloud,
} from "lucide-react";
import {
  useEffect, useState,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import {
  deviceRequestSchema,
  vehicleSchema,
} from "@/features/apply/utils/applySchemas";
import {
  DEVICE_MANUFACTURERS,
  PURCHASE_TYPES,
  VEHICLE_TYPES,
} from "@/features/apply/utils/applyTypes";
import { cn } from "@/lib/utils";

const EMPTY_VEHICLE: VehicleValues = {
  registrationNumber: "",
  vehicleType: "",
  otherVehicleType: "",
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

export function AddVehicleModal({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (values: VehicleValues) => void;
}) {
  const form = useForm<VehicleValues>({
    resolver: zodResolver(vehicleSchema),
    mode: "onTouched",
    defaultValues: EMPTY_VEHICLE,
  });

  const vehicleType = form.watch("vehicleType");
  const purchaseType = form.watch("purchaseType");

  function handleSubmit(values: VehicleValues) {
    onAdd(values);
    form.reset(EMPTY_VEHICLE);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next)
          form.reset(EMPTY_VEHICLE);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Vehicle</DialogTitle>
          <DialogDescription>
            Registration number, vehicle type, make and model are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={ADD_VEHICLE_FORM_ID}
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="LAG-123-XY"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VEHICLE_TYPES.map(type => (
                        <SelectItem
                          key={type}
                          value={type}
                        >
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {vehicleType === "Other" && (
              <FormField
                control={form.control}
                name="otherVehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Vehicle Type</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="make"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Make</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Toyota"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Model</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Hilux"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Year</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="2021"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="engineNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Engine Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chassisNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chassis Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Color</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="engineCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Engine Capacity</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="odometer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Odometer Reading</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchaseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Purchase</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a purchase type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PURCHASE_TYPES.map(type => (
                        <SelectItem
                          key={type}
                          value={type}
                        >
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {purchaseType === "Other" && (
              <FormField
                control={form.control}
                name="otherPurchaseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Purchase Type</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={ADD_VEHICLE_FORM_ID}
          >
            Add Vehicle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const EMPTY_DEVICE_REQUEST: DeviceRequestValues = {
  quantity: 1,
  manufacturer: "",
  useCase: "",
  notes: "",
};

export const REQUEST_DEVICES_FORM_ID = "apply-request-devices-form";

export function RequestDevicesModal({
  open,
  initial,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  /** When set, the modal edits this request instead of creating a new one. */
  initial?: DeviceRequest | null;
  onOpenChange: (open: boolean) => void;
  onAdd: (values: DeviceRequestValues) => void;
}) {
  const form = useForm<DeviceRequestValues>({
    resolver: zodResolver(deviceRequestSchema),
    mode: "onTouched",
    defaultValues: EMPTY_DEVICE_REQUEST,
  });

  // Load the edited request's values whenever the modal opens on one.
  useEffect(
    () => {
      if (!open)
        return;
      form.reset(initial
        ? {
            quantity: initial.quantity,
            manufacturer: initial.manufacturer,
            useCase: initial.useCase,
            notes: initial.notes,
          }
        : EMPTY_DEVICE_REQUEST);
    },
    [
      open,
      initial,
      form,
    ],
  );

  function handleSubmit(values: DeviceRequestValues) {
    onAdd(values);
    form.reset(EMPTY_DEVICE_REQUEST);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next)
          form.reset(EMPTY_DEVICE_REQUEST);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Device Request" : "Request Devices"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Update the details of this device request."
              : "Request tracking devices to be supplied by Fleet Pro."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            Each request covers one manufacturer. If you need devices from a different
            manufacturer, submit a separate request.
          </p>
        </div>

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
                <FormItem>
                  <FormLabel>Number of Devices</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a manufacturer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEVICE_MANUFACTURERS.map(manufacturer => (
                        <SelectItem
                          key={manufacturer}
                          value={manufacturer}
                        >
                          {manufacturer}
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
              name="useCase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Use Case</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="What will these devices be used for?"
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
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
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
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={REQUEST_DEVICES_FORM_ID}
          >
            {initial ? "Save Changes" : "Submit Device Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Bulk upload for a fleet section. Parses a header row plus data rows and hands
 * the raw cells back to the caller, which maps them to its own entity.
 */
export function UploadModal({
  open,
  onOpenChange,
  title,
  description,
  fileName,
  headers,
  sample,
  onRows,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fileName: string;
  headers: string[];
  sample: string[];
  /** Returns how many rows were accepted. */
  onRows: (rows: string[][]) => number;
}) {
  const [
    dragging,
    setDragging,
  ] = useState(false);

  function downloadTemplate() {
    const csv = `${headers.join(",")}\n${sample.join(",")}`;
    const url = URL.createObjectURL(new Blob(
      [csv],
      { type: "text/csv" },
    ));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Only CSV files are supported. Download the template to get started.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rows = String(reader.result)
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean)
        .slice(1)
        .map(line => line.split(",").map(cell => cell.trim()));

      if (rows.length === 0) {
        toast.error("No records were found in that file.");
        return;
      }

      const added = onRows(rows);
      if (added > 0) {
        toast.success(`${added} record${added === 1 ? "" : "s"} added from ${file.name}`);
        onOpenChange(false);
      }
    };
    reader.readAsText(file);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
          <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Need a template?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Download the Fleet Pro upload template to ensure your information is structured
              correctly. You may also upload your own document, provided it follows the same
              structure.
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
              handleFile(file);
          }}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          )}
        >
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UploadCloud className="h-6 w-6 text-primary" />
          </span>
          <p className="text-sm font-medium text-foreground">Drag and drop your file here</p>
          <p className="mt-1 text-xs text-muted-foreground">
            or click to browse and upload · CSV up to 10 MB
          </p>
          <input
            type="file"
            accept=".csv"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file)
                handleFile(file);
              event.target.value = "";
            }}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
