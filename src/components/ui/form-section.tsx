"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Bordered form block with a pill label straddling the top edge (reference UI).
 */
export function FormSection({
  title,
  className,
  contentClassName,
  children,
}: {
  title: React.ReactNode
  className?: string
  /** Applied to the inner content wrapper (padding + layout). */
  contentClassName?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        "relative flex flex-col rounded-lg border border-border/80 bg-card text-card-foreground shadow-[0_1px_3px_rgba(23,42,69,0.08)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute left-4 top-0 z-[1] -translate-y-1/2"
        aria-hidden
      >
        <span className="pointer-events-none inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium leading-none text-primary-foreground shadow-sm">
          {title}
        </span>
      </div>
      <div className={cn("px-6 pb-6 pt-7", contentClassName)}>{children}</div>
    </section>
  )
}
