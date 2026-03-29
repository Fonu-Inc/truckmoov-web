import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getDispatcherPreferencesQueryOptions, useUpdateDispatcherPreferences } from "@/features/auth/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { Save } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { TIMEZONES } from "../libs/timezone"
import { DAYS } from "../libs/days"

const dispatchSettingsSchema = z.object({
 timezone: z.string().min(1, "Timezone is required"),
 shiftStart: z.string().min(1, "Shift start is required"),
 shiftEnd: z.string().min(1, "Shift end is required"),
 workDays: z.array(z.number()).min(1, "Select at least one work day"),
})

type DispatchSettingsFormValues = z.infer<typeof dispatchSettingsSchema>

export default function DispatchSettings() {
 const { data } = useQuery(getDispatcherPreferencesQueryOptions())
 const { mutateAsync: updateDispatcherPreferences } = useUpdateDispatcherPreferences()

 const formDefaultValues = useMemo<DispatchSettingsFormValues>(
  () => ({
   timezone: data?.data?.dispatcherPreferences?.timezone ?? "UTC",
   shiftStart: data?.data?.dispatcherPreferences?.shiftStart ?? "09:00",
   shiftEnd: data?.data?.dispatcherPreferences?.shiftEnd ?? "17:00",
   workDays: data?.data?.dispatcherPreferences?.workDays ?? [2, 3, 4, 5, 6],
  }),
  [data]
 )

 const form = useForm<DispatchSettingsFormValues>({
  resolver: zodResolver(dispatchSettingsSchema),
  defaultValues: formDefaultValues,
 })

 useEffect(() => {
  form.reset(formDefaultValues)
 }, [form, formDefaultValues])

 const onSubmit = async (values: DispatchSettingsFormValues) => {
  await updateDispatcherPreferences({
   data: {
    timezone: values.timezone,
    shiftStart: values.shiftStart,
    shiftEnd: values.shiftEnd,
    workDays: values.workDays,
   },
  })
 }

 return (
  <Form {...form}>
   <form className="space-y-4.5" onSubmit={form.handleSubmit(onSubmit)}>
    <Card>
     <CardHeader>
      <CardTitle>Shift Hours</CardTitle>
      <CardDescription>Define your standard working hours for each dispatch shift</CardDescription>
     </CardHeader>
     <CardContent>
      <div className="grid grid-cols-2 gap-4">
       <FormField
        control={form.control}
        name="shiftStart"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Shift Start</FormLabel>
          <FormControl>
           <Input type="time" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
       <FormField
        control={form.control}
        name="shiftEnd"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Shift End</FormLabel>
          <FormControl>
           <Input type="time" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
      </div>
     </CardContent>
    </Card>

    <Card>
     <CardHeader>
      <CardTitle>Work Days</CardTitle>
      <CardDescription>Select the days of the week you are on dispatch</CardDescription>
     </CardHeader>
     <CardContent>
      <FormField
       control={form.control}
       name="workDays"
       render={({ field }) => (
        <FormItem>
         <FormControl>
          <div className="flex gap-2">
           {DAYS.map((day) => {
            const isActive = field.value.includes(day.value)
            return (
             <button
              key={day.value}
              type="button"
              onClick={() => {
               const next = isActive
                ? field.value.filter((d) => d !== day.value)
                : [...field.value, day.value].sort((a, b) => a - b)
               field.onChange(next)
              }}
              className={`h-9 w-10 rounded-md text-sm font-medium border transition-colors ${isActive
               ? "bg-primary text-primary-foreground border-primary"
               : "bg-background text-muted-foreground border-border hover:bg-muted"
               }`}
             >
              {day.label}
             </button>
            )
           })}
          </div>
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />
     </CardContent>
    </Card>

    <Card>
     <CardHeader>
      <CardTitle>Regional</CardTitle>
      <CardDescription>Set your local timezone for accurate scheduling and timestamps</CardDescription>
     </CardHeader>
     <CardContent>
      <FormField
       control={form.control}
       name="timezone"
       render={({ field }) => (
        <FormItem className="max-w-sm">
         <FormLabel>Timezone</FormLabel>
         <Select onValueChange={field.onChange} value={field.value}>
          <FormControl>
           <SelectTrigger>
            <SelectValue placeholder="Select a timezone" />
           </SelectTrigger>
          </FormControl>
          <SelectContent className="max-h-64">
           {TIMEZONES.map((tz: string) => (
            <SelectItem key={tz} value={tz}>
             {tz}
            </SelectItem>
           ))}
          </SelectContent>
         </Select>
         <FormMessage />
        </FormItem>
       )}
      />
     </CardContent>
    </Card>

    <div className="flex justify-end">
     <Button
      type="submit"
      isLoading={form.formState.isSubmitting}
      disabled={!form.formState.isDirty || form.formState.isSubmitting}
     >
      <Save className="h-4 w-4 mr-2" />
      Save Changes
     </Button>
    </div>
   </form>
  </Form>
 )
}
