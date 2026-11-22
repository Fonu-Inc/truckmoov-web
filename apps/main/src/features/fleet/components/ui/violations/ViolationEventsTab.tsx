import type { DriverBehaviorEvent } from "@truckmoov/api/fleet";
import type { ViolationVehicle } from "@/features/fleet/components/ui/violations/VehicleViolationsTab";
import type { SeverityFilter } from "@/features/fleet/components/ui/violations/ViolationsSeverityFilter";
import {
  Download, Eye, MapPin, Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ViolationsSeverityFilter } from "@/features/fleet/components/ui/violations/ViolationsSeverityFilter";
import { ViolationsTableState } from "@/features/fleet/components/ui/violations/ViolationsTableState";
import {
  capitalize, CARD_CLASS, downloadViolationsCsv, EXPORT_BUTTON_CLASS, formatViolationDate, GHOST_ROW_BUTTON_CLASS, INPUT_CLASS, NO_ENDPOINT, PILL_SHADOW_CLASS, SEARCH_ICON_CLASS, SEVERITY_CLASS, TABLE_CLASS, TBODY_CLASS, TD_CLASS, TH_CLASS, TH_RIGHT_CLASS, THEAD_CLASS, TR_CLASS, violationTypeLabel,
} from "@/features/fleet/components/ui/violations/violationsUi";

const recorded = (e: DriverBehaviorEvent) => (e.speedKph != null ? `${Math.round(e.speedKph)} km/h` : "—");
function location(e: DriverBehaviorEvent) {
  return e.latitude != null && e.longitude != null
    ? `${e.latitude.toFixed(4)}, ${e.longitude.toFixed(4)}`
    : "—";
}

/**
 * Violation Events sub-tab — one row per behaviour event. Pass `vehicle` to
 * add the driver page's Vehicle column (name + plate) after Driver, and
 * `typeLabel` to override the violation-type wording.
 */
export function ViolationEventsTab({
  events,
  driverName,
  vehiclePlate,
  vehicle,
  typeLabel = violationTypeLabel,
  search,
  onSearchChange,
  isLoading,
  isError,
  onRetry,
}: {
  events: DriverBehaviorEvent[];
  driverName: (id: string) => string;
  vehiclePlate: (id: string | null) => string;
  vehicle?: (id: string) => ViolationVehicle;
  typeLabel?: (type: string) => string;
  search: string;
  onSearchChange: (v: string) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const [
    severity,
    setSeverity,
  ] = useState<SeverityFilter>("all");

  const q = search.trim().toLowerCase();
  const filtered = events.filter(e => (severity === "all" || e.severity === severity)
    && (!q || [
      driverName(e.driverId),
      vehiclePlate(e.vehicleId),
      e.id,
    ].some(f => f.toLowerCase().includes(q))));

  const handleExport = () => downloadViolationsCsv(
    "violation_events",
    [
      "Event ID",
      "Driver",
      "Vehicle",
      "Violation Type",
      "Trigger",
      "Recorded",
      "Threshold",
      "Severity",
      "Location",
      "Date & Time",
    ],
    filtered.map(e => [
      e.id,
      driverName(e.driverId),
      vehiclePlate(e.vehicleId),
      typeLabel(e.type),
      NO_ENDPOINT,
      recorded(e),
      NO_ENDPOINT,
      capitalize(e.severity),
      location(e),
      formatViolationDate(e.occurredAt),
    ]),
  );

  return (
    <div className={CARD_CLASS}>
      <div className="flex flex-col p-6 pb-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display">Violation Events</h3>
            <p className="text-sm text-muted-foreground">Individual incidents that met an active violation rule.</p>
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
              placeholder="Search by driver, vehicle or event ID..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
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
                <th className={TH_CLASS}>Driver</th>
                {vehicle && <th className={TH_CLASS}>Vehicle</th>}
                <th className={TH_CLASS}>Violation Type</th>
                <th className={TH_CLASS}>Trigger</th>
                <th className={TH_CLASS}>Recorded</th>
                <th className={TH_CLASS}>Threshold</th>
                <th className={TH_CLASS}>Severity</th>
                <th className={TH_CLASS}>Location</th>
                <th className={TH_CLASS}>Date & Time</th>
                <th className={TH_RIGHT_CLASS}>Action</th>
              </tr>
            </thead>
            <tbody className={TBODY_CLASS}>
              <ViolationsTableState
                colSpan={vehicle ? 10 : 9}
                isLoading={isLoading}
                isError={isError}
                onRetry={onRetry}
                isEmpty={filtered.length === 0}
                emptyText={q || severity !== "all" ? "No events match your filters." : "No violation events recorded."}
              />
              {!isLoading && !isError && filtered.map(e => (
                <tr
                  key={e.id}
                  className={TR_CLASS}
                >
                  <td className={`${TD_CLASS} font-medium whitespace-nowrap`}>{driverName(e.driverId)}</td>
                  {vehicle && (
                    <td className={TD_CLASS}>
                      {e.vehicleId
                        ? (
                            <div className="min-w-0">
                              <p className="font-medium truncate">{vehicle(e.vehicleId).name}</p>
                              <p className="text-xs text-muted-foreground truncate">{vehicle(e.vehicleId).plate}</p>
                            </div>
                          )
                        : "—"}
                    </td>
                  )}
                  <td className={TD_CLASS}>{typeLabel(e.type)}</td>
                  {/* Trigger and Threshold come from the violated rule — no rules endpoint yet. */}
                  <td className={`${TD_CLASS} text-sm`}>{NO_ENDPOINT}</td>
                  <td className={TD_CLASS}>{recorded(e)}</td>
                  <td className={TD_CLASS}>{NO_ENDPOINT}</td>
                  <td className={TD_CLASS}>
                    <div className={`${PILL_SHADOW_CLASS} ${SEVERITY_CLASS[e.severity]}`}>{capitalize(e.severity)}</div>
                  </td>
                  <td className={`${TD_CLASS} whitespace-nowrap`}>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-destructive" />
                      {location(e)}
                    </span>
                  </td>
                  <td className={`${TD_CLASS} whitespace-nowrap`}>{formatViolationDate(e.occurredAt)}</td>
                  <td className={`${TD_CLASS} text-right`}>
                    <button
                      type="button"
                      className={GHOST_ROW_BUTTON_CLASS}
                      onClick={() => toast.info("Event details aren't available yet.")}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Event
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
