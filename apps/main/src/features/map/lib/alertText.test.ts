import {
  describe, expect, it,
} from "vitest";
import {
  alertFromFrame, alertHeadline, alertPosition,
} from "./alertText";

describe(
  "alert frames from the socket",
  () => {
    it(
      "reads the flat zone fields fleet sends",
      () => {
        const alert = alertFromFrame({
          alert_type: "geofence_entry",
          severity: "medium",
          vehicle_id: "v1",
          zoneId: "z1",
          zoneName: "Apapa Port",
          at: "2026-02-02T11:00:00Z",
        });
        expect(alert).toMatchObject({
          type: "geofence_entry", vehicleId: "v1", geofenceId: "z1", triggeredAt: "2026-02-02T11:00:00Z",
        });
        expect(alertHeadline(
          alert,
          "LND-123XY",
        )).toBe("LND-123XY entered Apapa Port");
      },
    );

    it(
      "reads details nested the way tracking sends them",
      () => {
        const alert = alertFromFrame({
          alert_id: "a1",
          alert_type: "geofence_exit",
          severity: "high",
          vehicle_id: "v2",
          job_id: "j1",
          details: { geofence_name: "Lagos Depot" },
        });
        expect(alert.id).toBe("a1");
        expect(alertHeadline(
          alert,
          null,
        )).toBe("A vehicle left Lagos Depot");
      },
    );

    it(
      "writes plain sentences for dwell and route alerts",
      () => {
        expect(alertHeadline(
          alertFromFrame({
            alert_type: "geofence_dwell", vehicle_id: "v1", zoneName: "Yard",
          }),
          "T1",
        ))
          .toBe("T1 has stayed in Yard longer than allowed");
        expect(alertHeadline(
          alertFromFrame({
            alert_type: "route_deviation", vehicle_id: "v1",
          }),
          "T1",
        )).toBe("T1 is off its route");
      },
    );

    it(
      "never shows a raw type code for an unknown alert",
      () => {
        expect(alertHeadline(
          alertFromFrame({ alert_type: "low_fuel" }),
          null,
        )).toBe("Low fuel");
      },
    );
  },
);

describe(
  "alertPosition",
  () => {
    it(
      "prefers the list's latitude/longitude, then the frame's details",
      () => {
        expect(alertPosition({
          id: "a", type: "x", severity: "low", latitude: 6.5, longitude: 3.4,
        })).toEqual([
          6.5,
          3.4,
        ]);
        expect(alertPosition(alertFromFrame({
          alert_type: "geofence_entry", details: {
            lat: 6.1, lng: 3.2,
          },
        }))).toEqual([
          6.1,
          3.2,
        ]);
      },
    );

    it(
      "is null without both halves",
      () => {
        expect(alertPosition({
          id: "a", type: "x", severity: "low", details: { lat: 6.5 },
        })).toBeNull();
      },
    );
  },
);
