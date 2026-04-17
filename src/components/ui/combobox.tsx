"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
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

interface ComboboxProps {
  options: { label: string; value: string | number }[]
  value?: string | number
  onChange: (value: string | number) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  searchValue?: string
  onSearchValueChange?: (value: string) => void
  isSearching?: boolean
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  searchValue,
  onSearchValueChange,
  isSearching = false,
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [localSearchValue, setLocalSearchValue] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)
  const currentSearchValue = searchValue ?? localSearchValue

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex w-full min-w-0 justify-between overflow-hidden font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={currentSearchValue}
            onValueChange={(nextValue) => {
              if (onSearchValueChange) {
                onSearchValueChange(nextValue)
                return
              }
              setLocalSearchValue(nextValue)
            }}
          />
          <CommandList>
            <CommandEmpty>{isSearching ? "Searching..." : emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                  <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value === value ? "" : option.value)
                    if (onSearchValueChange) onSearchValueChange("")
                    else setLocalSearchValue("")
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
