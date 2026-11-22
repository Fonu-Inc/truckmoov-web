import {
  useEffect, useMemo, useState,
} from "react";

/** Rows per page for the fleet tables that list every vehicle. */
export const FLEET_PAGE_SIZE = 25;

/**
 * Client-side paging for a list that is already fully loaded. The design app's
 * tables have no pager (it shows a handful of demo rows); a tenant can have
 * thousands of vehicles, so these pages slice the list instead of rendering
 * every row at once. Resets to page 1 when the list's length changes (search,
 * filters) — keyed on length, not identity, because callers often rebuild the
 * array on every render.
 */
export function useClientPage<T>(rows: T[], pageSize = FLEET_PAGE_SIZE) {
  const [
    requestedPage,
    setPage,
  ] = useState(1);
  const total = rows.length;

  useEffect(
    () => setPage(1),
    [total],
  );

  const pages = Math.max(
    1,
    Math.ceil(total / pageSize),
  );
  const page = Math.min(
    requestedPage,
    pages,
  );

  const pageRows = useMemo(
    () => rows.slice(
      (page - 1) * pageSize,
      page * pageSize,
    ),
    [
      rows,
      page,
      pageSize,
    ],
  );

  return {
    pageRows,
    page,
    setPage,
    total,
    pageSize,
  };
}
