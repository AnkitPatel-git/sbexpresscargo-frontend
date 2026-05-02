import { useCallback, useMemo, type UIEvent } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

const DEFAULT_PAGE_SIZE = 10;

type PaginatedListShape<T> = {
  data: T[];
  meta?: { page: number; totalPages: number; total?: number };
  page?: number;
  totalPages?: number;
};

function getNextPageParamFromResponse<T>(
  lastPage: PaginatedListShape<T>,
  lastPageParam: number,
  pageSize: number,
): number | undefined {
  if (lastPage.meta && typeof lastPage.meta.page === "number" && typeof lastPage.meta.totalPages === "number") {
    if (lastPage.meta.page < lastPage.meta.totalPages) {
      return lastPage.meta.page + 1;
    }
    return undefined;
  }
  if (typeof lastPage.page === "number" && typeof lastPage.totalPages === "number") {
    if (lastPage.page < lastPage.totalPages) {
      return lastPage.page + 1;
    }
    return undefined;
  }
  const rowCount = lastPage.data?.length ?? 0;
  if (rowCount < pageSize) {
    return undefined;
  }
  return lastPageParam + 1;
}

function mergeById<T extends { id: number }>(baseRows: T[], extraRows: T[] | undefined): T[] {
  if (!extraRows?.length) {
    return baseRows;
  }
  const seen = new Set<number>();
  const out: T[] = [];
  for (const row of extraRows) {
    if (seen.has(row.id)) {
      continue;
    }
    seen.add(row.id);
    out.push(row);
  }
  for (const row of baseRows) {
    if (seen.has(row.id)) {
      continue;
    }
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

type UseInfiniteEntityListConfig<T extends { id: number }> = {
  queryKey: readonly unknown[];
  pageSize?: number;
  fetchPage: (page: number) => Promise<PaginatedListShape<T>>;
  extraRows?: T[];
  enabled?: boolean;
  staleTime?: number;
};

type UseInfiniteSearchEntityListConfig<T extends { id: number }> = {
  queryKey: readonly unknown[];
  pageSize?: number;
  /** Server-side filter; debounce in the caller. First page refetches when this changes. */
  search: string;
  fetchPage: (page: number, search: string) => Promise<PaginatedListShape<T>>;
  extraRows?: T[];
  enabled?: boolean;
  staleTime?: number;
};

/**
 * Paged list for selects: first page uses `pageSize` (default 10). Call `fetchNextPage` when the user
 * scrolls the dropdown, or use `onScroll` from `useSelectContentInfiniteScroll`.
 */
export function useInfiniteEntityList<T extends { id: number }>(config: UseInfiniteEntityListConfig<T>) {
  const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
    queryKey: [...config.queryKey, "infinite", pageSize],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => config.fetchPage(pageParam as number),
    getNextPageParam: (lastPage, _pages, lastPageParam) => getNextPageParamFromResponse(lastPage, lastPageParam as number, pageSize),
    enabled: config.enabled !== false,
    staleTime: config.staleTime ?? 60_000,
  });

  const pagesFlat = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data?.pages]);
  const rows = useMemo(() => mergeById(pagesFlat, config.extraRows), [pagesFlat, config.extraRows]);

  return {
    rows,
    /** Flat pages only (no `extraRows` merge), for cache inspection */
    pagesFlat,
    fetchNextPage,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    isInitialLoading: isLoading,
    isError,
    error: error as Error | null,
  };
}

/**
 * Same as {@link useInfiniteEntityList} but passes `search` into every page request and resets pages when `search` changes.
 * Use for server-side typeahead (always use with {@link DEFAULT_PAGE_SIZE} in API calls).
 */
export function useInfiniteSearchEntityList<T extends { id: number }>(
  config: UseInfiniteSearchEntityListConfig<T>,
) {
  const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE;
  const search = config.search;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
    queryKey: [...config.queryKey, "infinite-search", pageSize, search],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => config.fetchPage(pageParam as number, search),
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      getNextPageParamFromResponse(lastPage, lastPageParam as number, pageSize),
    enabled: config.enabled !== false,
    staleTime: config.staleTime ?? 60_000,
  });

  const pagesFlat = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data?.pages]);
  const rows = useMemo(() => mergeById(pagesFlat, config.extraRows), [pagesFlat, config.extraRows]);

  return {
    rows,
    pagesFlat,
    fetchNextPage,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    isInitialLoading: isLoading,
    isError,
    error: error as Error | null,
  };
}

const SCROLL_END_THRESHOLD_PX = 40;

/** Attach to `SelectContent` `onScroll` to load the next page when the user nears the bottom. */
export function useSelectContentInfiniteScroll(options: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}) {
  return useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      if (!options.hasNextPage || options.isFetchingNextPage) {
        return;
      }
      const t = e.currentTarget;
      if (t.scrollTop + t.clientHeight >= t.scrollHeight - SCROLL_END_THRESHOLD_PX) {
        options.fetchNextPage();
      }
    },
    [options.hasNextPage, options.isFetchingNextPage, options.fetchNextPage],
  );
}

export { DEFAULT_PAGE_SIZE as INFINITE_LIST_PAGE_SIZE };

/** Fixed page size for server-backed selects (`DbAsyncSelect`): use as API `limit` with search + scroll paging. */
export const DB_ASYNC_SELECT_PAGE_SIZE = DEFAULT_PAGE_SIZE;
