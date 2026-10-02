import type { MessagingConversation, MessagingMessage } from "@truckmoov/api/notification";
import { describe, expect, it } from "vitest";
import {
  applyStatusEvent,
  errorText,
  groupByDay,
  matchesFilters,
  mergeConversation,
  removeMessage,
  timeOf,
  windowSecondsLeft,
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
  status: "open",
  priority: "normal",
  assignee_user_id: null,
  tags: [],
  first_seen_at: "2026-10-01T09:00:00.000Z",
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
    expect(errorText("window_locked")).toContain("24-hour window");
    expect(errorText("invalid_number")).toBe("This number is not on WhatsApp.");
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

describe("timestamp order", () => {
  it("orders a whole-second time before a fractional one in the same second", () => {
    expect(timeOf("2026-10-01T10:00:05Z")).toBeLessThan(timeOf("2026-10-01T10:00:05.123Z"));
    const whole = msg({ id: "in", created_at: "2026-10-01T10:00:05Z" });
    const fraction = msg({ id: "out", created_at: "2026-10-01T10:00:05.123Z" });
    expect(upsertMessages([fraction], [whole]).map(m => m.id)).toEqual(["in", "out"]);
  });

  it("keeps the newer conversation push when seconds differ in precision", () => {
    const current = conv({ last_message_at: "2026-10-01T10:00:05Z" });
    const newer = conv({ last_message_at: "2026-10-01T10:00:05.5Z", unread_count: 2 });
    expect(mergeConversation(current, newer)).toBe(newer);
  });

  it("treats an unreadable time as the oldest", () => {
    expect(timeOf("nope")).toBe(0);
  });
});

describe("tickState for scheduled", () => {
  it("shows a clock until it is sent", () => {
    expect(tickState({ direction: "outbound", status: "scheduled" })).toBe("clock");
  });
});

describe("matchesFilters", () => {
  const base = { state: "all" as const, status: "", assignee: "", tag: "" };

  it("applies status, tag and unread together", () => {
    const c = conv({ status: "pending", tags: ["billing"], unread_count: 1 });
    expect(matchesFilters({ ...base, status: "pending", tag: "billing", state: "unread" }, c, null)).toBe(true);
    expect(matchesFilters({ ...base, status: "resolved" }, c, null)).toBe(false);
    expect(matchesFilters({ ...base, tag: "other" }, c, null)).toBe(false);
    expect(matchesFilters({ ...base, state: "unread" }, conv({ unread_count: 0 }), null)).toBe(false);
  });

  it("resolves me and unassigned", () => {
    const mine = conv({ assignee_user_id: "u1" });
    expect(matchesFilters({ ...base, assignee: "me" }, mine, "u1")).toBe(true);
    expect(matchesFilters({ ...base, assignee: "me" }, mine, "u2")).toBe(false);
    expect(matchesFilters({ ...base, assignee: "unassigned" }, mine, "u1")).toBe(false);
    expect(matchesFilters({ ...base, assignee: "unassigned" }, conv({}), "u1")).toBe(true);
    expect(matchesFilters({ ...base, assignee: "u1" }, mine, null)).toBe(true);
  });
});

describe("removeMessage", () => {
  it("drops a message and keeps the list when nothing matches", () => {
    const list = [msg({ id: "a" }), msg({ id: "b" })];
    expect(removeMessage(list, "a").map(m => m.id)).toEqual(["b"]);
    expect(removeMessage(list, "zz")).toBe(list);
  });
});

describe("windowSecondsLeft", () => {
  it("counts down from the hours the server reported", () => {
    const open = { is_locked: false, window_remaining_hours: 1 };
    expect(windowSecondsLeft(open, 0, 0)).toBe(3600);
    expect(windowSecondsLeft(open, 0, 1_800_000)).toBe(1800);
    expect(windowSecondsLeft(open, 0, 7_200_000)).toBe(0);
    expect(windowSecondsLeft({ is_locked: true, window_remaining_hours: null }, 0, 0)).toBe(0);
  });
});
