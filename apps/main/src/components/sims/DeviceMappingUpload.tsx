import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {Upload, FileText, AlertCircle, CheckCircle, X, HardDrive, Download} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface DeviceMappingRow {
  device_name: string;
  device_type: string;
  imei: string;
  vehicle_id: string;
  notes: string;
  isValid: boolean;
  errors: string[];
}

interface DeviceMappingUploadProps {
  onDataParsed: (data: DeviceMappingRow[], fileName: string) => void;
  onClear: () => void;
  parsedData: DeviceMappingRow[];
  fileName: string | null;
}

export function DeviceMappingUpload({ 
  onDataParsed, 
  onClear, 
  parsedData, 
  fileName 
}: DeviceMappingUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const validateRow = (row: string[]): DeviceMappingRow => {
    const errors: string[] = [];
    const [device_name, device_type, imei, vehicle_id, notes] = row.map((s) => s?.trim() || "");

    if (!device_name) errors.push("Device name required");
    if (!device_type) errors.push("Device type required");
    if (!imei) {
      errors.push("IMEI/Serial required");
    } else if (imei.length < 10) {
      errors.push("IMEI too short");
    }

    return {
      device_name,
      device_type,
      imei,
      vehicle_id: vehicle_id || "",
      notes: notes || "",
      isValid: errors.length === 0,
      errors };
  };

  const parseCSV = (content: string): DeviceMappingRow[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    // Skip header row
    const dataRows = lines.slice(1);
    return dataRows.map((line) => validateRow(line.split(",")));
  };

  const handleFile = useCallback(async (selectedFile: File) => {
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
    onDataParsed(parsed, selectedFile.name);
  }, [onDataParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const downloadTemplate = () => {
    const template = `device_name,device_type,imei,vehicle_id,notes
Tracker Unit 1,GPS Tracker,359779090012345,LAG-123-ABC,Primary vehicle tracker
OBD Device 2,OBD Diagnostics,359779090012346,,Optional notes here
Camera Unit 3,Fleet Camera,359779090012347,LAG-456-XYZ,Front-facing camera`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "device_mapping_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedData.filter((r) => r.isValid).length;
  const invalidCount = parsedData.filter((r) => !r.isValid).length;

  if (fileName && parsedData.length > 0) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-secondary/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium text-sm">{fileName}</p>
              <p className="text-xs text-muted-foreground">{parsedData.length} devices parsed</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <div>
              <p className="text-xs font-medium">{validCount} Valid</p>
            </div>
          </div>
          {invalidCount > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-xs font-medium">{invalidCount} Invalid</p>
              </div>
            </div>
          )}
        </div>

        {/* Preview table */}
        <div className="max-h-32 overflow-y-auto rounded-md border border-border">
          <table className="w-full text-xs">
            <thead className="bg-secondary sticky top-0">
              <tr>
                <th className="p-1.5 text-left">Status</th>
                <th className="p-1.5 text-left">Device</th>
                <th className="p-1.5 text-left">IMEI</th>
                <th className="p-1.5 text-left">Vehicle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {parsedData.slice(0, 5).map((row, idx) => (
                <tr key={idx} className={cn(!row.isValid && "bg-destructive/5")}>
                  <td className="p-1.5">
                    {row.isValid ? (
                      <CheckCircle className="h-3 w-3 text-success" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-destructive" />
                    )}
                  </td>
                  <td className="p-1.5">{row.device_name || "—"}</td>
                  <td className="p-1.5 font-mono">{row.imei || "—"}</td>
                  <td className="p-1.5">{row.vehicle_id || "—"}</td>
                </tr>
              ))}
              {parsedData.length > 5 && (
                <tr>
                  <td colSpan={4} className="p-1.5 text-center text-muted-foreground">
                    +{parsedData.length - 5} more devices...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="mr-1 h-3 w-3" />
          Template
        </Button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
        )}
      >
        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-xs font-medium">Drop CSV file or click to browse</p>
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}
