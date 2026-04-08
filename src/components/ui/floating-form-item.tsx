"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "@/components/ui/form"

/** Inner field: value sits below the top border; label is on the border (see FloatingFieldSurface). */
export const FLOATING_INNER_CONTROL = cn(
  "h-auto min-h-[1.75rem] w-full border-0 bg-transparent px-0 py-0.5 text-sm shadow-none outline-none",
  "focus-visible:ring-0 focus-visible:ring-offset-0 rounded-sm",
  "dark:bg-transparent",
  "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium"
)

/** Styles for combobox / button triggers inside the floating shell. */
export const FLOATING_INNER_COMBO = cn(
  FLOATING_INNER_CONTROL,
  "justify-between font-normal"
)

/** Outlined "notch": label straddles the top border (gap in border via label background). */
const outlinedSurfaceClass = cn(
  "relative rounded-md border bg-transparent px-2.5 pb-1.5 pt-2.5 shadow-xs transition-[color,box-shadow]",
  "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
)

const outlinedLabelClass = cn(
  "absolute left-3 top-0 z-[1] mb-0 -translate-y-1/2 bg-card px-1 text-xs font-normal leading-none text-foreground select-none",
  "data-[error=true]:text-destructive"
)

const outlinedStaticLabelClass = cn(
  "absolute left-3 top-0 z-[1] -translate-y-1/2 bg-card px-1 text-xs font-normal leading-none text-foreground select-none"
)

function FloatingFieldSurface({
  label,
  className,
  children,
}: {
  label: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  const { error } = useFormField()

  return (
    <div
      className={cn(
        outlinedSurfaceClass,
        error ? "border-destructive" : "border-input",
        className
      )}
    >
      <FormLabel className={outlinedLabelClass}>{label}</FormLabel>
      {children}
    </div>
  )
}

/** Same outlined shell for non–FormField usage (e.g. file input). */
export function OutlinedFieldShell({
  label,
  className,
  children,
}: {
  label: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        outlinedSurfaceClass,
        "border-input",
        className
      )}
    >
      <span className={outlinedStaticLabelClass}>{label}</span>
      {children}
    </div>
  )
}

export function FloatingFormItem({
  label,
  className,
  itemClassName,
  children,
}: {
  label: React.ReactNode
  className?: string
  itemClassName?: string
  children: React.ReactNode
}) {
  return (
    <FormItem className={cn("gap-0", itemClassName)}>
      <FloatingFieldSurface label={label} className={className}>
        {children}
      </FloatingFieldSurface>
      <FormMessage className="mt-1" />
    </FormItem>
  )
}
