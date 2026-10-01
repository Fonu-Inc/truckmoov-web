import { useCallback, useEffect, useState } from "react";

const SEARCH_DEBOUNCE_MS = 350;

export function useBillingList<F extends object>(initialFilters: F) {
  const [search, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<F>(initialFilters);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  return {
    search,
    setSearch: setSearchValue,
    debouncedSearch,
    filters,
    setFilter,
    page,
    setPage,
  };
}
