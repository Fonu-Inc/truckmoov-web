import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateDevice, useUpdateDevice } from "@/features/fleet/api";
import { Device } from "@/features/fleet/api/types";
import { FormMode, ModalProps } from "@/shared/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

type DeviceFormModalProps = ModalProps & {
 mode?: FormMode;
 device?: Device | null;
}

const deviceSchema = z.object({
 imei: z.string().min(15, "IMEI must be 15 digits").max(15, "IMEI must be 15 digits").regex(/^\d+$/, "IMEI must contain only digits"),
 manufacturer: z.string().min(1, "Manufacturer is required").max(50),
 model: z.string().min(1, "Model is required").max(50),
 firmwareVersion: z.string().min(1, "Firmware version is required").max(20),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

export default function DeviceFormModal({ open, onOpenChange, mode = "create", device }: DeviceFormModalProps) {
 const defaultValues = useMemo<DeviceFormData>(() => ({
  imei: mode === "edit" && device ? device.imei : "",
  manufacturer: mode === "edit" && device ? device.manufacturer : "",
  model: mode === "edit" && device ? device.model : "",
  firmwareVersion: mode === "edit" && device ? device.firmwareVersion : "1.0.0",
 }), [device, mode]);

 const form = useForm<DeviceFormData>({
  resolver: zodResolver(deviceSchema),
  defaultValues,
 });

 useEffect(() => {
  if (open) form.reset(defaultValues);
 }, [open, defaultValues, form]);

 const { mutateAsync: createDevice, isPending: creating } = useCreateDevice();
 const { mutateAsync: updateDevice, isPending: updating } = useUpdateDevice();
 const isLoading = creating || updating;

 const handleSubmit = async (data: DeviceFormData) => {
  if (mode === "edit" && device) {
   await updateDevice(
    { id: device.id, data: {
     ...data,
     lifecycleStatus: "registered"
    } },
    { onSuccess: () => onOpenChange(false) }
   );
  } else {
   await createDevice(
    { data },
    { onSuccess: () => onOpenChange(false) }
   );
  }
 };

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-112.5">
    <DialogHeader>
     <DialogTitle>
      {mode === "edit" ? "Edit Device" : "Register New Device"}
     </DialogTitle>
     <DialogDescription>
      {mode === "edit" ? "Update device configuration." : "Register a new IoT tracking device."}
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
         <FormControl>
          <Input placeholder="Teltonika" {...field} />
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
       <DialogClose asChild>
        <Button type="button" variant="outline" disabled={isLoading}>
         Cancel
        </Button>
       </DialogClose>
       <Button type="submit" isLoading={isLoading}>
        {mode === "edit" ? "Save Changes" : "Register Device"}
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 )
}
