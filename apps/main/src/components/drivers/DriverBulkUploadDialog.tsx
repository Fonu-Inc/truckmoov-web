import {
  AlertTriangle, CheckCircle, Download, FileSpreadsheet, Upload, XCircle,
} from "lucide-react";
import {
  useCallback, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Progress } from "@/components/shadcn/progress";

type DriverBulkUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (drivers: DriverBulkUploadItem[]) => void | Promise<void>;
};

export type DriverBulkUploadItem = {
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: string;
  communicationPreference: string;
};

type ParsedDriver = {
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: string;
  communicationPreference: string;
  valid: boolean;
  errors: string[];
};

export function DriverBulkUploadDialog({
  open, onOpenChange, onUpload,
}: DriverBulkUploadDialogProps) {
  const [
    isDragging,
    setIsDragging,
  ] = useState(false);
  const [
    file,
    setFile,
  ] = useState<File | null>(null);
  const [
    parsedDrivers,
    setParsedDrivers,
  ] = useState<ParsedDriver[]>([]);
  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);
  const [
    uploadProgress,
    setUploadProgress,
  ] = useState(0);

  const validateDriver = (driver: any): ParsedDriver => {
    const errors: string[] = [];

    if (!driver.name || driver.name.length < 2)
      errors.push("Invalid name");
    if (!driver.phone || driver.phone.length < 10)
      errors.push("Invalid phone");
    if (!driver.licenseNumber || driver.licenseNumber.length < 5)
      errors.push("Invalid license");
    if (!driver.licenseExpiry)
      errors.push("Missing license expiry");

    const validStatuses = [
      "active",
      "available",
      "offline",
      "suspended",
    ];
    if (!validStatuses.includes(driver.status?.toLowerCase())) {
      driver.status = "available";
    }

    const validComms = [
      "whatsapp",
      "sms",
      "email",
      "voice",
    ];
    if (!validComms.includes(driver.communicationPreference?.toLowerCase())) {
      driver.communicationPreference = "whatsapp";
    }

    return {
      ...driver,
      valid: errors.length === 0,
      errors,
    };
  };

  const parseCSV = (content: string): ParsedDriver[] => {
    const lines = content.split("\n").filter(line => line.trim());
    if (lines.length < 2)
      return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const drivers: ParsedDriver[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const driver: any = {};

      headers.forEach((header, index) => {
        const value = values[index] || "";
        switch (header) {
          case "name":
          case "full name":
            driver.name = value;
            break;
          case "phone":
          case "phone number":
            driver.phone = value;
            break;
          case "email":
            driver.email = value;
            break;
          case "license":
          case "license number":
          case "licensenumber":
            driver.licenseNumber = value;
            break;
          case "license expiry":
          case "licenseexpiry":
          case "expiry":
            driver.licenseExpiry = value;
            break;
          case "status":
            driver.status = value.toLowerCase();
            break;
          case "communication":
          case "communicationpreference":
          case "preferred channel":
            driver.communicationPreference = value.toLowerCase();
            break;
        }
      });

      drivers.push(validateDriver(driver));
    }

    return drivers;
  };

  const handleFile = useCallback(
    (file: File) => {
      setFile(file);
      setIsProcessing(true);
      setUploadProgress(0);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;

        // Simulate processing progress
        let progress = 0;
        const interval = setInterval(
          () => {
            progress += 20;
            setUploadProgress(progress);
            if (progress >= 100) {
              clearInterval(interval);
              const drivers = parseCSV(content);
              setParsedDrivers(drivers);
              setIsProcessing(false);
            }
          },
          200,
        );
      };
      reader.readAsText(file);
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv"))) {
        handleFile(droppedFile);
      }
      else {
        toast.error("Please upload a CSV file");
      }
    },
    [handleFile],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedDrivers([]);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    const validDrivers = parsedDrivers.filter(d => d.valid);
    if (validDrivers.length === 0) {
      toast.error("No valid drivers to upload");
      return;
    }

    setIsProcessing(true);
    try {
      await onUpload(validDrivers);
      onOpenChange(false);
      resetState();
    }
    catch {
      // The API error is shown by the parent.
    }
    finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = "Name,Phone,Email,License Number,License Expiry,Status,Communication\nJohn Doe,+27821234567,john@email.com,DL123456789,2025-12-31,available,whatsapp";
    const blob = new Blob(
      [template],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "driver_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedDrivers.filter(d => d.valid).length;
  const invalidCount = parsedDrivers.filter(d => !d.valid).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open)
          resetState();
      }}
    >
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Bulk Upload Drivers</DialogTitle>
          <DialogDescription>
            Upload a CSV file with driver information. Download the template for the correct format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>

          {!file
            ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging ? "border-primary bg-primary/10" : "border-border"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop your CSV file here, or
                  </p>
                  <label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <span className="cursor-pointer">Browse Files</span>
                    </Button>
                  </label>
                </div>
              )
            : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)}
                        {" "}
                        KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetState}
                    >
                      Remove
                    </Button>
                  </div>

                  {isProcessing
                    ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Processing file...</p>
                          <Progress
                            value={uploadProgress}
                            className="h-2"
                          />
                        </div>
                      )
                    : (
                        <>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-success" />
                              <span className="text-sm">
                                {validCount}
                                {" "}
                                valid
                              </span>
                            </div>
                            {invalidCount > 0 && (
                              <div className="flex items-center gap-2">
                                <XCircle className="h-5 w-5 text-destructive" />
                                <span className="text-sm">
                                  {invalidCount}
                                  {" "}
                                  invalid
                                </span>
                              </div>
                            )}
                          </div>

                          {parsedDrivers.length > 0 && (
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {parsedDrivers.slice(
                                0,
                                10,
                              ).map((driver, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center justify-between p-2 rounded text-sm ${
                                    driver.valid ? "bg-success/10" : "bg-destructive/10"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {driver.valid
                                      ? (
                                          <CheckCircle className="h-4 w-4 text-success" />
                                        )
                                      : (
                                          <AlertTriangle className="h-4 w-4 text-destructive" />
                                        )}
                                    <span>{driver.name || "Unknown"}</span>
                                    <span className="text-muted-foreground">{driver.phone}</span>
                                  </div>
                                  {!driver.valid && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      {driver.errors[0]}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                              {parsedDrivers.length > 10 && (
                                <p className="text-sm text-muted-foreground text-center">
                                  And
                                  {" "}
                                  {parsedDrivers.length - 10}
                                  {" "}
                                  more...
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                </div>
              )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetState();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={() => void handleUpload()}
              disabled={!file || isProcessing || validCount === 0}
            >
              Upload
              {" "}
              {validCount > 0 && `${validCount} Drivers`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
