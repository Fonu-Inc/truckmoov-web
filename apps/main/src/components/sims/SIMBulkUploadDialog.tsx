import type { SIMCard } from "@/types";
import {
  useDownloadSimImportTemplate, useImportSims,
} from "@truckmoov/api/auth";
import {
  AlertCircle, CheckCircle, Download, FileText, Upload, X,
} from "lucide-react";
import {
  useCallback, useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { cn } from "@/lib/utils";

type SIMBulkUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (sims: Partial<SIMCard>[]) => void;
};

type ParsedSIM = Partial<SIMCard> & {
  isValid: boolean;
  errors: string[];
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

export function SIMBulkUploadDialog({
  open, onOpenChange, onUpload,
}: SIMBulkUploadDialogProps) {
  const [
    file,
    setFile,
  ] = useState<File | null>(null);
  const [
    parsedData,
    setParsedData,
  ] = useState<ParsedSIM[]>([]);
  const [
    isDragging,
    setIsDragging,
  ] = useState(false);
  const downloadTemplateMutation = useDownloadSimImportTemplate();
  const importSimsMutation = useImportSims();

  const parseCSV = (content: string) => {
    const lines = content.split("\n").filter(l => l.trim()).slice(1);
    return lines.map((line) => {
      const [
        iccid,
        imsi,
        mobileNumber,
        networkOperator,
        dataLimit,
      ] = line.split(",").map(s => s?.trim());
      const errors: string[] = [];
      if (!iccid || iccid.length < 19)
        errors.push("Invalid ICCID");
      if (!mobileNumber)
        errors.push("Phone required");
      return {
        iccid, imsi, mobileNumber, networkOperator, dataLimit: Number.parseFloat(dataLimit) || 5, isValid: errors.length === 0, errors,
      };
    });
  };

  const handleFile = useCallback(
    async (f: File) => {
      if (!f.name.endsWith(".csv")) { toast.error("Please upload a CSV file"); return; }
      setFile(f);
      setParsedData(parseCSV(await f.text()));
    },
    [],
  );

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
      link.download = "sim_import_template.csv";
      link.click();
      URL.revokeObjectURL(url);
    }
    catch (error) {
      toast.error(getErrorMessage(
        error,
        "Unable to download the SIM import template",
      ));
    }
  };

  const importFile = async () => {
    if (!file || validCount === 0)
      return;

    try {
      await importSimsMutation.mutateAsync(file);
      onUpload(parsedData.filter(r => r.isValid));
      setFile(null);
      setParsedData([]);
    }
    catch (error) {
      toast.error(getErrorMessage(
        error,
        "Unable to import SIM cards",
      ));
    }
  };

  const validCount = parsedData.filter(r => r.isValid).length;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Bulk Import SIM Cards</DialogTitle>
          <DialogDescription>Upload CSV to register multiple SIM cards.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!file
            ? (
                <>
                  <div className="flex items-center justify-between rounded-lg border bg-secondary/30 p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Download Template</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                      disabled={downloadTemplateMutation.isPending}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {downloadTemplateMutation.isPending ? "Downloading..." : "Download"}
                    </Button>
                  </div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8",
                      isDragging ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium">Drag and drop CSV file here</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>
                </>
              )
            : (
                <>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <p className="font-medium">{file.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => { setFile(null); setParsedData([]); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <p className="text-sm font-medium">
                        {validCount}
                        {" "}
                        Valid
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <p className="text-sm font-medium">
                        {parsedData.length - validCount}
                        {" "}
                        Invalid
                      </p>
                    </div>
                  </div>
                </>
              )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={importSimsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={importFile}
              disabled={!file || validCount === 0 || importSimsMutation.isPending}
            >
              {importSimsMutation.isPending ? "Importing..." : `Import ${validCount} SIMs`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
