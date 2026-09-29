import {
  useRef,
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

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel: string;
};

/** `await confirm({...})` resolves true on confirm, false on cancel. Render `dialog` once. */
export function useConfirmDialog() {
  const [
    options,
    setOptions,
  ] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  function confirm(next: ConfirmOptions) {
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }

  function settle(ok: boolean) {
    resolveRef.current?.(ok);
    resolveRef.current = null;
    setOptions(null);
  }

  const dialog = (
    <AlertDialog
      open={Boolean(options)}
      onOpenChange={open => !open && settle(false)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          <AlertDialogDescription>{options?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settle(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => settle(true)}>{options?.confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {
    confirm,
    dialog,
  };
}
