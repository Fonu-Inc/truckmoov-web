import type { DeviceBucket, PlatformDevice } from "./management/deviceStatus";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/shadcn/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

const CUSTOM_VALUE = "__custom__";

const deviceEditSchema = z
  .object({
    imei: z
      .string()
      .min(15, "IMEI must be 15 digits")
      .max(15, "IMEI must be 15 digits")
      .regex(/^\d+$/, "IMEI must contain only digits"),
    manufacturer: z.string().min(1, "Manufacturer is required").max(50),
    customManufacturer: z.string().max(50).optional(),
    model: z.string().min(1, "Model is required").max(50),
    firmwareVersion: z.string().max(50).optional(),
    protocol: z.enum(["tcp", "http", "mqtt", "udp"]),
    status: z.enum([
      "active",
      "inactive",
      "assigned",
      "unassigned",
      "configured",
      "registered",
      "unregistered",
    ]),
  })
  .refine(
    data =>
      data.manufacturer !== CUSTOM_VALUE
      || (data.customManufacturer && data.customManufacturer.trim().length > 0),
    {
      message: "Please enter a custom manufacturer",
      path: ["customManufacturer"],
    },
  );

type DeviceEditFormData = z.infer<typeof deviceEditSchema>;

/** The fields Edit Details changes, applied locally by the caller. */
export type DeviceEditValues = {
  imei: string;
  manufacturer: string;
  model: string;
  firmwareVersion: string | null;
  protocol: string;
  statusOverride: DeviceBucket;
};

type DeviceEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: PlatformDevice | null;
  normalizedStatus: string;
  onSaved: (values: DeviceEditValues) => void;
};

const manufacturers = [
  "Teltonika",
  "Queclink",
  "Meitrack",
  "CalAmp",
  "Digital Matter",
  "Geotab",
  "Concox",
  "Coban",
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "assigned", label: "Assigned" },
  { value: "unassigned", label: "Unassigned" },
  { value: "configured", label: "Configured" },
  { value: "registered", label: "Registered" },
  { value: "unregistered", label: "Unregistered" },
];

const protocolOptions = [
  { value: "tcp", label: "TCP" },
  { value: "http", label: "HTTP" },
  { value: "mqtt", label: "MQTT" },
  { value: "udp", label: "UDP" },
];

// The fork's statusToDb, folded onto the four buckets the Assigned Devices table shows.
const statusToBucket: Record<DeviceEditFormData["status"], DeviceBucket> = {
  active: "active",
  inactive: "inactive",
  assigned: "assigned",
  unassigned: "unassigned",
  configured: "unassigned",
  registered: "unassigned",
  unregistered: "unassigned",
};

const EMPTY_VALUES: DeviceEditFormData = {
  imei: "",
  manufacturer: "",
  customManufacturer: "",
  model: "",
  firmwareVersion: "",
  protocol: "http",
  status: "registered",
};

export function DeviceEditDialog({
  open,
  onOpenChange,
  device,
  normalizedStatus,
  onSaved,
}: DeviceEditDialogProps) {
  const form = useForm<DeviceEditFormData>({
    resolver: zodResolver(deviceEditSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (device && open) {
      const isKnown = manufacturers.includes(device.manufacturer);
      const protocol = (device.protocol ?? "").toLowerCase();
      form.reset({
        imei: device.imei,
        manufacturer: isKnown ? device.manufacturer : CUSTOM_VALUE,
        customManufacturer: isKnown ? "" : device.manufacturer,
        model: device.model || "",
        firmwareVersion: device.firmwareVersion || "",
        protocol: protocolOptions.some(p => p.value === protocol) ? protocol as DeviceEditFormData["protocol"] : "http",
        status: (normalizedStatus as DeviceEditFormData["status"]) || "registered",
      });
    }
    else if (!open) {
      form.reset(EMPTY_VALUES);
    }
  }, [device, normalizedStatus, open, form]);

  const manufacturerValue = form.watch("manufacturer");

  const handleSubmit = (data: DeviceEditFormData) => {
    if (!device)
      return;

    const resolvedManufacturer
      = data.manufacturer === CUSTOM_VALUE
        ? (data.customManufacturer ?? "").trim()
        : data.manufacturer;

    // ponytail: mock data from fleetflow parity port — wire to packages/api
    // (no device update endpoint; the edit is kept in page state only).
    onSaved({
      imei: data.imei,
      manufacturer: resolvedManufacturer,
      model: data.model,
      firmwareVersion: data.firmwareVersion || null,
      protocol: data.protocol,
      statusOverride: statusToBucket[data.status],
    });
    toast.success("Device details saved");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Device Details</DialogTitle>
          <DialogDescription>
            {`Update the device record for ${device?.manufacturer ?? ""} ${device?.model ?? ""}.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="imei"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IMEI Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="359779090012345"
                      maxLength={15}
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
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manufacturer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {manufacturers.map(m => (
                        <SelectItem
                          key={m}
                          value={m}
                        >
                          {m}
                        </SelectItem>
                      ))}
                      <SelectItem value={CUSTOM_VALUE}>Custom…</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {manufacturerValue === CUSTOM_VALUE && (
              <FormField
                control={form.control}
                name="customManufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Manufacturer</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter manufacturer name"
                        maxLength={50}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="FMC130"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firmwareVersion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firmware Version</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 1.0.0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="protocol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protocol</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select protocol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {protocolOptions.map(p => (
                          <SelectItem
                            key={p.value}
                            value={p.value}
                          >
                            {p.label}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map(s => (
                          <SelectItem
                            key={s.value}
                            value={s.value}
                          >
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
