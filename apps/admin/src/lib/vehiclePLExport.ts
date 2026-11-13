import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import JsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Local type alias — useVehicleFinancials hook has been deleted
export type VehicleProfitability = {
  vehicle_id: string;
  revenue?: {
    total?: number;
    jobs_completed?: number;
    total_km?: number;
  };
  costs?: {
    total?: number;
    fuel?: number;
    maintenance?: number;
    wages?: number;
    insurance?: number;
    depreciation?: number;
  };
  profitability?: {
    net_profit?: number;
    margin_percent?: number;
    score?: number;
    tier?: string;
  };
};

export type StatementOptions = {
  title: string;
  companyName: string;
  periodLabel: string;
  preparedBy: string;
  notes: string;
  includeCover: boolean;
  includeSummary: boolean;
  includePerVehicle: boolean;
  accent: "blue" | "green" | "amber" | "slate";
};

const ACCENT_HEX: Record<StatementOptions["accent"], [number, number, number]> = {
  blue: [
    37,
    99,
    235,
  ],
  green: [
    22,
    163,
    74,
  ],
  amber: [
    217,
    119,
    6,
  ],
  slate: [
    51,
    65,
    85,
  ],
};

const TIER_LABEL: Record<string, string> = {
  "excellent": "Excellent",
  "good": "Good",
  "marginal": "Marginal",
  "loss-making": "Loss-Making",
};

function fmtNGN(n: number) {
  return `₦${(n || 0).toLocaleString(
    "en-NG",
    { maximumFractionDigits: 0 },
  )}`;
}

function buildRows(data: VehicleProfitability[], nameLookup: (id: string) => string) {
  return data.map(d => ({
    vehicle: nameLookup(d.vehicle_id),
    revenue: d.revenue?.total || 0,
    costs: d.costs?.total || 0,
    profit: d.profitability?.net_profit || 0,
    margin: d.profitability?.margin_percent || 0,
    score: d.profitability?.score || 0,
    tier: TIER_LABEL[d.profitability?.tier || "marginal"] || "—",
    fuel: d.costs?.fuel || 0,
    maintenance: d.costs?.maintenance || 0,
    wages: d.costs?.wages || 0,
    insurance: d.costs?.insurance || 0,
    depreciation: d.costs?.depreciation || 0,
    jobs: d.revenue?.jobs_completed || 0,
    km: d.revenue?.total_km || 0,
  }));
}

function totals(data: VehicleProfitability[]) {
  return data.reduce(
    (acc, v) => ({
      revenue: acc.revenue + (v.revenue?.total || 0),
      costs: acc.costs + (v.costs?.total || 0),
      profit: acc.profit + (v.profitability?.net_profit || 0),
      jobs: acc.jobs + (v.revenue?.jobs_completed || 0),
      km: acc.km + (v.revenue?.total_km || 0),
    }),
    {
      revenue: 0,
      costs: 0,
      profit: 0,
      jobs: 0,
      km: 0,
    },
  );
}

export function exportVehiclePLToPDF(
  data: VehicleProfitability[],
  nameLookup: (id: string) => string,
  opts: StatementOptions,
) {
  const doc = new JsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const accent = ACCENT_HEX[opts.accent];
  const t = totals(data);
  const margin = (t.revenue > 0 ? (t.profit / t.revenue) * 100 : 0).toFixed(1);

  // Cover
  if (opts.includeCover) {
    doc.setFillColor(...accent);
    doc.rect(
      0,
      0,
      pageWidth,
      220,
      "F",
    );
    doc.setTextColor(
      255,
      255,
      255,
    );
    doc.setFont(
      "helvetica",
      "bold",
    );
    doc.setFontSize(28);
    doc.text(
      opts.title,
      40,
      100,
    );
    if (opts.companyName) {
      doc.setFontSize(16);
      doc.setFont(
        "helvetica",
        "normal",
      );
      doc.text(
        opts.companyName,
        40,
        130,
      );
    }
    doc.setFontSize(12);
    doc.text(
      `Reporting Period: ${opts.periodLabel}`,
      40,
      160,
    );
    doc.text(
      `Generated: ${formatDate(new Date())}`,
      40,
      180,
    );

    doc.setTextColor(
      0,
      0,
      0,
    );
    doc.setFontSize(11);
    doc.text(
      "This document presents a per-vehicle profit and loss analysis",
      40,
      280,
    );
    doc.text(
      "for the selected reporting period.",
      40,
      296,
    );

    if (opts.preparedBy) {
      doc.setFontSize(10);
      doc.text(
        `Prepared by: ${opts.preparedBy}`,
        40,
        760,
      );
    }
    doc.addPage();
  }

  // Summary
  if (opts.includeSummary) {
    doc.setTextColor(...accent);
    doc.setFont(
      "helvetica",
      "bold",
    );
    doc.setFontSize(18);
    doc.text(
      "Fleet Summary",
      40,
      60,
    );

    autoTable(
      doc,
      {
        startY: 80,
        head: [
          [
            "Metric",
            "Value",
          ],
        ],
        body: [
          [
            "Total Revenue",
            fmtNGN(t.revenue),
          ],
          [
            "Total Costs",
            fmtNGN(t.costs),
          ],
          [
            "Net Profit",
            fmtNGN(t.profit),
          ],
          [
            "Profit Margin",
            `${margin}%`,
          ],
          [
            "Jobs Completed",
            String(t.jobs),
          ],
          [
            "Total Distance (km)",
            t.km.toFixed(0),
          ],
          [
            "Vehicles Analyzed",
            String(data.length),
          ],
        ],
        headStyles: {
          fillColor: accent,
          textColor: 255,
        },
        styles: {
          fontSize: 10,
          cellPadding: 6,
        },
      },
    );
  }

  // Per Vehicle
  if (opts.includePerVehicle && data.length > 0) {
    if (opts.includeSummary)
      doc.addPage();
    doc.setTextColor(...accent);
    doc.setFont(
      "helvetica",
      "bold",
    );
    doc.setFontSize(18);
    doc.text(
      "Per-Vehicle Breakdown",
      40,
      60,
    );

    const rows = buildRows(
      data,
      nameLookup,
    );
    autoTable(
      doc,
      {
        startY: 80,
        head: [
          [
            "Vehicle",
            "Revenue",
            "Costs",
            "Profit",
            "Margin",
            "Tier",
            "Score",
          ],
        ],
        body: rows.map(r => [
          r.vehicle,
          fmtNGN(r.revenue),
          fmtNGN(r.costs),
          fmtNGN(r.profit),
          `${r.margin.toFixed(1)}%`,
          r.tier,
          String(r.score),
        ]),
        headStyles: {
          fillColor: accent,
          textColor: 255,
        },
        styles: {
          fontSize: 9,
          cellPadding: 5,
        },
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
          6: { halign: "right" },
        },
      },
    );
  }

  // Notes
  if (opts.notes) {
    const lastY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100;
    doc.setTextColor(
      80,
      80,
      80,
    );
    doc.setFontSize(9);
    doc.setFont(
      "helvetica",
      "italic",
    );
    const noteLines = doc.splitTextToSize(
      opts.notes,
      pageWidth - 80,
    );
    doc.text(
      noteLines,
      40,
      lastY + 30,
    );
  }

  doc.save(`${opts.title.replace(
    /\s+/g,
    "_",
  )}_${Date.now()}.pdf`);
}

export function exportVehiclePLToCSV(
  data: VehicleProfitability[],
  nameLookup: (id: string) => string,
  opts: StatementOptions,
) {
  const rows = buildRows(
    data,
    nameLookup,
  );
  const header = [
    "Vehicle",
    "Revenue",
    "Fuel",
    "Maintenance",
    "Wages",
    "Insurance",
    "Depreciation",
    "Total Costs",
    "Net Profit",
    "Margin %",
    "Tier",
    "Score",
    "Jobs",
    "KM",
  ];
  const csv = [
    header.join(","),
    ...rows.map(r =>
      [
        r.vehicle,
        r.revenue,
        r.fuel,
        r.maintenance,
        r.wages,
        r.insurance,
        r.depreciation,
        r.costs,
        r.profit,
        r.margin.toFixed(2),
        r.tier,
        r.score,
        r.jobs,
        r.km,
      ]
        .map(v => (typeof v === "string" && v.includes(",") ? `"${v}"` : v))
        .join(",")),
  ].join("\n");

  const blob = new Blob(
    [csv],
    { type: "text/csv;charset=utf-8;" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${opts.title.replace(
    /\s+/g,
    "_",
  )}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
