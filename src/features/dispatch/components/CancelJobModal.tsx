import { useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import z from "zod"
import { ModalProps } from "@/shared/types"
import { useCancelJob } from "../api"
import { Job } from "../api/types"

type CancelJobModalProps = ModalProps & {
  job: Job | null
}

const cancelJobSchema = z.object({
 reason: z.string().trim().min(1, "Cancellation reason is required"),
})

type CancelJobFormData = z.infer<typeof cancelJobSchema>

export default function CancelJobModal({ open, onOpenChange, job }: CancelJobModalProps) {
 const { mutateAsync: cancelJob, isPending } = useCancelJob()

 const defaultValues = useMemo(() => ({ reason: "" }), [])

 const form = useForm<CancelJobFormData>({
  resolver: zodResolver(cancelJobSchema),
  defaultValues,
 })

 useEffect(() => {
  if (open) form.reset(defaultValues)
 }, [open, form, defaultValues])

 const handleConfirmCancel = (data: CancelJobFormData) => {
  cancelJob({ jobId: job!.id, data: { reason: data.reason } }, {
   onSuccess: () => onOpenChange(false),
  })
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-md">
    <DialogHeader>
     <DialogTitle>Cancel Job</DialogTitle>
     <DialogDescription>
      Provide a reason for cancelling this job.
     </DialogDescription>
    </DialogHeader>

    <Form {...form}>
     <form onSubmit={form.handleSubmit(handleConfirmCancel)} className="space-y-4 py-2">
      <FormField
       control={form.control}
       name="reason"
       render={({ field }) => (
        <FormItem>
         <FormLabel>Cancellation Reason</FormLabel>
         <FormControl>
          <Textarea
           rows={4}
           placeholder="Tell us why this job is being cancelled..."
           {...field}
          />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />

      <div className="flex justify-end gap-2">
       <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        Keep Job
       </Button>
       <Button type="submit" variant="destructive" isLoading={isPending}>
        Confirm Cancel
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 )
}
