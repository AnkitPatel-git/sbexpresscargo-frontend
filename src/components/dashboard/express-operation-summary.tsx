"use client";

import { Menu } from "lucide-react";
import type { OperationSummary } from "@/types/dashboard";
import { cn } from "@/lib/utils";

const OUTBOUND_LEGEND: { key: keyof OperationSummary["outbound"]["buckets"]; label: string; color: string }[] = [
  { key: "pickupInscan", label: "Pickup Inscan", color: "#2d6a4f" },
  { key: "booking", label: "Booking", color: "#e9c46a" },
  { key: "manifesting", label: "Manifesting", color: "#6c757d" },
  { key: "outForDelivery", label: "Out For Delivery", color: "#e07a5f" },
  { key: "delivered", label: "Delivered", color: "#e76f51" },
  { key: "rto", label: "RTO", color: "#b5c99a" },
  { key: "pending", label: "Pending", color: "#457b9d" },
  { key: "unDelivered", label: "Un Delivered", color: "#9c6644" },
  { key: "obc", label: "OBC", color: "#1d3557" },
  { key: "hold", label: "Hold", color: "#95d5b2" },
  { key: "voidShipments", label: "Void Shipments", color: "#52796f" },
  { key: "appointment", label: "Appointment", color: "#fefae0" },
  { key: "unManifest", label: "UnManifest", color: "#2a9d8f" },
];

const INBOUND_LEGEND: { key: keyof OperationSummary["inbound"]["buckets"]; label: string; color: string }[] = [
  { key: "incoming", label: "Incoming", color: "#2d6a4f" },
  { key: "incomingReceived", label: "Incoming Received", color: "#e9c46a" },
  { key: "pendingIncoming", label: "Pending Incoming", color: "#5c7b99" },
  { key: "delivered", label: "Delivered", color: "#e07a5f" },
  { key: "pending", label: "Pending", color: "#e76f51" },
  { key: "unDelivered", label: "Un Delivered", color: "#b5c99a" },
  { key: "onForwarding", label: "On Forwarding", color: "#457b9d" },
];

function PillTitle({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-md bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
      {children}
    </span>
  );
}

function TreeNode({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-background px-3 py-2 text-center text-xs font-medium shadow-sm min-w-[120px]",
        accent && "border-l-4"
      )}
      style={accent ? { borderLeftColor: accent } : undefined}
    >
      <div className="text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

export function ExpressOutboundSummary({ data }: { data: OperationSummary | undefined }) {
  const s = data?.outbound.summary;
  const buckets = data?.outbound.buckets;

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <PillTitle>Outbound Summary</PillTitle>
        <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Menu">
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-stretch justify-center gap-3 py-6 md:flex-nowrap md:justify-start">
        <TreeNode label="Pickup Inscan" value={s?.pickupInscan ?? 0} accent="#2d6a4f" />
        <div className="hidden items-center md:flex text-muted-foreground">→</div>
        <div className="flex flex-wrap gap-2 md:flex-nowrap">
          <TreeNode label="Booking" value={s?.booking ?? 0} accent="#e9c46a" />
          <TreeNode label="Manifesting" value={s?.manifesting ?? 0} accent="#6c757d" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-4 sm:grid-cols-3 lg:grid-cols-4">
        {OUTBOUND_LEGEND.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-2 text-[11px] leading-tight text-foreground">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-medium tabular-nums">{buckets?.[key] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExpressInboundSummary({ data }: { data: OperationSummary | undefined }) {
  const s = data?.inbound.summary;
  const buckets = data?.inbound.buckets;

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <PillTitle>Inbound Summary</PillTitle>
        <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Menu">
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-stretch justify-center gap-2 py-6 md:flex-nowrap md:justify-start">
        <TreeNode label="Incoming" value={s?.incoming ?? 0} accent="#2d6a4f" />
        <div className="hidden items-center md:flex text-muted-foreground px-1">→</div>
        <div className="flex flex-wrap gap-2 md:flex-nowrap">
          <TreeNode label="Incoming Received" value={s?.incomingReceived ?? 0} accent="#e9c46a" />
          <TreeNode label="Pending Incoming" value={s?.pendingIncoming ?? 0} accent="#5c7b99" />
          <TreeNode label="Delivered" value={s?.delivered ?? 0} accent="#e07a5f" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-4 sm:grid-cols-3 lg:grid-cols-4">
        {INBOUND_LEGEND.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-2 text-[11px] leading-tight text-foreground">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-medium tabular-nums">{buckets?.[key] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
