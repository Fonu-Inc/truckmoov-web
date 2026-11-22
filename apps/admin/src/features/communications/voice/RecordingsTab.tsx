import { useQuery } from "@tanstack/react-query";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import { Mic } from "lucide-react";
import {
  Card, CardContent,
} from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { StateNotice } from "../components/StateNotice";
import {
  formatDuration, languageName,
} from "./voiceDisplay";
import { voiceCallsOptions } from "./voiceQueries";

export function RecordingsTab() {
  const list = useQuery(voiceCallsOptions({
    recording: true, limit: 50,
  }));

  if (list.isPending)
    return <Skeleton className="h-40 w-full" />;
  if (list.isError && !list.data) {
    return (
      <StateNotice
        title="Could not load recordings."
        body="Check your connection and try again."
        actionLabel="Retry"
        onAction={() => void list.refetch()}
      />
    );
  }
  if (!list.data || list.data.items.length === 0) {
    return (
      <StateNotice
        icon={<Mic className="h-8 w-8 text-muted-foreground/50" />}
        title="No recordings yet."
        body="A call recorded by the carrier shows up here with a player."
      />
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {list.data.items.map(call => (
        <Card
          key={call.id}
          className="border-border/50 bg-card/50"
        >
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-medium text-foreground">{call.contact_name || call.to_number || call.from_number}</p>
            <p className="text-xs text-muted-foreground">{`${formatDateTime(call.started_at)} · ${formatDuration(call.duration_seconds)} · ${languageName(call.language)}`}</p>
            <audio
              controls
              preload="none"
              src={call.recording_url}
              className="w-full"
            />
            {call.notes && <p className="text-xs text-muted-foreground">{call.notes}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
