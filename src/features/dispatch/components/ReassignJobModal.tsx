import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { listDriversQueryOptions, listVehiclesQueryOptions } from "@/features/fleet/api"
import { ModalProps } from "@/shared/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { RefreshCw, Truck, User } from "lucide-react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import z from "zod"

const reassignSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
})

type ReassignFormData = z.infer<typeof reassignSchema>

type ReassignJobModalProps = ModalProps & {
  jobId?: string
}

export default function ReassignJobModal({ open, onOpenChange, jobId }: ReassignJobModalProps) {
  const form = useForm<ReassignFormData>({
    resolver: zodResolver(reassignSchema),
    defaultValues: {
      vehicleId: "",
      driverId: "",
    },
  })

  const { data: vehiclesData } = useQuery(listVehiclesQueryOptions({ params: {} }))
  const vehicles = useMemo(() => vehiclesData?.data ?? [], [vehiclesData])

  const { data: driversData } = useQuery(listDriversQueryOptions({ params: {} }))
  const drivers = useMemo(() => driversData?.data ?? [], [driversData])

  const handleSubmit = (_data: ReassignFormData) => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Reassign Job
          </DialogTitle>
          <DialogDescription>
            {jobId ? `Job ${jobId}` : "Select a new vehicle and driver for this job."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                        <SelectValue placeholder="Select driver" />
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

            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">
                <RefreshCw className="h-4 w-4" />
                Reassign Job
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
