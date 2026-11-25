import type { OnboardingVehicleInput } from "@truckmoov/api/auth";
import type {
  ParsedVehicleRow,
  SheetCell,
} from "@truckmoov/app-core/apply/vehicleSheet";
import {
  parseVehicleSheet,
  VEHICLE_LICENCE_ACCEPT,
  VEHICLE_SHEET_COLUMNS,
  vehicleLicenceError,
} from "@truckmoov/app-core/apply/vehicleSheet";
import {
  downloadVehicleTemplate,
  readVehicleSheetFile,
} from "@truckmoov/app-core/apply/vehicleSheetFile";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Info,
  Paperclip,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { cn } from "@/lib/utils";

type SheetFile = {
  name: string;
  cells: SheetCell[][];
  existing: string[];
};

type RowState = {
  licence: File | null;
  attachedAt?: Date;
  added?: boolean;
  failure?: string;
};

const STEP_ONE_POINTS = [
  "Click Download Template to get the Excel sheet with all the required columns.",
  "Enter one vehicle per row, registration number, vehicle type, make, model, year, chassis and engine number, colour, engine capacity, odometer reading and purchase type.",
  "Save the file and drag it into the upload area below, or click to browse for it.",
  "Once uploaded, click View Document to check that every row came through correctly, then click Continue.",
];

const STEP_TWO_POINTS = [
  "Every vehicle from your sheet is listed below with its own attach button.",
  "Attach that vehicle's license document, PDF, JPG or PNG up to 10MB.",
  "You can view or replace a document at any time before finishing.",
  "A vehicle cannot be added until its license document is attached.",
];

function fileSize(bytes: number) {
  if (bytes < 1024)
    return `${bytes} B`;
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function cellText(cell: SheetCell) {
  if (cell === null || cell === undefined)
    return "";
  return cell instanceof Date ? cell.toLocaleDateString("en-GB") : String(cell);
}

function StepPanel({
  title, description, points,
}: {
  title: string;
  description: string;
  points: string[];
}) {
  return (
    <div className="w-full rounded-2xl border border-border/60 bg-muted/20 p-4 text-left">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <ul className="mt-3 space-y-1.5">
        {points.map(point => (
          <li
            key={point}
            className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
          >
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The design's "Bulk Upload Vehicles" wizard. Step 1 reads an Excel sheet in the browser;
 * step 2 attaches a licence to each vehicle. Each ready vehicle is then added through the
 * single add-vehicle endpoint (the server's import takes CSV only, with no licences).
 */
export function VehicleBulkUploadModal({
  open,
  onOpenChange,
  existingRegistrations,
  vehiclesLeft,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Vehicles already on the application, so the sheet can't add them twice. */
  existingRegistrations: string[];
  /** Owner Operator accounts stop at 10 vehicles; `Infinity` otherwise. */
  vehiclesLeft: number;
  /** Rejects with the server error on failure. */
  onAdd: (data: OnboardingVehicleInput, licence: File) => Promise<unknown>;
}) {
  const [
    step,
    setStep,
  ] = useState<1 | 2>(1);
  const [
    sheet,
    setSheet,
  ] = useState<SheetFile | null>(null);
  const [
    readError,
    setReadError,
  ] = useState<string | null>(null);
  const [
    reading,
    setReading,
  ] = useState(false);
  const [
    dragging,
    setDragging,
  ] = useState(false);
  const [
    showRequirements,
    setShowRequirements,
  ] = useState(false);
  const [
    previewOpen,
    setPreviewOpen,
  ] = useState(false);
  const [
    rowState,
    setRowState,
  ] = useState<Record<number, RowState>>({});
  const [
    adding,
    setAdding,
  ] = useState(false);

  // Reset on close, so the next open starts at step 1 with no file.
  function close() {
    setStep(1);
    setSheet(null);
    setReadError(null);
    setRowState({});
    setShowRequirements(false);
    onOpenChange(false);
  }

  // Checked against the vehicles there when the file was read, so rows this dialog adds
  // aren't flagged as duplicates once the list refreshes.
  const parsed = sheet ? parseVehicleSheet(
    sheet.cells,
    sheet.existing,
  ) : null;
  const rows = parsed?.rows ?? [];
  const sheetError = readError ?? parsed?.error ?? null;
  const rowOf = (row: ParsedVehicleRow): RowState => rowState[row.sheetRow] ?? { licence: null };
  const ready = rows.filter(row => row.data && rowOf(row).licence && !rowOf(row).added);
  const toAdd = ready.slice(
    0,
    Math.max(
      vehiclesLeft,
      0,
    ),
  );

  async function handleFile(file: File) {
    setReading(true);
    setReadError(null);
    try {
      setSheet({
        name: file.name,
        cells: await readVehicleSheetFile(file),
        existing: existingRegistrations,
      });
      setRowState({});
    }
    catch (error) {
      setSheet(null);
      setReadError((error as Error).message);
    }
    finally {
      setReading(false);
    }
  }

  function attach(row: ParsedVehicleRow, file: File) {
    const problem = vehicleLicenceError(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setRowState(state => ({
      ...state,
      [row.sheetRow]: {
        licence: file,
        attachedAt: new Date(),
      },
    }));
  }

  function detach(row: ParsedVehicleRow) {
    setRowState(state => ({
      ...state,
      [row.sheetRow]: { licence: null },
    }));
  }

  function view(file: File) {
    const url = URL.createObjectURL(file);
    window.open(
      url,
      "_blank",
      "noopener",
    );
    setTimeout(
      () => URL.revokeObjectURL(url),
      60_000,
    );
  }

  async function addVehicles() {
    setAdding(true);
    let added = 0;
    let failed = 0;
    // One at a time: the server checks each against the vehicles already added.
    for (const row of toAdd) {
      const { licence } = rowOf(row);
      try {
        await onAdd(
          row.data as OnboardingVehicleInput,
          licence as File,
        );
        added += 1;
        setRowState(state => ({
          ...state,
          [row.sheetRow]: {
            ...state[row.sheetRow],
            added: true,
            failure: undefined,
          },
        }));
      }
      catch (error) {
        failed += 1;
        setRowState(state => ({
          ...state,
          [row.sheetRow]: {
            ...state[row.sheetRow],
            failure: (error as { message?: string }).message || "This vehicle couldn't be added.",
          },
        }));
      }
    }
    setAdding(false);
    if (added)
      toast.success(`${added} ${added === 1 ? "vehicle" : "vehicles"} added.`);
    if (!failed && added === toAdd.length && ready.length === toAdd.length)
      close();
  }

  const columnCount = Math.max(
    ...(sheet?.cells ?? [[]]).map(row => row.length),
    0,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={next => !adding && (next ? onOpenChange(true) : close())}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Vehicles</DialogTitle>
          <DialogDescription>
            Add many vehicles at once with an Excel template, and attach the required documents to each vehicle
            before they are created.
          </DialogDescription>
        </DialogHeader>

        {step === 1
          ? (
              <>
                <StepPanel
                  title="Step 1, Upload Vehicle Information"
                  description="Start by giving us the details of every vehicle you want to add, using our Excel template."
                  points={STEP_ONE_POINTS}
                />
                <div className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      onClick={() => void downloadVehicleTemplate().catch(() => toast.error("The template couldn't be downloaded. Try again."))}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                    <Button
                      variant="outline"
                      aria-expanded={showRequirements}
                      onClick={() => setShowRequirements(shown => !shown)}
                    >
                      <Info className="mr-2 h-4 w-4" />
                      View Upload Requirements
                    </Button>
                  </div>

                  {showRequirements && (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-sm font-medium">Upload requirements</p>
                      <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">
                        {VEHICLE_SHEET_COLUMNS.map(column => (
                          <li key={column.key}>
                            <span className="font-medium text-foreground">{column.header}</span>
                            <span className={cn(
                              "ml-1",
                              column.required && "text-destructive",
                            )}
                            >
                              {column.required ? "(required)" : "(optional)"}
                            </span>
                            {`, ${column.hint}`}
                          </li>
                        ))}
                        <li className="pt-1">
                          <span className="font-medium text-foreground">Documents</span>
                          , every vehicle needs Vehicle License. Attach files to each vehicle in the next step.
                        </li>
                      </ul>
                    </div>
                  )}

                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragging(false);
                      const file = event.dataTransfer.files[0];
                      if (file)
                        void handleFile(file);
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
                      dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                    )}
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <FileSpreadsheet className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {reading ? "Reading your file…" : "Drag and drop your Excel file here"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">or click to browse · .xlsx, one vehicle per row</p>
                    <input
                      type="file"
                      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      aria-label="Upload vehicle sheet"
                      disabled={reading}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file)
                          void handleFile(file);
                        event.target.value = "";
                      }}
                    />
                  </div>

                  {sheet && (
                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{sheet.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {`${rows.length} ${rows.length === 1 ? "vehicle" : "vehicles"} found`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewOpen(true)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Document
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSheet(null);
                              setRowState({});
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {sheetError && <p className="text-sm text-destructive">{sheetError}</p>}

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={close}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!sheet || Boolean(sheetError) || reading}
                      onClick={() => setStep(2)}
                    >
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )
          : (
              <>
                <StepPanel
                  title="Step 2, Upload Documents"
                  description="Attach the vehicle license document that belongs to each vehicle you uploaded."
                  points={STEP_TWO_POINTS}
                />
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {`${rows.length} ${rows.length === 1 ? "vehicle" : "vehicles"} read from `}
                    <span className="font-medium text-foreground">{sheet?.name}</span>
                    . Attach each vehicle&apos;s vehicle license document below.
                  </p>
                  <div>
                    <p className="text-sm font-medium">Attach vehicle license per vehicle</p>
                    <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
                      {rows.map((row) => {
                        const state = rowOf(row);
                        const title = [
                          row.ref,
                          row.registrationNumber,
                        ].filter(Boolean).join(" · ") || `Row ${row.sheetRow}`;
                        return (
                          <div
                            key={row.sheetRow}
                            className="rounded-xl border border-border p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{title}</p>
                                <p className={cn(
                                  "text-xs",
                                  row.errors.length || state.failure ? "text-destructive" : "text-muted-foreground",
                                )}
                                >
                                  {row.errors.length
                                    ? `Row ${row.sheetRow}: ${row.errors.join(" ")} Fix it in the Excel file and upload again.`
                                    : state.added
                                      ? "Added to your vehicles"
                                      : state.failure ?? (state.licence ? "1 document attached to this vehicle" : "No vehicle license attached")}
                                </p>
                              </div>
                              {!row.errors.length && !state.added && (
                                <div className="relative">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    tabIndex={-1}
                                  >
                                    <Paperclip className="mr-2 h-4 w-4" />
                                    {state.licence ? "Replace Vehicle License" : "Attach Vehicle License"}
                                  </Button>
                                  <input
                                    type="file"
                                    accept={VEHICLE_LICENCE_ACCEPT}
                                    aria-label={`Attach vehicle license for ${title}`}
                                    disabled={adding}
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                    onChange={(event) => {
                                      const file = event.target.files?.[0];
                                      if (file) {
                                        attach(
                                          row,
                                          file,
                                        );
                                      }
                                      event.target.value = "";
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            {state.licence && !state.added && (
                              <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-2">
                                <p className="px-1 pb-2 text-xs font-medium text-muted-foreground">Attached to this vehicle</p>
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                      <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium">{state.licence.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {`Vehicle License · ${fileSize(state.licence.size)} · Uploaded ${(state.attachedAt ?? new Date()).toLocaleDateString(
                                          "en-GB",
                                          {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          },
                                        )}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">Valid</Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => view(state.licence as File)}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-label="Remove vehicle license"
                                      disabled={adding}
                                      onClick={() => detach(row)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {ready.length > toAdd.length && (
                    <p className="text-xs text-warning">
                      {vehiclesLeft > 0
                        ? `Owner Operator accounts can add ${vehiclesLeft} more ${vehiclesLeft === 1 ? "vehicle" : "vehicles"}, so only the first ${vehiclesLeft} will be added.`
                        : "Owner Operator accounts can have a maximum of 10 vehicles. Change your customer type to Enterprise Customer to add more."}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      disabled={adding}
                      onClick={() => setStep(1)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      disabled={!toAdd.length}
                      loading={adding}
                      onClick={() => void addVehicles()}
                    >
                      {`Add ${toAdd.length} ${toAdd.length === 1 ? "Vehicle" : "Vehicles"}`}
                    </Button>
                  </div>
                </div>
              </>
            )}

        <Dialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        >
          <DialogContent className="max-w-5xl gap-4 overflow-hidden p-0">
            <DialogHeader>
              <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-6 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <FileSpreadsheet className="h-5 w-5 text-success" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="truncate">{sheet?.name}</DialogTitle>
                  <DialogDescription>{`Excel workbook · ${rows.length} ${rows.length === 1 ? "vehicle" : "vehicles"}`}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="mx-6 overflow-hidden rounded-lg border border-border bg-background">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <span className="rounded bg-background px-2 py-1 font-medium text-foreground">Sheet 1</span>
                <span>Vehicle Information</span>
              </div>
              <div className="max-h-[58vh] overflow-auto">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-muted">
                    <tr className="text-muted-foreground">
                      <th className="sticky left-0 z-20 w-12 border-b border-r border-border bg-muted px-2 py-1.5 text-center font-medium" />
                      {Array.from(
                        { length: columnCount },
                        (_, index) => (
                          <th
                            key={index}
                            className="border-b border-r border-border px-3 py-1.5 text-center font-medium"
                          >
                            {String.fromCharCode(65 + (index % 26))}
                          </th>
                        ),
                      )}
                    </tr>
                    <tr>
                      <th className="sticky left-0 z-20 border-b border-r border-border bg-muted px-2 py-2" />
                      {(sheet?.cells[0] ?? []).map((cell, index) => (
                        <th
                          // eslint-disable-next-line react/no-array-index-key -- columns have no other identity
                          key={index}
                          className="whitespace-nowrap border-b border-r border-border px-3 py-2 text-left font-semibold"
                        >
                          {cellText(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(sheet?.cells.slice(1) ?? []).map((cells, rowIndex) => (
                      <tr
                        // eslint-disable-next-line react/no-array-index-key -- sheet rows have no other identity
                        key={rowIndex}
                        className="border-t border-border/60"
                      >
                        <td className="sticky left-0 border-r border-border bg-muted/60 px-2 py-2 text-center text-muted-foreground">{rowIndex + 1}</td>
                        {Array.from(
                          { length: columnCount },
                          (_, index) => (
                            <td
                              key={index}
                              className="whitespace-nowrap border-r border-border px-3 py-2"
                            >
                              {cellText(cells[index])}
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <p className="text-xs text-muted-foreground">Preview only · Changes must be made in the Excel file.</p>
              <Button
                variant="outline"
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
