/** The site-wide dialogs. Each is mounted once, in the root layout's DialogHost. */
export type DialogId = "get-started" | "contact";

type Listener = () => void;

let openDialogId: DialogId | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners)
    listener();
}

/**
 * Tiny external store for "which dialog is open". Triggers only write to it, and the
 * DialogHost is its only subscriber, so opening a dialog re-renders nothing else on the page.
 */
export const dialogStore = {
  getSnapshot: (): DialogId | null => openDialogId,
  getServerSnapshot: (): DialogId | null => null,
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  open(id: DialogId) {
    if (openDialogId === id)
      return;
    openDialogId = id;
    emit();
  },
  close() {
    if (openDialogId === null)
      return;
    openDialogId = null;
    emit();
  },
};
