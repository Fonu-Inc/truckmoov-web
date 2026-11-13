import { useCallback, useState } from "react";
import type { DataTablePagination } from "@/components/shadcn/data-table";

/**
 * Page state for an endpoint that takes `page` + `limit` and returns a `total`.
 *
 * Send `page` and `pageSize` (as `limit`) to the query, then hand
 * `pagination(total)` to `DataTable`. Pass the list's filter values as
 * `resetOn`: when any of them changes the table goes back to page 1, in the
 * same render, so the stale page is never requested.
 */
export function useServerPagination(resetOn: unknown[] = [], initialPageSize = 10) {
  const [pageState, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const resetKey = JSON.stringify(resetOn);
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  let page = pageState;
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setPage(1);
    page = 1;
  }

  const setPageSize = useCallback((next: number) => {
    setPageSizeState(next);
    setPage(1);
  }, []);

  const pagination = useCallback(
    (total: number): DataTablePagination => ({
      page,
      pageSize,
      total,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }),
    [page, pageSize, setPageSize],
  );

  return { page, pageSize, setPage, pagination };
}
