import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDeleteInvitedUser } from "@/features/auth/api";
import { User } from "@/features/auth/api/types";

type RemoveUserDialogProps = {
 user: User;
 open: boolean;
 onOpenChange: (value: boolean) => void
}

export default function RemoveUserDialog({ open, onOpenChange, user }: RemoveUserDialogProps) {
 const { mutateAsync, isPending } = useDeleteInvitedUser()

 async function deleteUser() {
  await mutateAsync({
   userId: user.userId
  }, {
   onSuccess: () => {
    onOpenChange(false)
   }
  })
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent>
    <DialogHeader>
     <DialogTitle>Remove User</DialogTitle>
     <DialogDescription>
      Are you sure you want to remove {user?.profile?.fullName} from your organization?
      They will lose access to all resources.
     </DialogDescription>
    </DialogHeader>
    <div className="flex justify-end gap-3 pt-4">
     <DialogClose>
      <Button
       variant="outline"
      >
       Cancel
      </Button>
     </DialogClose>
     <Button
      variant="destructive"
      onClick={deleteUser}
      isLoading={isPending}
     >
      Remove User
     </Button>
    </div>
   </DialogContent>
  </Dialog>
 )
}
