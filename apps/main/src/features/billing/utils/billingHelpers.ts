/**
 * Non-component helpers from fleetflow's `billingShared.tsx`, split out so
 * `billingShared.tsx` only exports components (react-refresh/only-export-components).
 */

export const TONE: Record<string, string> = {
  positive: "bg-emerald-500/12 text-emerald-600 border-emerald-500/25",
  warning: "bg-amber-500/12 text-amber-600 border-amber-500/25",
  danger: "bg-destructive/12 text-destructive border-destructive/25",
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-primary/12 text-primary border-primary/25",
};

export function toneForStatus(status: string): keyof typeof TONE {
  switch (status) {
    case "paid":
    case "successful":
    case "accepted":
      return "positive";
    case "pending":
    case "partially_paid":
    case "awaiting_decision":
    case "sent":
      return "warning";
    case "overdue":
    case "failed":
      return "danger";
    case "refunded":
      return "info";
    default:
      return "neutral";
  }
}

/** Simple client-side document download used for quotations, invoices and receipts. */
export function downloadDocument(filename: string, lines: string[]) {
  const blob = new Blob(
    [lines.join("\n")],
    { type: "text/plain;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
