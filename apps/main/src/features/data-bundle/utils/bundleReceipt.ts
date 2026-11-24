import JsPDF from "jspdf";

export type BundleReceiptTransaction = {
  id: string;
  created_at: string;
  msisdn: string;
  bundle_code: string;
  status: string;
  amount_ngn?: number | null;
  payment_reference?: string | null;
};

export const canDownloadReceipt = (t: Pick<BundleReceiptTransaction, "status">) => t.status.toUpperCase() === "SUCCESS";

/** Port of fleetflow's bundleTransactionReceipt: a PDF of the recorded transaction, amount in NGN. */
export function generateBundleTransactionReceipt(transaction: BundleReceiptTransaction, bundleName?: string): Blob {
  const doc = new JsPDF();
  const amount = transaction.amount_ngn;
  const amountLabel = amount == null || !Number.isFinite(Number(amount))
    ? "Not recorded"
    : `NGN ${Number(amount).toLocaleString(
      "en-NG",
      {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      },
    )}`;
  const date = new Date(transaction.created_at);
  const dateLabel = Number.isNaN(date.getTime())
    ? "Not recorded"
    : `${date.toLocaleString(
      "en-NG",
      { timeZone: "Africa/Lagos" },
    )} (Africa/Lagos)`;
  doc.setFont(
    "helvetica",
    "bold",
  );
  doc.setFontSize(20);
  doc.text(
    "TruckMoov",
    20,
    24,
  );
  doc.setFontSize(14);
  doc.text(
    "TRANSACTION RECEIPT",
    20,
    38,
  );
  doc.setFontSize(11);
  const rows = [
    [
      "Transaction reference",
      transaction.id,
    ],
    [
      "Payment reference",
      transaction.payment_reference ?? "-",
    ],
    [
      "Date",
      dateLabel,
    ],
    [
      "Mobile number",
      transaction.msisdn,
    ],
    [
      "Bundle",
      bundleName || transaction.bundle_code,
    ],
    [
      "Bundle code",
      transaction.bundle_code,
    ],
    [
      "Status",
      transaction.status,
    ],
    [
      "Transaction amount",
      amountLabel,
    ],
  ];
  let y = 56;
  for (const [
    label,
    value,
  ] of rows) {
    doc.setFont(
      "helvetica",
      "bold",
    );
    doc.text(
      label,
      20,
      y,
    );
    doc.setFont(
      "helvetica",
      "normal",
    );
    const lines = doc.splitTextToSize(
      value,
      100,
    );
    doc.text(
      lines,
      83,
      y,
    );
    y += Math.max(
      12,
      lines.length * 6 + 6,
    );
  }
  doc.text(
    doc.splitTextToSize(
      "This receipt records the successful bundle transaction and its recorded amount.",
      170,
    ),
    20,
    y + 12,
  );
  return doc.output("blob");
}

export function bundleReceiptFilename(reference: string) {
  return `bundle-receipt-${reference.replace(
    /[^\w-]/g,
    "_",
  )}.pdf`;
}
