import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormMode } from "@/shared/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

type DeviceFormModalProps = {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 mode?: FormMode
}

const deviceSchema = z.object({
 imei: z.string().min(15, "IMEI must be 15 digits").max(15, "IMEI must be 15 digits").regex(/^\d+$/, "IMEI must contain only digits"),
 manufacturer: z.string().min(1, "Manufacturer is required").max(50),
 model: z.string().min(1, "Model is required").max(50),
 firmwareVersion: z.string().min(1, "Firmware version is required").max(20),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

export default function DeviceFormModal({ open, onOpenChange, mode = "create" }: DeviceFormModalProps) {
 const form = useForm<DeviceFormData>({
  resolver: zodResolver(deviceSchema),
  defaultValues: {
   imei: "",
   manufacturer: "",
   model: "",
   firmwareVersion: "1.0.0",
  },
 });

 const handleSubmit = (data: DeviceFormData) => {
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
         <Select onValueChange={field.onChange} value={field.value}>
          <FormControl>
           <SelectTrigger>
            <SelectValue placeholder="Select manufacturer" />
           </SelectTrigger>
          </FormControl>
          <SelectContent>
           {/* {manufacturers.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
           ))} */}
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
       <DialogClose>
        <Button type="button" variant="outline">
         Cancel
        </Button>
       </DialogClose>
       <Button type="submit">
        {mode === "edit" ? "Save Changes" : "Register Device"}
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 )
}
