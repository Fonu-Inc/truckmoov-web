import type { SystemSupportTicket } from "@truckmoov/api/auth";
import type {
  SupportTicket, TicketStatus,
} from "./AdminTicketSheet";

/** API row → sheet ticket (null → undefined). */
export function toSheetTicket(t: SystemSupportTicket): SupportTicket {
  return {
    id: t.id,
    displayId: t.displayId,
    reporterName: t.reporterName ?? undefined,
    tenantId: t.tenantId,
    category: t.category,
    subject: t.subject,
    description: t.description ?? "",
    status: t.status as TicketStatus,
    priority: t.priority,
    contextType: t.contextType ?? "none",
    channel: t.channel ?? undefined,
    escalatedTo: t.escalatedTo ?? undefined,
    escalatedReferenceId: t.escalatedReferenceId ?? undefined,
    escalationNotes: t.escalationNotes ?? undefined,
    escalatedAt: t.escalatedAt ?? undefined,
    assignedTo: t.assignedTo ?? undefined,
    createdBy: t.createdBy ?? "",
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    resolvedAt: t.resolvedAt ?? undefined,
    contextSnapshot: t.contextSnapshot ?? undefined,
  };
}
