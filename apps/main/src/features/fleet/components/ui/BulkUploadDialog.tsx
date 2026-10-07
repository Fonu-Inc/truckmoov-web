import type { ColumnDef } from "@tanstack/react-table";
import type {
  BulkImportSkipped, VehicleImportColumn,
} from "@truckmoov/api/fleet";
import {
  downloadVehicleImportTemplate,
  useImportVehicles,
  useVehicleImportColumns,
} from "@truckmoov/api/fleet";
import {
  AlertCircle, CheckCircle, Download, FileText, Upload, X,
} from "lucide-react";
import {
  useCallback, useRef, useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { cn } from "@/lib/utils";

type BulkUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ImportOutcome = {
  created: number;
  updated: number;
  total: number;
  skipped: BulkImportSkipped[];
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const templateColumns: ColumnDef<VehicleImportColumn>[] = [
  {
    accessorKey: "header",
    header: "Column",
    enableSorting: false,
    meta: { className: "font-medium" },
  },
  {
    accessorKey: "required",
    header: "Required",
    enableSorting: false,
    cell: ({ row }) => (row.original.required ? "yes" : "no"),
  },
  {
    accessorKey: "example",
    header: "Example",
    enableSorting: false,
    meta: { className: "font-mono text-muted-foreground" },
  },
  {
    accessorKey: "note",
    header: "Note",
    enableSorting: false,
    meta: { className: "text-muted-foreground" },
  },
];

const skippedColumns: ColumnDef<BulkImportSkipped>[] = [
  {
    accessorKey: "line",
    header: "Line",
    enableSorting: false,
    meta: { className: "font-mono" },
  },
  {
    accessorKey: "message",
    header: "Reason",
    enableSorting: false,
    meta: { className: "text-destructive" },
  },
];

export function BulkUploadDialog({
  open, onOpenChange,
}: BulkUploadDialogProps) {
  const [
    isDragging,
    setIsDragging,
  ] = useState(false);
  const [
    file,
    setFile,
  ] = useState<File | null>(null);
  const [
    outcome,
    setOutcome,
  ] = useState<ImportOutcome | null>(null);
  // One key per selected file: retrying the same file reuses it, a new file rotates it.
  const idempotencyKey = useRef("");
  const importMutation = useImportVehicles();
  const { data: columnsResp } = useVehicleImportColumns();

  const handleFile = useCallback(
    (selectedFile: File) => {
      if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      if (selectedFile.size > MAX_FILE_BYTES) {
        toast.error("File exceeds 10 MB limit");
        return;
      }
      idempotencyKey.current = crypto.randomUUID();
      setFile(selectedFile);
      setOutcome(null);
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile)
        handleFile(droppedFile);
    },
    [handleFile],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile)
      handleFile(selectedFile);
  };

  const handleReset = () => {
    setFile(null);
    setOutcome(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleImport = async () => {
    if (!file)
      return;
    try {
      const res = await importMutation.mutateAsync({
        file,
        idempotencyKey: idempotencyKey.current,
      });
      const data = res.data;
      const skipped = data.skipped ?? [];
      setOutcome({
        created: data.created,
        updated: data.updated,
        total: data.total,
        skipped,
      });
      const summary = `${data.created} created, ${data.updated} updated${skipped.length ? `, ${skipped.length} skipped` : ""}`;
      if (skipped.length > 0)
        toast.warning(`Import complete — ${summary}`);
      else
        toast.success(`Import complete — ${summary}`);
    }
    catch (error) {
      const err = error as { message?: string };
      toast.error(err?.message ?? "Vehicle import failed");
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await downloadVehicleImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vehicle_import_template.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
    catch {
      toast.error("Failed to download template");
    }
  };

  const columns = columnsResp?.data?.columns ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next)
          handleReset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Import Vehicles</DialogTitle>
          <DialogDescription>
            Upload a CSV file — the server validates it and imports what it can.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file && !outcome && (
            <>
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Download Template</p>
                    <p className="text-xs text-muted-foreground">Use the server template for correct columns</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              {columns.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                  <DataTable
                    className="text-xs"
                    columns={templateColumns}
                    data={columns}
                  />
                </div>
              )}

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-1">Drag and drop your CSV file here</p>
                <p className="text-xs text-muted-foreground mb-4">or click to browse (max 10 MB)</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <Button
                  variant="outline"
                  size="sm"
                >
                  Select File
                </Button>
              </div>
            </>
          )}

          {file && !outcome && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)}
                    {" "}
                    KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleReset}
                disabled={importMutation.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {outcome && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm font-medium">{outcome.created}</p>
                    <p className="text-xs text-muted-foreground">Created</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{outcome.updated}</p>
                    <p className="text-xs text-muted-foreground">Updated</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">{outcome.skipped.length}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </div>
                </div>
              </div>

              {outcome.skipped.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                  <DataTable
                    className="text-xs"
                    columns={skippedColumns}
                    data={outcome.skipped}
                  />
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            {outcome
              ? (
                  <Button onClick={handleClose}>Done</Button>
                )
              : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      disabled={importMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={!file || importMutation.isPending}
                    >
                      {importMutation.isPending ? "Importing..." : "Import"}
                    </Button>
                  </>
                )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
