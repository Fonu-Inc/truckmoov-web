import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import z from "zod"

type SetJobPriorityModalProps = {
 open: boolean
 onOpenChange: (open: boolean) => void
}

const setPrioritySchema = z.object({
 priority: z.enum(["low", "normal", "high", "urgent"]),
})

type SetPriorityFormData = z.infer<typeof setPrioritySchema>

export default function SetJobPriorityModal({ open, onOpenChange }: SetJobPriorityModalProps) {
 const form = useForm<SetPriorityFormData>({
  resolver: zodResolver(setPrioritySchema),
  defaultValues: {
   priority: "normal",
  },
 })

 useEffect(() => {
  if (open) form.reset({ priority: "normal" })
 }, [open, form])

 const handleSave = (_data: SetPriorityFormData) => {
  onOpenChange(false)
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
       <Button type="submit">
        Save Priority
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 )
}
