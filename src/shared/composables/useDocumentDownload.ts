import { useState } from "react";
import { documentSecureUrlQueryOptions } from "@/features/fleet/api";
import { queryClient } from "@/shared/providers/TanstackQueryProvider";
import { toast } from "sonner";

export type DocumentDownloadMode = "view" | "download";

type DownloadPayload = {
 id: string;
 tenantId: string;
 filename?: string;
 mode?: DocumentDownloadMode;
};

/**
 * Reusable composable for securely downloading a document.
 * Fetches a pre-signed URL from the API and then either opens or downloads it.
 *
 * Usage:
 *   const { download, view, isLoading } = useDocumentDownload()
 *   view({ id: doc.id, tenantId })
 *   download({ id: doc.id, tenantId, filename: doc.filename })
 */
export function useDocumentDownload() {
 const [isLoading, setIsLoading] = useState(false);
 const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

 async function openSecureDocument({ id, tenantId, filename, mode = "download" }: DownloadPayload) {
  setIsLoading(true);
  setActiveDocumentId(id);

  try {
   const result = await queryClient.fetchQuery(
    documentSecureUrlQueryOptions({ id, params: { tenantId } })
   );
   const url = result?.data?.url;

   if (!url) {
    toast.error("Unable to retrieve a secure document link.");
    return;
   }

   if (mode === "view") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
   }

   const link = document.createElement("a");
   link.href = url;
   link.target = "_blank";
   link.rel = "noopener,noreferrer";
   if (filename) link.download = filename;
   document.body.appendChild(link);
   link.click();
   link.remove();
  } catch {
   toast.error("Unable to load this document right now. Please try again.");
  } finally {
   setIsLoading(false);
   setActiveDocumentId(null);
  }
 }

 function view(payload: Omit<DownloadPayload, "mode">) {
  return openSecureDocument({ ...payload, mode: "view" });
 }

 function download(payload: Omit<DownloadPayload, "mode">) {
  return openSecureDocument({ ...payload, mode: "download" });
 }

 return { download, view, openSecureDocument, isLoading, activeDocumentId };
}
