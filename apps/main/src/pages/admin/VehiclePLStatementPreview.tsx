import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import { Printer } from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { Button } from "@/components/shadcn/button";

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
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className={`${accentBg} text-white`}>
                    <th className="text-left p-2">Vehicle</th>
                    <th className="text-right p-2">Revenue</th>
                    <th className="text-right p-2">Costs</th>
                    <th className="text-right p-2">Profit</th>
                    <th className="text-right p-2">Margin</th>
                    <th className="text-left p-2">Tier</th>
                    <th className="text-right p-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={r.vehicle_id}
                      className={i % 2 === 0 ? "bg-muted/30" : ""}
                    >
                      <td className="p-2 font-medium">{r.vehicle_name}</td>
                      <td className="text-right p-2 text-success">{fmt(r.revenue)}</td>
                      <td className="text-right p-2 text-destructive">{fmt(r.costs)}</td>
                      <td className={`text-right p-2 font-semibold ${r.net_profit >= 0 ? "text-success" : "text-destructive"}`}>
                        {fmt(r.net_profit)}
                      </td>
                      <td className="text-right p-2">
                        {r.margin.toFixed(1)}
                        %
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${TIER_COLOR[r.tier] || ""}`}>
                          {TIER_LABEL[r.tier] || r.tier}
                        </span>
                      </td>
                      <td className="text-right p-2">{r.score}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td className="p-2">Total</td>
                    <td className="text-right p-2">{fmt(totals.revenue)}</td>
                    <td className="text-right p-2">{fmt(totals.costs)}</td>
                    <td className={`text-right p-2 ${totals.profit >= 0 ? "text-success" : "text-destructive"}`}>
                      {fmt(totals.profit)}
                    </td>
                    <td className="text-right p-2">
                      {margin.toFixed(1)}
                      %
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </section>
          )}

          {/* Cost composition */}
          {options.includePerVehicle && rows.length > 0 && (
            <section className="page-break-before-auto">
              <h2 className={`text-2xl font-bold mb-4 ${accentText}`}>Cost Composition</h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className={`${accentBg} text-white`}>
                    <th className="text-left p-2">Vehicle</th>
                    <th className="text-right p-2">Fuel</th>
                    <th className="text-right p-2">Maintenance</th>
                    <th className="text-right p-2">Wages</th>
                    <th className="text-right p-2">Insurance</th>
                    <th className="text-right p-2">Depreciation</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={r.vehicle_id}
                      className={i % 2 === 0 ? "bg-muted/30" : ""}
                    >
                      <td className="p-2 font-medium">{r.vehicle_name}</td>
                      <td className="text-right p-2">{fmt(r.fuel)}</td>
                      <td className="text-right p-2">{fmt(r.maintenance)}</td>
                      <td className="text-right p-2">{fmt(r.wages)}</td>
                      <td className="text-right p-2">{fmt(r.insurance)}</td>
                      <td className="text-right p-2">{fmt(r.depreciation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
