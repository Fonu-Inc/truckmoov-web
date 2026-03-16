import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { getNotificationsPreferencesQueryOptions, useUpdateNotificationPreferences } from "@/features/auth/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { Bell, Mail, Megaphone, Phone, Save } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const notificationSettingsSchema = z.object({
 jobUpdates: z.boolean(),
 incidentAlerts: z.boolean(),
 marketingAnnouncements: z.boolean(),
 emailAlerts: z.boolean(),
 smsAlerts: z.boolean(),
 pushAlerts: z.boolean(),
})

type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>

const alertItems: Array<{
 key: keyof NotificationSettingsFormValues
 label: string
 description: string
 icon: typeof Bell
}> = [
  { key: "jobUpdates", label: "Job Updates", description: "Updates when jobs are assigned, changed, or completed", icon: Bell },
  { key: "incidentAlerts", label: "Incident Alerts", description: "Critical incident and emergency notifications", icon: Bell },
  {
   key: "marketingAnnouncements",
   label: "Marketing Announcements",
   description: "Product updates, tips, and promotional messages",
   icon: Megaphone,
  },
 ]

const deliveryChannelItems: Array<{
 key: keyof NotificationSettingsFormValues
 label: string
 description: string
 icon: typeof Mail
}> = [
  { key: "emailAlerts", label: "Email Alerts", description: "Receive notifications by email", icon: Mail },
  { key: "smsAlerts", label: "SMS Alerts", description: "Critical alerts via SMS", icon: Phone },
  { key: "pushAlerts", label: "Push Alerts", description: "Real-time browser notifications", icon: Bell },
 ]

export default function NotificationSettings() {
 const { data } = useQuery(getNotificationsPreferencesQueryOptions())
 const {
  mutateAsync: updateNotificationPreferences
 } = useUpdateNotificationPreferences()

 const formDefaultValues = useMemo<NotificationSettingsFormValues>(
  () => ({
   jobUpdates: data?.data?.notificationPreferences?.jobUpdates ?? false,
   incidentAlerts: data?.data?.notificationPreferences?.incidentAlerts ?? false,
   marketingAnnouncements: data?.data?.notificationPreferences?.marketingAnnouncements ?? false,
   emailAlerts: data?.data?.notificationPreferences?.emailAlerts ?? false,
   smsAlerts: data?.data?.notificationPreferences?.smsAlerts ?? false,
   pushAlerts: data?.data?.notificationPreferences?.pushAlerts ?? false,
  }),
  [data]
 )

 const form = useForm<NotificationSettingsFormValues>({
  resolver: zodResolver(notificationSettingsSchema),
  defaultValues: formDefaultValues,
 })

 const onSubmit = async (values: NotificationSettingsFormValues) => {
  await updateNotificationPreferences({
   data: {
    emailAlerts: values.emailAlerts,
    incidentAlerts: values.incidentAlerts,
    jobUpdates: values.jobUpdates,
    marketingAnnouncements: values.marketingAnnouncements,
    pushAlerts: values.pushAlerts,
    smsAlerts: values.smsAlerts
   }
  })
 };

 useEffect(() => {
  form.reset(formDefaultValues)
 }, [form, formDefaultValues])

 return (
  <Form {...form}>
   <form className="space-y-4.5" onSubmit={form.handleSubmit(onSubmit)}>
    <Card>
     <CardHeader>
      <CardTitle>Alert Preferences</CardTitle>
      <CardDescription>Choose which events trigger notifications</CardDescription>
     </CardHeader>
     <CardContent className="space-y-4">
      {alertItems.map((item) => (
       <FormField
        key={item.key as string}
        control={form.control}
        name={item.key}
        render={({ field }) => (
         <FormItem className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
          <div className="flex items-center gap-3">
           <div className="p-2 rounded-lg bg-muted">
            <item.icon className="h-4 w-4 text-muted-foreground" />
           </div>
           <div>
            <p className="font-medium">{item.label}</p>
            <p className="text-sm text-muted-foreground">{item.description}</p>
           </div>
          </div>
          <FormControl>
           <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
         </FormItem>
        )}
       />
      ))}
     </CardContent>
    </Card>

    <Card>
     <CardHeader>
      <CardTitle>Delivery Channels</CardTitle>
      <CardDescription>How you want to receive notifications</CardDescription>
     </CardHeader>
     <CardContent className="space-y-4">
      {deliveryChannelItems.map((item) => (
       <FormField
        key={item.key as string}
        control={form.control}
        name={item.key}
        render={({ field }) => (
         <FormItem className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
          <div className="flex items-center gap-3">
           <div className="p-2 rounded-lg bg-muted">
            <item.icon className="h-4 w-4 text-muted-foreground" />
           </div>
           <div>
            <p className="font-medium">{item.label}</p>
            <p className="text-sm text-muted-foreground">{item.description}</p>
           </div>
          </div>
          <FormControl>
           <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
         </FormItem>
        )}
       />
      ))}
     </CardContent>
    </Card>

    <div className="flex justify-end">
     <Button type="submit" variant="gradient" isLoading={form.formState.isSubmitting} disabled={!form.formState.isDirty || form.formState.isSubmitting}>
      <Save className="h-4 w-4 mr-2" />
      Save Changes
     </Button>
    </div>
   </form>
  </Form>
 )
}
