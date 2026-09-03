import {
  Clock, Package,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/shadcn/badge";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";

// ponytail: no `job_offers` endpoint on @truckmoov/api yet — render the shell with
// empty states. When useJobOffers/useRespondToOffer land, drop the mocks in and
// replace `pending`/`past` with the query results (schema mirrors fleetflow's
// job_offers table: id, job, jobs.metadata.priority, offered_rate_ngn, expires_at,
// status). Empty-state UX matches the design reference.

export function JobOffersInbox() {
  const pending: unknown[] = [];
  const past: unknown[] = [];

  return (
    <div className="space-y-4">
      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="incoming" className="gap-2">
            <Package className="h-4 w-4" />
            Incoming
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <Clock className="h-4 w-4" />
            Past Offers
            {past.length > 0 && (
              <Badge variant="secondary" className="ml-1">{past.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-4 space-y-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Incoming Offers</h2>
            <p className="text-sm text-muted-foreground">New job offers awaiting your acceptance or decline.</p>
          </div>
          <EmptyState
            icon={Package}
            title="No pending offers"
            description="Job offers from enterprises will appear here."
          />
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Past Offers</h2>
            <p className="text-sm text-muted-foreground">Offers you've previously accepted, declined, or that have expired.</p>
          </div>
          <EmptyState
            icon={Clock}
            title="No past offers"
            description="Offers you've accepted, declined, or that have expired will appear here."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
