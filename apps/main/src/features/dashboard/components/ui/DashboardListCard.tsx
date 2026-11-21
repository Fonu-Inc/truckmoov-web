import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/lib/utils";

type QueryStatus = {
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyText?: string;
};

/**
 * The overview's titled list card: tinted icon tile, title with a muted count,
 * a "View …" link, then rows. Carries the loading / error / empty states so
 * each section's own query can fail on its own without blanking the page.
 */
export function DashboardListCard({
  icon: Icon,
  tint,
  title,
  count,
  description,
  actionLabel,
  actionHref,
  status,
  children,
}: {
  icon: LucideIcon;
  /** Tile classes, e.g. `bg-destructive/10 text-destructive`. */
  tint: string;
  title: string;
  count?: number;
  description: string;
  actionLabel: string;
  actionHref: string;
  status: QueryStatus;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-2xl surface-sleek flex flex-col">
      <CardHeader className="p-6 pb-4 flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
            tint,
          )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="font-display text-base truncate">
              {title}
              {count !== undefined && (
                <>
                  {" "}
                  <span className="text-muted-foreground font-normal">
                    (
                    {count}
                    )
                  </span>
                </>
              )}
            </CardTitle>
            <CardDescription className="truncate">{description}</CardDescription>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link to={actionHref}>
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-2 flex-1">
        {status.isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-[62px] w-full rounded-lg"
              />
            ))
          : status.isError
            ? (
                <div className="py-6 text-center text-sm">
                  <p className="text-destructive">Couldn't load this section.</p>
                  {status.onRetry && (
                    <Button
                      variant="link"
                      className="mt-1"
                      onClick={status.onRetry}
                    >
                      Try again
                    </Button>
                  )}
                </div>
              )
            : status.isEmpty
              ? <p className="py-6 text-center text-sm text-muted-foreground">{status.emptyText}</p>
              : children}
      </CardContent>
    </Card>
  );
}

/** One bordered row: title + muted subtitle on the left, `right` slot on the right. */
export function DashboardListRow({
  title,
  subtitle,
  right,
}: {
  title: ReactNode;
  subtitle: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}

/** The outline pill the reference uses for row status ("In 2 days", "Active", …). */
export function RowPill({
  className, children,
}: {
  className: string; children: ReactNode;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5",
        className,
      )}
    >
      {children}
    </Badge>
  );
}
