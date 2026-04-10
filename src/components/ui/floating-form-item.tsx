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

/** SelectTrigger — same shell treatment as combobox. */
export const FLOATING_INNER_SELECT_TRIGGER = FLOATING_INNER_COMBO

/** Textarea inside the outlined shell. */
export const FLOATING_INNER_TEXTAREA = cn(
  FLOATING_INNER_CONTROL,
  "min-h-[4.5rem] resize-none py-1"
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

const outlinedSectionNavyLabelClass = cn(
  "absolute left-3 top-0 z-[1] -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium leading-none text-primary-foreground shadow-sm select-none"
)

/**
 * Larger outlined panel (tables, toolbars) with the same notch label as fields / Import CSV.
 * `labelTone="navy"` uses the app primary (navy) pill on the border with white text.
 */
export function OutlinedFormSection({
  label,
  labelTone = "notch",
  className,
  children,
}: {
  label: React.ReactNode
  /** `notch` matches floating fields; `navy` is a solid primary pill + white label text. */
  labelTone?: "notch" | "navy"
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        "relative rounded-md border border-input bg-card px-3 pb-3 pt-5 shadow-xs",
        className
      )}
    >
      <span
        className={labelTone === "navy" ? outlinedSectionNavyLabelClass : outlinedStaticLabelClass}
      >
        {label}
      </span>
      <div className="relative z-0 space-y-3 pt-0.5">{children}</div>
    </section>
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
