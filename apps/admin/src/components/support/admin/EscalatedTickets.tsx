import type { ElementType } from "react";
import type { SupportTicket } from "./AdminTicketSheet";
import { useQuery } from "@tanstack/react-query";
import { getSystemEscalatedSupportTicketsQueryOptions } from "@truckmoov/api/auth";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowUpRight,
  Building2,
  Loader2,
  Wifi,
  Wrench,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { AdminTicketSheet } from "./AdminTicketSheet";
import { toSheetTicket } from "./toSheetTicket";
import { useSupportTenantDirectory } from "./useSupportTenantDirectory";

type EscalationType = "fleetpro_internal" | "fonu_connectivity" | "vendor_installer";

// `description` is the line fleetflow's CardHeader generates under each summary
// card's title (lib/headingDescriptions) — written out here, our Card has no such hook.
const escalationConfig: Record<EscalationType, {
  label: string;
  icon: ElementType;
  color: string;
  description: string;
}> = {
  fleetpro_internal: {
    label: "FleetPro Internal",
    icon: Building2,
    color: "text-primary",
    description: "Vehicle records, fleet membership, and operational details.",
  },
  fonu_connectivity: {
    label: "Fonu Connectivity",
    icon: Wifi,
    color: "text-chart-3",
    description: "Tracking equipment, connectivity details, and current status.",
  },
  vendor_installer: {
    label: "Vendor / Installer",
    icon: Wrench,
    color: "text-chart-5",
    description: "Details and current information for vendor / installer.",
  },
};

const priorityStyles: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-chart-5/10 text-chart-5",
  critical: "bg-destructive/10 text-destructive",
};

function titleCase(value: string) {
  return value
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim()
    .replace(
      /\b\w/g,
      letter => letter.toUpperCase(),
    );
}

function shortId(id: string) {
  return id.slice(
    0,
    8,
  );
}

export function EscalatedTickets() {
  const escalatedQuery = useQuery(getSystemEscalatedSupportTicketsQueryOptions());
  const [
    selectedTicket,
    setSelectedTicket,
  ] = useState<SupportTicket | null>(null);

  // Server groups by party and counts each group — use both as sent.
  const parties = useMemo(
    () => (escalatedQuery.data?.data?.parties ?? []).map(p => ({
      party: p.party,
      count: p.count,
      tickets: p.tickets.map(toSheetTicket),
    })),
    [escalatedQuery.data],
  );
  const countByParty = Object.fromEntries(parties.map(p => [
    p.party,
    p.count,
  ]));
  const total = escalatedQuery.data?.data?.total ?? 0;

  const { tenantName } = useSupportTenantDirectory();
  const tenantLabel = (id: string) => tenantName(id) || `Tenant #${shortId(id)}`;

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

  if (total === 0) {
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
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(escalationConfig).map(([
          key,
          config,
        ]) => {
          const count = countByParty[key] ?? 0;
          const Icon = config.icon;
          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <Badge variant="outline">{count}</Badge>
                </div>
                <CardTitle className="text-base">{config.label}</CardTitle>
                <CardDescription className="mt-1.5">{config.description}</CardDescription>
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

      {parties.filter(p => p.count > 0).map(({
        party: target,
        count,
        tickets: targetTickets,
      }) => {
        const config = escalationConfig[target as EscalationType] || {
          label: titleCase(target),
          icon: ArrowUpRight,
          color: "text-muted-foreground",
          description: "",
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
                {count}
                {" "}
                escalated ticket
                {count > 1 ? "s" : ""}
                {" "}
                awaiting action from this party
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {targetTickets.map(ticket => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-medium text-sm truncate">{ticket.subject}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-mono text-muted-foreground">
                          #
                          {shortId(ticket.id)}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-foreground">{tenantLabel(ticket.tenantId)}</span>
                        <Badge
                          variant="outline"
                          className={priorityStyles[ticket.priority] ?? ""}
                        >
                          {ticket.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="capitalize"
                        >
                          {ticket.category.replace(
                            /_/g,
                            " ",
                          )}
                        </Badge>
                        {ticket.escalatedReferenceId && (
                          <Badge
                            variant="outline"
                            className="font-mono"
                          >
                            Ref:
                            {" "}
                            {ticket.escalatedReferenceId}
                          </Badge>
                        )}
                      </div>

                      {ticket.escalationNotes && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {ticket.escalationNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                      <Badge
                        variant="destructive"
                        className="text-[10px]"
                      >
                        Escalated
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {ticket.escalatedAt
                          ? formatRelative(ticket.escalatedAt)
                          : "—"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <AdminTicketSheet
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
