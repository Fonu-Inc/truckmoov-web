import type { ReactNode } from "react";
import { DialogHost } from "@/shared/components/providers/DialogHost";

/**
 * Every app-wide provider, composed once and used in the root layout. There is deliberately
 * no context provider around the page: the only app-wide client state is the dialog store,
 * which components read through useSyncExternalStore.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DialogHost />
    </>
  );
}
