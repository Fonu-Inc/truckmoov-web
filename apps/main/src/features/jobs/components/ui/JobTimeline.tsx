import type { DispatchJob } from "@truckmoov/api/dispatch";
import { format } from "date-fns";
import { History } from "lucide-react";
import {
  sortedTimeline, timelineText,
} from "@/features/jobs/utils/jobProgress";

export function JobTimeline({ job }: { job: DispatchJob }) {
  const entries = sortedTimeline(job);

  return (
    <section className="space-y-3 rounded-2xl border border-border/60 bg-background/40 p-4">
      <header className="flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">Timeline</h3>
      </header>
      {entries.length === 0
        ? <p className="text-sm text-muted-foreground">Nothing has happened on this job yet.</p>
        : (
            <ol className="space-y-2">
              {entries.map((entry, index) => (
                <li
                  key={entry.id ?? index}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 break-words">{timelineText(entry)}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {entry.occurred_at ? format(
                      new Date(entry.occurred_at),
                      "MMM dd, HH:mm",
                    ) : ""}
                  </span>
                </li>
              ))}
            </ol>
          )}
    </section>
  );
}
