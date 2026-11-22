import type {
  FleetViolation, ViolationSubject,
} from "@truckmoov/api/fleet";
import type { SeverityFilter } from "@/features/fleet/components/ui/violations/ViolationsSeverityFilter";
import {
  Download, Eye, Search,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { ViolationQuotaCell } from "@/features/fleet/components/ui/violations/ViolationQuotaCell";
import { ViolationsSeverityFilter } from "@/features/fleet/components/ui/violations/ViolationsSeverityFilter";
import { ViolationsTableState } from "@/features/fleet/components/ui/violations/ViolationsTableState";
import {
  CARD_CLASS, downloadViolationsCsv, EXPORT_BUTTON_CLASS, formatViolationDate, GHOST_ROW_BUTTON_CLASS, INPUT_CLASS, PILL_SHADOW_CLASS, quotaText, SEARCH_ICON_CLASS, SEVERITY_CLASS, TABLE_CLASS, TBODY_CLASS, TD_CLASS, TH_CLASS, TH_RIGHT_CLASS, THEAD_CLASS, TR_CLASS, violationTypeLabel,
} from "@/features/fleet/components/ui/violations/violationsUi";

export type ViolationVehicle = {
  name: string; plate: string;
};

/** Vehicle Violations sub-tab — one row per vehicle from the violations summary. */
export function VehicleViolationsTab({
  subjects,
  items,
  vehicle,
  isLoading,
  isError,
  onRetry,
  onViewDetails,
}: {
  subjects: ViolationSubject[];
  items: FleetViolation[];
  vehicle: (id: string) => ViolationVehicle;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onViewDetails: (plate: string) => void;
}) {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    severity,
    setSeverity,
  ] = useState<SeverityFilter>("all");

  const rows = useMemo(
    () => {
      const withSeverity = severity === "all"
        ? null
        : new Set(items.filter(i => i.severity === severity).map(i => i.vehicleId));
      return subjects
        .filter(s => !withSeverity || withSeverity.has(s.subjectId))
        .map(s => ({
          ...s,
          ...vehicle(s.subjectId),
          mostFrequent: violationTypeLabel(s.mostFrequent),
        }));
    },
    [
      subjects,
      items,
      severity,
      vehicle,
    ],
  );

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter(r => r.name.toLowerCase().includes(q) || r.plate.toLowerCase().includes(q))
    : rows;

  const handleExport = () => downloadViolationsCsv(
    "vehicle_violations",
    [
      "Vehicle",
      "Plate",
      "Total Violations",
      "Critical",
      "Most Frequent",
      "Quota",
      "Last Violation",
    ],
    filtered.map(r => [
      r.name,
      r.plate,
      r.total,
      r.critical,
      r.mostFrequent,
      quotaText(r.quota),
      r.lastAt ? formatViolationDate(r.lastAt) : "—",
    ]),
  );

  return (
    <div className={CARD_CLASS}>
      <div className="flex flex-col p-6 pb-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display">Vehicle Violations</h3>
            <p className="text-sm text-muted-foreground">One row per vehicle — recorded violations, scores and quotas.</p>
          </div>
          <button
            type="button"
            className={EXPORT_BUTTON_CLASS}
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className={SEARCH_ICON_CLASS} />
            <input
              className={INPUT_CLASS}
              placeholder="Search vehicles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <ViolationsSeverityFilter
            value={severity}
            onChange={setSeverity}
          />
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="relative w-full overflow-auto">
          <table className={TABLE_CLASS}>
            <thead className={THEAD_CLASS}>
              <tr className={TR_CLASS}>
                <th className={TH_CLASS}>Vehicle</th>
                <th className={TH_CLASS}>Total Violations</th>
                <th className={TH_CLASS}>Critical</th>
                <th className={TH_CLASS}>Most Frequent</th>
                <th className={TH_CLASS}>Quota</th>
                <th className={TH_CLASS}>Last Violation</th>
                <th className={TH_RIGHT_CLASS}>Action</th>
              </tr>
            </thead>
            <tbody className={TBODY_CLASS}>
              <ViolationsTableState
                colSpan={7}
                isLoading={isLoading}
                isError={isError}
                onRetry={onRetry}
                isEmpty={filtered.length === 0}
                emptyText={q || severity !== "all" ? "No vehicles match your filters." : "No vehicle violations recorded."}
              />
              {!isLoading && !isError && filtered.map(r => (
                <tr
                  key={r.subjectId}
                  className={TR_CLASS}
                >
                  <td className={`${TD_CLASS} whitespace-nowrap`}>
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.plate}</p>
                    </div>
                  </td>
                  <td className={TD_CLASS}>{r.total}</td>
                  <td className={TD_CLASS}>
                    {r.critical > 0
                      ? <div className={`${PILL_SHADOW_CLASS} ${SEVERITY_CLASS.critical}`}>{r.critical}</div>
                      : r.critical}
                  </td>
                  <td className={TD_CLASS}>{r.mostFrequent}</td>
                  <td className={TD_CLASS}>
                    <ViolationQuotaCell quota={r.quota} />
                  </td>
                  <td className={`${TD_CLASS} whitespace-nowrap`}>{r.lastAt ? formatViolationDate(r.lastAt) : "—"}</td>
                  <td className={`${TD_CLASS} text-right`}>
                    <button
                      type="button"
                      className={GHOST_ROW_BUTTON_CLASS}
                      onClick={() => onViewDetails(r.plate)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
