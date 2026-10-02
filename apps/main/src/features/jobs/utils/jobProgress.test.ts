import {
  describe, expect, it,
} from "vitest";
import {
  canResendInstruction,
  instructionState,
  nextStep,
  pendingReports,
  sortedTimeline,
  timelineText,
} from "./jobProgress";

describe(
  "nextStep",
  () => {
    it(
      "moves one step at a time and stops at delivered",
      () => {
        expect(nextStep("assigned")).toBe("en-route");
        expect(nextStep("en-route")).toBe("arrived");
        expect(nextStep("arrived")).toBe("loaded");
        expect(nextStep("loaded")).toBe("delivered");
        expect(nextStep("delivered")).toBeUndefined();
        expect(nextStep("created")).toBeUndefined();
        expect(nextStep("cancelled")).toBeUndefined();
        expect(nextStep(undefined)).toBeUndefined();
      },
    );
  },
);

describe(
  "pendingReports",
  () => {
    const requests = [
      {
        id: "late", state: "pending" as const, requested_status: "loaded" as const, requested_at: "2026-03-01T12:00:00Z",
      },
      {
        id: "done", state: "confirmed" as const, requested_status: "en-route" as const, requested_at: "2026-03-01T08:00:00Z",
      },
      {
        id: "now", state: "pending" as const, requested_status: "arrived" as const, requested_at: "2026-03-01T10:00:00Z",
      },
    ];

    it(
      "lists only waiting replies, oldest first",
      () => {
        const reports = pendingReports({
          status: "en-route", driver_status_requests: requests,
        });

        expect(reports.map(r => r.request.id)).toEqual([
          "now",
          "late",
        ]);
      },
    );

    it(
      "marks only the reply for the very next step as actionable",
      () => {
        const reports = pendingReports({
          status: "en-route", driver_status_requests: requests,
        });

        expect(reports.map(r => r.actionable)).toEqual([
          true,
          false,
        ]);
      },
    );

    it(
      "has nothing to show without replies",
      () => {
        expect(pendingReports({ status: "assigned" })).toEqual([]);
      },
    );
  },
);

describe(
  "instructionState",
  () => {
    const entry = (type: string, metadata: Record<string, string> = {}, at = "2026-03-01T10:00:00Z") => ({
      type, metadata, occurred_at: at,
    });

    it(
      "is waiting until the notification service reports",
      () => {
        expect(instructionState({
          assigned_driver_id: "d1", timeline: [entry("job_assigned")],
        })).toEqual({ kind: "waiting" });
      },
    );

    it(
      "reads the latest outcome and its reason",
      () => {
        const timeline = [
          entry(
            "job_assigned",
            {},
            "2026-03-01T10:00:00Z",
          ),
          entry(
            "driver_instruction_not_sent",
            {
              driver_id: "d1", reason: "no WhatsApp number",
            },
            "2026-03-01T10:01:00Z",
          ),
          entry(
            "driver_instruction_sent",
            { driver_id: "d1" },
            "2026-03-01T10:05:00Z",
          ),
        ];

        expect(instructionState({
          assigned_driver_id: "d1", timeline,
        })).toEqual({ kind: "sent" });
        expect(instructionState({
          assigned_driver_id: "d1", timeline: timeline.slice(
            0,
            2,
          ),
        })).toEqual({
          kind: "not_sent", reason: "no WhatsApp number",
        });
      },
    );

    it(
      "ignores an outcome that belongs to an earlier driver",
      () => {
        const timeline = [
          entry(
            "job_assigned",
            { driver_id: "d1" },
          ),
          entry(
            "driver_instruction_sent",
            { driver_id: "d1" },
          ),
          entry(
            "job_reassigned",
            { driver_id: "d2" },
          ),
        ];

        expect(instructionState({
          assigned_driver_id: "d2", timeline,
        })).toEqual({ kind: "waiting" });
      },
    );
  },
);

describe(
  "canResendInstruction",
  () => {
    const failed = [
      {
        type: "driver_instruction_failed", metadata: { driver_id: "d1" }, occurred_at: "2026-03-01T10:00:00Z",
      },
    ];

    it(
      "is allowed only for an assigned job whose message did not go out",
      () => {
        expect(canResendInstruction({
          status: "assigned", assigned_driver_id: "d1", timeline: failed,
        })).toBe(true);
        expect(canResendInstruction({
          status: "assigned", assigned_driver_id: "d1", timeline: [],
        })).toBe(false);
        expect(canResendInstruction({
          status: "en-route", assigned_driver_id: "d1", timeline: failed,
        })).toBe(false);
        expect(canResendInstruction({
          status: "assigned", timeline: failed,
        })).toBe(false);
      },
    );
  },
);

describe(
  "timeline",
  () => {
    it(
      "shows the newest entry first",
      () => {
        const entries = sortedTimeline({
          timeline: [
            {
              id: "a", occurred_at: "2026-03-01T08:00:00Z",
            },
            {
              id: "b", occurred_at: "2026-03-01T09:00:00Z",
            },
          ],
        });

        expect(entries.map(e => e.id)).toEqual([
          "b",
          "a",
        ]);
      },
    );

    it(
      "says plainly what happened to the message and the job",
      () => {
        expect(timelineText({
          type: "driver_instruction_not_sent", metadata: { reason: "no WhatsApp number" },
        })).toBe("Message not sent: no WhatsApp number");
        expect(timelineText({
          type: "job_cancelled", metadata: { reason: "Customer called off" },
        })).toBe("Job cancelled: Customer called off");
        expect(timelineText({
          type: "job_status_updated", metadata: { to_status: "loaded" },
        })).toBe("Status changed to loaded and moving");
        expect(timelineText({
          type: "something_new", summary: "Custom text",
        })).toBe("Custom text");
      },
    );
  },
);
