import type { DriverBehaviorEvent } from "@truckmoov/api/fleet";
import type { SeverityFilter } from "@/features/fleet/components/ui/violations/ViolationsSeverityFilter";
import {
  Download, Eye, Search,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { ViolationsSeverityFilter } from "@/features/fleet/components/ui/violations/ViolationsSeverityFilter";
import { ViolationsTableState } from "@/features/fleet/components/ui/violations/ViolationsTableState";
import {
  CARD_CLASS, downloadViolationsCsv, EXPORT_BUTTON_CLASS, formatViolationDate, GHOST_ROW_BUTTON_CLASS, INPUT_CLASS, NO_ENDPOINT, PILL_SHADOW_CLASS, SEARCH_ICON_CLASS, SEVERITY_CLASS, TABLE_CLASS, TBODY_CLASS, TD_CLASS, TH_CLASS, TH_RIGHT_CLASS, THEAD_CLASS, TR_CLASS, violationTypeLabel,
} from "@/features/fleet/components/ui/violations/violationsUi";

export type ViolationVehicle = {
  name: string; plate: string;
};

type VehicleRow = {
  vehicleId: string;
  name: string;
  plate: string;
  total: number;
  critical: number;
  mostFrequent: string;
  lastAt: string;
};

/**
 * Vehicle Violations sub-tab — one row per vehicle, grouped from the
 * behaviour events (there is no per-vehicle violations endpoint).
 */
export function VehicleViolationsTab({
  events,
  vehicle,
  isLoading,
  isError,
  onRetry,
  onViewDetails,
}: {
  events: DriverBehaviorEvent[];
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

  const rows = useMemo<VehicleRow[]>(
    () => {
      const byVehicle = new Map<string, DriverBehaviorEvent[]>();
      for (const e of events) {
        if (!e.vehicleId || (severity !== "all" && e.severity !== severity))
          continue;
        byVehicle.set(
          e.vehicleId,
          [
            ...(byVehicle.get(e.vehicleId) ?? []),
            e,
          ],
        );
      }
      return [...byVehicle].map(([
        vehicleId,
        list,
      ]) => {
        const typeCounts = new Map<string, number>();
        for (const e of list) {
          const label = violationTypeLabel(e.type);
          typeCounts.set(
            label,
            (typeCounts.get(label) ?? 0) + 1,
          );
        }
        const mostFrequent = [...typeCounts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
        const lastAt = list.reduce(
          (max, e) => (e.occurredAt > max ? e.occurredAt : max),
          "",
        );
        return {
          vehicleId,
          ...vehicle(vehicleId),
          total: list.length,
          critical: list.filter(e => e.severity === "critical").length,
          mostFrequent,
          lastAt,
        };
      }).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    },
    [
      events,
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
      NO_ENDPOINT,
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
                  key={r.vehicleId}
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
                    {/* Quota needs a violation-rules endpoint. */}
                    <div className="w-28 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{NO_ENDPOINT}</span>
                      </div>
                      <div className="relative w-full overflow-hidden rounded-full bg-secondary h-1.5">
                        <div
                          className="h-full w-full flex-1 transition-all duration-300 bg-primary"
                          style={{ transform: "translateX(-100%)" }}
                        />
                      </div>
                    </div>
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
