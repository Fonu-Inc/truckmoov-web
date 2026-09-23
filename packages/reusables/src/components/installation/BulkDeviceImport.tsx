import {
  AlertCircle, Check, Download, FileSpreadsheet, Loader2, Upload, X,
} from "lucide-react";
import {
  useRef, useState,
} from "react";
import { toast } from "sonner";
import {
  Alert, AlertDescription, AlertTitle,
} from "../shadcn/alert";
import { Badge } from "../shadcn/badge";
import { Button } from "../shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "../shadcn/card";
import { Progress } from "../shadcn/progress";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../shadcn/table";

type BulkDeviceImportProps = {
  catalog: any[];
  onImportComplete: () => void;
};

type ImportRow = {
  device_name?: string;
  manufacturer: string;
  model: string;
  imei: string;
  intended_vehicle_plate?: string;
  intended_sim?: string;
  valid: boolean;
  errors: string[];
};

export function BulkDeviceImport({
  catalog, onImportComplete: _onImportComplete,
}: BulkDeviceImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [
    file,
    setFile,
  ] = useState<File | null>(null);
  const [
    parsedRows,
    setParsedRows,
  ] = useState<ImportRow[]>([]);
  const [importing] = useState(false);
  const [importProgress] = useState(0);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile)
      return;

    setFile(selectedFile);

    // Parse CSV
    const text = await selectedFile.text();
    const lines = text.split("\n").filter(line => line.trim());

    if (lines.length < 2) {
      toast.error("File must contain header row and at least one data row");
      return;
    }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const requiredHeaders = [
      "manufacturer",
      "model",
      "imei",
    ];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      toast.error(`Missing required columns: ${missingHeaders.join(", ")}`);
      return;
    }

    const rows: ImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      const errors: string[] = [];

      // Validate required fields
      if (!row.manufacturer)
        errors.push("Manufacturer is required");
      if (!row.model)
        errors.push("Model is required");
      if (!row.imei)
        errors.push("IMEI is required");
      if (row.imei && !/^\d{15}$/.test(row.imei))
        errors.push("IMEI must be 15 digits");

      // Validate against catalog
      const catalogMatch = catalog.find(c =>
        c.manufacturer.toLowerCase() === row.manufacturer.toLowerCase()
        && c.model.toLowerCase() === row.model.toLowerCase());

      if (!catalogMatch && row.manufacturer && row.model) {
        errors.push("Model not found in catalog");
      }

      if (catalogMatch?.status === "blocked") {
        errors.push("Model is blocked");
      }

      rows.push({
        device_name: row.device_name || row.name,
        manufacturer: row.manufacturer,
        model: row.model,
        imei: row.imei,
        intended_vehicle_plate: row.intended_vehicle_plate || row.vehicle,
        intended_sim: row.intended_sim || row.sim,
        valid: errors.length === 0,
        errors,
      });
    }

    setParsedRows(rows);
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.valid);
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    toast.info("Coming soon");
  };

  const downloadTemplate = () => {
    const headers = [
      "manufacturer",
      "model",
      "imei",
      "device_name",
      "intended_vehicle_plate",
      "intended_sim",
    ];
    const exampleRow = [
      "Teltonika",
      "FMC130",
      "123456789012345",
      "Truck GPS 01",
      "LAG-123-AB",
      "",
    ];

    const csv = [
      headers.join(","),
      exampleRow.join(","),
    ].join("\n");
    const blob = new Blob(
      [csv],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "device-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedRows.filter(r => r.valid).length;
  const invalidCount = parsedRows.filter(r => !r.valid).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Bulk Device Import
        </CardTitle>
        <CardDescription>
          Import multiple devices from a CSV file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!file
            ? (
                <>
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">Upload Device List</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a CSV file with device information
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Select File
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadTemplate}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </>
              )
            : (
                <>
                  <Check className="h-12 w-12 mx-auto mb-4 text-success" />
                  <h3 className="font-medium mb-2">{file.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {parsedRows.length}
                    {" "}
                    rows parsed
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setParsedRows([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Remove File
                  </Button>
                </>
              )}
        </div>

        {/* Validation Summary */}
        {parsedRows.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="default"
                  className="bg-success"
                >
                  <Check className="h-3 w-3 mr-1" />
                  {validCount}
                  {" "}
                  Valid
                </Badge>
              </div>
              {invalidCount > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    {invalidCount}
                    {" "}
                    Invalid
                  </Badge>
                </div>
              )}
            </div>

            {/* Preview Table */}
            <div className="rounded-lg border max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {row.valid
                          ? (
                              <Check className="h-4 w-4 text-success" />
                            )
                          : (
                              <X className="h-4 w-4 text-destructive" />
                            )}
                      </TableCell>
                      <TableCell>{row.manufacturer}</TableCell>
                      <TableCell>{row.model}</TableCell>
                      <TableCell className="font-mono text-sm">{row.imei}</TableCell>
                      <TableCell>
                        {row.errors.length > 0 && (
                          <span className="text-xs text-destructive">
                            {row.errors.join(", ")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Import Button */}
            {importing
              ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Importing devices...</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                )
              : (
                  <Button
                    onClick={handleImport}
                    disabled={validCount === 0}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                    {" "}
                    {validCount}
                    {" "}
                    Devices
                  </Button>
                )}
          </div>
        )}

        {/* Help Section */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>CSV Format Requirements</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>
                <strong>manufacturer</strong>
                {" "}
                - Must match a catalog entry (required)
              </li>
              <li>
                <strong>model</strong>
                {" "}
                - Must match a catalog entry (required)
              </li>
              <li>
                <strong>imei</strong>
                {" "}
                - 15-digit device identifier (required)
              </li>
              <li>
                <strong>device_name</strong>
                {" "}
                - Optional friendly name
              </li>
              <li>
                <strong>intended_vehicle_plate</strong>
                {" "}
                - Optional vehicle pre-assignment
              </li>
              <li>
                <strong>intended_sim</strong>
                {" "}
                - Optional SIM pre-assignment (Fonu SIM ID)
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
