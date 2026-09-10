import type { UseQueryResult } from "@tanstack/react-query";
import { AsyncState } from "@/shared/components/ui/AsyncState";
import { Card, CardContent } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";

// ponytail: schema for /fleet/vehicles?tabs=<X> summary is per-tab and not yet
// finalised on the server. Render key/value tiles from whatever primitives the
// server returns; type-tighten each tab's payload once the endpoint ships.
type Primitive = string | number | boolean | null;

function isRenderable(v: unknown): v is Primitive {
  return v === null || ["string", "number", "boolean"].includes(typeof v);
}

function humanise(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

type Props<T extends { data?: { summary?: unknown } | undefined }> = {
  query: UseQueryResult<T>;
};

export function TabSummaryStrip<T extends { data?: { summary?: unknown } | undefined }>({ query }: Props<T>) {
  return (
    <AsyncState
      query={query}
      skeleton={(
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
        </div>
      )}
      empty={<p className="text-xs text-muted-foreground">Summary not available yet.</p>}
      isEmpty={(body) => {
        const summary = (body as { data?: { summary?: unknown } })?.data?.summary;
        return !summary || (typeof summary === "object" && Object.keys(summary as object).length === 0);
      }}
    >
      {(body) => {
        const summary = (body as { data?: { summary?: unknown } })?.data?.summary as Record<string, unknown> | undefined;
        const entries = Object.entries(summary ?? {}).filter(([, v]) => isRenderable(v));
        if (entries.length === 0)
          return <p className="text-xs text-muted-foreground">Summary not available yet.</p>;
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {entries.map(([key, value]) => (
              <Card key={key}>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{humanise(key)}</p>
                  <p className="mt-1 truncate text-lg font-semibold">
                    {value === null ? "—" : String(value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      }}
    </AsyncState>
  );
}
