import { useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import z from "zod"
import { ModalProps } from "@/shared/types"
import { useAuthStore } from "@/stores/authStore"
import { useAddJobNote } from "../api"
import { Job } from "../api/types"

type AddJobNoteModalProps = ModalProps & {
  job: Job | null
}

const addJobNoteSchema = z.object({
 note: z.string().trim().min(1, "Note is required"),
})

type AddJobNoteFormData = z.infer<typeof addJobNoteSchema>

export default function AddJobNoteModal({ open, onOpenChange, job }: AddJobNoteModalProps) {
 const { user } = useAuthStore()
 const { mutateAsync: addNote, isPending } = useAddJobNote()

 const defaultValues = useMemo(() => ({ note: "" }), [])

 const form = useForm<AddJobNoteFormData>({
  resolver: zodResolver(addJobNoteSchema),
  defaultValues,
 })

 useEffect(() => {
  if (open) form.reset(defaultValues)
 }, [open, form, defaultValues])

 const handleSave = (data: AddJobNoteFormData) => {
  addNote({ jobId: job!.id, data: { text: data.note, author_id: user.id } }, {
   onSuccess: () => onOpenChange(false),
  })
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
       <Button type="submit" isLoading={isPending}>
        Save Note
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 )
}
