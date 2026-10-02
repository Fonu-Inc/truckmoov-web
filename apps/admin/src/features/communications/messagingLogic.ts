import type {
  MessageStatusEvent,
  MessagingConversation,
  MessagingMessage,
  MessagingMessageStatus,
} from "@truckmoov/api/notification";

const STATUS_RANK: Record<MessagingMessageStatus, number> = {
  received: 0,
  scheduled: 0,
  queued: 1,
  sent: 2,
  delivered: 3,
  read: 4,
  failed: 5,
};

/** Go trims trailing zeros, so "05Z" and "05.123Z" only order right as numbers. */
export function timeOf(iso: string): number {
  const value = Date.parse(iso);
  return Number.isNaN(value) ? 0 : value;
}

export type TickState = "clock" | "one" | "two" | "two-blue" | "failed" | "none";

export function tickState(message: Pick<MessagingMessage, "direction" | "status">): TickState {
  if (message.direction === "inbound")
    return "none";
  switch (message.status) {
    case "scheduled":
    case "queued": return "clock";
    case "sent": return "one";
    case "delivered": return "two";
    case "read": return "two-blue";
    case "failed": return "failed";
    default: return "none";
  }
}

export function pickStatus(
  current: MessagingMessageStatus,
  incoming: MessagingMessageStatus,
): MessagingMessageStatus {
  if (current === "read" || current === "delivered")
    return STATUS_RANK[incoming] > STATUS_RANK[current] && incoming !== "failed" ? incoming : current;
  return STATUS_RANK[incoming] >= STATUS_RANK[current] ? incoming : current;
}

const ERROR_TEXT: Record<string, string> = {
  window_locked: "The 24-hour window has closed. Send a template to reopen it.",
  invalid_number: "This number is not on WhatsApp.",
  undeliverable: "WhatsApp could not deliver this message.",
  rate_limited: "Slow down, try again in a moment.",
  forbidden: "You do not have permission to reply.",
  unavailable: "Could not send. Try again.",
  send_failed: "Could not send. Try again.",
};

export function errorText(code: string | undefined): string {
  return (code && ERROR_TEXT[code]) || "Could not send. Try again.";
}

function sameMessage(a: MessagingMessage, b: MessagingMessage) {
  if (a.id === b.id)
    return true;
  return Boolean(a.client_message_id) && a.client_message_id === b.client_message_id;
}

function mergeMessage(existing: MessagingMessage, incoming: MessagingMessage): MessagingMessage {
  const status = pickStatus(existing.status, incoming.status);
  return {
    ...existing,
    ...incoming,
    status,
    error: status === "failed" ? incoming.error ?? existing.error : undefined,
  };
}

function byCreatedAt(a: MessagingMessage, b: MessagingMessage) {
  return timeOf(a.created_at) - timeOf(b.created_at);
}

export function upsertMessages(
  list: MessagingMessage[],
  incoming: MessagingMessage[],
): MessagingMessage[] {
  const next = [...list];
  for (const message of incoming) {
    const index = next.findIndex(m => sameMessage(m, message));
    if (index === -1)
      next.push(message);
    else
      next[index] = mergeMessage(next[index], message);
  }
  return next.sort(byCreatedAt);
}

export function applyStatusEvent(
  list: MessagingMessage[],
  event: MessageStatusEvent,
): MessagingMessage[] {
  let changed = false;
  const next = list.map((m) => {
    const matches = m.id === event.message_id
      || (Boolean(event.client_message_id) && m.client_message_id === event.client_message_id);
    if (!matches)
      return m;
    changed = true;
    const status = pickStatus(m.status, event.status);
    return {
      ...m,
      status,
      error: status === "failed" ? event.error ?? m.error : undefined,
    };
  });
  return changed ? next : list;
}

export function visibleThread(
  server: MessagingMessage[],
  pending: MessagingMessage[],
): MessagingMessage[] {
  const open = pending.filter(p => !server.some(s => sameMessage(s, p)));
  return [...server, ...open].sort(byCreatedAt);
}

export function mergeConversation(
  existing: MessagingConversation,
  incoming: MessagingConversation,
): MessagingConversation {
  return timeOf(incoming.last_message_at) >= timeOf(existing.last_message_at) ? incoming : existing;
}

function byLastMessage(a: MessagingConversation, b: MessagingConversation) {
  return timeOf(b.last_message_at) - timeOf(a.last_message_at);
}

export function updateConversations(
  list: MessagingConversation[],
  incoming: MessagingConversation,
  options: { insert: boolean },
): MessagingConversation[] {
  const index = list.findIndex(c => c.id === incoming.id);
  if (index === -1)
    return options.insert ? [incoming, ...list].sort(byLastMessage) : list;
  const next = [...list];
  next[index] = mergeConversation(list[index], incoming);
  return next.sort(byLastMessage);
}

export function mergeConversationPage(
  existing: MessagingConversation[],
  fresh: MessagingConversation[],
): MessagingConversation[] {
  let next = existing;
  for (const conversation of fresh)
    next = updateConversations(next, conversation, { insert: true });
  return next;
}

export function conversationTitle(c: Pick<MessagingConversation, "driver_name" | "driver_phone">) {
  return c.driver_name || c.driver_phone || "Unknown";
}

export type DayGroup = { key: string; label: string; messages: MessagingMessage[] };

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function dayLabel(iso: string, now: Date = new Date()): string {
  const day = new Date(iso);
  const diffDays = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      - new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime())
    / 86_400_000,
  );
  if (diffDays === 0)
    return "Today";
  if (diffDays === 1)
    return "Yesterday";
  return day.toLocaleDateString(undefined, {
    day: "numeric", month: "long", year: day.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export function groupByDay(messages: MessagingMessage[], now: Date = new Date()): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const message of messages) {
    const key = dayKey(message.created_at);
    const last = groups[groups.length - 1];
    if (last?.key === key)
      last.messages.push(message);
    else
      groups.push({ key, label: dayLabel(message.created_at, now), messages: [message] });
  }
  return groups;
}

export function windowText(c: Pick<MessagingConversation, "is_locked" | "window_remaining_hours">) {
  if (c.is_locked)
    return "Reply window closed";
  if (c.window_remaining_hours === null)
    return "";
  const hours = Math.max(1, Math.ceil(c.window_remaining_hours));
  return `${hours}h left to reply`;
}

export function removeMessage(list: MessagingMessage[], messageId: string): MessagingMessage[] {
  const next = list.filter(m => m.id !== messageId);
  return next.length === list.length ? list : next;
}

export function isLocalMessage(message: Pick<MessagingMessage, "id">) {
  return message.id.startsWith("local:");
}

export function messagePreview(message: Pick<MessagingMessage, "message_type" | "text" | "media" | "template_name">) {
  if (message.text)
    return message.text;
  if (message.media)
    return message.media.filename || message.media.type;
  return message.template_name || message.message_type;
}

/** Seconds left in the 24-hour window at `now`, from the hours the server last reported. */
export function windowSecondsLeft(
  conversation: Pick<MessagingConversation, "is_locked" | "window_remaining_hours">,
  reportedAt: number,
  now: number,
): number {
  if (conversation.is_locked || conversation.window_remaining_hours === null)
    return 0;
  const left = conversation.window_remaining_hours * 3600 - (now - reportedAt) / 1000;
  return Math.max(0, Math.floor(left));
}

export type ListFilters = {
  state: "all" | "unread";
  status: string;
  assignee: string;
  tag: string;
};

/** Whether a conversation belongs in a filtered list. The text search is the server's to judge. */
export function matchesFilters(filters: ListFilters, c: MessagingConversation, myUserId: string | null): boolean {
  if (filters.state === "unread" && c.unread_count === 0)
    return false;
  if (filters.status && c.status !== filters.status)
    return false;
  if (filters.tag && !c.tags.includes(filters.tag))
    return false;
  if (!filters.assignee)
    return true;
  if (filters.assignee === "unassigned")
    return c.assignee_user_id === null;
  const wanted = filters.assignee === "me" ? myUserId : filters.assignee;
  return c.assignee_user_id === wanted;
}

export function removeConversation(list: MessagingConversation[], id: string): MessagingConversation[] {
  const next = list.filter(c => c.id !== id);
  return next.length === list.length ? list : next;
}


export function windowLabel(locked: boolean, secondsLeft: number): string {
  if (locked)
    return "Reply window closed";
  if (secondsLeft < 3600)
    return `${Math.max(1, Math.ceil(secondsLeft / 60))}m left to reply`;
  return `${Math.ceil(secondsLeft / 3600)}h left to reply`;
}

export const STATUS_LABEL: Record<MessagingConversation["status"], string> = {
  open: "Open",
  pending: "Pending",
  resolved: "Resolved",
};

export const PRIORITY_LABEL: Record<MessagingConversation["priority"], string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};
