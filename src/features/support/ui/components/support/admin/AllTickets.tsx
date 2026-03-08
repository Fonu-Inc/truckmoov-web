import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupportTickets, SupportTicket, TicketStatus, TicketCategory } from "@/hooks/useSupportTickets";
import { AdminTicketSheet } from "./AdminTicketSheet";
import { 
  Search, 
  Loader2,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusOptions: { value: TicketStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_tenant", label: "Waiting on Tenant" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const categoryOptions: { value: TicketCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "device_tracking", label: "Device & Tracking" },
  { value: "sim_connectivity", label: "SIM & Connectivity" },
  { value: "messaging", label: "Messaging" },
  { value: "billing", label: "Billing" },
  { value: "account_access", label: "Account / Access" },
  { value: "other", label: "Other" },
];

const statusVariants: Record<TicketStatus, "default" | "secondary" | "destructive" | "outline"> = {
  open: "default",
  in_progress: "secondary",
  waiting_on_tenant: "outline",
  escalated: "destructive",
  resolved: "secondary",
  closed: "outline",
};

export function AllTickets() {
  const { tickets, isLoading } = useSupportTickets();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "all">("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.description.toLowerCase().includes(search.toLowerCase()) ||
      ticket.id.toLowerCase().includes(search.toLowerCase()) ||
      ticket.tenantId.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tickets, tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredTickets.length} of {tickets.length} tickets
        </div>

        {/* Tickets Table */}
        <div className="rounded-lg border">
          <div className="grid grid-cols-[1fr_120px_120px_120px_100px] gap-4 p-3 bg-muted/50 text-sm font-medium border-b">
            <div>Ticket</div>
            <div>Category</div>
            <div>Status</div>
            <div>Priority</div>
            <div>Created</div>
          </div>
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No tickets match your filters
            </div>
          ) : (
            <div className="divide-y">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="grid grid-cols-[1fr_120px_120px_120px_100px] gap-4 p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      #{ticket.id.slice(0, 8)} • Tenant: {ticket.tenantId.slice(0, 8)}...
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline" className="capitalize text-xs">
                      {ticket.category.replace(/_/g, " ").slice(0, 15)}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={statusVariants[ticket.status]} className="capitalize">
                      {ticket.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="outline" className="capitalize">
                      {ticket.priority}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AdminTicketSheet
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </>
  );
}
