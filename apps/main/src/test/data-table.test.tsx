import type { ColumnDef } from "@tanstack/react-table";
import {
  act, fireEvent, render, renderHook, screen,
} from "@testing-library/react";
import { useServerPagination } from "@truckmoov/reusables/hooks/useServerPagination";
import {
  describe, expect, it, vi,
} from "vitest";
import { DataTable } from "@/components/shadcn/data-table";

type Row = {
  id: string; name: string;
};
const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "id", header: "ID",
  },
  {
    accessorKey: "name", header: "Name",
  },
];
const rows: Row[] = [
  {
    id: "1", name: "Alpha",
  },
  {
    id: "2", name: "Beta",
  },
];

describe(
  "dataTable",
  () => {
    it(
      "renders rows",
      () => {
        render(
          <DataTable
            columns={columns}
            data={rows}
          />,
        );
        expect(screen.getByText("Alpha")).toBeInTheDocument();
        expect(screen.getByText("Beta")).toBeInTheDocument();
      },
    );

    it(
      "renders 5 skeleton rows when loading",
      () => {
        const { container } = render(
          <DataTable
            columns={columns}
            data={[]}
            isLoading
          />,
        );
        // 5 rows x 2 cols = 10 skeleton cells
        expect(container.querySelectorAll(".animate-pulse")).toHaveLength(10);
      },
    );

    it(
      "renders error state with retry",
      () => {
        const onRetry = vi.fn();
        render(
          <DataTable
            columns={columns}
            data={[]}
            isError
            errorMessage="Boom."
            onRetry={onRetry}
          />,
        );
        expect(screen.getByText("Boom.")).toBeInTheDocument();
        screen.getByRole(
          "button",
          { name: /try again/i },
        ).click();
        expect(onRetry).toHaveBeenCalledOnce();
      },
    );

    it(
      "renders empty state without filters",
      () => {
        render(
          <DataTable
            columns={columns}
            data={[]}
            emptyState="Nothing yet."
            filteredEmptyState="No matches."
          />,
        );
        expect(screen.getByText("Nothing yet.")).toBeInTheDocument();
      },
    );

    it(
      "renders filtered empty state when hasActiveFilters",
      () => {
        render(
          <DataTable
            columns={columns}
            data={[]}
            hasActiveFilters
            emptyState="Nothing yet."
            filteredEmptyState="No matches."
          />,
        );
        expect(screen.getByText("No matches.")).toBeInTheDocument();
      },
    );

    const many: Row[] = Array.from(
      { length: 23 },
      (_, i) => ({
        id: String(i + 1), name: `Row ${i + 1}`,
      }),
    );
    const next = () => fireEvent.click(screen.getByRole(
      "button",
      { name: "Next page" },
    ));

    it(
      "pages client-side when no pagination prop is given",
      () => {
        render(
          <DataTable
            columns={columns}
            data={many}
          />,
        );
        expect(screen.getByText("Row 10")).toBeInTheDocument();
        expect(screen.queryByText("Row 11")).not.toBeInTheDocument();
        expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();

        next();
        expect(screen.getByText("Row 11")).toBeInTheDocument();
        expect(screen.queryByText("Row 10")).not.toBeInTheDocument();
        expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
      },
    );

    it(
      "steps back to the last page when the rows shrink",
      () => {
        const { rerender } = render(
          <DataTable
            columns={columns}
            data={many}
          />,
        );
        next();
        next();
        expect(screen.getByText("Row 21")).toBeInTheDocument();

        rerender(
          <DataTable
            columns={columns}
            data={many.slice(
              0,
              15,
            )}
          />,
        );
        expect(screen.getByText("Row 11")).toBeInTheDocument();
        expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
      },
    );

    it(
      "keeps the page when the parent passes a new array with the same rows",
      () => {
        const { rerender } = render(
          <DataTable
            columns={columns}
            data={many}
          />,
        );
        next();
        rerender(
          <DataTable
            columns={columns}
            data={[...many]}
          />,
        );
        expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
      },
    );

    it(
      "shows no footer when the rows fit on one page",
      () => {
        render(
          <DataTable
            columns={columns}
            data={rows}
          />,
        );
        expect(screen.queryByText(/Page \d+ of/)).not.toBeInTheDocument();
      },
    );

    it(
      "renders every row when pagination is false",
      () => {
        render(
          <DataTable
            columns={columns}
            data={many}
            pagination={false}
          />,
        );
        expect(screen.getByText("Row 23")).toBeInTheDocument();
        expect(screen.queryByText(/Page \d+ of/)).not.toBeInTheDocument();
      },
    );

    it(
      "renders server rows as given and reports page changes",
      () => {
        const onPageChange = vi.fn();
        render(
          <DataTable
            columns={columns}
            data={rows}
            pagination={{
              page: 1, pageSize: 2, total: 6, onPageChange,
            }}
          />,
        );
        expect(screen.getByText("Showing 1–2 of 6")).toBeInTheDocument();
        next();
        expect(onPageChange).toHaveBeenCalledWith(2);
      },
    );

    it(
      "useServerPagination resets to page 1 when a filter changes",
      () => {
        const {
          result, rerender,
        } = renderHook(
          ({ filter }) => useServerPagination([filter]),
          { initialProps: { filter: "a" } },
        );
        act(() => result.current.setPage(3));
        expect(result.current.page).toBe(3);

        rerender({ filter: "b" });
        expect(result.current.page).toBe(1);
        expect(result.current.pagination(50)).toMatchObject({
          page: 1, pageSize: 10, total: 50,
        });
      },
    );
  },
);
