import {
  Download, FileText, Loader2,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";

import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";

type DocumentViewerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Display title — typically the document type label. */
  title: string;
  /** Secondary line — typically file name · size · date. */
  subtitle?: string;
  /** Resolves the document blob (storage download or generated sample). */
  loadBlob: () => Promise<Blob>;
  fileName: string;
};

/**
 * Popup viewer for a submitted document. Loads the file as a blob, renders
 * PDFs in an inline frame and images inline, and offers a download fallback
 * for other formats. Ported from fleetflow `documents/DocumentViewerDialog`.
 */
export function DocumentViewerDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  loadBlob,
  fileName,
}: DocumentViewerDialogProps) {
  const [
    objectUrl,
    setObjectUrl,
  ] = useState<string | null>(null);
  const [
    mime,
    setMime,
  ] = useState<string>("");
  const [
    loading,
    setLoading,
  ] = useState(false);
  const [
    error,
    setError,
  ] = useState<string | null>(null);

  useEffect(
    () => {
      if (!open)
        return;
      let cancelled = false;
      let url: string | null = null;
      setLoading(true);
      setError(null);
      setObjectUrl(null);
      loadBlob()
        .then((blob) => {
          if (cancelled)
            return;
          url = URL.createObjectURL(blob);
          setMime(blob.type || "application/octet-stream");
          setObjectUrl(url);
        })
        .catch(() => {
          if (!cancelled)
            setError("This document could not be loaded.");
        })
        .finally(() => {
          if (!cancelled)
            setLoading(false);
        });
      return () => {
        cancelled = true;
        if (url)
          URL.revokeObjectURL(url);
      };
    },
    [
      open,
      loadBlob,
    ],
  );

  const isPdf = mime === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  const isImage = mime.startsWith("image/");

  const download = () => {
    if (!objectUrl)
      return;
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="flex h-[85vh] max-w-3xl flex-col gap-3">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/30">
          {loading
            ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm">Loading document…</p>
                </div>
              )
            : error
              ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">{error}</p>
                )
              : objectUrl && isPdf
                ? (
                    <iframe
                      title={title}
                      src={objectUrl}
                      className="h-full w-full"
                    />
                  )
                : objectUrl && isImage
                  ? (
                      <img
                        src={objectUrl}
                        alt={title}
                        className="max-h-full max-w-full object-contain"
                      />
                    )
                  : (
                      <div className="flex flex-col items-center gap-3 p-6 text-center">
                        <FileText className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Preview isn’t available for this file type. Download it to view.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={download}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
