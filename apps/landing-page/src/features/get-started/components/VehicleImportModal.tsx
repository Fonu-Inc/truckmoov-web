"use client";

import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import {
  CloudArrowUp,
  DownloadSimple,
  FileCsv,
} from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingVehicleImportColumnsQueryOptions,
  getOnboardingVehicleImportTemplate,
} from "@truckmoov/api/auth";
import {
  useEffect,
  useState,
} from "react";
import { Notice } from "@/features/get-started/components/StepParts";
import { SubDialog } from "@/features/get-started/components/SubDialog";
import { SECONDARY_BUTTON_CLASS } from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

const MAX_CSV_BYTES = 2 * 1024 * 1024;

export type VehicleImportResult = {
  message: string;
  skipped: {
    line: number;
    message: string;
  }[];
};

/**
 * Bulk vehicle import (main app: VehicleImportModal). The server parses the CSV: rows match
 * on registration number, so re-uploading a corrected file updates vehicles instead of
 * duplicating them, and bad rows come back in `skipped` while the good ones still import.
 */
export function VehicleImportModal({
  open,
  onOpenChange,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rejects with the server error on failure. */
  onUpload: (file: File) => Promise<VehicleImportResult>;
}) {
  const [
    dragging,
    setDragging,
  ] = useState(false);
  const [
    uploading,
    setUploading,
  ] = useState(false);
  const [
    result,
    setResult,
  ] = useState<VehicleImportResult | null>(null);
  const [
    error,
    setError,
  ] = useState<string | null>(null);
  const columnsQuery = useQuery({
    ...getOnboardingVehicleImportColumnsQueryOptions(),
    enabled: open,
  });
  const columns = columnsQuery.data?.data.columns ?? [];

  useEffect(
    () => {
      if (open) {
        setResult(null);
        setError(null);
      }
    },
    [open],
  );

  async function downloadTemplate() {
    try {
      const blob = await getOnboardingVehicleImportTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "fleetpro_vehicle_template.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    }
    catch {
      setError("The template couldn't be downloaded. Try again.");
    }
  }

  async function handleFile(file: File) {
    setResult(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only CSV files are supported. Download the template to get started.");
      return;
    }
    if (file.size > MAX_CSV_BYTES) {
      setError("The CSV must be 2 MB or smaller.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const outcome = await onUpload(file);
      setResult(outcome);
      if (outcome.skipped.length === 0)
        onOpenChange(false);
    }
    catch (err) {
      const serverError = err as ServerErrorResponse;
      setError(serverError.statusCode === 413 ? "The CSV must be 2 MB or smaller." : serverError.message || "The file couldn't be imported.");
    }
    finally {
      setUploading(false);
    }
  }

  return (
    <SubDialog
      open={open}
      onOpenChange={next => !uploading && onOpenChange(next)}
      title="Upload Vehicles"
      description="Upload a CSV of your vehicles. Rows are matched on registration number, so uploading a corrected file again updates those vehicles rather than adding them twice."
      className="sm:max-w-[620px]"
      footer={(
        <button
          type="button"
          className={cn(
            SECONDARY_BUTTON_CLASS,
            "h-[45px] px-6 text-sm",
          )}
          disabled={uploading}
          onClick={() => onOpenChange(false)}
        >
          {result ? "Done" : "Cancel"}
        </button>
      )}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-[15px] bg-surface p-4">
          <FileCsv className="size-6 shrink-0 text-brand-deep" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-heading">Need a template?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Download the Fleet Pro template so every column is in the expected format.
            </p>
          </div>
          <button
            type="button"
            className={SECONDARY_BUTTON_CLASS}
            onClick={() => void downloadTemplate()}
          >
            <DownloadSimple className="size-4" />
            Download CSV Template
          </button>
        </div>

        {columns.length > 0 && (
          <div className="rounded-[15px] border-[0.5px] border-border">
            <p className="border-b-[0.5px] border-border px-3 py-2 text-xs font-semibold text-heading">Columns</p>
            <ul className="divide-y divide-border text-xs">
              {columns.map(column => (
                <li
                  key={column.header}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-1.5"
                >
                  <span className="font-mono text-heading">
                    {column.header}
                    {column.required && (
                      <span
                        aria-hidden="true"
                        className="ml-0.5 text-destructive"
                      >
                        *
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground">{column.note || `e.g. ${column.example}`}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file)
              void handleFile(file);
          }}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed p-10 text-center transition-colors",
            dragging ? "border-brand-bright bg-brand-tint" : "border-border-field hover:border-border-deep",
          )}
        >
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-brand-tint">
            <CloudArrowUp className="size-6 text-brand-deep" />
          </span>
          <p className="text-sm font-medium text-heading">{uploading ? "Importing…" : "Drag and drop your file here"}</p>
          <p className="mt-1 text-xs text-muted-foreground">or click to browse · CSV up to 2 MB</p>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={uploading}
            aria-label="Choose a CSV file"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file)
                void handleFile(file);
              event.target.value = "";
            }}
          />
        </div>

        {error && <Notice>{error}</Notice>}

        {result && result.skipped.length > 0 && (
          <div className="space-y-2 rounded-[15px] bg-warning-soft p-3">
            <p className="text-sm font-medium text-heading">{result.message}</p>
            <p className="text-xs text-muted-foreground">
              These rows couldn't be read and were skipped. Fix them and upload the file again.
            </p>
            <ul className="space-y-1 text-xs">
              {result.skipped.map(row => (
                <li key={row.line}>
                  <span className="font-medium text-heading">{`Line ${row.line}: `}</span>
                  <span className="text-muted-foreground">{row.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SubDialog>
  );
}
