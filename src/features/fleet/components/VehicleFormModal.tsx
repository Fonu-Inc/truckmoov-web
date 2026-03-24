import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
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
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { useCreateVehicle } from "@/features/fleet/api";

const vehicleSchema = z.object({
 vin: z.string().min(17, "VIN must be 17 characters").max(17, "VIN must be 17 characters"),
 registrationNumber: z.string().min(1, "Registration number is required").max(20, "Registration too long"),
 make: z.string().min(1, "Make is required").max(50, "Make too long"),
 model: z.string().min(1, "Model is required").max(50, "Model too long"),
 year: z.coerce.number().min(1990, "Year must be 1990 or later").max(new Date().getFullYear() + 1, "Invalid year"),
 type: z.enum(["truck", "van", "trailer"]),
 capacity: z.coerce.number().min(0, "Capacity must be positive").max(100, "Capacity too large"),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

const defaultValues: VehicleFormData = {
 vin: "",
 registrationNumber: "",
 make: "",
 model: "",
 year: new Date().getFullYear(),
 type: "truck",
 capacity: 0,
};

export default function VehicleFormModal() {
 const [open, setOpen] = useState(false);
 const { mutateAsync, isPending } = useCreateVehicle();

 const form = useForm<VehicleFormData>({
  resolver: zodResolver(vehicleSchema),
  defaultValues,
 });

 async function handleSubmit(data: VehicleFormData) {
 };

 return (
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogTrigger asChild>
    <Button>
     <Plus className="h-4 w-4" />
     Add Vehicle
    </Button>
   </DialogTrigger>
   <DialogContent className="sm:max-w-125">
    <DialogHeader>
     <DialogTitle>Add Vehicle</DialogTitle>
     <DialogDescription>Fill in the vehicle details to add to your fleet.</DialogDescription>
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
          <FormControl>
           <Input placeholder="LAG-123-XY" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />

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
      </div>

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
           <Input type="number" placeholder="2024" {...field} />
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
           <Input type="number" placeholder="40" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
      </div>

      <div className="flex justify-end gap-3 pt-4">
       <Button type="button" variant="outline" onClick={() => setOpen(false)}>
        Cancel
       </Button>
       <Button type="submit" isLoading={isPending}>
        "Add Vehicle"
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 );
}
