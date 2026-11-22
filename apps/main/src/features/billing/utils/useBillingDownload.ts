import type { ReceiptData } from "@/lib/receiptPdf";
import { useState } from "react";
import { toast } from "sonner";
import { downloadDocument } from "./billingHelpers";

export function useBillingDownload<T>(
  fetchDetail: (id: string) => Promise<T>,
  build: (detail: T) => ReceiptData,
) {
  const [
    busyId,
    setBusyId,
  ] = useState<string | null>(null);

  const download = async (id: string) => {
    setBusyId(id);
    try {
      await downloadDocument(build(await fetchDetail(id)));
    }
    catch {
      toast.error("Could not prepare the download. Try again.");
    }
    finally {
      setBusyId(null);
    }
  };

  return {
    download, busyId,
  };
}
