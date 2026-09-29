import { Download } from "lucide-react";

import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";

export function SummaryStat({
  icon: Icon, label, value, hint,
}: {
  icon: React.ElementType; label: string; value: string; hint?: string;
}) {
  return (
    <Card className="surface-sleek border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-bold truncate">{value}</p>
            {hint && <p className="text-[11px] text-muted-foreground truncate">{hint}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SectionCard({
  title, description, children, onExport, action, toolbar,
}: {
  title: string; description?: string; children: React.ReactNode; onExport?: () => void;
  action?: React.ReactNode; toolbar?: React.ReactNode;
}) {
  return (
    <Card className="surface-sleek border-border/50">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-2" />
              {" "}
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {toolbar}
        {children}
      </CardContent>
    </Card>
  );
}

export type Row = {
  label: string; count: number | string; detail: string; icon: React.ElementType;
};

export function ActivityRows({ rows }: { rows: Row[] }) {
  return (
    <div className="divide-y divide-border/60">
      {rows.map(r => (
        <div
          key={r.label}
          className="flex items-center gap-3 py-3"
        >
          <div className="h-9 w-9 shrink-0 rounded-xl bg-muted flex items-center justify-center">
            <r.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{r.label}</p>
            <p className="text-xs text-muted-foreground truncate">{r.detail}</p>
          </div>
          <Badge
            variant="secondary"
            className="rounded-full shrink-0"
          >
            {r.count}
          </Badge>
        </div>
      ))}
    </div>
  );
}
