import type { ColumnDef } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/shadcn/data-table";

type Row = { id: string; name: string };
const columns: ColumnDef<Row>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
];
const rows: Row[] = [
  { id: "1", name: "Alpha" },
  { id: "2", name: "Beta" },
];

describe("DataTable", () => {
  it("renders rows", () => {
    render(<DataTable columns={columns} data={rows} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("renders 5 skeleton rows when loading", () => {
    const { container } = render(<DataTable columns={columns} data={[]} isLoading />);
    // 5 rows x 2 cols = 10 skeleton cells
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(10);
  });

  it("renders error state with retry", () => {
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
    screen.getByRole("button", { name: /try again/i }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders empty state without filters", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyState="Nothing yet."
        filteredEmptyState="No matches."
      />,
    );
    expect(screen.getByText("Nothing yet.")).toBeInTheDocument();
  });

  it("renders filtered empty state when hasActiveFilters", () => {
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
  });
});
