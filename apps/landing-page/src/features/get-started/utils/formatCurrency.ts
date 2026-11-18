/** Naira amount as the main app's `formatCurrency` shows it, e.g. "₦77,000". */
export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString(
    "en-NG",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  )}`;
}
