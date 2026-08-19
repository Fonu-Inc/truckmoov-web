import type { Currency } from "@/lib/currency";
import JsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/currency";

export type ReceiptItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type ReceiptData = {
  invoiceNumber: string;
  tenantName: string;
  tenantEmail?: string;
  plan: string;
  period: string;
  issueDate: string;
  paidDate: string;
  dueDate: string;
  paymentMethod: string;
  paymentReference?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax?: number;
  amount: number;
  currency: Currency;
  brandName?: string;
  brandTagline?: string;
};

const MTN_YELLOW: [number, number, number] = [
  255,
  204,
  0,
];
const DARK: [number, number, number] = [
  20,
  20,
  20,
];
const MUTED: [number, number, number] = [
  120,
  120,
  120,
];

export function generateReceiptPDF(data: ReceiptData): JsPDF {
  const doc = new JsPDF({
    unit: "mm", format: "a4",
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // ---------- Header band ----------
  doc.setFillColor(...MTN_YELLOW);
  doc.rect(
    0,
    0,
    pageWidth,
    28,
    "F",
  );
  doc.setTextColor(...DARK);
  doc.setFont(
    "helvetica",
    "bold",
  );
  doc.setFontSize(18);
  doc.text(
    data.brandName ?? "Fleet Pro",
    margin,
    14,
  );
  doc.setFontSize(9);
  doc.setFont(
    "helvetica",
    "normal",
  );
  doc.text(
    data.brandTagline ?? "Powered by MTN Nigeria",
    margin,
    20,
  );

  // Download label (right)
  doc.setFont(
    "helvetica",
    "bold",
  );
  doc.setFontSize(20);
  doc.text(
    "PAYMENT RECEIPT",
    pageWidth - margin,
    16,
    { align: "right" },
  );
  doc.setFont(
    "helvetica",
    "normal",
  );
  doc.setFontSize(9);
  doc.text(
    `#${data.invoiceNumber}`,
    pageWidth - margin,
    22,
    { align: "right" },
  );

  // ---------- PAID stamp ----------
  doc.setDrawColor(
    34,
    197,
    94,
  );
  doc.setLineWidth(1.2);
  doc.roundedRect(
    pageWidth - margin - 38,
    36,
    38,
    12,
    2,
    2,
  );
  doc.setTextColor(
    34,
    197,
    94,
  );
  doc.setFont(
    "helvetica",
    "bold",
  );
  doc.setFontSize(14);
  doc.text(
    "PAID",
    pageWidth - margin - 19,
    44,
    { align: "center" },
  );

  // ---------- Bill to / Meta ----------
  let y = 42;
  doc.setTextColor(...MUTED);
  doc.setFont(
    "helvetica",
    "bold",
  );
  doc.setFontSize(9);
  doc.text(
    "BILLED TO",
    margin,
    y,
  );
  doc.setTextColor(...DARK);
  doc.setFont(
    "helvetica",
    "bold",
  );
  doc.setFontSize(11);
  doc.text(
    data.tenantName,
    margin,
    y + 6,
  );
  doc.setFont(
    "helvetica",
    "normal",
  );
  doc.setFontSize(9);
  if (data.tenantEmail) {
    doc.text(
      data.tenantEmail,
      margin,
      y + 11,
    );
  }
  doc.setTextColor(...MUTED);
  doc.text(
    `${data.plan} Plan · ${data.period}`,
    margin,
    y + 16,
  );

  // Meta block (left of PAID stamp)
  const metaX = pageWidth - margin - 70;
  let metaY = y + 14;
  const metaRow = (label: string, value: string) => {
    doc.setTextColor(...MUTED);
    doc.setFont(
      "helvetica",
      "normal",
    );
    doc.setFontSize(8);
    doc.text(
      label,
      metaX,
      metaY,
    );
    doc.setTextColor(...DARK);
    doc.setFont(
      "helvetica",
      "bold",
    );
    doc.setFontSize(9);
    doc.text(
      value,
      pageWidth - margin,
      metaY,
      { align: "right" },
    );
    metaY += 5;
  };
  metaRow(
    "Issue date",
    data.issueDate,
  );
  metaRow(
    "Due date",
    data.dueDate,
  );
  metaRow(
    "Paid on",
    data.paidDate,
  );
  metaRow(
    "Method",
    data.paymentMethod,
  );
  if (data.paymentReference) {
    metaRow(
      "Reference",
      data.paymentReference,
    );
  }

  // ---------- Items table ----------
  y = Math.max(
    y + 24,
    metaY + 4,
  );
  autoTable(
    doc,
    {
      startY: y,
      head: [
        [
          "Description",
          "Qty",
          "Unit Price",
          "Amount",
        ],
      ],
      body: data.items.map(item => [
        item.description,
        String(item.quantity),
        formatCurrency(
          item.unitPrice,
          data.currency,
        ),
        formatCurrency(
          item.total,
          data.currency,
        ),
      ]),
      theme: "grid",
      headStyles: {
        fillColor: DARK,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9, textColor: DARK,
      },
      columnStyles: {
        1: {
          halign: "center", cellWidth: 18,
        },
        2: {
          halign: "right", cellWidth: 35,
        },
        3: {
          halign: "right", cellWidth: 35,
        },
      },
      margin: {
        left: margin, right: margin,
      },
    },
  );

  // ---------- Totals ----------
  // @ts-expect-error - lastAutoTable is added by jspdf-autotable
  const tableEndY = doc.lastAutoTable?.finalY ?? y + 30;
  let ty = tableEndY + 8;
  const totalsX = pageWidth - margin - 70;

  const totalsRow = (label: string, value: string, bold = false) => {
    doc.setTextColor(...MUTED);
    doc.setFont(
      "helvetica",
      "normal",
    );
    doc.setFontSize(9);
    doc.text(
      label,
      totalsX,
      ty,
    );
    doc.setTextColor(...DARK);
    doc.setFont(
      "helvetica",
      bold ? "bold" : "normal",
    );
    doc.setFontSize(bold ? 12 : 9);
    doc.text(
      value,
      pageWidth - margin,
      ty,
      { align: "right" },
    );
    ty += bold ? 8 : 6;
  };

  totalsRow(
    "Subtotal",
    formatCurrency(
      data.subtotal,
      data.currency,
    ),
  );
  if (data.tax) {
    totalsRow(
      "Tax (VAT 7.5%)",
      formatCurrency(
        data.tax,
        data.currency,
      ),
    );
  }

  // Divider
  doc.setDrawColor(
    220,
    220,
    220,
  );
  doc.line(
    totalsX,
    ty - 2,
    pageWidth - margin,
    ty - 2,
  );
  ty += 2;

  totalsRow(
    "TOTAL PAID",
    formatCurrency(
      data.amount,
      data.currency,
    ),
    true,
  );

  // ---------- Footer ----------
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(
    230,
    230,
    230,
  );
  doc.line(
    margin,
    footerY - 6,
    pageWidth - margin,
    footerY - 6,
  );
  doc.setTextColor(...MUTED);
  doc.setFont(
    "helvetica",
    "normal",
  );
  doc.setFontSize(8);
  doc.text(
    "Thank you for your business. This receipt is electronically generated and is valid without signature.",
    margin,
    footerY,
  );
  doc.text(
    `Generated ${new Date().toLocaleString()}`,
    pageWidth - margin,
    footerY,
    { align: "right" },
  );

  return doc;
}

export function downloadReceiptPDF(data: ReceiptData): void {
  const doc = generateReceiptPDF(data);
  doc.save(`Download-${data.invoiceNumber}.pdf`);
}
