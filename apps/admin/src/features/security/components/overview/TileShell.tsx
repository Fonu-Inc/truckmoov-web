import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/lib/utils";

export type TileState = "loading" | "error" | "ready";

type TileShellProps = {
  label: string;
  state: TileState;
  to: string;
  value?: number;
  hint?: string;
  partial?: boolean;
  onRetry: () => void;
};

function TileBody({ label, state, value, hint, partial, onRetry }: Omit<TileShellProps, "to">) {
  if (state === "loading") {
    return (
      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">Couldn't load this count.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {partial && <Badge variant="outline" className="rounded-full text-xs">Partial count</Badge>}
      </div>
      <p className={cn("text-3xl font-semibold tabular-nums", value === 0 && "text-muted-foreground")}>
        {value ?? 0}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TileShell({ to, ...body }: TileShellProps) {
  const card = (
    <Card className={cn("h-full transition-colors", body.state === "ready" && "hover:bg-muted/50")}>
      <CardContent className="relative p-5">
        <TileBody {...body} />
        {body.state === "ready" && (
          <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground" aria-hidden />
        )}
      </CardContent>
    </Card>
  );
  if (body.state !== "ready")
    return card;
  return <Link to={to} className="block rounded-xl focus-visible:outline focus-visible:outline-2">{card}</Link>;
}
