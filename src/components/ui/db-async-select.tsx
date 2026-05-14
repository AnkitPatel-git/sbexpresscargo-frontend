"use client"

/**
 * DB-backed single select — rules:
 * 1. Search is server-side (debounced before querying).
 * 2. Page size is always {@link DB_ASYNC_SELECT_PAGE_SIZE}; load more by scrolling the **option list**
 *    (search stays fixed), or automatically when the first page is shorter than the panel.
 *
 * In `fetchPage`, call your API with `{ page, limit: DB_ASYNC_SELECT_PAGE_SIZE, search }`.
 */

import { useEffect, useMemo, useRef, useState, type Ref } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import {
  DB_ASYNC_SELECT_PAGE_SIZE,
  useInfiniteSearchEntityList,
  useIntersectLoadMoreInScrollRoot,
  useSelectContentInfiniteScroll,
} from "@/hooks/use-infinite-entity-list"

export { DB_ASYNC_SELECT_PAGE_SIZE }

export type DbAsyncSelectFetchResult<T extends { id: number }> = {
  data: T[]
  meta?: { page: number; totalPages: number; total?: number }
  page?: number
  totalPages?: number
}

export type DbAsyncSelectProps<T extends { id: number }> = {
  value: string | undefined
  onValueChange: (value: string) => void
  /** React Query key (search is appended internally). */
  queryKey: readonly unknown[]
  /**
   * Load one page from the server. Must use `limit: DB_ASYNC_SELECT_PAGE_SIZE` and pass `search` to the API.
   */
  fetchPage: (page: number, search: string) => Promise<DbAsyncSelectFetchResult<T>>
  getItemLabel: (item: T) => string
  /** Merged after pages (e.g. current value missing from search results). */
  extraItems?: T[]
  /** Hide rows in the list (paging unchanged). Use for “already picked” filters without server support. */
  visibleItem?: (item: T) => boolean
  placeholder?: string
  disabled?: boolean
  triggerClassName?: string
  contentClassName?: string
  searchPlaceholder?: string
  debounceMs?: number
  /** When set, first option uses these instead of a data row (e.g. none / all). */
  clearOption?: { value: string; label: string }
  id?: string
  "aria-invalid"?: boolean
  triggerRef?: Ref<HTMLButtonElement>
}

export function DbAsyncSelect<T extends { id: number }>({
  value,
  onValueChange,
  queryKey,
  fetchPage,
  getItemLabel,
  extraItems,
  visibleItem,
  placeholder,
  disabled,
  triggerClassName,
  contentClassName,
  searchPlaceholder = "Search…",
  debounceMs = 300,
  clearOption,
  id,
  "aria-invalid": ariaInvalid,
  triggerRef,
}: DbAsyncSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectScrollRootRef = useRef<HTMLDivElement | null>(null)
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = useDebounce(search, debounceMs)
  const trimmedSearch = debouncedSearch.trim()
  const selectedIdForExtras =
    value && (!clearOption || value !== clearOption.value) ? Number(value) : NaN

  const extraRowsForQuery = useMemo(() => {
    if (!extraItems?.length) {
      return extraItems
    }
    const q = trimmedSearch.toLowerCase()
    if (!q) {
      return extraItems
    }
    return extraItems.filter((item) => {
      if (Number.isFinite(selectedIdForExtras) && item.id === selectedIdForExtras) {
        return true
      }
      return getItemLabel(item).toLowerCase().includes(q)
    })
  }, [extraItems, getItemLabel, selectedIdForExtras, trimmedSearch])

  const { rows, fetchNextPage, hasNextPage, isFetchingNextPage, isInitialLoading } = useInfiniteSearchEntityList<T>({
    queryKey,
    pageSize: DB_ASYNC_SELECT_PAGE_SIZE,
    search: trimmedSearch,
    fetchPage,
    extraRows: extraRowsForQuery,
    enabled: open,
  })

  const listRows = visibleItem ? rows.filter(visibleItem) : rows

  const onScroll = useSelectContentInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: () => {
      void fetchNextPage()
    },
  })

  useIntersectLoadMoreInScrollRoot({
    enabled: open,
    scrollRootRef: selectScrollRootRef,
    sentinelRef: loadMoreSentinelRef,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: () => {
      void fetchNextPage()
    },
    listLength: listRows.length,
  })

  useEffect(() => {
    if (!open) {
      return
    }
    const id = requestAnimationFrame(() => {
      searchInputRef.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  return (
    <div className="min-w-0 w-full max-w-full">
      <Select
        value={value}
        onValueChange={onValueChange}
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setSearch("")
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger
          ref={triggerRef}
          id={id}
          aria-invalid={ariaInvalid}
          className={cn(triggerClassName)}
          disabled={disabled}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          viewportClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
          className={cn(contentClassName)}
        >
          <div
            className="shrink-0 border-b border-border bg-popover p-2"
            onPointerDown={(e) => {
              // Do not preventDefault when the click is on the input: bubbling would cancel
              // focus and block typing after picking an item or refocusing the field.
              if ((e.target as HTMLElement | null)?.closest("input")) {
                return
              }
              e.preventDefault()
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 bg-background"
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <div
            ref={selectScrollRootRef}
            className="min-h-0 flex-1 overflow-y-auto px-1 pb-1"
            onScroll={onScroll}
          >
            {clearOption ? (
              <SelectItem value={clearOption.value} className="font-medium">
                {clearOption.label}
              </SelectItem>
            ) : null}
            {isInitialLoading ? (
              <div className="px-2 py-2 text-center text-xs text-muted-foreground">Loading…</div>
            ) : (
              listRows.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {getItemLabel(item)}
                </SelectItem>
              ))
            )}
            {!isInitialLoading && listRows.length === 0 && !clearOption ? (
              <div className="px-2 py-2 text-center text-xs text-muted-foreground">No results</div>
            ) : null}
            {isFetchingNextPage ? (
              <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">Loading more…</div>
            ) : null}
            {hasNextPage && !isInitialLoading ? (
              <div ref={loadMoreSentinelRef} className="h-px w-full shrink-0" aria-hidden />
            ) : null}
          </div>
        </SelectContent>
      </Select>
    </div>
  )
}
