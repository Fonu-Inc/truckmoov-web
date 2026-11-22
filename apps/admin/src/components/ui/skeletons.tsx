import { Skeleton } from "@/components/shadcn/skeleton";
import {
  TableCell, TableRow,
} from "@/components/shadcn/table";
import { cn } from "@/lib/utils";

// Varied widths so a block of cells does not read as one flat bar.
const CELL_WIDTHS = [
  "w-3/4",
  "w-1/2",
  "w-2/3",
  "w-1/3",
  "w-4/5",
];

/** Placeholder rows for the body of a table that is still loading. */
export function TableSkeleton({
  rows = 6,
  columns,
}: {
  rows?: number;
  columns: number;
}) {
  return (
    <>
      {Array.from(
        { length: rows },
        (_, row) => (
          <TableRow
            key={row}
            aria-hidden
          >
            {Array.from(
              { length: columns },
              (_, column) => (
                <TableCell key={column}>
                  <Skeleton className={cn(
                    "h-4",
                    CELL_WIDTHS[(row + column) % CELL_WIDTHS.length],
                  )}
                  />
                </TableCell>
              ),
            )}
          </TableRow>
        ),
      )}
    </>
  );
}

/** Placeholder for a list of rows with a leading avatar or icon and two lines of text. */
export function ListSkeleton({
  rows = 4, className,
}: {
  rows?: number; className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-4",
        className,
      )}
      aria-hidden
    >
      {Array.from(
        { length: rows },
        (_, row) => (
          <div
            key={row}
            className="flex items-center gap-4"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ),
      )}
    </div>
  );
}

/** Placeholder for a label and value grid, such as an overview tab. */
export function DetailSkeleton({
  items = 6, className,
}: {
  items?: number; className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        className,
      )}
      aria-hidden
    >
      {Array.from(
        { length: items },
        (_, item) => (
          <div
            key={item}
            className="space-y-2 rounded-xl border p-3"
          >
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ),
      )}
    </div>
  );
}
