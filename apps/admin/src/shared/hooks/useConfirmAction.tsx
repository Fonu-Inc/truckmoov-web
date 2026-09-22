import type { ReactNode } from "react";
import {
  useCallback,
  useState,
} from "react";
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

export type ConfirmActionOptions = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive styling on the confirm button. Defaults to true. */
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

/**
 * Shared confirmation dialog for destructive or irreversible actions
 * (suspend, terminate, revoke, delete).
 *
 * Usage:
 *   const { confirm, confirmDialog } = useConfirmAction();
 *   <Button onClick={() => confirm({ title: "Suspend?", onConfirm: doIt })} />
 *   {confirmDialog}
 */
export function useConfirmAction() {
  const [
    options,
    setOptions,
  ] = useState<ConfirmActionOptions | null>(null);
  const [
    busy,
    setBusy,
  ] = useState(false);

  const confirm = useCallback(
    (opts: ConfirmActionOptions) => setOptions(opts),
    [],
  );

  const handleConfirm = async () => {
    if (!options)
      return;
    try {
      setBusy(true);
      await options.onConfirm();
    }
    finally {
      setBusy(false);
      setOptions(null);
    }
  };

  const confirmDialog = (
    <AlertDialog
      open={!!options}
      onOpenChange={(open) => {
        if (!open && !busy)
          setOptions(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          {options?.description
            ? <AlertDialogDescription>{options.description}</AlertDialogDescription>
            : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {options?.cancelLabel || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className={
              options?.destructive === false
                ? undefined
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }
          >
            {options?.confirmLabel || "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {
    confirm,
    confirmDialog,
  };
}
