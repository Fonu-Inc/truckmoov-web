import type { PlatformStockImportResult } from "@truckmoov/api/auth";
import { useImportPlatformStock } from "@truckmoov/api/auth";
import { downloadBlob } from "@truckmoov/app-core/utils/general-utils";
import {
  CheckCircle2, Download, FileSpreadsheet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  countStockRows,
  STOCK_IMPORT_MAX_BYTES,
  STOCK_TEMPLATE_CSV,
} from "./platformStockCsv";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SHOWN_REJECTED = 10;

/** Loads platform-held device stock from a CSV. */
export function ImportPlatformStockDialog({
  open,
  onOpenChange,
}: Props) {
  const importStock = useImportPlatformStock();
  const [
    file,
    setFile,
  ] = useState<File | null>(null);
  const [
    rowCount,
    setRowCount,
  ] = useState<number | null>(null);
  const [
    error,
    setError,
  ] = useState("");
  const [
    result,
    setResult,
  ] = useState<PlatformStockImportResult | null>(null);

  const reset = () => {
    setFile(null);
    setRowCount(null);
    setError("");
    setResult(null);
  };

  const pickFile = async (input: HTMLInputElement) => {
    const picked = input.files?.[0];
    setFile(null);
    setRowCount(null);
    setError("");
    if (!picked)
      return;
    if (picked.size > STOCK_IMPORT_MAX_BYTES) {
      setError("File is larger than 2 MB. Split it into smaller files.");
      input.value = "";
      return;
    }
    const count = countStockRows(await picked.text());
    if (count === 0) {
      setError("No device rows found. Expected a header row followed by at least one device.");
      input.value = "";
      return;
    }
    setFile(picked);
    setRowCount(count);
  };

  const submit = () => {
    if (!file)
      return;
    setError("");
    importStock.mutate(
      { file },
      {
        onSuccess: (res) => {
          setResult(res.data);
          toast.success(`${res.data.created} device${res.data.created === 1 ? "" : "s"} added to platform stock`);
        },
        onError: (err) => {
          setError(err.message);
          toast.error(err.message);
        },
      },
    );
  };

  const close = (value: boolean) => {
    if (importStock.isPending)
      return;
    if (!value)
      reset();
    onOpenChange(value);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Platform Stock</DialogTitle>
          <DialogDescription>
            Add FleetPro-owned devices that can be allocated to tenants. Devices already registered are skipped.
          </DialogDescription>
        </DialogHeader>

        {result
          ? (
              <div className="space-y-4">
                <div
                  role="status"
                  className="flex items-center gap-2 text-success"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-medium">Import finished</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Created", value: result.created,
                    },
                    {
                      label: "Already existed", value: result.skippedExisting,
                    },
                    {
                      label: "Rejected", value: result.rejectedTotal,
                    },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="rounded-lg border bg-card p-3"
                    >
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="mt-1 text-xl font-bold">{item.value}</p>
                    </div>
                  ))}
                </div>
                {result.rejected.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {result.rejectedTotal > SHOWN_REJECTED
                        ? `First ${SHOWN_REJECTED} of ${result.rejectedTotal} rejected rows`
                        : "Rejected rows"}
                    </p>
                    <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2 text-sm">
                      {result.rejected.slice(
                        0,
                        SHOWN_REJECTED,
                      ).map(row => (
                        <li
                          key={`${row.line}-${row.imei}`}
                          className="flex gap-2"
                        >
                          <span className="shrink-0 text-muted-foreground">{`Line ${row.line}`}</span>
                          <span className="shrink-0 font-mono">{row.imei || "(empty)"}</span>
                          <span className="text-destructive">{row.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="platform-stock-file"
                    required
                  >
                    CSV file
                  </Label>
                  <Input
                    id="platform-stock-file"
                    type="file"
                    accept=".csv,text/csv"
                    disabled={importStock.isPending}
                    onChange={e => void pickFile(e.target)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Columns: imei, manufacturer, model, name (optional). Up to 2 MB.
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => downloadBlob(
                      new Blob(
                        [STOCK_TEMPLATE_CSV],
                        { type: "text/csv" },
                      ),
                      "platform-stock-template.csv",
                    )}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Download template
                  </Button>
                </div>

                {file && rowCount !== null && (
                  <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <span className="min-w-0 truncate">{file.name}</span>
                    <span className="ml-auto shrink-0 text-muted-foreground">
                      {`${rowCount.toLocaleString()} device${rowCount === 1 ? "" : "s"}`}
                    </span>
                  </div>
                )}

                {importStock.isPending && (
                  <p
                    role="status"
                    className="text-sm text-muted-foreground"
                  >
                    {`Importing ${rowCount?.toLocaleString() ?? ""} devices. Large files can take a minute, keep this open.`}
                  </p>
                )}

                {error && (
                  <p
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}
              </div>
            )}

        <DialogFooter>
          {result
            ? (
                <>
                  <Button
                    variant="outline"
                    onClick={reset}
                  >
                    Import another file
                  </Button>
                  <Button onClick={() => close(false)}>Done</Button>
                </>
              )
            : (
                <>
                  <Button
                    variant="outline"
                    disabled={importStock.isPending}
                    onClick={() => close(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={submit}
                    disabled={!file}
                    loading={importStock.isPending}
                  >
                    Import stock
                  </Button>
                </>
              )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
