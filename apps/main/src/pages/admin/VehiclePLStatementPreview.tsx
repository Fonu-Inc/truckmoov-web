import type { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import { Printer } from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { Button } from "@/components/shadcn/button";
import { DataTable } from "@/components/shadcn/data-table";

type PreviewRow = {
  vehicle_id: string;
  vehicle_name: string;
  revenue: number;
  costs: number;
  net_profit: number;
  margin: number;
  score: number;
  tier: string;
  fuel: number;
  maintenance: number;
  wages: number;
  insurance: number;
  depreciation: number;
  jobs: number;
  km: number;
};

type PreviewPayload = {
  options: {
    title: string;
    companyName: string;
    periodLabel: string;
    preparedBy: string;
    notes: string;
    includeCover: boolean;
    includeSummary: boolean;
    includePerVehicle: boolean;
    includeCostBreakdown: boolean;
    accent: "blue" | "green" | "amber" | "slate";
  };
  rows: PreviewRow[];
};

const ACCENT_BG: Record<string, string> = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  amber: "bg-amber-600",
  slate: "bg-slate-700",
};
const ACCENT_TEXT: Record<string, string> = {
  blue: "text-blue-600",
  green: "text-green-600",
  amber: "text-amber-600",
  slate: "text-slate-700",
};

function fmt(n: number) {
  return `₦${(n || 0).toLocaleString(
    "en-NG",
    { maximumFractionDigits: 0 },
  )}`;
}

const TIER_COLOR: Record<string, string> = {
  "excellent": "bg-success/10 text-success",
  "good": "bg-info/10 text-info",
  "marginal": "bg-warning/10 text-warning",
  "loss-making": "bg-destructive/10 text-destructive",
};

const TIER_LABEL: Record<string, string> = {
  "excellent": "Excellent",
  "good": "Good",
  "marginal": "Marginal",
  "loss-making": "Loss-Making",
};

// Header colour per accent; full class strings so Tailwind keeps them.
const ACCENT_HEAD: Record<string, string> = {
  blue: "[&_thead_tr]:bg-blue-600 [&_th]:text-white",
  green: "[&_thead_tr]:bg-green-600 [&_th]:text-white",
  amber: "[&_thead_tr]:bg-amber-600 [&_th]:text-white",
  slate: "[&_thead_tr]:bg-slate-700 [&_th]:text-white",
};
// Zebra rows, as the print statement had.
const STATEMENT_TABLE = "[&_tbody_tr:nth-child(odd)]:bg-muted/30";
const RIGHT = { className: "text-right" };

const perVehicleColumns: ColumnDef<PreviewRow>[] = [
  {
    accessorKey: "vehicle_name",
    header: "Vehicle",
    enableSorting: false,
    meta: { className: "font-medium" },
  },
  {
    accessorKey: "revenue",
    header: "Revenue",
    enableSorting: false,
    meta: { className: "text-right text-success" },
    cell: ({ row }) => fmt(row.original.revenue),
  },
  {
    accessorKey: "costs",
    header: "Costs",
    enableSorting: false,
    meta: { className: "text-right text-destructive" },
    cell: ({ row }) => fmt(row.original.costs),
  },
  {
    accessorKey: "net_profit",
    header: "Profit",
    enableSorting: false,
    meta: RIGHT,
    cell: ({ row }) => (
      <span className={`font-semibold ${row.original.net_profit >= 0 ? "text-success" : "text-destructive"}`}>
        {fmt(row.original.net_profit)}
      </span>
    ),
  },
  {
    accessorKey: "margin",
    header: "Margin",
    enableSorting: false,
    meta: RIGHT,
    cell: ({ row }) => `${row.original.margin.toFixed(1)}%`,
  },
  {
    accessorKey: "tier",
    header: "Tier",
    enableSorting: false,
    cell: ({ row }) => (
      <span className={`px-2 py-0.5 rounded text-xs ${TIER_COLOR[row.original.tier] || ""}`}>
        {TIER_LABEL[row.original.tier] || row.original.tier}
      </span>
    ),
  },
  {
    accessorKey: "score",
    header: "Score",
    enableSorting: false,
    meta: RIGHT,
  },
];

const costColumns: ColumnDef<PreviewRow>[] = [
  {
    accessorKey: "vehicle_name",
    header: "Vehicle",
    enableSorting: false,
    meta: { className: "font-medium" },
  },
  ...([
    "fuel",
    "maintenance",
    "wages",
    "insurance",
    "depreciation",
  ] as const).map((key): ColumnDef<PreviewRow> => ({
    accessorKey: key,
    header: key.charAt(0).toUpperCase() + key.slice(1),
    enableSorting: false,
    meta: RIGHT,
    cell: ({ row }) => fmt(row.original[key]),
  })),
];

export default function VehiclePLStatementPreview() {
  const [
    payload,
    setPayload,
  ] = useState<PreviewPayload | null>(null);

  useEffect(
    () => {
      const raw = sessionStorage.getItem("vpl_statement_preview");
      if (raw) {
        try {
          setPayload(JSON.parse(raw));
        }
        catch {
          setPayload(null);
        }
      }
    },
    [],
  );

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          No statement data available. Open this preview from the Statement Builder.
        </div>
      </div>
    );
  }

  const {
    options, rows,
  } = payload;
  const totals = rows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      costs: acc.costs + r.costs,
      profit: acc.profit + r.net_profit,
      jobs: acc.jobs + r.jobs,
      km: acc.km + r.km,
    }),
    {
      revenue: 0, costs: 0, profit: 0, jobs: 0, km: 0,
    },
  );
  const margin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;
  const accentBg = ACCENT_BG[options.accent];
  const accentText = ACCENT_TEXT[options.accent];
  const accentHead = ACCENT_HEAD[options.accent];

  return (
    <div className="min-h-screen bg-muted/30 py-8 print:bg-white print:py-0">
      {/* Print toolbar */}
      <div className="max-w-4xl mx-auto mb-4 flex justify-end print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          {" "}
          Print / Save as PDF
        </Button>
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none">
        {/* Cover */}
        {options.includeCover && (
          <div className={`${accentBg} text-white p-12 print:p-10`}>
            <h1 className="text-4xl font-bold mb-2">{options.title}</h1>
            {options.companyName && <p className="text-xl opacity-90">{options.companyName}</p>}
            <div className="mt-8 text-sm opacity-90 space-y-1">
              <p>
                Reporting Period:
                {options.periodLabel}
              </p>
              <p>
                Generated:
                {formatDate(new Date())}
              </p>
              {options.preparedBy && (
                <p>
                  Prepared by:
                  {options.preparedBy}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="p-12 print:p-10 space-y-10">
          {/* Summary */}
          {options.includeSummary && (
            <section>
              <h2 className={`text-2xl font-bold mb-4 ${accentText}`}>Fleet Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryStat
                  label="Total Revenue"
                  value={fmt(totals.revenue)}
                />
                <SummaryStat
                  label="Total Costs"
                  value={fmt(totals.costs)}
                />
                <SummaryStat
                  label="Net Profit"
                  value={fmt(totals.profit)}
                  highlight
                />
                <SummaryStat
                  label="Profit Margin"
                  value={`${margin.toFixed(1)}%`}
                />
                <SummaryStat
                  label="Jobs Completed"
                  value={String(totals.jobs)}
                />
                <SummaryStat
                  label="Total Distance"
                  value={`${totals.km.toFixed(0)} km`}
                />
                <SummaryStat
                  label="Vehicles"
                  value={String(rows.length)}
                />
              </div>
            </section>
          )}

          {/* Per Vehicle */}
          {options.includePerVehicle && rows.length > 0 && (
            <section>
              <h2 className={`text-2xl font-bold mb-4 ${accentText}`}>Per-Vehicle Breakdown</h2>
              <DataTable
                className={`border-collapse ${STATEMENT_TABLE} ${accentHead}`}
                columns={perVehicleColumns}
                data={rows}
                pagination={false}
              />
              <div className="flex flex-wrap justify-end gap-x-6 gap-y-1 border-t-2 p-2 text-sm font-bold">
                <span>Total</span>
                <span>
                  Revenue
                  {" "}
                  {fmt(totals.revenue)}
                </span>
                <span>
                  Costs
                  {" "}
                  {fmt(totals.costs)}
                </span>
                <span className={totals.profit >= 0 ? "text-success" : "text-destructive"}>
                  Profit
                  {" "}
                  {fmt(totals.profit)}
                </span>
                <span>
                  Margin
                  {" "}
                  {margin.toFixed(1)}
                  %
                </span>
              </div>
            </section>
          )}

          {/* Cost composition */}
          {options.includeCostBreakdown && rows.length > 0 && (
            <section className="page-break-before-auto">
              <h2 className={`text-2xl font-bold mb-4 ${accentText}`}>Cost Composition</h2>
              <DataTable
                className={`border-collapse ${STATEMENT_TABLE} ${accentHead}`}
                columns={costColumns}
                data={rows}
                pagination={false}
              />
            </section>
          )}

          {options.notes && (
            <section>
              <h3 className="text-sm font-semibold mb-2">Notes</h3>
              <p className="text-xs text-muted-foreground italic whitespace-pre-wrap">{options.notes}</p>
            </section>
          )}

          <div className="text-center text-xs text-muted-foreground pt-8 border-t">
            Generated by Fleet Pro ·
            {" "}
            {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      <style>
        {`
        @media print {
          @page { size: A4; margin: 0.5in; }
          body { background: white; }
        }
      `}
      </style>
    </div>
  );
}

function SummaryStat({
  label, value, highlight,
}: {
  label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className="border rounded-lg p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
