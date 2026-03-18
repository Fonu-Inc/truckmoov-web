import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type RemoveUserDialogProps = {
 open: boolean;
 onOpenChange: (value: boolean) => void
}

export default function RemoveUserDialog({open, onOpenChange}: RemoveUserDialogProps) {
 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent>
    <DialogHeader>
     <DialogTitle>Remove User</DialogTitle>
     <DialogDescription>
      Are you sure you want to remove this use from your organization?
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
     >
      Remove User
     </Button>
    </div>
   </DialogContent>
  </Dialog>
 )
}
