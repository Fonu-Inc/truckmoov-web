import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormMode } from "@/shared/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

const jobSchema = z.object({
 reference: z.string().min(3, "Reference must be at least 3 characters").max(50),
 pickupAddress: z.string().min(5, "Pickup address required").max(200),
 pickupLat: z.coerce.number().min(-90).max(90),
 pickupLng: z.coerce.number().min(-180).max(180),
 deliveryAddress: z.string().min(5, "Delivery address required").max(200),
 deliveryLat: z.coerce.number().min(-90).max(90),
 deliveryLng: z.coerce.number().min(-180).max(180),
 cargoType: z.string().min(2, "Cargo type required").max(100),
 cargoWeight: z.coerce.number().min(0.1, "Weight must be positive"),
 cargoDescription: z.string().max(500).optional(),
 amount: z.coerce.number().min(0, "Amount must be positive"),
 deadline: z.string().min(1, "Deadline required"),
 priority: z.enum(["low", "medium", "high", "urgent"]),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobFormModalProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 mode?: FormMode
}

export default function JobFormModal({ open, onOpenChange, mode = "create" }: JobFormModalProps) {
 const form = useForm<JobFormData>({
  resolver: zodResolver(jobSchema),
  defaultValues: {
   reference: "",
   pickupAddress: "",
   pickupLat: 6.5244,
   pickupLng: 3.3792,
   deliveryAddress: "",
   deliveryLat: 9.0579,
   deliveryLng: 7.4951,
   cargoType: "",
   cargoWeight: 0,
   cargoDescription: "",
   amount: 0,
   deadline: "",
   priority: "medium",
  },
 });

 const handleSubmit = (data: JobFormData) => {
  onOpenChange(false);
  form.reset();
 };

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto bg-card border-border">
    <DialogHeader>
     <DialogTitle>{mode === "edit" ? "Edit Job" : "Create New Job"}</DialogTitle>
    </DialogHeader>
    <Form {...form}>
     <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
       <FormField
        control={form.control}
        name="reference"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Job Reference</FormLabel>
          <FormControl>
           <Input {...field} readOnly={mode === "edit"} className="font-mono" />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
       <FormField
        control={form.control}
        name="priority"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Priority</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
           <FormControl>
            <SelectTrigger>
             <SelectValue placeholder="Select priority" />
            </SelectTrigger>
           </FormControl>
           <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
           </SelectContent>
          </Select>
          <FormMessage />
         </FormItem>
        )}
       />
      </div>

      {/* Pickup Location */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
       <h4 className="font-medium text-sm text-primary">Pickup Location</h4>
       <FormField
        control={form.control}
        name="pickupAddress"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Address</FormLabel>
          <FormControl>
           <Input placeholder="123 Marina Road, Victoria Island, Lagos" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
       <div className="grid grid-cols-2 gap-3">
        <FormField
         control={form.control}
         name="pickupLat"
         render={({ field }) => (
          <FormItem>
           <FormLabel>Latitude</FormLabel>
           <FormControl>
            <Input type="number" step="any" {...field} />
           </FormControl>
           <FormMessage />
          </FormItem>
         )}
        />
        <FormField
         control={form.control}
         name="pickupLng"
         render={({ field }) => (
          <FormItem>
           <FormLabel>Longitude</FormLabel>
           <FormControl>
            <Input type="number" step="any" {...field} />
           </FormControl>
           <FormMessage />
          </FormItem>
         )}
        />
       </div>
      </div>

      {/* Delivery Location */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
       <h4 className="font-medium text-sm text-accent">Delivery Location</h4>
       <FormField
        control={form.control}
        name="deliveryAddress"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Address</FormLabel>
          <FormControl>
           <Input placeholder="45 Wuse Zone 5, Abuja" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
       <div className="grid grid-cols-2 gap-3">
        <FormField
         control={form.control}
         name="deliveryLat"
         render={({ field }) => (
          <FormItem>
           <FormLabel>Latitude</FormLabel>
           <FormControl>
            <Input type="number" step="any" {...field} />
           </FormControl>
           <FormMessage />
          </FormItem>
         )}
        />
        <FormField
         control={form.control}
         name="deliveryLng"
         render={({ field }) => (
          <FormItem>
           <FormLabel>Longitude</FormLabel>
           <FormControl>
            <Input type="number" step="any" {...field} />
           </FormControl>
           <FormMessage />
          </FormItem>
         )}
        />
       </div>
      </div>

      {/* Cargo Details */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
       <h4 className="font-medium text-sm">Cargo Details</h4>
       <div className="grid grid-cols-2 gap-3">
        <FormField
         control={form.control}
         name="cargoType"
         render={({ field }) => (
          <FormItem>
           <FormLabel>Cargo Type</FormLabel>
           <FormControl>
            <Input placeholder="Electronics, Food, etc." {...field} />
           </FormControl>
           <FormMessage />
          </FormItem>
         )}
        />
        <FormField
         control={form.control}
         name="cargoWeight"
         render={({ field }) => (
          <FormItem>
           <FormLabel>Weight (tons)</FormLabel>
           <FormControl>
            <Input type="number" step="0.1" {...field} />
           </FormControl>
           <FormMessage />
          </FormItem>
         )}
        />
       </div>
       <FormField
        control={form.control}
        name="cargoDescription"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Description (Optional)</FormLabel>
          <FormControl>
           <Textarea placeholder="Additional cargo details..." {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
      </div>

      {/* Payment & Deadline */}
      <div className="grid grid-cols-2 gap-4">
       <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Amount (NGN)</FormLabel>
          <FormControl>
           <Input type="number" step="100" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
       <FormField
        control={form.control}
        name="deadline"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Deadline</FormLabel>
          <FormControl>
           <Input type="datetime-local" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
      </div>

      <div className="flex justify-end gap-3 pt-4">
       <DialogClose asChild>
        <Button type="button" variant="outline">
         Cancel
        </Button>
       </DialogClose>
       <Button>
        {mode === "edit" ? "Update Job" : "Create Job"}
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 )
}
