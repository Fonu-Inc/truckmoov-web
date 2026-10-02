import * as z from "zod";

export const ICCID_PATTERN = /^[A-Za-z0-9]{18,20}$/;
export const MSISDN_PATTERN = /^\+\d{7,15}$/;
export const IMSI_PATTERN = /^\d{10,15}$/;
export const OTHER_CARRIER = "Other";

export type SimIdentityValues = {
  iccid: string;
  msisdn: string;
  imsi: string;
  carrier: string;
};

type Original = Partial<SimIdentityValues>;

function accepts(pattern: RegExp, original?: string) {
  return (value: string) => value === original || pattern.test(value);
}

export function buildIdentityShape(original: Original = {}) {
  return {
    iccid: z.string().trim()
      .min(1, "ICCID and phone number are required")
      .refine(accepts(ICCID_PATTERN, original.iccid), "ICCID must be 18 to 20 letters or digits"),
    msisdn: z.string().trim()
      .min(1, "ICCID and phone number are required")
      .refine(accepts(MSISDN_PATTERN, original.msisdn), "Phone must start with + and have 7 to 15 digits"),
    imsi: z.string().trim()
      .refine(value => value === "" || accepts(IMSI_PATTERN, original.imsi)(value), "IMSI must be 10 to 15 digits"),
    carrier: z.string().trim()
      .min(1, "Carrier is required")
      .max(64, "Carrier name is too long"),
  };
}

export function mergeCarrierOptions(base: readonly string[], extra?: readonly string[]) {
  return Array.from(new Set([
    ...base,
    ...extra ?? [],
  ]));
}
