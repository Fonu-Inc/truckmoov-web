export type DataUnit = "KB" | "MB" | "GB";
export type BillingCycle = "monthly" | "yearly";

export function toMb(amount: number, unit: DataUnit): number {
  if (!Number.isFinite(amount) || amount < 0) return 0;
  if (unit === "KB") return amount / 1024;
  if (unit === "GB") return amount * 1024;
  return amount;
}

export function formatBundle(amount: number, unit: DataUnit, cycle: BillingCycle): string {
  return `${amount}${unit} / ${cycle}`;
}



