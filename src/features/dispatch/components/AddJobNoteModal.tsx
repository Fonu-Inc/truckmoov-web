import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import z from "zod"

type AddJobNoteModalProps = {
 open: boolean
 onOpenChange: (open: boolean) => void
}

const addJobNoteSchema = z.object({
 note: z.string().trim().min(1, "Note is required"),
})

type AddJobNoteFormData = z.infer<typeof addJobNoteSchema>

export default function AddJobNoteModal({ open, onOpenChange }: AddJobNoteModalProps) {
 const form = useForm<AddJobNoteFormData>({
  resolver: zodResolver(addJobNoteSchema),
  defaultValues: {
   note: "",
  },
 })

 useEffect(() => {
  if (open) form.reset({ note: "" })
 }, [open, form])

 const handleSave = (_data: AddJobNoteFormData) => {
  onOpenChange(false)
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-md">
    <DialogHeader>
     <DialogTitle>Add Job Note</DialogTitle>
     <DialogDescription>
      Add a note for this job.
     </DialogDescription>
    </DialogHeader>

    <Form {...form}>
     <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-2">
      <FormField
       control={form.control}
       name="note"
       render={({ field }) => (
        <FormItem>
         <FormLabel>Note</FormLabel>
         <FormControl>
          <Textarea
           placeholder="Type your note here..."
           rows={4}
           {...field}
          />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />

      <div className="flex justify-end gap-2">
       <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        Cancel
       </Button>
       <Button type="submit">
        Save Note
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 )
}
