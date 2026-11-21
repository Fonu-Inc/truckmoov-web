import type { ColumnDef, PaginationState, Row, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

const SKELETON_ROWS = 5;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE_OPTIONS[0];

export type DataTablePagination = {
  /** 1-based current page. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Omit to hide the rows-per-page selector. */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
};

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  hasActiveFilters?: boolean;
  emptyState?: ReactNode;
  filteredEmptyState?: ReactNode;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string;
  className?: string;
  /**
   * Server-driven pagination: pass the current page + total from the endpoint.
   * Omit it and the table pages the rows it was given client-side (10 per page).
   * Pass `false` only when the rows are already paged elsewhere (cursor
   * navigation) or must all render at once (print layouts).
   */
  pagination?: DataTablePagination | false;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  isError,
  errorMessage = "Something went wrong.",
  onRetry,
  hasActiveFilters,
  emptyState = "No data",
  filteredEmptyState = "No results match your filters.",
  onRowClick,
  rowClassName,
  className,
  pagination,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [clientPage, setClientPage] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const isClientPaged = pagination === undefined;
  const table = useReactTable({
    data,
    columns,
    state: isClientPaged ? { sorting, pagination: clientPage } : { sorting },
    onSortingChange: setSorting,
    // Sorting one server page would reorder a slice and read as the whole list.
    enableSorting: !pagination,
    onPaginationChange: setClientPage,
    // The page is controlled here; never let a new `data` reference (a parent
    // re-render, a refetch) bounce the user back to page 1.
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(isClientPaged && { getPaginationRowModel: getPaginationRowModel() }),
  });
  const colCount = columns.length || 1;

  // Filtering can shrink the rows under the current page — step back to the last page.
  const lastPageIndex = Math.max(0, Math.ceil(data.length / clientPage.pageSize) - 1);
  useEffect(() => {
    if (isClientPaged && clientPage.pageIndex > lastPageIndex)
      setClientPage(p => ({ ...p, pageIndex: lastPageIndex }));
  }, [isClientPaged, clientPage.pageIndex, lastPageIndex]);

  let footer: DataTablePagination | null = null;
  if (isClientPaged) {
    // A table that fits on the smallest page gets no footer — nothing to page.
    if (data.length > DEFAULT_PAGE_SIZE) {
      footer = {
        page: clientPage.pageIndex + 1,
        pageSize: clientPage.pageSize,
        total: data.length,
        onPageChange: page => setClientPage(p => ({ ...p, pageIndex: page - 1 })),
        onPageSizeChange: pageSize => setClientPage({ pageIndex: 0, pageSize }),
      };
    }
  }
  else if (pagination && pagination.total > 0) {
    footer = pagination;
  }

  return (
    <div>
      <Table className={className}>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="border-border/50 hover:bg-transparent">
              {group.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                const headerClass = (header.column.columnDef.meta as { className?: string } | undefined)?.className;
                return (
                  <TableHead
                    key={header.id}
                    className={cn("whitespace-nowrap", headerClass, canSort && "cursor-pointer select-none")}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : (
                          <span className="inline-flex items-center">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && (
                              sortDir === "asc"
                                ? <ArrowUp className="h-3 w-3 ml-1 inline" />
                                : sortDir === "desc"
                                  ? <ArrowDown className="h-3 w-3 ml-1 inline" />
                                  : <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-50" />
                            )}
                          </span>
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <TableRow key={`skeleton-${i}`} className="border-border/50">
                {Array.from({ length: colCount }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={colCount} className="text-center py-8">
                <p className="text-destructive">{errorMessage}</p>
                {onRetry && (
                  <Button variant="link" className="mt-1" onClick={onRetry}>
                    Try again
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colCount} className="text-center py-8 text-muted-foreground">
                {hasActiveFilters ? filteredEmptyState : emptyState}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row: Row<TData>) => (
              <TableRow
                key={row.id}
                className={cn(
                  "border-border/50",
                  onRowClick && "cursor-pointer",
                  rowClassName?.(row.original),
                )}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "whitespace-nowrap",
                      (cell.column.columnDef.meta as { className?: string } | undefined)?.className,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {/* Outside <Table>: its wrapper scrolls horizontally, and a wide table
          would carry the pager controls off-screen with it. */}
      {footer && (
        <div className="border-t border-border/50">
          <PaginationBar pagination={footer} />
        </div>
      )}
    </div>
  );
}

function PaginationBar({ pagination }: { pagination: DataTablePagination }) {
  const {
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  } = pagination;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);
  const isFirst = safePage <= 1;
  const isLast = safePage >= totalPages;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 font-normal">
      <p className="hidden text-sm text-muted-foreground md:block">
        {total === 0
          ? "No results"
          : `Showing ${from}–${to} of ${total}`}
      </p>

      <div className="flex flex-1 items-center justify-end gap-4">
        {onPageSizeChange && (
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-sm text-muted-foreground">Rows</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Previous page"
            disabled={isFirst}
            onClick={() => onPageChange(safePage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {safePage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Next page"
            disabled={isLast}
            onClick={() => onPageChange(safePage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
