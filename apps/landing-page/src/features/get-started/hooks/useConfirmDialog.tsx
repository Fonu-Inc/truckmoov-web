"use client";

import {
  useRef,
  useState,
} from "react";
import { SubDialog } from "@/features/get-started/components/SubDialog";
import {
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

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
    <SubDialog
      open={Boolean(options)}
      onOpenChange={open => !open && settle(false)}
      title={options?.title ?? ""}
      description={options?.description}
      className="sm:max-w-[460px]"
      footer={(
        <>
          <button
            type="button"
            className={cn(
              SECONDARY_BUTTON_CLASS,
              "h-[45px] px-6 text-sm",
            )}
            onClick={() => settle(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={PRIMARY_BUTTON_CLASS}
            onClick={() => settle(true)}
          >
            {options?.confirmLabel}
          </button>
        </>
      )}
    />
  );

  return {
    confirm,
    dialog,
  };
}
