import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { StateNotice } from "../components/StateNotice";
import { barShare, formatDuration, languageName } from "./voiceDisplay";
import { voiceStatsOptions } from "./voiceQueries";

const DAYS = 14;

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

export function DashboardTab() {
  const stats = useQuery(voiceStatsOptions(DAYS));

  if (stats.isPending)
    return <Skeleton className="h-48 w-full" />;
  if (stats.isError || !stats.data)
    return <StateNotice title="Could not load the dashboard." body="Check your connection and try again." actionLabel="Retry" onAction={() => void stats.refetch()} />;

  const { data } = stats;
  const busiest = Math.max(...data.days.map(day => day.total), 0);
  const languages = Object.entries(data.by_language).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={`Calls, last ${DAYS} days`} value={String(data.total)} />
        <Kpi label="Answer rate" value={`${data.answer_rate}%`} />
        <Kpi label="Missed or failed" value={String(data.missed + data.failed)} />
        <Kpi label="Average talk time" value={formatDuration(data.average_duration_seconds)} />
      </div>
      <Card className="border-border/50 bg-card/50">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium">Calls per day</p>
          <div className="flex h-40 items-end gap-1" role="img" aria-label="Calls per day">
            {data.days.map(day => (
              <div key={day.day} className="flex h-full flex-1 flex-col justify-end" title={`${day.day}: ${day.total} calls`}>
                <div className="rounded-t bg-primary" style={{ height: `${barShare(day.total, busiest)}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{data.days[0]?.day}</span>
            <span>{data.days[data.days.length - 1]?.day}</span>
          </div>
        </CardContent>
      </Card>
      {languages.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-medium">By language</p>
            {languages.map(([code, count]) => (
              <div key={code} className="flex items-center justify-between text-sm">
                <span>{languageName(code)}</span>
                <span className="text-muted-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {data.total === 0 && <p className="text-center text-sm text-muted-foreground">No calls in this period.</p>}
    </div>
  );
}
