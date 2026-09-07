"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { getTodayIndiaYyyyMmDd } from "@/lib/india-date";

const HOURS_24 = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 }, (_, minute) =>
  String(minute).padStart(2, "0"),
);

const nativeSelectClass = cn(
  "h-9 min-w-[4.25rem] rounded-md border border-input bg-transparent px-2 text-sm tabular-nums shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

function parseHhMm(value?: string | null): { hours: string; minutes: string } {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})/);
  if (!match) return { hours: "00", minutes: "00" };
  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const minutes = Math.min(59, Math.max(0, Number(match[2])));
  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
  };
}

type Time24SelectProps = {
  id?: string;
  value?: string;
  onChange: (hhmm: string) => void;
  disabled?: boolean;
  className?: string;
  selectClassName?: string;
  "aria-label"?: string;
};

/** Hour + minute dropdowns in 24-hour format (HH:mm). Independent of OS locale. */
export function Time24Select({
  id,
  value,
  onChange,
  disabled,
  className,
  selectClassName,
  "aria-label": ariaLabel = "Time (24-hour)",
}: Time24SelectProps) {
  const { hours, minutes } = parseHhMm(value);
  const selectCn = cn(nativeSelectClass, selectClassName);

  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={ariaLabel}>
      <select
        id={id}
        aria-label="Hour"
        className={selectCn}
        disabled={disabled}
        value={hours}
        onChange={(event) => onChange(`${event.target.value}:${minutes}`)}
      >
        {HOURS_24.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <span className="text-muted-foreground select-none" aria-hidden>
        :
      </span>
      <select
        aria-label="Minute"
        className={selectCn}
        disabled={disabled}
        value={minutes}
        onChange={(event) => onChange(`${hours}:${event.target.value}`)}
      >
        {MINUTES.map((minute) => (
          <option key={minute} value={minute}>
            {minute}
          </option>
        ))}
      </select>
    </div>
  );
}

type DateTime24InputProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  dateClassName?: string;
  selectClassName?: string;
};

/**
 * Date + 24h time selectors. Value is `YYYY-MM-DDTHH:mm` (IST wall clock),
 * same shape as datetime-local, without OS 12/24-hour conversion.
 */
export function DateTime24Input({
  id,
  value,
  onChange,
  disabled,
  className,
  dateClassName,
  selectClassName,
}: DateTime24InputProps) {
  const trimmed = value?.trim() ?? "";
  const datePart = trimmed.includes("T")
    ? trimmed.slice(0, 10)
    : /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      ? trimmed
      : "";
  const timePart = trimmed.includes("T") ? trimmed.slice(11, 16) : "";
  const { hours, minutes } = parseHhMm(timePart || "00:00");
  const hhmm = `${hours}:${minutes}`;

  function emit(nextDate: string, nextTime: string) {
    if (!nextDate && !nextTime) {
      onChange("");
      return;
    }
    onChange(`${nextDate || getTodayIndiaYyyyMmDd()}T${nextTime || "00:00"}`);
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <input
        id={id}
        type="date"
        aria-label="Date"
        disabled={disabled}
        value={datePart}
        onChange={(event) => emit(event.target.value, hhmm)}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 min-w-[10.5rem] rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          dateClassName,
        )}
      />
      <Time24Select
        disabled={disabled}
        value={hhmm}
        selectClassName={selectClassName}
        onChange={(nextTime) => emit(datePart, nextTime)}
      />
    </div>
  );
}
