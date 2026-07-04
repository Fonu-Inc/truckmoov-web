import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IoTDevice } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Button } from "@/components/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { useEffect } from "react";

const CUSTOM_VALUE = "__custom__";

const deviceSchema = z
  .object({
    deviceName: z.string().min(1, "Device name is required").max(60),
    imei: z
      .string()
      .min(15, "IMEI must be 15 digits")
      .max(15, "IMEI must be 15 digits")
      .regex(/^\d+$/, "IMEI must contain only digits"),
    manufacturer: z.string().min(1, "Manufacturer is required").max(50),
    customManufacturer: z.string().max(50).optional(),
    model: z.string().min(1, "Model is required").max(50),
  })
  .refine(
    (data) =>
      data.manufacturer !== CUSTOM_VALUE ||
      (data.customManufacturer && data.customManufacturer.trim().length > 0),
    {
      message: "Please enter a custom manufacturer",
      path: ["customManufacturer"],
    },
  );

type DeviceFormData = z.infer<typeof deviceSchema>;

interface DeviceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<IoTDevice>) => void;
  device?: IoTDevice | null;
  title: string;
}

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

export function DeviceFormDialog({
  open,
  onOpenChange,
  onSubmit,
  device,
  title,
}: DeviceFormDialogProps) {
  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      deviceName: "",
      imei: "",
      manufacturer: "",
      customManufacturer: "",
      model: "",
    },
  });

  useEffect(() => {
    if (device) {
      const isKnown = manufacturers.includes(device.manufacturer);
      form.reset({
        deviceName: (device as IoTDevice & { deviceName?: string }).deviceName ?? "",
        imei: device.imei,
        manufacturer: isKnown ? device.manufacturer : CUSTOM_VALUE,
        customManufacturer: isKnown ? "" : device.manufacturer,
        model: device.model,
      });
    } else {
      form.reset({
        deviceName: "",
        imei: "",
        manufacturer: "",
        customManufacturer: "",
        model: "",
      });
    }
  }, [device, form, open]);

  const manufacturerValue = form.watch("manufacturer");
  const isEditing = Boolean(device);

  const handleSubmit = (data: DeviceFormData) => {
    const resolvedManufacturer =
      data.manufacturer === CUSTOM_VALUE
        ? (data.customManufacturer ?? "").trim()
        : data.manufacturer;
    onSubmit({
      ...data,
      manufacturer: resolvedManufacturer,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {device ? "Update device configuration." : "Register a new IoT tracking device."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="deviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Truck 12 — Tracker" maxLength={60} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      readOnly={isEditing}
                      className={isEditing ? "cursor-not-allowed opacity-70" : undefined}
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manufacturer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {manufacturers.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
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
                      <Input placeholder="Enter manufacturer name" maxLength={50} {...field} />
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
                    <Input placeholder="FMC130" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {device ? "Save Changes" : "Register Device"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
