import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { ListErrorBanner } from "@/components/platform/billing/billingUi";
import { ListSkeleton } from "@/components/ui/skeletons";

const PAGE_SIZE = 10;

type Props<T> = {
  title: string;
  description: string;
  rows: T[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  emptyText: string;
  errorTitle?: string;
  footer?: ReactNode;
  renderRow: (row: T) => ReactNode;
  rowKey: (row: T) => string;
};

export function SectionCard<T>({
  title,
  description,
  rows,
  isLoading,
  isError,
  onRetry,
  emptyText,
  errorTitle,
  footer,
  renderRow,
  rowKey,
}: Props<T>) {
  const [
    visible,
    setVisible,
  ] = useState(PAGE_SIZE);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <ListSkeleton rows={3} />}
        {!isLoading && isError && (
          <ListErrorBanner
            title={errorTitle ?? `Couldn't load ${title.toLowerCase()}`}
            onRetry={onRetry}
          />
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
        )}
        {!isLoading && !isError && rows.slice(
          0,
          visible,
        ).map(row => (
          <div
            key={rowKey(row)}
            className="rounded-lg border p-3"
          >
            {renderRow(row)}
          </div>
        ))}
        {rows.length > visible && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisible(v => v + PAGE_SIZE)}
          >
            Show more (
            {rows.length - visible}
            {" "}
            left)
          </Button>
        )}
        {footer}
      </CardContent>
    </Card>
  );
}

export function NotMonitoredNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
      <span className="font-medium">Not monitored yet. </span>
      {children}
    </p>
  );
}
