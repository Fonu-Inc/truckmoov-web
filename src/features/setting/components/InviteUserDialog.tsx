import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useInviteMember } from "@/features/auth/api";
import { UserRole } from "@/features/auth/api/types";
import UserRoleSelect from "@/shared/components/UserRoleSelect";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const inviteUserSchema = z.object({
 email: z.email("Enter a valid email address"),
 role: z.string().min(1, "Select a role"),
});

type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

export default function InviteUserDialog() {
 const [open, setOpen] = useState(false);
 const form = useForm<InviteUserFormValues>({
  resolver: zodResolver(inviteUserSchema),
  defaultValues: {
   email: "",
   role: "ENTERPRISE_ADMIN",
  },
 });

 const { mutateAsync: inviteMember } = useInviteMember()
 const handleSubmit = async (values: InviteUserFormValues) => {
  await inviteMember({
   data: {
    email: values.email,
    role: values.role as UserRole,
   }
  }, {
   onSuccess: () => {
    form.reset()
    setOpen(false)
   }
  })
 };

 return (
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogTrigger asChild>
    <Button>
     <Plus className="h-4 w-4" />
     Invite User
    </Button>
   </DialogTrigger>
   <DialogContent className="bg-card border-border">
    <DialogHeader>
     <DialogTitle>Invite Team Member</DialogTitle>
     <DialogDescription>Send an invitation to join your organization</DialogDescription>
    </DialogHeader>
    <Form {...form}>
     <form onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-4 py-4">
       <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
         <FormItem className="space-y-2">
          <FormLabel>Email Address</FormLabel>
          <FormControl>
           <Input
            id="inviteEmail"
            type="email"
            placeholder="colleague@company.com"
            {...field}
           />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
       <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
         <FormItem className="space-y-2">
          <UserRoleSelect value={field.value} onValueChange={field.onChange} />
          <FormMessage />
         </FormItem>
        )}
       />
      </div>
      <div className="flex justify-end gap-3">
       <DialogClose asChild>
        <Button variant="outline" type="button" disabled={form.formState.isSubmitting}>Cancel</Button>
       </DialogClose>
       <Button variant="gradient" type="submit" isLoading={form.formState.isSubmitting}>
        Send Invitation
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 )
}
