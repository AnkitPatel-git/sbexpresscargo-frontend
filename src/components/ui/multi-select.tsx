"use client"

import * as React from "react"
import type { UIEvent } from "react"
import { Check, X, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface Option {
  label: string
  value: string | number
}

interface MultiSelectProps {
  options: Option[]
  selected: (string | number)[]
  onChange: (value: (string | number)[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  /** When false, options are not client-filtered (use with server search + `onSearchChange`). Default true. */
  enableClientFilter?: boolean
  /** Fired when the search box value changes (e.g. debounce and refetch server-side). */
  onSearchChange?: (query: string) => void
  /** Attach to the scrollable list (e.g. load next page near bottom). */
  onListScroll?: (e: UIEvent<HTMLDivElement>) => void
  /** Shown at the bottom of the list (e.g. loading more). */
  listFooter?: React.ReactNode
  onOpenChange?: (open: boolean) => void
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  enableClientFilter = true,
  onSearchChange,
  onListScroll,
  listFooter,
  onOpenChange,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
  }

  const handleUnselect = (value: string | number) => {
    onChange(selected.filter((s) => s !== value))
  }

  const handleSelect = (value: string | number) => {
    if (selected.includes(value)) {
      handleUnselect(value)
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-10 py-2",
            className
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length > 0 ? (
              options
                .filter((option) => selected.includes(option.value))
                .map((option) => (
                  <Badge
                    variant="secondary"
                    key={String(option.value)}
                    className="mr-1 mb-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnselect(option.value)
                    }}
                  >
                    {option.label}
                    <X className="ml-1 h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </Badge>
                ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={enableClientFilter}>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={(v) => onSearchChange?.(v)}
          />
          <CommandList onScroll={onListScroll}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="p-1">
              {options.map((option) => (
                <CommandItem
                  key={String(option.value)}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => handleSelect(option.value)}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selected.includes(option.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <Check className={cn("h-4 w-4")} />
                  </div>
                  <span>{option.label}</span>
                </CommandItem>
              ))}
              {listFooter}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
