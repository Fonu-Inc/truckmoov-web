import type { IoTDevice } from "@/types";
import {
  AlertCircle, CheckCircle, Download, FileText, Upload, X,
} from "lucide-react";
import {
  useCallback, useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { cn } from "@/lib/utils";

type DeviceBulkUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (devices: Partial<IoTDevice>[]) => void;
  onDownloadTemplate?: () => Promise<Blob>;
};

type ParsedRow = {
  imei: string;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  isValid: boolean;
  errors: string[];
};

function validateRow(row: string[]): ParsedRow {
  const errors: string[] = [];
  const [
    imei,
    manufacturer,
    model,
    firmwareVersion,
  ] = row.map(value => value?.trim() || "");

  if (!imei || imei.length !== 15 || !/^\d+$/.test(imei))
    errors.push("IMEI must be 15 digits");
  if (!manufacturer)
    errors.push("Manufacturer required");
  if (!model)
    errors.push("Model required");

  return {
    imei,
    manufacturer,
    model,
    firmwareVersion: firmwareVersion || "1.0.0",
    isValid: errors.length === 0,
    errors,
  };
}

function parseCSV(content: string): ParsedRow[] {
  return content
    .split("\n")
    .filter(line => line.trim())
    .slice(1)
    .map(line => validateRow(line.split(",")));
}

export function DeviceBulkUploadDialog({
  open, onOpenChange, onUpload, onDownloadTemplate,
}: DeviceBulkUploadDialogProps) {
  const [
    isDragging,
    setIsDragging,
  ] = useState(false);
  const [
    file,
    setFile,
  ] = useState<File | null>(null);
  const [
    parsedData,
    setParsedData,
  ] = useState<ParsedRow[]>([]);
  const [
    downloadingTemplate,
    setDownloadingTemplate,
  ] = useState(false);

  const handleFile = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      setFile(selectedFile);
      const content = await selectedFile.text();
      setParsedData(parseCSV(content));
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

  const handleImport = () => {
    const validRows = parsedData.filter(row => row.isValid);
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }
    onUpload(validRows);
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
  };

  const downloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const blob = onDownloadTemplate
        ? await onDownloadTemplate()
        : new Blob(
            ["IMEI,Manufacturer,Model,Firmware Version\n"],
            { type: "text/csv" },
          );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "device_import_template.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to download device import template");
    }
    finally {
      setDownloadingTemplate(false);
    }
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.filter(r => !r.isValid).length;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Bulk Import Devices</DialogTitle>
          <DialogDescription>Upload a CSV file to register multiple IoT devices at once.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file
            ? (
                <>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Download Template</p>
                        <p className="text-xs text-muted-foreground">CSV format with required columns</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                      disabled={downloadingTemplate}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {downloadingTemplate ? "Downloading..." : "Download"}
                    </Button>
                  </div>

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
                    <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
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
              )
            : (
                <>
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
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div>
                        <p className="text-sm font-medium">
                          {validCount}
                          {" "}
                          Valid
                        </p>
                        <p className="text-xs text-muted-foreground">Ready to import</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="text-sm font-medium">
                          {invalidCount}
                          {" "}
                          Invalid
                        </p>
                        <p className="text-xs text-muted-foreground">Has errors</p>
                      </div>
                    </div>
                  </div>

                  {parsedData.length > 0 && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                      <table className="w-full text-xs">
                        <thead className="bg-secondary sticky top-0">
                          <tr>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">IMEI</th>
                            <th className="p-2 text-left">Manufacturer</th>
                            <th className="p-2 text-left">Issues</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {parsedData.slice(
                            0,
                            10,
                          ).map((row, index) => (
                            <tr
                              key={index}
                              className={cn(!row.isValid && "bg-destructive/5")}
                            >
                              <td className="p-2">
                                {row.isValid ? <CheckCircle className="h-4 w-4 text-success" /> : <AlertCircle className="h-4 w-4 text-destructive" />}
                              </td>
                              <td className="p-2 font-mono">{row.imei || "—"}</td>
                              <td className="p-2">
                                {row.manufacturer}
                                {" "}
                                {row.model}
                              </td>
                              <td className="p-2 text-destructive">{row.errors.join(", ")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || validCount === 0}
            >
              Import
              {" "}
              {validCount}
              {" "}
              Devices
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
