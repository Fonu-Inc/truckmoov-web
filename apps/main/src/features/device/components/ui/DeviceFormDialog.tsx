import type { IoTDevice } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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

const deviceSchema = z
  .object({
    deviceName: z.string().max(60).optional(),
    imei: z
      .string()
      .min(
        15,
        "IMEI must be 15 digits",
      )
      .max(
        15,
        "IMEI must be 15 digits",
      )
      .regex(
        /^\d+$/,
        "IMEI must contain only digits",
      ),
    manufacturer: z.string().min(
      1,
      "Manufacturer is required",
    ).max(50),
    customManufacturer: z.string().max(50).optional(),
    model: z.string().min(
      1,
      "Model is required",
    ).max(50),
    firmwareVersion: z.string().max(50).optional(),
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

type DeviceFormData = z.infer<typeof deviceSchema>;

type DeviceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<IoTDevice>) => void;
  device?: IoTDevice | null;
  title: string;
  isSubmitting?: boolean;
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

export function DeviceFormDialog({
  open,
  onOpenChange,
  onSubmit,
  device,
  title,
  isSubmitting = false,
}: DeviceFormDialogProps) {
  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      deviceName: "",
      imei: "",
      manufacturer: "",
      customManufacturer: "",
      model: "",
      firmwareVersion: "",
    },
  });

  useEffect(
    () => {
      if (device) {
        const isKnown = manufacturers.includes(device.manufacturer);
        form.reset({
          deviceName: (device as IoTDevice & { deviceName?: string }).deviceName ?? "",
          imei: device.imei,
          manufacturer: isKnown ? device.manufacturer : CUSTOM_VALUE,
          customManufacturer: isKnown ? "" : device.manufacturer,
          model: device.model,
          firmwareVersion: device.firmwareVersion || "",
        });
      }
      else {
        form.reset({
          deviceName: "",
          imei: "",
          manufacturer: "",
          customManufacturer: "",
          model: "",
          firmwareVersion: "",
        });
      }
    },
    [
      device,
      form,
      open,
    ],
  );

  const manufacturerValue = form.watch("manufacturer");
  const isEditing = Boolean(device);

  const handleSubmit = (data: DeviceFormData) => {
    const resolvedManufacturer
      = data.manufacturer === CUSTOM_VALUE
        ? (data.customManufacturer ?? "").trim()
        : data.manufacturer;
    const payload: Partial<IoTDevice> = {
      ...data,
      manufacturer: resolvedManufacturer,
    };

    if (!isEditing) {
      payload.firmwareVersion = data.firmwareVersion?.trim() || undefined;
    }

    onSubmit(payload);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting)
          onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {device ? "Update device configuration." : "Register a new IoT tracking device."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {!isEditing && (
              <FormField
                control={form.control}
                name="deviceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Truck 12 - Tracker"
                        maxLength={60}
                        disabled={isSubmitting}
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
              name="imei"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>IMEI Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="359779090012345"
                      maxLength={15}
                      readOnly={isEditing}
                      disabled={isSubmitting}
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
                  <FormLabel required>Manufacturer</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
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
                    <FormLabel required>Custom Manufacturer</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter manufacturer name"
                        maxLength={50}
                        disabled={isSubmitting}
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
                  <FormLabel required>Model</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="FMC130"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="firmwareVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firmware Version</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 3.28.07"
                        maxLength={50}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting
                  ? device ? "Saving..." : "Registering..."
                  : device ? "Save Changes" : "Register Device"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
