import {
  ICCID_PATTERN,
  MSISDN_PATTERN,
} from "./simIdentity";

export const MAX_IMPORT_ROWS = 1000;
export const TEMPLATE_FILE_NAME = "sim_import_template.csv";
export const TEMPLATE_CONTENT
  = "ICCID,Phone Number,IMSI,Carrier\n"
    + "8927100012345678901,+2348031234567,621301234567890,MTN Nigeria\n"
    + "8927100012345678902,+2348052345678,621302345678901,Glo";

export type ParsedSimRow = {
  iccid: string;
  msisdn: string;
  imsi: string;
  carrier: string;
  isValid: boolean;
  errors: string[];
};

const CARRIER_ALIASES: Record<string, string> = { "mtn nigeria": "MTN" };

export function splitCsv(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const text = content.replace(/^﻿/, "");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === "\"" && text[i + 1] === "\"") {
        cell += "\"";
        i++;
      }
      else if (char === "\"") {
        quoted = false;
      }
      else {
        cell += char;
      }
    }
    else if (char === "\"") {
      quoted = true;
    }
    else if (char === ",") {
      row.push(cell);
      cell = "";
    }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n")
        i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    }
    else {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows.filter(cells => cells.some(value => value.trim() !== ""));
}

function normalizeCarrier(value: string) {
  if (!value)
    return "MTN";
  return CARRIER_ALIASES[value.toLowerCase()] ?? value;
}

function validateRow(iccid: string, msisdn: string, carrier: string) {
  const errors: string[] = [];
  if (iccid.length < 18)
    errors.push("Invalid ICCID (min 18 chars)");
  else if (!ICCID_PATTERN.test(iccid))
    errors.push("ICCID must be 18 to 20 letters or digits");
  if (!msisdn.startsWith("+"))
    errors.push("Phone must start with +");
  else if (!MSISDN_PATTERN.test(msisdn))
    errors.push("Phone must be + followed by 7 to 15 digits");
  if (carrier.length > 64)
    errors.push("Carrier name is too long");
  return errors;
}

export function parseSimCsv(content: string): ParsedSimRow[] {
  return splitCsv(content).slice(1).map(([
    rawIccid = "",
    rawMsisdn = "",
    rawImsi = "",
    rawCarrier = "",
  ]) => {
    const iccid = rawIccid.trim();
    const msisdn = rawMsisdn.trim();
    const carrier = normalizeCarrier(rawCarrier.trim());
    const errors = validateRow(iccid, msisdn, carrier);
    return {
      iccid,
      msisdn,
      imsi: rawImsi.trim(),
      carrier,
      isValid: errors.length === 0,
      errors,
    };
  });
}

export function downloadSimTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE_CONTENT], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = TEMPLATE_FILE_NAME;
  link.click();
  URL.revokeObjectURL(url);
}
