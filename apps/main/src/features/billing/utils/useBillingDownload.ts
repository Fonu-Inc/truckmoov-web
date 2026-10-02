import { useState } from "react";
import { toast } from "sonner";
import { downloadDocument } from "./billingHelpers";

type Document = {
  filename: string; lines: string[];
};

export function useBillingDownload<T>(
  fetchDetail: (id: string) => Promise<T>,
  build: (detail: T) => Document,
) {
  const [
    busyId,
    setBusyId,
  ] = useState<string | null>(null);

  const download = async (id: string) => {
    setBusyId(id);
    try {
      const doc = build(await fetchDetail(id));
      downloadDocument(
        doc.filename,
        doc.lines,
      );
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
