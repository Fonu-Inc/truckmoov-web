import { useState, useCallback } from "react";
import { Vehicle } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription } from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import {Upload, FileText, AlertCircle, CheckCircle, X, Download} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (vehicles: Partial<Vehicle>[]) => void;
}

interface ParsedRow {
  registrationNumber: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  type: "truck" | "van" | "trailer";
  capacity: number;
  isValid: boolean;
  errors: string[];
}

export function BulkUploadDialog({ open, onOpenChange, onUpload }: BulkUploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateRow = (row: string[]): ParsedRow => {
    const errors: string[] = [];
    const [registrationNumber, vin, make, model, yearStr, type, capacityStr] = row.map((s) =>
      s?.trim() || ""
    );

    if (!registrationNumber) errors.push("Registration number required");
    if (!vin || vin.length !== 17) errors.push("VIN must be 17 characters");
    if (!make) errors.push("Make required");
    if (!model) errors.push("Model required");

    const year = parseInt(yearStr, 10);
    if (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1) {
      errors.push("Invalid year");
    }

    const validTypes = ["truck", "van", "trailer"];
    const normalizedType = type?.toLowerCase() as "truck" | "van" | "trailer";
    if (!validTypes.includes(normalizedType)) {
      errors.push("Type must be truck, van, or trailer");
    }

    const capacity = parseFloat(capacityStr);
    if (isNaN(capacity) || capacity < 0) {
      errors.push("Invalid capacity");
    }

    return {
      registrationNumber,
      vin,
      make,
      model,
      year: year || new Date().getFullYear(),
      type: normalizedType || "truck",
      capacity: capacity || 0,
      isValid: errors.length === 0,
      errors };
  };

  const parseCSV = (content: string): ParsedRow[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    // Skip header row
    const dataRows = lines.slice(1);
    return dataRows.map((line) => validateRow(line.split(",")));
  };

  const handleFile = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const content = await selectedFile.text();
      const parsed = parseCSV(content);
      setParsedData(parsed);
    } catch (error) {
      toast.error("Failed to parse CSV file");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleImport = () => {
    const validRows = parsedData.filter((row) => row.isValid);
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }
    onUpload(
      validRows.map((row) => ({
        registrationNumber: row.registrationNumber,
        vin: row.vin,
        make: row.make,
        model: row.model,
        year: row.year,
        type: row.type,
        capacity: row.capacity }))
    );
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
  };

  const downloadTemplate = () => {
    const template = `Registration Number,VIN,Make,Model,Year,Type,Capacity (tons)
LAG-123-XY,1HGCM82633A123456,Mercedes-Benz,Actros,2022,truck,40
LAG-456-AB,2HGCM82633A654321,Volvo,FH16,2023,truck,35`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vehicle_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedData.filter((r) => r.isValid).length;
  const invalidCount = parsedData.filter((r) => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Import Vehicles</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple vehicles at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
            <>
              {/* Download Template */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Download Template</p>
                    <p className="text-xs text-muted-foreground">
                      Use our CSV template for correct formatting
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-1">
                  Drag and drop your CSV file here
                </p>
                <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <Button variant="outline" size="sm">
                  Select File
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* File Info */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={handleReset}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm font-medium">{validCount} Valid</p>
                    <p className="text-xs text-muted-foreground">Ready to import</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">{invalidCount} Invalid</p>
                    <p className="text-xs text-muted-foreground">Has errors</p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {parsedData.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-secondary sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Registration</th>
                        <th className="p-2 text-left">Make/Model</th>
                        <th className="p-2 text-left">Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedData.slice(0, 10).map((row, index) => (
                        <tr key={index} className={cn(!row.isValid && "bg-destructive/5")}>
                          <td className="p-2">
                            {row.isValid ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                          </td>
                          <td className="p-2 font-mono">{row.registrationNumber || "—"}</td>
                          <td className="p-2">
                            {row.make} {row.model}
                          </td>
                          <td className="p-2 text-destructive">
                            {row.errors.join(", ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 10 && (
                    <p className="p-2 text-center text-xs text-muted-foreground bg-secondary">
                      ... and {parsedData.length - 10} more rows
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!file || validCount === 0}>
              Import {validCount} Vehicles
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
