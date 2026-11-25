/**
 * The design's "Bulk Upload Vehicles" sheet, read in the browser. The server only
 * imports CSV and takes no licence per row, so each parsed row is added through the
 * same endpoint as a single Add Vehicle, licence attached (shared by main and landing).
 */

import type {
  OnboardingVehicleInput,
  OnboardingVehiclePurchaseType,
  OnboardingVehicleType,
} from "@truckmoov/api/auth";
import {
  PURCHASE_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
} from "./applyTypes";

export type SheetCell = string | number | boolean | Date | null | undefined;

type ColumnKey
  = | "ref"
    | "registrationNumber"
    | "vehicleType"
    | "make"
    | "model"
    | "year"
    | "chassisNumber"
    | "engineNumber"
    | "color"
    | "engineCapacity"
    | "odometer"
    | "purchaseType";

export type VehicleSheetColumn = {
  key: ColumnKey;
  header: string;
  required: boolean;
  hint: string;
  /** Other headings accepted for this column, lower-case. */
  aliases?: string[];
};

/** In the design's order. The template uses `header`; uploads may use an alias. */
export const VEHICLE_SHEET_COLUMNS: VehicleSheetColumn[] = [
  {
    key: "ref", header: "Vehicle ID", required: true, hint: "Unique reference, e.g. V-001.",
  },
  {
    key: "registrationNumber", header: "Registration Number", required: true, hint: "Plate number, e.g. LAG-123-ABC. Must be unique.", aliases: ["registration", "plate number"],
  },
  {
    key: "vehicleType", header: "Vehicle Type", required: true, hint: `One of: ${Object.values(VEHICLE_TYPE_LABELS).join(", ")}`, aliases: ["type"],
  },
  {
    key: "make", header: "Make", required: true, hint: "Manufacturer, e.g. Toyota", aliases: ["vehicle make"],
  },
  {
    key: "model", header: "Model", required: true, hint: "Model name, e.g. Hilux", aliases: ["vehicle model"],
  },
  {
    key: "year", header: "Year", required: true, hint: "4-digit year, e.g. 2021", aliases: ["vehicle year"],
  },
  {
    key: "chassisNumber", header: "Chassis Number", required: false, hint: "VIN / chassis number", aliases: ["vin"],
  },
  {
    key: "engineNumber", header: "Engine Number", required: false, hint: "Engine number",
  },
  {
    key: "color", header: "Color", required: false, hint: "e.g. White", aliases: ["colour", "vehicle color", "vehicle colour"],
  },
  {
    key: "engineCapacity", header: "Engine Capacity", required: false, hint: "e.g. 2.8L",
  },
  {
    key: "odometer", header: "Odometer Reading", required: false, hint: "Numeric, in kilometres, e.g. 84500", aliases: ["odometer", "odometer (km)"],
  },
  {
    key: "purchaseType", header: "Type of Purchase", required: false, hint: `One of: ${[
      ...Object.values(PURCHASE_TYPE_LABELS).filter(label => label !== "Other"),
      "Rental",
      "Other",
    ].join(", ")}`, aliases: ["purchase type"],
  },
];

export type ParsedVehicleRow = {
  /** 1-based sheet row, header included, for messages. */
  sheetRow: number;
  ref: string;
  registrationNumber: string;
  /** Null when the row has errors. */
  data: OnboardingVehicleInput | null;
  errors: string[];
};

export type VehicleSheetResult = {
  rows: ParsedVehicleRow[];
  /** Set when the sheet itself can't be read, e.g. missing columns. */
  error?: string;
};

const normalize = (value: string) => value.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const plate = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

function text(cell: SheetCell) {
  if (cell === null || cell === undefined)
    return "";
  if (cell instanceof Date)
    return String(cell.getFullYear());
  return String(cell).trim();
}

const VEHICLE_TYPES = new Map<string, OnboardingVehicleType>(
  (Object.entries(VEHICLE_TYPE_LABELS) as [OnboardingVehicleType, string][])
    .flatMap(([key, label]) => [
      [
        normalize(label),
        key,
      ],
      [
        normalize(key),
        key,
      ],
    ]),
);

type Purchase = {
  type: OnboardingVehiclePurchaseType; other?: string;
};

const PURCHASE_TYPES = new Map<string, Purchase>([
  ...(Object.entries(PURCHASE_TYPE_LABELS) as [OnboardingVehiclePurchaseType, string][])
    .flatMap(([key, label]): [string, Purchase][] => [
      [
        normalize(label),
        { type: key },
      ],
      [
        normalize(key),
        { type: key },
      ],
    ]),
  [
    "leased",
    { type: "lease" },
  ],
  [
    "finance",
    { type: "financed" },
  ],
  [
    "loan",
    { type: "financed" },
  ],
  // The design offers Rental; the API has no value for it, so it goes in as Other.
  [
    "rental",
    {
      type: "other", other: "Rental",
    },
  ],
]);

function columnIndex(headers: SheetCell[]) {
  const found = new Map<ColumnKey, number>();
  headers.forEach((cell, index) => {
    const heading = normalize(text(cell));
    const column = VEHICLE_SHEET_COLUMNS.find(c => normalize(c.header) === heading || c.aliases?.includes(heading));
    if (column && !found.has(column.key))
      found.set(column.key, index);
  });
  return found;
}

/**
 * Reads the sheet's rows: the first non-empty row is the header. Rows that break a rule
 * carry `errors` and no `data`. `existingRegistrations` are vehicles already on the
 * application, so a re-upload doesn't add them twice.
 */
export function parseVehicleSheet(sheet: SheetCell[][], existingRegistrations: string[] = []): VehicleSheetResult {
  const headerAt = sheet.findIndex(row => row.some(cell => text(cell)));
  if (headerAt === -1)
    return { rows: [], error: "The file has no rows. Add one vehicle per row under the template's headings." };

  const columns = columnIndex(sheet[headerAt]);
  const missing = VEHICLE_SHEET_COLUMNS.filter(c => c.required && !columns.has(c.key)).map(c => c.header);
  if (missing.length) {
    return {
      rows: [],
      error: `The sheet is missing ${missing.length === 1 ? "the column" : "these columns"}: ${missing.join(", ")}. Download the template to get started.`,
    };
  }

  const seenRefs = new Set<string>();
  const seenPlates = new Set(existingRegistrations.map(plate));
  const thisYear = new Date().getFullYear();
  const rows: ParsedVehicleRow[] = [];

  sheet.slice(headerAt + 1).forEach((cells, offset) => {
    if (!cells.some(cell => text(cell)))
      return;
    const get = (key: ColumnKey) => {
      const index = columns.get(key);
      return index === undefined ? "" : text(cells[index]);
    };
    const errors: string[] = [];
    for (const column of VEHICLE_SHEET_COLUMNS) {
      if (column.required && !get(column.key))
        errors.push(`${column.header} is required.`);
    }

    const ref = get("ref");
    if (ref) {
      if (seenRefs.has(ref.toLowerCase()))
        errors.push(`Vehicle ID ${ref} is used more than once.`);
      seenRefs.add(ref.toLowerCase());
    }

    const registrationNumber = get("registrationNumber");
    if (registrationNumber) {
      if (seenPlates.has(plate(registrationNumber)))
        errors.push(`${registrationNumber} is already in your list.`);
      seenPlates.add(plate(registrationNumber));
    }

    const typeText = get("vehicleType");
    const vehicleType = VEHICLE_TYPES.get(normalize(typeText));
    if (typeText && !vehicleType)
      errors.push(`Vehicle type "${typeText}" isn't supported. Use one of: ${Object.values(VEHICLE_TYPE_LABELS).join(", ")}.`);

    const yearText = get("year");
    const year = Number(yearText);
    if (yearText && (!/^\d{4}$/.test(yearText) || year < 1950 || year > thisYear + 1))
      errors.push("Year must be four digits, 1950 or later.");

    const odometerText = get("odometer").replace(/,|\s*km$/gi, "");
    if (odometerText && !/^\d+(?:\.\d+)?$/.test(odometerText))
      errors.push("Odometer reading must be a number of kilometres.");

    const purchaseText = get("purchaseType");
    const purchase = purchaseText ? PURCHASE_TYPES.get(normalize(purchaseText)) : undefined;
    if (purchaseText && !purchase)
      errors.push(`Type of purchase "${purchaseText}" isn't supported.`);

    const optional = (key: ColumnKey) => get(key) || undefined;
    rows.push({
      sheetRow: headerAt + offset + 2,
      ref,
      registrationNumber,
      errors,
      data: errors.length || !vehicleType
        ? null
        : {
            registrationNumber,
            vehicleType,
            make: get("make"),
            model: get("model"),
            year,
            chassisNumber: optional("chassisNumber"),
            engineNumber: optional("engineNumber"),
            color: optional("color"),
            engineCapacity: optional("engineCapacity"),
            odometerReading: odometerText ? Math.round(Number(odometerText)) : undefined,
            purchaseType: purchase?.type,
            purchaseTypeOther: purchase?.other,
          },
    });
  });

  return rows.length
    ? { rows }
    : {
        rows,
        error: "The sheet has headings but no vehicles. Add one vehicle per row.",
      };
}

/** The template's rows: headings, then one example vehicle. */
export function vehicleTemplateRows(): SheetCell[][] {
  return [
    VEHICLE_SHEET_COLUMNS.map(c => c.header),
    [
      "V-001",
      "LAG-123-ABC",
      "Truck",
      "Toyota",
      "Hilux",
      2021,
      "JTEBU5JR9K5000001",
      "ENG-000123",
      "White",
      "2.8L",
      84500,
      "Owned",
    ],
  ];
}

/** Licence files accepted per vehicle: PDF, JPG or PNG up to 10 MB. */
export const VEHICLE_LICENCE_ACCEPT = "application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png";
export const VEHICLE_LICENCE_MAX_BYTES = 10 * 1024 * 1024;

export function vehicleLicenceError(file: File) {
  if (!/\.(?:pdf|jpe?g|png)$/i.test(file.name))
    return "Attach a PDF, JPG or PNG file.";
  if (file.size > VEHICLE_LICENCE_MAX_BYTES)
    return "The file must be 10 MB or smaller.";
  return null;
}
