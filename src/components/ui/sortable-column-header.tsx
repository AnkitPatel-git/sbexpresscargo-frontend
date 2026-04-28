"use client"

import { ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type SortOrder = "asc" | "desc"

interface SortableColumnHeaderProps {
    label: string
    field: string
    sortBy: string
    sortOrder: SortOrder
    onSort: (field: string) => void
    className?: string
}

export function SortableColumnHeader({
    label,
    field,
    sortBy,
    sortOrder,
    onSort,
    className,
}: SortableColumnHeaderProps) {
    const isActive = sortBy === field

    return (
        <Button
            type="button"
            variant="ghost"
            className={cn(
                "h-auto p-0 font-semibold text-primary-foreground hover:bg-transparent hover:text-primary-foreground",
                className
            )}
            onClick={() => onSort(field)}
        >
            <span className="inline-flex items-center">
                {label}
                <span className="ml-1 inline-flex flex-col leading-none opacity-80">
                    <ChevronUp className={cn("h-2.5 w-2.5 -mb-1", isActive && sortOrder === "asc" ? "opacity-100" : "opacity-40")} />
                    <ChevronDown className={cn("h-2.5 w-2.5", isActive && sortOrder === "desc" ? "opacity-100" : "opacity-40")} />
                </span>
            </span>
        </Button>
    )
}
