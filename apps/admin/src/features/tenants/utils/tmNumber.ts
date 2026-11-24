/**
 * Telecom Master (enterprise account number) helpers. The Telecom Master belongs to the
 * enterprise account and is never a device SIM MSISDN.
 */
export type TmNumberChoice = "existing" | "new" | "";

export type TmNumberStatus
  = | "not_selected"
    | "pending_verification"
    | "verified"
    | "allocation_pending"
    | "allocated"
    | "verification_failed"
    | "allocation_failed";

export const TM_STATUS_LABEL: Record<TmNumberStatus, string> = {
  not_selected: "Not Selected",
  pending_verification: "Pending Verification",
  verified: "Verified",
  allocation_pending: "Allocation Pending",
  allocated: "Allocated",
  verification_failed: "Verification Failed",
  allocation_failed: "Allocation Failed",
};

export const TM_STATUS_TONE: Record<TmNumberStatus, string> = {
  not_selected: "bg-muted text-muted-foreground border-border",
  pending_verification: "bg-warning/15 text-warning border-warning/30",
  allocation_pending: "bg-warning/15 text-warning border-warning/30",
  verified: "bg-success/15 text-success border-success/30",
  allocated: "bg-success/15 text-success border-success/30",
  verification_failed: "bg-destructive/15 text-destructive border-destructive/30",
  allocation_failed: "bg-destructive/15 text-destructive border-destructive/30",
};

/** MTN Nigeria mobile prefixes (after the leading 0). */
export const MTN_PREFIXES = [
  "703",
  "706",
  "803",
  "806",
  "810",
  "813",
  "814",
  "816",
  "903",
  "906",
  "913",
  "916",
  "704",
  "707",
];

/**
 * Normalises a Nigerian number (0803…, 803…, 234803…, +234 803…) to
 * international 234XXXXXXXXXX. Returns null when not a valid MTN mobile number.
 * Format validity is NOT verification — MTN must confirm eligibility.
 */
export function normalizeMtnNumber(input: string): string | null {
  const digits = (input || "").replace(
    /[\s\-().]/g,
    "",
  ).replace(
    /^\+/,
    "",
  );
  if (!/^\d+$/.test(digits))
    return null;
  let national: string;
  if (digits.startsWith("234") && digits.length === 13)
    national = digits.slice(3);
  else if (digits.startsWith("0") && digits.length === 11)
    national = digits.slice(1);
  else if (digits.length === 10)
    national = digits;
  else return null;
  if (!MTN_PREFIXES.includes(national.slice(
    0,
    3,
  ))) {
    return null;
  }
  return `234${national}`;
}

export function formatTmNumber(msisdn?: string | null) {
  return msisdn && /^234\d{10}$/.test(msisdn) ? `+234 ${msisdn.slice(
    3,
    6,
  )} ${msisdn.slice(
    6,
    9,
  )} ${msisdn.slice(9)}` : msisdn || "-";
}

/** Quotation line for a new Telecom Master SIM; null when not applicable. Included once. */
export function tmSimQuotationLine(choice: TmNumberChoice, configuredCharge: number | null) {
  if (choice !== "new")
    return null;
  return {
    label: "New Telecom Master SIM", amount: configuredCharge, priced: configuredCharge !== null && configuredCharge >= 0,
  };
}

/** Admin filter groups. */
export type TmFilter = "all" | "existing" | "new" | "pending_verification" | "allocation_pending" | "allocated" | "failed";
export function matchesTmFilter(row: {
  numberType: string; status: string;
}, f: TmFilter) {
  switch (f) {
    case "all": return true;
    case "existing": return row.numberType === "existing";
    case "new": return row.numberType === "new";
    case "failed": return row.status === "verification_failed" || row.status === "allocation_failed";
    default: return row.status === f;
  }
}
