import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/shadcn/button";
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
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const colCount = columns.length || 1;

  return (
    <Table className={className}>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id} className="border-border/50 hover:bg-transparent">
            {group.headers.map((header) => (
              <TableHead
                key={header.id}
                className={(header.column.columnDef.meta as { className?: string } | undefined)?.className}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
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
                  className={(cell.column.columnDef.meta as { className?: string } | undefined)?.className}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
