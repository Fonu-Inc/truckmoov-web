import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  useDriverBehaviorEvents,
  useDriverBehaviorRanking,
  useDriverBehaviorSummary,
  useDrivers,
} from "@truckmoov/api/fleet";
import {
  Activity, Bell, Loader2, Shield, TriangleAlert, User,
} from "lucide-react";
import {
  useCallback, useMemo, useState,
} from "react";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Skeleton } from "@/components/shadcn/skeleton";
import { BehaviourEventItem } from "@/features/drivers/components/ui/behaviour/BehaviourEventItem";
import { BehaviourScoreCard } from "@/features/drivers/components/ui/behaviour/BehaviourScoreCard";
import { CARD_CLASS } from "@/features/fleet/components/ui/violations/violationsUi";
import { PageHeader } from "@/shared/components/layout/PageHeader";

const TAB_TRIGGER_CLASS = "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2";
const TAB_CONTENT_CLASS = "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-0";

function StateMessage({ children }: { children: React.ReactNode }) {
  return <div className="py-6 text-center text-sm text-muted-foreground">{children}</div>;
}

function Stat({
  icon: Icon, tint, value, label,
}: {
  icon: React.ElementType; tint: string; value: string | null; label: string;
}) {
  return (
    <div className={CARD_CLASS}>
      <div className="p-4 text-center">
        <Icon className={`h-5 w-5 mx-auto mb-1 ${tint}`} />
        {value === null
          ? <Skeleton className="mx-auto h-8 w-12" />
          : <p className="text-2xl font-bold">{value}</p>}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/** `/drivers/behaviour` — the design app's driver Behavior tab. */
export default function BehaviourPage() {
  const [
    activeTab,
    setActiveTab,
  ] = useState("scores");
  const summaryQuery = useDriverBehaviorSummary();
  const rankingQuery = useDriverBehaviorRanking();
  const eventsQuery = useDriverBehaviorEvents({ params: { limit: 50 } });
  const driversQuery = useDrivers();

  const summary = summaryQuery.data?.data;
  const driverScores = rankingQuery.data?.data?.items ?? [];
  const events = eventsQuery.data?.data?.items ?? [];
  const eventsTotal = eventsQuery.data?.data?.total ?? 0;
  const criticalCount = eventsQuery.data?.data?.criticalCount ?? 0;

  // Events and ranking carry driver ids only — names and phones come from the roster.
  const driversById = useMemo(
    () => new Map((driversQuery.data?.data ?? []).map(d => [
      d.id,
      d,
    ])),
    [driversQuery.data?.data],
  );
  const driverPhone = useCallback(
    (id: string) => driversById.get(id)?.phone || "-",
    [driversById],
  );
  const driverName = useCallback(
    (id: string) => driversById.get(id)?.name || "-",
    [driversById],
  );

  const stat = (value: number | null | undefined) => (summaryQuery.isLoading ? null : `${value ?? "-"}`);

  return (
    <>
      <PageHeader
        title="Drivers Behavior"
        description="Details and current information your drivers behavior."
      />
      <div className={TAB_CONTENT_CLASS}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Stat
              icon={Activity}
              tint="text-primary"
              value={stat(summary?.averageScore)}
              label="Avg Score"
            />
            <Stat
              icon={TriangleAlert}
              tint="text-warning"
              value={stat(summary?.eventsLast24h)}
              label="Events (24h)"
            />
            <Stat
              icon={User}
              tint="text-accent"
              value={stat(summary?.driversTotal)}
              label="Drivers"
            />
            <Stat
              icon={Shield}
              tint="text-success"
              value={stat(summary?.zoneEntries)}
              label="Zone Entries"
            />
            <Stat
              icon={Bell}
              tint="text-destructive"
              value={stat(summary?.zoneExits)}
              label="Zone Exits"
            />
          </div>

          <div>
            <div>
              <TabsPrimitive.Root
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsPrimitive.List className="inline-flex h-10 items-center justify-center rounded-xl bg-secondary/60 p-1 text-muted-foreground mb-4">
                  <TabsPrimitive.Trigger
                    value="scores"
                    className={TAB_TRIGGER_CLASS}
                  >
                    <Activity className="h-4 w-4" />
                    Behavior Ranking
                  </TabsPrimitive.Trigger>
                  <TabsPrimitive.Trigger
                    value="events"
                    className={TAB_TRIGGER_CLASS}
                  >
                    <TriangleAlert className="h-4 w-4" />
                    Behavior Events
                    {criticalCount > 0 && (
                      <div className="rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                        {criticalCount}
                      </div>
                    )}
                  </TabsPrimitive.Trigger>
                </TabsPrimitive.List>

                <TabsPrimitive.Content
                  value="scores"
                  className={TAB_CONTENT_CLASS}
                >
                  <div className="grid gap-4">
                    <p className="text-xs text-muted-foreground">Drivers are ranked by performance score: braking (30%), speeding (30%), acceleration (20%) and cornering (20%), calculated from recorded telemetry events.</p>
                    {rankingQuery.isLoading && <StateMessage><Loader2 className="mx-auto h-5 w-5 animate-spin" /></StateMessage>}
                    {rankingQuery.isError && (
                      <StateMessage>
                        <span className="text-destructive">{rankingQuery.error.message}</span>
                        {" "}
                        <button
                          type="button"
                          className="font-medium text-primary hover:underline"
                          onClick={() => void rankingQuery.refetch()}
                        >
                          Try again
                        </button>
                      </StateMessage>
                    )}
                    {rankingQuery.isSuccess && driverScores.length === 0 && <StateMessage>No drivers scored yet.</StateMessage>}
                    {driverScores.map(score => (
                      <BehaviourScoreCard
                        key={score.driverId}
                        score={score}
                        phone={driverPhone(score.driverId)}
                      />
                    ))}
                  </div>
                </TabsPrimitive.Content>

                <TabsPrimitive.Content
                  value="events"
                  className={TAB_CONTENT_CLASS}
                >
                  <div className={CARD_CLASS}>
                    <div className="flex flex-col space-y-1.5 p-6 pb-2">
                      <h3 className="font-semibold tracking-tight text-foreground font-display text-sm">Recent Behavior Events</h3>
                      {eventsQuery.isLoading
                        ? <Skeleton className="h-4 w-40" />
                        : <p className="text-sm text-muted-foreground">{`${eventsTotal} total events recorded`}</p>}
                    </div>
                    <div className="p-6 pt-0">
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-2">
                          {eventsQuery.isLoading && <StateMessage><Loader2 className="mx-auto h-5 w-5 animate-spin" /></StateMessage>}
                          {eventsQuery.isError && <StateMessage><span className="text-destructive">{eventsQuery.error.message}</span></StateMessage>}
                          {eventsQuery.isSuccess && events.length === 0 && <StateMessage>No behaviour events recorded.</StateMessage>}
                          {events.map(event => (
                            <BehaviourEventItem
                              key={event.id}
                              event={event}
                              driverName={driverName(event.driverId)}
                              phone={driverPhone(event.driverId)}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </TabsPrimitive.Content>
              </TabsPrimitive.Root>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
