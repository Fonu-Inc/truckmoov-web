import { useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import z from "zod"
import { ModalProps } from "@/shared/types"
import { useUpdateJobPriority } from "../api"
import { Job } from "../api/types"

type EditJobTimeWindowModalProps = ModalProps & {
 job: Job | null
}

const editTimeWindowSchema = z.object({
 pickup_start: z.string().min(1, "Required"),
 pickup_end: z.string().min(1, "Required"),
 dropoff_start: z.string().min(1, "Required"),
 dropoff_end: z.string().min(1, "Required"),
})

type EditTimeWindowFormData = z.infer<typeof editTimeWindowSchema>

export default function EditJobTimeWindowModal({ open, onOpenChange, job }: EditJobTimeWindowModalProps) {
 const { mutateAsync: updateJobPriority, isPending } = useUpdateJobPriority()

 const defaultValues = useMemo(() => ({
  pickup_start: job?.time_window?.pickup_start ?? "",
  pickup_end: job?.time_window?.pickup_end ?? "",
  dropoff_start: job?.time_window?.dropoff_start ?? "",
  dropoff_end: job?.time_window?.dropoff_end ?? "",
 }), [job])

 const form = useForm<EditTimeWindowFormData>({
  resolver: zodResolver(editTimeWindowSchema),
  defaultValues,
 })

 useEffect(() => {
  if (open) form.reset(defaultValues)
 }, [open, form, defaultValues])

 const handleSave = (data: EditTimeWindowFormData) => {
  updateJobPriority({ jobId: job!.id, data: { time_window: data } }, {
   onSuccess: () => onOpenChange(false),
  })
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-md">
    <DialogHeader>
     <DialogTitle>Edit Time Window</DialogTitle>
     <DialogDescription>
      Update the pickup and dropoff time windows for this job.
     </DialogDescription>
    </DialogHeader>

    <Form {...form}>
     <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-2">
      <FormField
       control={form.control}
       name="pickup_start"
       render={({ field }) => (
        <FormItem>
         <FormLabel>Pickup Start</FormLabel>
         <FormControl>
          <Input type="datetime-local" {...field} />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />

      <FormField
       control={form.control}
       name="pickup_end"
       render={({ field }) => (
        <FormItem>
         <FormLabel>Pickup End</FormLabel>
         <FormControl>
          <Input type="datetime-local" {...field} />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />

      <FormField
       control={form.control}
       name="dropoff_start"
       render={({ field }) => (
        <FormItem>
         <FormLabel>Dropoff Start</FormLabel>
         <FormControl>
          <Input type="datetime-local" {...field} />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />

      <FormField
       control={form.control}
       name="dropoff_end"
       render={({ field }) => (
        <FormItem>
         <FormLabel>Dropoff End</FormLabel>
         <FormControl>
          <Input type="datetime-local" {...field} />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />

      <div className="flex justify-end gap-2">
       <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        Cancel
       </Button>
       <Button type="submit" isLoading={isPending}>
        Save Time Window
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 )
}
