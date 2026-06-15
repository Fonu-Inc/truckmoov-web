import { useMemo, useState } from "react";
import type { ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSystemEscalatedSupportTicketsQueryOptions } from "@truckmoov/api/auth";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, Building2, Loader2, Wifi, Wrench } from "lucide-react";

import { Badge } from "@/components/shadcn/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { AdminTicketSheet } from "./AdminTicketSheet";
import type { SupportTicket } from "./AdminTicketSheet";

type EscalationType = "fleetpro_internal" | "fonu_connectivity" | "vendor_installer";

const escalationConfig: Record<EscalationType, { label: string; icon: ElementType; color: string }> = {
  fleetpro_internal: { label: "FleetPro Internal", icon: Building2, color: "text-primary" },
  fonu_connectivity: { label: "Fonu Connectivity", icon: Wifi, color: "text-chart-3" },
  vendor_installer: { label: "Vendor / Installer", icon: Wrench, color: "text-chart-5" },
};

const priorityStyles: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-chart-5/10 text-chart-5",
  critical: "bg-destructive/10 text-destructive",
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (source: Record<string, unknown> | null, key: string): string | undefined => {
  const value = source?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
};

const readNestedString = (source: Record<string, unknown> | null, path: string[]): string | undefined => {
  let current: unknown = source;
  for (const key of path) {
    current = asRecord(current)?.[key];
  }
  return typeof current === "string" && current.trim() ? current : undefined;
};

const titleCase = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const shortId = (id: string) => id.slice(0, 8);

const normalizeTicket = (raw: Record<string, unknown>, fallbackTarget?: string): SupportTicket => ({
  id: readString(raw, "id") ?? readString(raw, "ticketId") ?? "",
  tenantId: readString(raw, "tenantId") ?? readNestedString(raw, ["tenant", "id"]) ?? "",
  tenantName: readString(raw, "tenantName") ?? readNestedString(raw, ["tenant", "name"]),
  category: readString(raw, "category") ?? "other",
  subject: readString(raw, "subject") ?? readString(raw, "title") ?? "Untitled ticket",
  description: readString(raw, "description") ?? readString(raw, "content") ?? "",
  status: "escalated",
  priority: readString(raw, "priority") ?? "medium",
  contextType: readString(raw, "contextType") ?? readString(raw, "channel") ?? "none",
  escalatedTo:
    readString(raw, "escalatedTo") ??
    readString(raw, "target") ??
    readString(raw, "escalationParty") ??
    fallbackTarget,
  escalatedReferenceId: readString(raw, "escalatedReferenceId") ?? readString(raw, "referenceId"),
  escalationNotes: readString(raw, "escalationNotes") ?? readString(raw, "notes"),
  escalatedAt: readString(raw, "escalatedAt"),
  createdBy: readString(raw, "createdBy") ?? readNestedString(raw, ["reporter", "id"]) ?? "",
  createdAt: readString(raw, "createdAt") ?? new Date().toISOString(),
  updatedAt: readString(raw, "updatedAt") ?? new Date().toISOString(),
  resolvedAt: readString(raw, "resolvedAt"),
  contextSnapshot: asRecord(raw.contextSnapshot) ?? undefined,
  reporterName: readString(raw, "reporterName") ?? readNestedString(raw, ["reporter", "fullName"]),
});

const addTicket = (groups: Record<string, SupportTicket[]>, ticket: SupportTicket, fallbackTarget?: string) => {
  if (!ticket.id) return;
  const target = ticket.escalatedTo || fallbackTarget || "unknown";
  groups[target] = [...(groups[target] ?? []), ticket];
};

const normalizeEscalatedResponse = (response: unknown): Record<string, SupportTicket[]> => {
  const root = asRecord(response);
  const data = root?.data ?? response;
  const dataRecord = asRecord(data);
  const groups: Record<string, SupportTicket[]> = {};

  if (Array.isArray(data)) {
    data.map(asRecord).filter(Boolean).forEach((raw) => addTicket(groups, normalizeTicket(raw)));
    return groups;
  }

  if (!dataRecord) return groups;

  const flatCandidates = [dataRecord.tickets, dataRecord.items, dataRecord.rows, dataRecord.data];
  const flat = flatCandidates.find(Array.isArray);
  if (Array.isArray(flat)) {
    flat.map(asRecord).filter(Boolean).forEach((raw) => addTicket(groups, normalizeTicket(raw)));
  }

  const groupedCandidates = [dataRecord.grouped, dataRecord.groups, dataRecord.byTarget, dataRecord.byEscalationParty];
  groupedCandidates.forEach((candidate) => {
    if (Array.isArray(candidate)) {
      candidate.map(asRecord).filter(Boolean).forEach((group) => {
        const target =
          readString(group, "escalatedTo") ??
          readString(group, "target") ??
          readString(group, "party") ??
          readString(group, "key") ??
          "unknown";
        const tickets = [group.tickets, group.items, group.rows, group.data].find(Array.isArray);
        if (Array.isArray(tickets)) {
          tickets
            .map(asRecord)
            .filter(Boolean)
            .forEach((raw) => addTicket(groups, normalizeTicket(raw, target), target));
        }
      });
      return;
    }

    const groupedRecord = asRecord(candidate);
    if (groupedRecord) {
      Object.entries(groupedRecord).forEach(([target, value]) => {
        if (Array.isArray(value)) {
          value
            .map(asRecord)
            .filter(Boolean)
            .forEach((raw) => addTicket(groups, normalizeTicket(raw, target), target));
        }
      });
    }
  });

  if (Object.keys(groups).length === 0) {
    Object.entries(dataRecord).forEach(([target, value]) => {
      if (Array.isArray(value)) {
        value
          .map(asRecord)
          .filter(Boolean)
          .forEach((raw) => addTicket(groups, normalizeTicket(raw, target), target));
      }
    });
  }

  return groups;
};

export function EscalatedTickets() {
  const escalatedQuery = useQuery(getSystemEscalatedSupportTicketsQueryOptions());
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const byTarget = useMemo(() => normalizeEscalatedResponse(escalatedQuery.data), [escalatedQuery.data]);
  const escalatedTickets = useMemo(() => Object.values(byTarget).flat(), [byTarget]);

  const tenantLabel = (ticket: SupportTicket) =>
    ticket.tenantName || `Tenant #${shortId(ticket.tenantId || ticket.id)}`;

  if (escalatedQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (escalatedQuery.isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ArrowUpRight className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">Unable to Load Escalated Tickets</h3>
          <p className="text-sm text-muted-foreground">
            Escalated support tickets could not be loaded right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (escalatedTickets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ArrowUpRight className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">No Escalated Tickets</h3>
          <p className="text-sm text-muted-foreground">
            There are currently no tickets that have been escalated to external parties.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(escalationConfig).map(([key, config]) => {
          const count = byTarget[key]?.length || 0;
          const Icon = config.icon;
          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <Badge variant="outline">{count}</Badge>
                </div>
                <CardTitle className="text-base">{config.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {count === 0 ? "No active escalations" : `${count} ticket${count > 1 ? "s" : ""} pending`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {Object.entries(byTarget).map(([target, targetTickets]) => {
        const config = escalationConfig[target as EscalationType] || {
          label: titleCase(target),
          icon: ArrowUpRight,
          color: "text-muted-foreground",
        };
        const Icon = config.icon;

        return (
          <Card key={target}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${config.color}`} />
                {config.label}
              </CardTitle>
              <CardDescription>
                {targetTickets.length} escalated ticket{targetTickets.length > 1 ? "s" : ""} awaiting action from this party
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {targetTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedTicket(ticket)}
                    className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="truncate text-sm font-medium">{ticket.subject}</p>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-mono text-muted-foreground">#{shortId(ticket.id)}</span>
                        <span className="text-muted-foreground">-</span>
                        <span className="text-foreground">{tenantLabel(ticket)}</span>
                        <Badge variant="outline" className={priorityStyles[ticket.priority] ?? ""}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {ticket.category.replace(/_/g, " ")}
                        </Badge>
                        {ticket.escalatedReferenceId && (
                          <Badge variant="outline" className="font-mono">
                            Ref: {ticket.escalatedReferenceId}
                          </Badge>
                        )}
                      </div>

                      {ticket.escalationNotes && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">{ticket.escalationNotes}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                      <Badge variant="destructive" className="text-[10px]">
                        Escalated
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {ticket.escalatedAt
                          ? formatDistanceToNow(new Date(ticket.escalatedAt), { addSuffix: true })
                          : "-"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <AdminTicketSheet ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}
