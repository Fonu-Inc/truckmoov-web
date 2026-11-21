"use client";

import type { DialogId } from "@/shared/stores/dialogStore";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";
import { useOpenDialog } from "@/shared/hooks/useOpenDialog";
import { dialogStore } from "@/shared/stores/dialogStore";

// Code-split: neither dialog (nor the API client behind Get Started) is in the initial bundle.
const GetStartedHost = dynamic(
  () => import("@/features/get-started/components/GetStartedHost").then(m => m.GetStartedHost),
  { ssr: false },
);
const ContactDialog = dynamic(
  () => import("@/features/contact/components/ContactDialog").then(m => m.ContactDialog),
  { ssr: false },
);

function closeDialog(open: boolean) {
  if (!open)
    dialogStore.close();
}

/**
 * Renders the site dialogs once for the whole app. A dialog's code loads the first time it
 * opens and then stays mounted (closed), so the wizard keeps its progress and reopening is
 * instant. Navigating to another page closes whatever is open.
 */
export function DialogHost() {
  const openId = useOpenDialog();
  const pathname = usePathname();
  const [
    loaded,
    setLoaded,
  ] = useState<ReadonlySet<DialogId>>(() => new Set());

  // Derived state: remember which dialogs have been opened at least once.
  if (openId && !loaded.has(openId)) {
    setLoaded(new Set([
      ...loaded,
      openId,
    ]));
  }

  useEffect(
    () => {
      dialogStore.close();
    },
    [pathname],
  );

  // Read once at mount: the effect below strips `?apply=1` from the URL, and a re-run of it
  // (StrictMode in dev) must still see that it was there.
  const [applyOnLoad] = useState(() => typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("apply") === "1");

  // Declared after the close-on-navigate effect so it wins on first load: a resume link
  // (`?token=…&applicationId=…`) or the payment provider's return (`?payment=return`)
  // reopens the application wizard where the applicant left off. `?apply=1` (the main
  // app's sign-in link) opens it for a new application.
  useEffect(
    () => {
      const params = new URLSearchParams(window.location.search);
      const resumeLink = params.has("token") && (params.has("applicationId") || params.has("id"));
      if (resumeLink || params.has("payment")) {
        dialogStore.open(
          "get-started",
          "resume",
        );
        return;
      }
      if (applyOnLoad) {
        dialogStore.open(
          "get-started",
          "new",
        );
        params.delete("apply");
        const query = params.toString();
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
        );
      }
    },
    [applyOnLoad],
  );

  return (
    <>
      {loaded.has("get-started") && (
        <GetStartedHost
          open={openId === "get-started"}
          intent={dialogStore.getIntent()}
          onOpenChange={closeDialog}
        />
      )}
      {loaded.has("contact") && (
        <ContactDialog
          open={openId === "contact"}
          onOpenChange={closeDialog}
        />
      )}
    </>
  );
}
