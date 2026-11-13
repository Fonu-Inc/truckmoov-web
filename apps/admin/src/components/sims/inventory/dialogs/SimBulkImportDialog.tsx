import type { ColumnDef } from "@tanstack/react-table";
import type { SystemSimImportResult } from "@truckmoov/api/auth";
import type { DragEvent } from "react";
import type { ParsedSimRow } from "./simCsv";
import { useImportSystemSims } from "@truckmoov/api/auth";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  Wifi,
  XCircle,
} from "lucide-react";
import { useState } from "react";
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
import {
  downloadSimTemplate,
  MAX_IMPORT_ROWS,
  parseSimCsv,
} from "./simCsv";

export type SimBulkImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function TemplateRow() {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-secondary/30 p-3">
      <div className="flex items-center gap-2">
        <Download className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium">Download Template</p>
          <p className="text-xs text-muted-foreground">CSV template with sample data</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={downloadSimTemplate}
      >
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
    </div>
  );
}

function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file)
      onFile(file);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border"}`}
    >
      <Upload className="h-10 w-10 text-muted-foreground mb-4" />
      <p className="text-sm font-medium mb-1">Drag and drop your CSV file here</p>
      <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
      <Button
        variant="outline"
        size="sm"
        asChild
      >
        <label className="cursor-pointer">
          Browse Files
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file)
                onFile(file);
              event.target.value = "";
            }}
          />
        </label>
      </Button>
    </div>
  );
}

function CountTile({
  tone,
  count,
  label,
  hint,
}: {
  tone: "success" | "destructive";
  count: number;
  label: string;
  hint: string;
}) {
  const Icon = tone === "success" ? CheckCircle : AlertTriangle;
  const classes = tone === "success"
    ? "border-success/30 bg-success/10"
    : "border-destructive/30 bg-destructive/10";
  return (
    <div className={`flex items-center gap-2 rounded-lg border p-3 ${classes}`}>
      <Icon className={`h-5 w-5 ${tone === "success" ? "text-success" : "text-destructive"}`} />
      <div>
        <p className="text-sm font-medium">
          {count}
          {" "}
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

const PREVIEW_COLUMNS: ColumnDef<ParsedSimRow>[] = [
  {
    id: "status",
    header: "Status",
    enableSorting: false,
    meta: { className: "w-8" },
    cell: ({ row }) => (
      <span title={row.original.errors.join(", ")}>
        {row.original.isValid
          ? <CheckCircle className="h-4 w-4 text-success" />
          : <XCircle className="h-4 w-4 text-destructive" />}
      </span>
    ),
  },
  {
    accessorKey: "iccid",
    header: "ICCID",
    enableSorting: false,
    meta: { className: "font-mono text-xs" },
  },
  {
    accessorKey: "msisdn",
    header: "Phone",
    enableSorting: false,
    meta: { className: "text-sm" },
  },
  {
    accessorKey: "carrier",
    header: "Carrier",
    enableSorting: false,
    meta: { className: "text-sm" },
  },
];

function PreviewTable({ rows }: { rows: ParsedSimRow[] }) {
  return (
    <div className="rounded-lg border">
      <div className="overflow-auto">
        <DataTable
          columns={PREVIEW_COLUMNS}
          data={rows}
          className="text-xs"
        />
      </div>
    </div>
  );
}

function FileCard({
  name,
  count,
  onClear,
}: {
  name: string;
  count: number;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wifi className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {count}
            {" "}
            records found
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
      >
        <XCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}

type ImportProblem = SystemSimImportResult["results"][number];

const PROBLEM_COLUMNS: ColumnDef<ImportProblem>[] = [
  {
    accessorKey: "row",
    header: "Row",
    enableSorting: false,
    meta: { className: "w-12 text-sm" },
  },
  {
    accessorKey: "iccid",
    header: "ICCID",
    enableSorting: false,
    meta: { className: "font-mono text-xs" },
  },
  {
    id: "result",
    header: "Result",
    enableSorting: false,
    meta: { className: "text-sm" },
    cell: ({ row }) => `${row.original.outcome === "skipped" ? "Skipped" : "Failed"}${row.original.reason ? `: ${row.original.reason}` : ""}`,
  },
];

function ImportOutcome({ result }: { result: SystemSimImportResult }) {
  const problems = result.results.filter(item => item.outcome !== "imported");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <CountTile
          tone="success"
          count={result.imported}
          label="Imported"
          hint="Added to inventory"
        />
        <CountTile
          tone="destructive"
          count={result.skipped}
          label="Skipped"
          hint="Not imported"
        />
        <CountTile
          tone="destructive"
          count={result.failed}
          label="Failed"
          hint="Not imported"
        />
      </div>
      {problems.length > 0 && (
        <div className="max-h-48 overflow-auto rounded-lg border">
          <DataTable
            columns={PROBLEM_COLUMNS}
            data={problems}
            className="text-xs"
          />
        </div>
      )}
    </div>
  );
}

function BulkImportBody({ onClose }: { onClose: () => void }) {
  const importMutation = useImportSystemSims();
  const [
    file,
    setFile,
  ] = useState<File | null>(null);
  const [
    rows,
    setRows,
  ] = useState<ParsedSimRow[]>([]);
  const [
    result,
    setResult,
  ] = useState<SystemSimImportResult | null>(null);

  const validRows = rows.filter(row => row.isValid);
  const tooMany = validRows.length > MAX_IMPORT_ROWS;

  const handleFile = async (picked: File) => {
    if (!picked.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    setFile(picked);
    setRows(parseSimCsv(await picked.text()));
  };

  const clearFile = () => {
    setFile(null);
    setRows([]);
  };

  const handleImport = () => {
    importMutation.mutate(
      {
        rows: validRows.map(row => ({
          iccid: row.iccid,
          msisdn: row.msisdn,
          imsi: row.imsi || undefined,
          carrier: row.carrier,
        })),
      },
      {
        onSuccess: ({ data }) => {
          toast.success(`${data.imported} SIM cards imported successfully`);
          if (data.skipped + data.failed === 0)
            onClose();
          else
            setResult(data);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  if (result) {
    return (
      <>
        <ImportOutcome result={result} />
        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Close</Button>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {file
        ? (
            <>
              <FileCard
                name={file.name}
                count={rows.length}
                onClear={clearFile}
              />
              <div className="grid grid-cols-2 gap-3">
                <CountTile
                  tone="success"
                  count={validRows.length}
                  label="Valid"
                  hint="Ready to import"
                />
                <CountTile
                  tone="destructive"
                  count={rows.length - validRows.length}
                  label="Invalid"
                  hint="Will be skipped"
                />
              </div>
              {tooMany && (
                <p className="text-sm text-destructive">
                  Import up to
                  {" "}
                  {MAX_IMPORT_ROWS}
                  {" "}
                  SIMs at a time. Split the file and try again.
                </p>
              )}
              {rows.length > 0 && <PreviewTable rows={rows} />}
            </>
          )
        : (
            <>
              <TemplateRow />
              <DropZone onFile={handleFile} />
            </>
          )}

      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          loading={importMutation.isPending}
          disabled={!file || validRows.length === 0 || tooMany}
        >
          Import
          {" "}
          {validRows.length}
          {" "}
          SIM
          {validRows.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}

export function SimBulkImportDialog({
  open,
  onOpenChange,
}: SimBulkImportDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Import SIM Cards</DialogTitle>
          <DialogDescription>Upload a CSV file to import multiple SIM cards at once</DialogDescription>
        </DialogHeader>
        <BulkImportBody onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
