"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  integerInputDisplayValue,
  parseOptionalIntegerInput,
  type ParseIntegerOptions,
} from "@/lib/integer-input"

export type IntegerInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "inputMode" | "autoComplete"
> & {
  value?: unknown
  onValueChange?: (value: number | undefined) => void
} & ParseIntegerOptions

/**
 * Whole numbers only: no spinner, no decimal separator, shows blank when empty (not 0 unless user entered 0).
 */
const IntegerInput = React.forwardRef<HTMLInputElement, IntegerInputProps>(function IntegerInput(
  { className, value, onValueChange, min, max, allowNegative, disabled, onBlur, onFocus, ...rest },
  ref,
) {
  const opts = React.useMemo(() => ({ min, max, allowNegative }), [min, max, allowNegative])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(parseOptionalIntegerInput(e.target.value, opts))
  }

  return (
    <Input
      ref={ref}
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      className={cn(className)}
      value={integerInputDisplayValue(value)}
      onChange={handleChange}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  )
})

export { IntegerInput }
