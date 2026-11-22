import { Ticket } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { LogTicketDialog } from "@/components/support/LogTicketDialog";
import { MyTickets } from "@/components/support/MyTickets";
import { useSupportAccess } from "@/features/help/hooks/useSupportAccess";

export default function TicketsPage() {
  const { canManage } = useSupportAccess();
  const [
    logTicketOpen,
    setLogTicketOpen,
  ] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
            <p className="text-sm text-muted-foreground">
              View, search, and track the status of all support tickets logged on the platform.
            </p>
          </div>
          {canManage && (
            <Button
              size="sm"
              onClick={() => setLogTicketOpen(true)}
              className="shrink-0"
            >
              <Ticket className="h-4 w-4 mr-2" />
              Log Ticket
            </Button>
          )}
        </div>
        <MyTickets />
      </div>
      <LogTicketDialog
        open={logTicketOpen}
        onOpenChange={setLogTicketOpen}
      />
    </>
  );
}
