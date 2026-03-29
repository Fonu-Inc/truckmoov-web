import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 Form,
 FormControl,
 FormDescription,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from "@/components/ui/form";
import ImageUploadInput from "@/shared/components/ImageUploadInput";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { useCreateVehicle, useUpdateVehicle } from "@/features/fleet/api";
import { FormMode } from "@/shared/types";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useMemo } from "react";
import { CreateVehicleData, Vehicle } from "../api/types";

const vehicleSchema = z.object({
 vin: z.string().min(17, "VIN must be 17 characters").max(17, "VIN must be 17 characters"),
 registrationNumber: z.string().min(1, "Registration number is required").max(20, "Registration too long"),
 plateNumber: z.string().min(1, "Plate number image is required"),
 make: z.string().min(1, "Make is required").max(50, "Make too long"),
 model: z.string().min(1, "Model is required").max(50, "Model too long"),
 year: z.coerce.number().min(1990, "Year must be 1990 or later").max(new Date().getFullYear() + 1, "Invalid year"),
 type: z.enum(["truck", "van", "trailer"]),
 capacity: z.coerce.number().min(0, "Capacity must be positive").max(100, "Capacity too large"),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;


type VehicleFormModalProps = {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 mode?: FormMode;
 vehicle?: Vehicle | null;
}

export default function VehicleFormModal({ open, onOpenChange, mode = "create", vehicle }: VehicleFormModalProps) {
 const { user } = useAuthStore()
 const { mutateAsync: createVehicle, isPending } = useCreateVehicle();
 const { mutateAsync: updateVehicle, isPending: updatingVehicle } = useUpdateVehicle()

 const defaultValues: VehicleFormData = useMemo(() => ({
  vin: vehicle?.vin ?? "",
  registrationNumber: vehicle?.registrationNumber ?? "",
  plateNumber: vehicle?.plateNumber ?? "",
  make: vehicle?.make ?? "",
  model: vehicle?.model ?? "",
  year: vehicle?.year ?? new Date().getFullYear(),
  type: vehicle?.type ?? "truck",
  capacity: vehicle?.capacity ?? 0,
 }), [vehicle]);

 const form = useForm<z.input<typeof vehicleSchema>, any, VehicleFormData>({
  resolver: zodResolver(vehicleSchema),
  defaultValues,
 });

 useEffect(() => {
  form.reset(defaultValues)
 }, [form, defaultValues])

 async function handleSubmit(data: VehicleFormData) {
  const payloadData: CreateVehicleData = {
   capacity: data.capacity,
   make: data.make,
   model: data.model,
   plateNumber: data.plateNumber,
   registrationNumber: data.registrationNumber,
   tenantId: user.userId,
   type: data.type,
   vin: data.vin,
   year: data.year,
   status: mode === "edit" ? vehicle!.status : "active",
  }

  if (mode === "edit") {
   if (!vehicle?.id) return
   await updateVehicle({
    id: vehicle.id,
    data: payloadData
   }, {
    onSuccess: () => {
     onOpenChange(false)
    }
   })
   return
  }
  await createVehicle({
   data: payloadData
  }, {
   onSuccess: () => {
    onOpenChange(false)
   }
  })
 };

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-125">
    <DialogHeader>
     <DialogTitle>{mode === "edit" ? "Edit Vehicle" : "Add Vehicle"} </DialogTitle>
     <DialogDescription>
      {mode === "edit" ? "Update the vehicle details below." : "Fill in the vehicle details to add to your fleet."}
     </DialogDescription>
    </DialogHeader>

    <Form {...form}>
     <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
       <FormField
        control={form.control}
        name="registrationNumber"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Registration Number</FormLabel>
          {mode === "create" && (
           <FormDescription>Same as the plate number</FormDescription>
          )}
          <FormControl>
           <Input placeholder="Enter registration number" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />

       {mode === "create" && (
        <FormField
         control={form.control}
         name="plateNumber"
         render={({ field }) => (
          <FormItem>
           <FormLabel>Plate Number Image</FormLabel>
           <FormControl>
            <ImageUploadInput onChange={field.onChange} value={field.value as string} />
           </FormControl>
           <FormMessage />
          </FormItem>
         )}
        />
       )}
      </div>

      <FormField
       control={form.control}
       name="vin"
       render={({ field }) => (
        <FormItem>
         <FormLabel>VIN</FormLabel>
         <FormControl>
          <Input placeholder="17-character VIN" maxLength={17} {...field} />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />

      <div className="grid gap-4 md:grid-cols-2">
       <FormField
        control={form.control}
        name="make"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Make</FormLabel>
          <FormControl>
           <Input placeholder="Mercedes-Benz" {...field} />
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
           <Input placeholder="Actros" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
       <FormField
        control={form.control}
        name="year"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Year</FormLabel>
          <FormControl>
           <Input type="number" placeholder="2024" {...field} value={field.value as number} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />

       <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Type</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
           <FormControl>
            <SelectTrigger>
             <SelectValue placeholder="Select type" />
            </SelectTrigger>
           </FormControl>
           <SelectContent>
            <SelectItem value="truck">Truck</SelectItem>
            <SelectItem value="van">Van</SelectItem>
            <SelectItem value="trailer">Trailer</SelectItem>
           </SelectContent>
          </Select>
          <FormMessage />
         </FormItem>
        )}
       />

       <FormField
        control={form.control}
        name="capacity"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Capacity (tons)</FormLabel>
          <FormControl>
           <Input type="number" placeholder="40" {...field} value={field.value as number} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
      </div>

      <div className="flex justify-end gap-3 pt-4">
       <DialogClose asChild>
        <Button type="button" variant="outline" disabled={isPending || updatingVehicle}>
         Cancel
        </Button>
       </DialogClose>
       <Button type="submit" isLoading={isPending || updatingVehicle}>
        {mode === "edit" ? "Save Changes" : "Add Vehicle"}
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 );
}
