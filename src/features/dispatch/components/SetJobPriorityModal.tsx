import { useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import z from "zod"
import { ModalProps } from "@/shared/types"
import { useUpdateJobPriority } from "../api"
import { Job } from "../api/types"

type SetJobPriorityModalProps = ModalProps & {
  job: Job | null
}

const setPrioritySchema = z.object({
 priority: z.enum(["low", "normal", "high", "urgent"]),
})

type SetPriorityFormData = z.infer<typeof setPrioritySchema>

export default function SetJobPriorityModal({ open, onOpenChange, job }: SetJobPriorityModalProps) {
 const { mutateAsync: updatePriority, isPending } = useUpdateJobPriority()

 const defaultValues = useMemo(() => ({
  priority: job?.priority ?? "normal",
 }), [job])

 const form = useForm<SetPriorityFormData>({
  resolver: zodResolver(setPrioritySchema),
  defaultValues,
 })

 useEffect(() => {
  if (open) form.reset(defaultValues)
 }, [open, form, defaultValues])

 const handleSave = (data: SetPriorityFormData) => {
  updatePriority({ jobId: job!.id, data: { priority: data.priority } }, {
   onSuccess: () => onOpenChange(false),
  })
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-md">
    <DialogHeader>
     <DialogTitle>Set Job Priority</DialogTitle>
     <DialogDescription>
      Select the priority level for this job.
     </DialogDescription>
    </DialogHeader>

    <Form {...form}>
     <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-2">
      <FormField
       control={form.control}
       name="priority"
       render={({ field }) => (
        <FormItem>
         <FormLabel>Priority</FormLabel>
         <Select value={field.value} onValueChange={field.onChange}>
          <FormControl>
           <SelectTrigger>
            <SelectValue placeholder="Select priority" />
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

      <div className="flex justify-end gap-2">
       <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        Cancel
       </Button>
       <Button type="submit" isLoading={isPending}>
        Save Priority
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 )
}
