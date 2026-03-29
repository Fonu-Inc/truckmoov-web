import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useUpdateDriverContactChannels } from "@/features/fleet/api"
import { Driver } from "@/features/fleet/api/types"
import { ModalProps } from "@/shared/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, MessageSquare, Phone, Save } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const contactChannelsSchema = z.object({
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  smsNumber: z.string().min(1, "SMS number is required"),
  voiceNumber: z.string().min(1, "Voice number is required"),
})

type ContactChannelsFormValues = z.infer<typeof contactChannelsSchema>

type DriverContactChannelsModalProps = ModalProps & {
  driver: Driver | null
}

const FIELDS: { name: keyof ContactChannelsFormValues; label: string; icon: typeof Phone; placeholder: string }[] = [
  { name: "whatsappNumber", label: "WhatsApp Number", icon: MessageSquare, placeholder: "+1 234 567 8900" },
  { name: "smsNumber", label: "SMS Number", icon: Mail, placeholder: "+1 234 567 8900" },
  { name: "voiceNumber", label: "Voice Number", icon: Phone, placeholder: "+1 234 567 8900" },
]

export default function DriverContactChannelsModal({ open, onOpenChange, driver }: DriverContactChannelsModalProps) {
  const { mutateAsync: updateContactChannels, isPending } = useUpdateDriverContactChannels()

  const defaultValues = useMemo<ContactChannelsFormValues>(() => ({
    whatsappNumber: driver?.contactChannels?.whatsappNumber ?? "",
    smsNumber: driver?.contactChannels?.smsNumber ?? "",
    voiceNumber: driver?.contactChannels?.voiceNumber ?? "",
  }), [driver])

  const form = useForm<ContactChannelsFormValues>({
    resolver: zodResolver(contactChannelsSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [form, defaultValues])

  async function onSubmit(values: ContactChannelsFormValues) {
    if (!driver?.id) return
    await updateContactChannels(
      { id: driver.id, data: values },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Channels</DialogTitle>
          <DialogDescription>
            {driver?.firstName} {driver?.lastName} · {driver?.phone}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {FIELDS.map(({ name, label, icon: Icon, placeholder }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {label}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={placeholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" isLoading={isPending} disabled={!form.formState.isDirty || isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
