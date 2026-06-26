"use client";

import { Menu } from "lucide-react";
import type { TatBucket, TatSummary } from "@/types/dashboard";
import { cn } from "@/lib/utils";

const GROUPS: {
  key: "total" | "delivered" | "undelivered";
  label: string;
  accent: string;
}[] = [
  { key: "total", label: "Total Shipment", accent: "#457b9d" },
  { key: "delivered", label: "Delivered Shipment", accent: "#2d6a4f" },
  { key: "undelivered", label: "Undelivered Shipment", accent: "#e07a5f" },
];

function PillTitle({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-md bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
      {children}
    </span>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "within" | "beyond" | "total";
}) {
  return (
    <div className="flex flex-col items-center rounded-md border border-border bg-background px-2 py-2 text-center">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-base font-semibold tabular-nums",
          tone === "within" && "text-emerald-600",
          tone === "beyond" && "text-red-600",
          tone === "total" && "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function GroupCard({
  label,
  accent,
  bucket,
}: {
  label: string;
  accent: string;
  bucket: TatBucket | undefined;
}) {
  return (
    <div
      className="rounded-lg border border-border border-l-4 bg-card p-3 shadow-sm"
      style={{ borderLeftColor: accent }}
    >
      <div className="mb-3 text-sm font-semibold text-foreground">{label}</div>
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Within TAT" value={bucket?.withinTat ?? 0} tone="within" />
        <Metric label="Beyond TAT" value={bucket?.beyondTat ?? 0} tone="beyond" />
        <Metric label="Total" value={bucket?.total ?? 0} tone="total" />
      </div>
    </div>
  );
}

export function TatSummaryCard({ data }: { data: TatSummary | undefined }) {
  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <PillTitle>TAT Summary</PillTitle>
        <button
          type="button"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="Menu"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {GROUPS.map((group) => (
          <GroupCard
            key={group.key}
            label={group.label}
            accent={group.accent}
            bucket={data?.[group.key]}
          />
        ))}
      </div>
    </div>
  );
}
