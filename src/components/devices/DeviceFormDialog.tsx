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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";

const deviceSchema = z.object({
  imei: z.string().min(15, "IMEI must be 15 digits").max(15, "IMEI must be 15 digits").regex(/^\d+$/, "IMEI must contain only digits"),
  manufacturer: z.string().min(1, "Manufacturer is required").max(50),
  model: z.string().min(1, "Model is required").max(50),
  firmwareVersion: z.string().min(1, "Firmware version is required").max(20),
});

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
      imei: "",
      manufacturer: "",
      model: "",
      firmwareVersion: "1.0.0",
    },
  });

  useEffect(() => {
    if (device) {
      form.reset({
        imei: device.imei,
        manufacturer: device.manufacturer,
        model: device.model,
        firmwareVersion: device.firmwareVersion,
      });
    } else {
      form.reset({
        imei: "",
        manufacturer: "",
        model: "",
        firmwareVersion: "1.0.0",
      });
    }
  }, [device, form, open]);

  const handleSubmit = (data: DeviceFormData) => {
    onSubmit(data);
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
              name="imei"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IMEI Number</FormLabel>
                  <FormControl>
                    <Input placeholder="359779090012345" maxLength={15} {...field} />
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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="firmwareVersion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firmware Version</FormLabel>
                  <FormControl>
                    <Input placeholder="3.28.07" {...field} />
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
