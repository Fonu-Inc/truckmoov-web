import type { FleetViolation } from "@truckmoov/api/fleet";
import type { ViolationVehicle } from "@/features/fleet/components/ui/violations/VehicleViolationsTab";
import type { SeverityFilter } from "@/features/fleet/components/ui/violations/ViolationsSeverityFilter";
import {
  Download, Eye, MapPin, Search,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { ViolationsSeverityFilter } from "@/features/fleet/components/ui/violations/ViolationsSeverityFilter";
import { ViolationsTableState } from "@/features/fleet/components/ui/violations/ViolationsTableState";
import {
  capitalize, CARD_CLASS, downloadViolationsCsv, EXPORT_BUTTON_CLASS, formatViolationDate, GHOST_ROW_BUTTON_CLASS, INPUT_CLASS, PILL_SHADOW_CLASS, SEARCH_ICON_CLASS, SEVERITY_CLASS, TABLE_CLASS, TBODY_CLASS, TD_CLASS, TH_CLASS, TH_RIGHT_CLASS, THEAD_CLASS, TR_CLASS, violationTypeLabel,
} from "@/features/fleet/components/ui/violations/violationsUi";

function location(e: FleetViolation) {
  return e.latitude != null && e.longitude != null
    ? `${e.latitude.toFixed(4)}, ${e.longitude.toFixed(4)}`
    : "—";
}

/**
 * Violation Events sub-tab — one row per violation. Pass `vehicle` to
 * add the driver page's Vehicle column (name + plate) after Driver, and
 * `typeLabel` to override the violation-type wording.
 */
export function ViolationEventsTab({
  items,
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
  items: FleetViolation[];
  driverName: (id: string | null) => string;
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
    selected,
    setSelected,
  ] = useState<FleetViolation | null>(null);
  const [
    severity,
    setSeverity,
  ] = useState<SeverityFilter>("all");

  const q = search.trim().toLowerCase();
  const filtered = items.filter(e => (severity === "all" || e.severity === severity)
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
      e.ruleName,
      e.recordedValue,
      e.threshold,
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
                  <td className={`${TD_CLASS} text-sm`}>{e.ruleName}</td>
                  <td className={TD_CLASS}>{e.recordedValue}</td>
                  <td className={TD_CLASS}>{e.threshold}</td>
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
                      onClick={() => setSelected(e)}
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
      <Dialog
        open={!!selected}
        onOpenChange={open => !open && setSelected(null)}
      >
        <DialogContent className="sm:max-w-[760px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Violation Event Details</DialogTitle>
            <DialogDescription>Incident details and the location at the time of the violation.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{typeLabel(selected.type)}</h3>
                <div className={`${PILL_SHADOW_CLASS} ${SEVERITY_CLASS[selected.severity]}`}>{capitalize(selected.severity)}</div>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                {[
                  [
                    "Vehicle",
                    selected.vehicleId && vehicle
                      ? [
                          vehicle(selected.vehicleId).name,
                          vehicle(selected.vehicleId).plate,
                        ].filter(v => v !== "—").join(" · ")
                      : vehiclePlate(selected.vehicleId),
                  ],
                  [
                    "Driver at time of incident",
                    driverName(selected.driverId),
                  ],
                  [
                    "Date & Time",
                    formatViolationDate(selected.occurredAt),
                  ],
                  [
                    "Triggered Rule",
                    selected.ruleName,
                  ],
                  [
                    "Recorded Value",
                    selected.recordedValue,
                  ],
                  [
                    "Rule Threshold",
                    selected.threshold,
                  ],
                  [
                    "Location",
                    location(selected),
                  ],
                ].map(([
                  label,
                  value,
                ]) => (
                  <div
                    key={label}
                    className="min-w-0"
                  >
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="font-medium break-words mt-1">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
