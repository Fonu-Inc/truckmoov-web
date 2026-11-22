import type { SimRow } from "../simInventoryShared";
import { useDeleteSystemSim } from "@truckmoov/api/auth";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";

export type SimDeleteDialogProps = {
  sim: SimRow | null;
  onOpenChange: (open: boolean) => void;
};

export function SimDeleteDialog({
  sim,
  onOpenChange,
}: SimDeleteDialogProps) {
  const deleteMutation = useDeleteSystemSim();

  const handleDelete = () => {
    if (!sim)
      return;
    deleteMutation.mutate(
      { id: sim.id },
      {
        onSuccess: () => {
          toast.success("SIM card deleted successfully");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <AlertDialog
      open={Boolean(sim)}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete SIM Card</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this SIM card? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleDelete();
            }}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete SIM
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
