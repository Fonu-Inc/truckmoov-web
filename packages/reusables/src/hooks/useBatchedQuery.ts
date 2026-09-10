import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { DataTablePagination } from "@/components/shadcn/data-table";

type ServerResponse<T> = { status: boolean; message: string; data: T };
type PaginatedPayload<TItem> = { total: number; items: TItem[] };

export type BatchedQueryArgs<TItem> = {
  /**
   * Factory returning the react-query options for one server batch. Called
   * with the batch's server-side offset + limit. Cache identity must be
   * stable across renders — memoize with useCallback in the consumer.
   */
  queryOptions: (params: { offset: number; limit: number }) => UseQueryOptions<
    ServerResponse<PaginatedPayload<TItem>>
  >;
  /** Rows per table page. Default 10. */
  pageSize?: number;
  /** Rows per server call. One batch covers `batchSize / pageSize` table pages. Default 500. */
  batchSize?: number;
};

export type BatchedQueryResult<TItem> = {
  items: TItem[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  pagination: DataTablePagination;
  setPage: (page: number) => void;
};

export function useBatchedQuery<TItem>({
  queryOptions,
  pageSize: initialPageSize = 10,
  batchSize = 500,
}: BatchedQueryArgs<TItem>): BatchedQueryResult<TItem> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const batchOffset = Math.floor((page - 1) * pageSize / batchSize) * batchSize;
  const query = useQuery(queryOptions({ offset: batchOffset, limit: batchSize }));

  const batchItems = query.data?.data.items ?? [];
  const total = query.data?.data.total ?? 0;
  const startInBatch = (page - 1) * pageSize - batchOffset;
  const items = batchItems.slice(startInBatch, startInBatch + pageSize);

  const setPageSize = useCallback((next: number) => {
    setPageSizeState(next);
    setPage(1);
  }, []);

  const refetch = useCallback(() => {
    query.refetch();
  }, [query]);

  return {
    items,
    total,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch,
    setPage,
    pagination: {
      page,
      pageSize,
      total,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    },
  };
}
