"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  decimalInputDisplayValue,
  parseOptionalDecimalInput,
  sanitizeDecimalRaw,
  type ParseDecimalOptions,
} from "@/lib/decimal-input"

export type DecimalInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "inputMode" | "autoComplete"
> & {
  value?: unknown
  onValueChange?: (value: number | undefined) => void
  /** Max fractional digits. Default 2. */
  decimalPlaces?: number
} & ParseDecimalOptions

/**
 * Non-negative decimals by default (e.g. rates). Preserves trailing "." while typing.
 */
const DecimalInput = React.forwardRef<HTMLInputElement, DecimalInputProps>(function DecimalInput(
  {
    className,
    value,
    onValueChange,
    min,
    max,
    allowNegative,
    decimalPlaces = 2,
    disabled,
    onBlur,
    onFocus,
    ...rest
  },
  ref,
) {
  const opts = React.useMemo(
    () => ({ min, max, allowNegative, decimalPlaces }),
    [min, max, allowNegative, decimalPlaces],
  )
  const [display, setDisplay] = React.useState(() => decimalInputDisplayValue(value, decimalPlaces))
  const focusedRef = React.useRef(false)

  React.useEffect(() => {
    if (!focusedRef.current) {
      setDisplay(decimalInputDisplayValue(value, decimalPlaces))
    }
  }, [value, decimalPlaces])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = sanitizeDecimalRaw(e.target.value, decimalPlaces)
    setDisplay(next)
    onValueChange?.(parseOptionalDecimalInput(next, opts))
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    focusedRef.current = true
    onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    focusedRef.current = false
    const parsed = parseOptionalDecimalInput(display, opts)
    setDisplay(decimalInputDisplayValue(parsed, decimalPlaces))
    onValueChange?.(parsed)
    onBlur?.(e)
  }

  return (
    <Input
      ref={ref}
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      disabled={disabled}
      className={cn(className)}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  )
})

export { DecimalInput }
