import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCreateJob } from "@/features/dispatch/api"
import { listDriversQueryOptions, listVehiclesQueryOptions } from "@/features/fleet/api"
import { ModalProps } from "@/shared/types"
import { useAuthStore } from "@/stores/authStore"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { Clock, MapPin, Package, Send, Truck, User } from "lucide-react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

const jobSchema = z.object({
 vehicleId: z.string().min(1, "Vehicle is required"),
 driverId: z.string().min(1, "Driver is required"),
 pickupLocation: z.string().min(1, "Pickup location is required"),
 deliveryLocation: z.string().min(1, "Delivery location is required"),
 cargoDescription: z.string().min(1, "Cargo description is required"),
 priority: z.enum(["low", "normal", "high", "urgent"]),
 notes: z.string().optional(),
})

type JobFormData = z.infer<typeof jobSchema>

type JobFormModalProps = ModalProps

export default function JobFormModal({ open, onOpenChange }: JobFormModalProps) {
 const { user } = useAuthStore()
 const { mutateAsync: createJob, isPending } = useCreateJob()

 const form = useForm<JobFormData>({
  resolver: zodResolver(jobSchema),
  defaultValues: {
   vehicleId: "",
   driverId: "",
   pickupLocation: "",
   deliveryLocation: "",
   cargoDescription: "",
   priority: "normal",
   notes: "",
  },
 })

 const { data: vehiclesData } = useQuery(listVehiclesQueryOptions({ params: {} }))
 const vehicles = useMemo(() => vehiclesData?.data ?? [], [vehiclesData])

 const { data: driversData } = useQuery(listDriversQueryOptions({ params: {} }))
 const drivers = useMemo(() => driversData?.data ?? [], [driversData])

 const handleSubmit = async (data: JobFormData) => {
  await createJob({
   data: {
    ...data,
    tenant_id: user.userId
   }
  }, {
   onSuccess: () => {
    onOpenChange(false)
    form.reset()
   }
  })
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-150">
    <DialogHeader>
     <DialogTitle className="flex items-center gap-2">
      <Send className="h-5 w-5 text-primary" />
      Create New Dispatch
     </DialogTitle>
     <DialogDescription>
      Assign a job to a vehicle and driver for immediate dispatch.
     </DialogDescription>
    </DialogHeader>

    <Form {...form}>
     <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
       <FormField
        control={form.control}
        name="vehicleId"
        render={({ field }) => (
         <FormItem>
          <FormLabel className="flex items-center gap-1">
           <Truck className="h-3 w-3" /> Vehicle
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
           <FormControl>
            <SelectTrigger>
             <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
           </FormControl>
           <SelectContent>
            {vehicles.map((v) => (
             <SelectItem key={v.id} value={v.id}>
              {v.make} {v.model} · {v.registrationNumber}
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
        name="driverId"
        render={({ field }) => (
         <FormItem>
          <FormLabel className="flex items-center gap-1">
           <User className="h-3 w-3" /> Driver
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
           <FormControl>
            <SelectTrigger>
             <SelectValue placeholder="Assign driver" />
            </SelectTrigger>
           </FormControl>
           <SelectContent>
            {drivers.map((d) => (
             <SelectItem key={d.id} value={d.id}>
              {d.firstName} {d.lastName}
             </SelectItem>
            ))}
           </SelectContent>
          </Select>
          <FormMessage />
         </FormItem>
        )}
       />
      </div>

      <FormField
       control={form.control}
       name="pickupLocation"
       render={({ field }) => (
        <FormItem>
         <FormLabel className="flex items-center gap-1">
          <MapPin className="h-3 w-3" /> Pickup Location
         </FormLabel>
         <FormControl>
          <Input placeholder="Enter pickup address" {...field} />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />

      <FormField
       control={form.control}
       name="deliveryLocation"
       render={({ field }) => (
        <FormItem>
         <FormLabel className="flex items-center gap-1">
          <MapPin className="h-3 w-3" /> Delivery Location
         </FormLabel>
         <FormControl>
          <Input placeholder="Enter delivery address" {...field} />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />

      <div className="grid grid-cols-2 gap-4">
       <FormField
        control={form.control}
        name="cargoDescription"
        render={({ field }) => (
         <FormItem>
          <FormLabel className="flex items-center gap-1">
           <Package className="h-3 w-3" /> Cargo Description
          </FormLabel>
          <FormControl>
           <Input placeholder="e.g., Electronics, 50kg" {...field} />
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
          <FormLabel className="flex items-center gap-1">
           <Clock className="h-3 w-3" /> Priority
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
           <FormControl>
            <SelectTrigger>
             <SelectValue />
            </SelectTrigger>
           </FormControl>
           <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
           </SelectContent>
          </Select>
          <FormMessage />
         </FormItem>
        )}
       />
      </div>

      <FormField
       control={form.control}
       name="notes"
       render={({ field }) => (
        <FormItem>
         <FormLabel>Additional Notes</FormLabel>
         <FormControl>
          <Textarea placeholder="Any special instructions..." rows={3} {...field} />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />

      <div className="flex justify-end gap-3 pt-2">
       <DialogClose asChild>
        <Button type="button" variant="outline" disabled={isPending}>
         Cancel
        </Button>
       </DialogClose>
       <Button type="submit" isLoading={isPending} disabled={isPending}>
        Create Dispatch
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 )
}
