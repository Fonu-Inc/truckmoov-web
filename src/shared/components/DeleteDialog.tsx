import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";

type DeleteDialogProps = {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 handleDeleteFn: () => Promise<void> | void;
 isLoading: boolean;
 title?: string;
 description?: string;
};

export default function DeleteDialog({
 open,
 onOpenChange,
 handleDeleteFn,
 isLoading,
 title = "Are you sure?",
 description = "This action cannot be undone.",
}: DeleteDialogProps) {
 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent>
    <DialogHeader>
     <DialogTitle>{title}</DialogTitle>
     <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <div className="flex justify-end gap-3 pt-4">
     <DialogClose asChild>
      <Button variant="outline">Cancel</Button>
     </DialogClose>
     <Button variant="destructive" onClick={handleDeleteFn} isLoading={isLoading}>
      Delete
     </Button>
    </div>
   </DialogContent>
  </Dialog>
 );
}
