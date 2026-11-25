/**
 * Reading and writing the bulk-upload Excel file in the browser. Kept apart from
 * `vehicleSheet.ts` so the parsing rules test without the Excel libraries.
 */

import type { SheetCell } from "./vehicleSheet";
import { readSheet } from "read-excel-file/browser";
import writeXlsxFile from "write-excel-file/browser";
import { vehicleTemplateRows } from "./vehicleSheet";

export const VEHICLE_SHEET_MAX_BYTES = 5 * 1024 * 1024;

/** The first sheet's rows. Throws a readable message for a non-Excel or broken file. */
export async function readVehicleSheetFile(file: File): Promise<SheetCell[][]> {
  if (!/\.xlsx$/i.test(file.name))
    throw new Error("Only Excel (.xlsx) files are supported. Download the template to get started.");
  if (file.size > VEHICLE_SHEET_MAX_BYTES)
    throw new Error("The Excel file must be 5 MB or smaller.");
  try {
    return await readSheet(file) as SheetCell[][];
  }
  catch {
    throw new Error("This file couldn't be read. Save it as an Excel workbook (.xlsx) and try again.");
  }
}

export async function downloadVehicleTemplate() {
  const [
    headers,
    example,
  ] = vehicleTemplateRows();
  await writeXlsxFile(
    [
      headers.map(value => ({
        value: String(value), fontWeight: "bold" as const,
      })),
      example.map(value => ({ value: value as string | number })),
    ],
    {
      sheet: "Vehicle Information",
      columns: headers.map(() => ({ width: 22 })),
    },
  ).toFile("fleetpro-vehicle-template.xlsx");
}
