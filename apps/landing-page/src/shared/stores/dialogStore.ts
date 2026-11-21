/** The site-wide dialogs. Each is mounted once, in the root layout's DialogHost. */
export type DialogId = "get-started" | "contact";

/**
 * Which button opened the dialog. For Get Started:
 * - "new" (Apply for Account Creation) offers a fresh application, or asks whether to continue
 *   the one saved in this browser;
 * - "returning" (Apply as Returning Customer) is an existing MTN customer: the same flow, with
 *   the returning flag set (a saved application is still resumed);
 * - "resume" reopens the saved application directly (a resume link or the payment return).
 */
export type DialogIntent = "new" | "returning" | "resume";

type Listener = () => void;

let openDialogId: DialogId | null = null;
let openIntent: DialogIntent = "new";
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
  /** The intent of the latest `open`. Read alongside the snapshot; it only changes with it. */
  getIntent: (): DialogIntent => openIntent,
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  open(id: DialogId, intent: DialogIntent = "new") {
    if (openDialogId === id)
      return;
    openDialogId = id;
    openIntent = intent;
    emit();
  },
  close() {
    if (openDialogId === null)
      return;
    openDialogId = null;
    emit();
  },
};
