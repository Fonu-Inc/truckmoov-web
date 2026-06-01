import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { useSupportPermissions } from "@/hooks/useSupportPermissions";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { 
  HelpCircle, 
  FileWarning, 
  TicketCheck, 
  Activity,
  ArrowRight,
  Clock,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";

interface HelpHomeProps {
  onNavigate: (tab: string) => void;
}

export function HelpHome({ onNavigate }: HelpHomeProps) {
  const { canCreateTicket, canViewTickets } = useSupportPermissions();
  const { tickets, isLoading } = useSupportTickets();

  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress");
  const recentTickets = tickets.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => onNavigate("quick-help")}
        >
          <CardHeader className="pb-2">
            <HelpCircle className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Quick Help</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Browse guides and troubleshooting steps for common issues
            </CardDescription>
          </CardContent>
        </Card>

        {canCreateTicket && (
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onNavigate("report")}
          >
            <CardHeader className="pb-2">
              <FileWarning className="h-8 w-8 text-destructive mb-2" />
              <CardTitle className="text-lg">Report an Issue</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create a support ticket with context automatically attached
              </CardDescription>
            </CardContent>
          </Card>
        )}

        {canViewTickets && (
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onNavigate("tickets")}
          >
            <CardHeader className="pb-2">
              <TicketCheck className="h-8 w-8 text-chart-2 mb-2" />
              <CardTitle className="text-lg">My Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                View and track your open support requests
              </CardDescription>
              {openTickets.length > 0 && (
                <Badge variant="secondary" className="mt-2">
                  {openTickets.length} open
                </Badge>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2">
            <Activity className="h-8 w-8 text-chart-3 mb-2" />
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Check platform health and known issues
            </CardDescription>
            <Badge variant="outline" className="mt-2 text-chart-2 border-chart-2">
              All systems operational
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      {canViewTickets && recentTickets.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Your latest support requests</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("tickets")}>
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {ticket.status === "open" ? (
                      <AlertCircle className="h-5 w-5 text-chart-5" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {ticket.category.replace("_", " ")} • {ticket.status.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Here's how to get the most out of FleetPro support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  1
                </div>
                <h4 className="font-medium">Check Quick Help</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Browse our guides for instant solutions to common issues
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  2
                </div>
                <h4 className="font-medium">Report with Context</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Select the affected device/SIM to auto-attach diagnostic info
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  3
                </div>
                <h4 className="font-medium">Track Resolution</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Get real-time updates as our team works on your issue
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
