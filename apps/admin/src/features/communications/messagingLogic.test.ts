import type { MessagingConversation, MessagingMessage } from "@truckmoov/api/notification";
import { describe, expect, it } from "vitest";
import {
  applyStatusEvent,
  errorText,
  groupByDay,
  mergeConversation,
  pickStatus,
  tickState,
  upsertMessages,
  visibleThread,
} from "./messagingLogic";

const msg = (over: Partial<MessagingMessage>): MessagingMessage => ({
  id: "m1",
  client_message_id: null,
  direction: "outbound",
  status: "queued",
  text: "hi",
  message_type: "text",
  created_at: "2026-10-01T10:00:00.000Z",
  ...over,
});

const conv = (over: Partial<MessagingConversation>): MessagingConversation => ({
  id: "c1",
  driver_name: null,
  driver_phone: "+234",
  last_message_preview: "",
  last_message_at: "2026-10-01T10:00:00.000Z",
  last_message_direction: "inbound",
  unread_count: 0,
  is_locked: false,
  window_remaining_hours: 5,
  ...over,
});

describe("tickState", () => {
  it("maps outbound statuses", () => {
    expect(tickState({ direction: "outbound", status: "queued" })).toBe("clock");
    expect(tickState({ direction: "outbound", status: "sent" })).toBe("one");
    expect(tickState({ direction: "outbound", status: "delivered" })).toBe("two");
    expect(tickState({ direction: "outbound", status: "read" })).toBe("two-blue");
    expect(tickState({ direction: "outbound", status: "failed" })).toBe("failed");
    expect(tickState({ direction: "inbound", status: "received" })).toBe("none");
  });
});

describe("pickStatus", () => {
  it("ignores stale statuses", () => {
    expect(pickStatus("delivered", "sent")).toBe("delivered");
    expect(pickStatus("sent", "delivered")).toBe("delivered");
    expect(pickStatus("queued", "failed")).toBe("failed");
    expect(pickStatus("delivered", "failed")).toBe("delivered");
  });
});

describe("upsertMessages", () => {
  it("reconciles optimistic message by client id", () => {
    const optimistic = msg({ id: "local:a", client_message_id: "a" });
    const server = msg({ id: "srv1", client_message_id: "a", status: "sent" });
    const out = upsertMessages([optimistic], [server]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("srv1");
    expect(out[0].status).toBe("sent");
  });

  it("dedupes by id and keeps order", () => {
    const a = msg({ id: "1", created_at: "2026-10-01T10:00:00.000Z" });
    const b = msg({ id: "2", created_at: "2026-10-01T09:00:00.000Z" });
    expect(upsertMessages([a], [b, a]).map(m => m.id)).toEqual(["2", "1"]);
  });
});

describe("applyStatusEvent", () => {
  it("updates by client id and records failure", () => {
    const out = applyStatusEvent(
      [msg({ id: "s", client_message_id: "a" })],
      {
        conversation_id: "c1",
        message_id: "s",
        client_message_id: "a",
        status: "failed",
        error: { code: "window_locked", message: "x" },
      },
    );
    expect(out[0].status).toBe("failed");
    expect(out[0].error?.code).toBe("window_locked");
  });

  it("returns same list when nothing matches", () => {
    const list = [msg({})];
    expect(applyStatusEvent(list, { conversation_id: "c", message_id: "zz", status: "sent" })).toBe(list);
  });
});

describe("visibleThread", () => {
  it("hides pending once server has it", () => {
    const pending = [msg({ id: "local:a", client_message_id: "a" })];
    const server = [msg({ id: "srv", client_message_id: "a" })];
    expect(visibleThread(server, pending)).toHaveLength(1);
    expect(visibleThread([], pending)).toHaveLength(1);
  });
});

describe("mergeConversation", () => {
  it("drops stale pushes", () => {
    const current = conv({ last_message_at: "2026-10-01T11:00:00.000Z" });
    const stale = conv({ last_message_at: "2026-10-01T10:00:00.000Z", unread_count: 3 });
    expect(mergeConversation(current, stale)).toBe(current);
  });
});

describe("errorText", () => {
  it("maps known codes with a safe default", () => {
    expect(errorText("window_locked")).toBe("The 24-hour window has closed.");
    expect(errorText("forbidden")).toBe("You do not have permission to reply.");
    expect(errorText("weird")).toBe("Could not send. Try again.");
  });
});

describe("groupByDay", () => {
  it("splits messages on day change", () => {
    const now = new Date("2026-10-01T12:00:00");
    const groups = groupByDay(
      [
        msg({ id: "1", created_at: "2026-09-30T10:00:00" }),
        msg({ id: "2", created_at: "2026-10-01T10:00:00" }),
        msg({ id: "3", created_at: "2026-10-01T11:00:00" }),
      ],
      now,
    );
    expect(groups.map(g => g.label)).toEqual(["Yesterday", "Today"]);
    expect(groups[1].messages).toHaveLength(2);
  });
});
