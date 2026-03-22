import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_QUERY_KEY, useChangeUserRole, useUpdateInvitedUser } from "@/features/auth/api";
import { User } from "@/features/auth/api/types";
import { queryClient } from "@/shared/providers/TanstackQueryProvider";
import UserRoleSelect from "@/shared/components/UserRoleSelect";

const editUserSchema = z.object({
 fullName: z.string().trim().min(1, "Full name is required"),
 role: z.string().min(1, "Select a role"),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

type EditUserDialogProps = {
 user: User;
 open: boolean;
 onOpenChange: (value: boolean) => void;
}

export default function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
 const form = useForm<EditUserFormValues>({
  resolver: zodResolver(editUserSchema),
  defaultValues: {
   fullName: user?.profile?.fullName ?? "",
   role: user?.role ?? "",
  },
 });

 useEffect(() => {
  form.reset({
   fullName: user?.profile?.fullName ?? "",
   role: user?.role ?? "",
  });
 }, [user, form]);

 const { mutateAsync: updateInvitedUser } = useUpdateInvitedUser();
 const { mutateAsync: changeUserRole } = useChangeUserRole();

 const handleSubmit = async (values: EditUserFormValues) => {
  const { dirtyFields } = form.formState;
  const promises = [];

  if (dirtyFields.fullName) {
   promises.push(
    updateInvitedUser({ userId: user.id, data: { fullName: values.fullName } })
   );
  }

  if (dirtyFields.role) {
   promises.push(
    changeUserRole(
     { data: { targetUserId: user.id, newRole: values.role } },
     {
      onSuccess: () => {
       toast.success("User Role Updated");
       queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.invitedUsers });
      },
     }
    )
   );
  }

  await Promise.all(promises);
  onOpenChange(false);
 };

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent>
    <DialogHeader>
     <DialogTitle>Edit User</DialogTitle>
     <DialogDescription>
      Update user details and permissions
     </DialogDescription>
    </DialogHeader>
    <Form {...form}>
     <form onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-4 py-4">
       <FormField
        control={form.control}
        name="fullName"
        render={({ field }) => (
         <FormItem className="space-y-2">
          <FormLabel>Full Name</FormLabel>
          <FormControl>
           <Input placeholder="Enter full name" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
       <div className="space-y-2">
        <Label htmlFor="editEmail">Email</Label>
        <Input
         id="editEmail"
         disabled
         className="bg-muted"
         value={user?.email}
        />
        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
       </div>
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
        <Button variant="outline" type="button" disabled={form.formState.isSubmitting}>
         Cancel
        </Button>
       </DialogClose>
       <Button variant="gradient" type="submit" isLoading={form.formState.isSubmitting}>
        Save Changes
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 );
}
