import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupportTickets, SupportTicket, TicketStatus } from "@/hooks/useSupportTickets";
import { TicketDetailSheet } from "./TicketDetailSheet";
import { 
  Search, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Loader2,
  MessageSquare,
  ArrowUpRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusConfig: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  open: { label: "Open", variant: "default", icon: AlertCircle },
  in_progress: { label: "In Progress", variant: "secondary", icon: Loader2 },
  waiting_on_tenant: { label: "Awaiting Response", variant: "outline", icon: MessageSquare },
  escalated: { label: "Escalated", variant: "destructive", icon: ArrowUpRight },
  resolved: { label: "Resolved", variant: "secondary", icon: CheckCircle2 },
  closed: { label: "Closed", variant: "outline", icon: CheckCircle2 },
};

export function MyTickets() {
  const { tickets, isLoading } = useSupportTickets();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.description.toLowerCase().includes(search.toLowerCase()) ||
      ticket.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "open" && !["resolved", "closed"].includes(ticket.status)) ||
      (statusFilter === "closed" && ["resolved", "closed"].includes(ticket.status));

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tickets found</h3>
              <p className="text-sm text-muted-foreground">
                {search ? "Try adjusting your search" : "You haven't created any support tickets yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const status = statusConfig[ticket.status];
              const StatusIcon = status.icon;

              return (
                <Card
                  key={ticket.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <StatusIcon className={`h-5 w-5 mt-0.5 shrink-0 ${
                          ticket.status === "open" ? "text-chart-5" :
                          ticket.status === "escalated" ? "text-destructive" :
                          ticket.status === "in_progress" ? "text-primary animate-spin" :
                          "text-muted-foreground"
                        }`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium truncate">{ticket.subject}</h4>
                            <Badge variant="outline" className="capitalize text-xs">
                              {ticket.category.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>#{ticket.id.slice(0, 8)}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                            {ticket.contextType !== "none" && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{ticket.contextType} attached</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Badge variant="outline" className="capitalize text-xs">
                          {ticket.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Detail Sheet */}
      <TicketDetailSheet
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </>
  );
}
