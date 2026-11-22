import {
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/shadcn/button";

/**
 * Pager for the fleet tables. Renders nothing while the list fits on one page,
 * so a short list looks exactly like the design app (which has no pager).
 */
export function FleetTablePager({
  page, pageSize, total, onPageChange,
}: {
  page: number; pageSize: number; total: number; onPageChange: (page: number) => void;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1)
    return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(
    page * pageSize,
    total,
  );
  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <span className="text-xs text-muted-foreground">{`Showing ${from}–${to} of ${total}`}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">{`Page ${page} of ${pages}`}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
