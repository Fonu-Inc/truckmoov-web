import { useCallback, useMemo, useState } from "react";
import { Database, PauseCircle, PlayCircle, Radar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type EventLevel = "info" | "warning" | "error";

type StreamEvent = {
  id: string;
  type: string;
  source: string;
  description: string;
  level: EventLevel;
  timestamp: string;
  latencyMs: number;
};

const LEVEL_STYLES: Record<EventLevel, string> = {
  info: "bg-primary/10 text-primary border-primary/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  error: "bg-destructive/10 text-destructive border-destructive/30",
};

const JOB_EVENTS: StreamEvent[] = [
  {
    id: "JOB-evt-1032",
    type: "job.assigned",
    source: "Dispatch Service",
    description: "Job TMV-889 assigned to DRV-1023.",
    level: "info",
    timestamp: "2026-03-31T08:41:12Z",
    latencyMs: 234,
  },
  {
    id: "JOB-evt-1031",
    type: "job.delayed",
    source: "ETA Monitor",
    description: "Job TMV-777 flagged as delayed (traffic congestion).",
    level: "warning",
    timestamp: "2026-03-31T08:36:18Z",
    latencyMs: 482,
  },
  {
    id: "JOB-evt-1030",
    type: "job.failed",
    source: "Dispatch Service",
    description: "Assignment failed due to driver unavailability.",
    level: "error",
    timestamp: "2026-03-31T08:22:41Z",
    latencyMs: 611,
  },
  {
    id: "JOB-evt-1029",
    type: "job.completed",
    source: "Driver Comms",
    description: "Job TMV-650 marked delivered by driver reply.",
    level: "info",
    timestamp: "2026-03-31T08:12:05Z",
    latencyMs: 154,
  },
];

const TRACKING_EVENTS: StreamEvent[] = [
  {
    id: "TRK-evt-902",
    type: "tracking.ping",
    source: "GPS Gateway",
    description: "Vehicle TMV-401 pinged at 3.418N, 6.441E.",
    level: "info",
    timestamp: "2026-03-31T08:42:12Z",
    latencyMs: 84,
  },
  {
    id: "TRK-evt-901",
    type: "tracking.geofence.exit",
    source: "Geo Engine",
    description: "Vehicle TMV-118 exited Apapa Yard.",
    level: "warning",
    timestamp: "2026-03-31T08:37:02Z",
    latencyMs: 216,
  },
  {
    id: "TRK-evt-900",
    type: "tracking.device_fault",
    source: "GPS Gateway",
    description: "Device TMV-GPS-90 reported low battery.",
    level: "error",
    timestamp: "2026-03-31T08:20:44Z",
    latencyMs: 510,
  },
  {
    id: "TRK-evt-899",
    type: "tracking.arrival",
    source: "Geo Engine",
    description: "Vehicle TMV-233 arrived at Ikeja hub.",
    level: "info",
    timestamp: "2026-03-31T08:10:14Z",
    latencyMs: 122,
  },
];

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleTimeString();
}

function EventList({ events }: { events: StreamEvent[] }) {
  return (
    <ScrollArea className="h-[420px]">
      <div className="space-y-3 pr-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-lg border border-border/50 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {event.type}
                </p>
                <p className="text-xs text-muted-foreground">{event.source}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("capitalize", LEVEL_STYLES[event.level])}
                >
                  {event.level}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {event.description}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3.5 w-3.5" />
              Latency {event.latencyMs}ms
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export default function EventStreams() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<EventLevel | "all">("all");
  const [activeTab, setActiveTab] = useState<"jobs" | "tracking">("jobs");
  const [live, setLive] = useState(true);

  const filterEvents = useCallback(
    (events: StreamEvent[]) => {
      const query = search.trim().toLowerCase();
      return events.filter((event) => {
        const matchesLevel =
          levelFilter === "all" || event.level === levelFilter;
        const matchesSearch =
          !query ||
          event.type.toLowerCase().includes(query) ||
          event.source.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query);
        return matchesLevel && matchesSearch;
      });
    },
    [search, levelFilter]
  );

  const filteredJobEvents = useMemo(
    () => filterEvents(JOB_EVENTS),
    [filterEvents]
  );
  const filteredTrackingEvents = useMemo(
    () => filterEvents(TRACKING_EVENTS),
    [filterEvents]
  );

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Event Streams</CardTitle>
            <CardDescription>
              Monitor live job and tracking events for analytics and alerting.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={live} onCheckedChange={setLive} />
            <span className="text-sm text-muted-foreground">Live updates</span>
            {live ? (
              <Badge
                variant="outline"
                className="bg-success/10 text-success border-success/30"
              >
                Live
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-muted text-muted-foreground border-muted"
              >
                Paused
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Search events, sources, or payloads..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="md:max-w-sm"
            />
            <Select
              value={levelFilter}
              onValueChange={(value) =>
                setLevelFilter(value as EventLevel | "all")
              }
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLive(!live)}
              >
                {live ? (
                  <PauseCircle className="mr-2 h-4 w-4" />
                ) : (
                  <PlayCircle className="mr-2 h-4 w-4" />
                )}
                {live ? "Pause" : "Resume"}
              </Button>
              <Button variant="outline" size="sm">
                <Radar className="mr-2 h-4 w-4" />
                Snapshot
              </Button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "jobs" | "tracking")
            }
          >
            <TabsList className="bg-muted/50">
              <TabsTrigger value="jobs">Job Events</TabsTrigger>
              <TabsTrigger value="tracking">Tracking Events</TabsTrigger>
            </TabsList>
            <TabsContent value="jobs" className="mt-4">
              <EventList events={filteredJobEvents} />
            </TabsContent>
            <TabsContent value="tracking" className="mt-4">
              <EventList events={filteredTrackingEvents} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
