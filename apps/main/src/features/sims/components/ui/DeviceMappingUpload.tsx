import type { ColumnDef } from "@tanstack/react-table";
import { useDownloadSimRequestDeviceMappingTemplate } from "@truckmoov/api/auth";
import {
  AlertCircle, CheckCircle, Download, FileText, HardDrive, Upload, X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { DataTable } from "@/components/shadcn/data-table";
import { cn } from "@/lib/utils";

export type DeviceMappingRow = {
  device_name: string;
  device_type: string;
  imei: string;
  vehicle_id: string;
  notes: string;
  isValid: boolean;
  errors: string[];
};

const previewColumns: ColumnDef<DeviceMappingRow>[] = [
  {
    id: "status",
    header: "Status",
    enableSorting: false,
    meta: { className: "p-1.5" },
    cell: ({ row }) => (row.original.isValid
      ? <CheckCircle className="h-3 w-3 text-success" />
      : <AlertCircle className="h-3 w-3 text-destructive" />),
  },
  {
    id: "device",
    header: "Device",
    enableSorting: false,
    meta: { className: "p-1.5" },
    cell: ({ row }) => row.original.device_name || "—",
  },
  {
    id: "imei",
    header: "IMEI",
    enableSorting: false,
    meta: { className: "p-1.5 font-mono" },
    cell: ({ row }) => row.original.imei || "—",
  },
  {
    id: "vehicle",
    header: "Vehicle",
    enableSorting: false,
    meta: { className: "p-1.5" },
    cell: ({ row }) => row.original.vehicle_id || "—",
  },
];

type DeviceMappingUploadProps = {
  onDataParsed: (data: DeviceMappingRow[], fileName: string, file: File) => void;
  onClear: () => void;
  parsedData: DeviceMappingRow[];
  fileName: string | null;
};

export function DeviceMappingUpload({
  onDataParsed,
  onClear,
  parsedData,
  fileName,
}: DeviceMappingUploadProps) {
  const [
    isDragging,
    setIsDragging,
  ] = useState(false);
  const downloadTemplateMutation = useDownloadSimRequestDeviceMappingTemplate();

  const validateRow = (row: string[]): DeviceMappingRow => {
    const errors: string[] = [];
    const [
      device_name,
      device_type,
      imei,
      vehicle_id,
      notes,
    ] = row.map(s => s?.trim() || "");

    if (!device_name)
      errors.push("Device name required");
    if (!device_type)
      errors.push("Device type required");
    if (!imei) {
      errors.push("IMEI/Serial required");
    }
    else if (imei.length < 10) {
      errors.push("IMEI too short");
    }

    return {
      device_name,
      device_type,
      imei,
      vehicle_id: vehicle_id || "",
      notes: notes || "",
      isValid: errors.length === 0,
      errors,
    };
  };

  const parseCSV = (content: string): DeviceMappingRow[] => {
    const lines = content.split("\n").filter(line => line.trim());
    // Skip header row
    const dataRows = lines.slice(1);
    return dataRows.map(line => validateRow(line.split(",")));
  };

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv") && !selectedFile.name.endsWith(".xlsx")) {
      toast.error("Please upload a CSV or XLSX file");
      return;
    }

    // For now, only CSV is supported
    if (selectedFile.name.endsWith(".xlsx")) {
      toast.error("XLSX support coming soon. Please use CSV format.");
      return;
    }

    const content = await selectedFile.text();
    const parsed = parseCSV(content);
    onDataParsed(
      parsed,
      selectedFile.name,
      selectedFile,
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile)
      handleFile(droppedFile);
  };

  const downloadTemplate = async () => {
    try {
      const blob = await downloadTemplateMutation.mutateAsync();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "device_mapping_template.csv";
      link.click();
      URL.revokeObjectURL(url);
    }
    catch (error) {
      const message = error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Unable to download the device mapping template";
      toast.error(message);
    }
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.filter(r => !r.isValid).length;

  if (fileName && parsedData.length > 0) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-secondary/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium text-sm">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {parsedData.length}
                {" "}
                devices parsed
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <div>
              <p className="text-xs font-medium">
                {validCount}
                {" "}
                Valid
              </p>
            </div>
          </div>
          {invalidCount > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-xs font-medium">
                  {invalidCount}
                  {" "}
                  Invalid
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Preview table */}
        <div className="overflow-x-auto rounded-md border border-border">
          <DataTable
            columns={previewColumns}
            data={parsedData}
            className="text-xs"
            rowClassName={row => cn(!row.isValid && "bg-destructive/5")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-md border border-border bg-secondary/30 p-2">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs font-medium">Device Mapping Template</p>
            <p className="text-xs text-muted-foreground">CSV with device details</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
          disabled={downloadTemplateMutation.isPending}
        >
          <Download className="mr-1 h-3 w-3" />
          {downloadTemplateMutation.isPending ? "Downloading..." : "Template"}
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
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground",
        )}
      >
        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-xs font-medium">Drop CSV file or click to browse</p>
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}
