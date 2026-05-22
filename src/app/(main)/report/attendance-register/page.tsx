"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { optionLabelById } from "@/lib/select-closed-label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { customerService } from "@/services/masters/customer-service";
import { serviceCenterService } from "@/services/masters/service-center-service";
import { AttendanceUserMonthLogDialog } from "@/components/reports/attendance-user-month-log-dialog";
import { attendanceRegisterService } from "@/services/reports/attendance-register-service";
import { useAuth } from "@/context/auth-context";

function istCalendarParts(): { year: number; month: number } {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return { year: ist.getUTCFullYear(), month: ist.getUTCMonth() + 1 };
}

function AttendanceRegisterPanel() {
  const { isCustomerUser, defaultCustomerId, effectiveCustomerIds } = useAuth();
  const defaults = useMemo(() => istCalendarParts(), []);
  const [year, setYear] = useState(defaults.year);
  const [month, setMonth] = useState(defaults.month);
  const [serviceCenterId, setServiceCenterId] = useState<string>("all");
  const [customerId, setCustomerId] = useState<string>(
    isCustomerUser && Number(defaultCustomerId) > 0 ? String(defaultCustomerId) : "all",
  );
  const [downloading, setDownloading] = useState(false);
  const [logDialog, setLogDialog] = useState<{
    userId: number;
    userName: string;
  } | null>(null);

  useEffect(() => {
    if (!isCustomerUser) return;
    const scoped = Number(defaultCustomerId);
    if (Number.isInteger(scoped) && scoped > 0) {
      setCustomerId(String(scoped));
    }
  }, [defaultCustomerId, isCustomerUser]);

  const registerParams = useMemo(
    () => ({
      year,
      month,
      serviceCenterId: serviceCenterId === "all" ? undefined : Number(serviceCenterId),
      customerId:
        isCustomerUser && Number(defaultCustomerId) > 0
          ? Number(defaultCustomerId)
          : customerId === "all"
            ? undefined
            : Number(customerId),
    }),
    [year, month, serviceCenterId, customerId, isCustomerUser, defaultCustomerId],
  );

  const { data, isFetching, isError, error, isLoading } = useQuery({
    queryKey: ["attendance-register-preview", registerParams],
    queryFn: () => attendanceRegisterService.fetchMonthRegisterPreview(registerParams),
  });

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  const { data: serviceCenters } = useQuery({
    queryKey: ["attendance-register-service-centers"],
    queryFn: () =>
      serviceCenterService.getServiceCenters({
        page: 1,
        limit: 500,
        sortBy: "name",
        sortOrder: "asc",
      }),
  });

  const { data: customers } = useQuery({
    queryKey: ["attendance-register-customers"],
    queryFn: () =>
      customerService.getCustomers({
        page: 1,
        limit: 500,
        sortBy: "name",
        sortOrder: "asc",
      }),
  });

  const allowedCustomerIds = new Set(effectiveCustomerIds);

  const yearOptions = useMemo(() => {
    const y = defaults.year;
    return [y - 1, y, y + 1];
  }, [defaults.year]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const { blob, filename } = await attendanceRegisterService.downloadMonthRegister(
        registerParams,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Attendance register downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  const showTableSkeleton = isLoading || (isFetching && !data);

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Year</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger>
              <SelectValue>{year}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Month</Label>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger>
              <SelectValue>
                {new Date(2000, month - 1).toLocaleString("en-IN", { month: "long" })}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {new Date(2000, m - 1).toLocaleString("en-IN", { month: "long" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Service center (optional)</Label>
          <Select value={serviceCenterId} onValueChange={setServiceCenterId}>
            <SelectTrigger>
              <SelectValue placeholder="All">
                {serviceCenterId === "all"
                  ? "All"
                  : optionLabelById(serviceCenterId, serviceCenters?.data, (sc) => `${sc.name} (${sc.code})`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {(serviceCenters?.data ?? []).map((sc) => (
                <SelectItem key={sc.id} value={String(sc.id)}>
                  {sc.name} ({sc.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Customer / company (optional)</Label>
          <Select value={customerId} onValueChange={setCustomerId} disabled={isCustomerUser}>
            <SelectTrigger>
              <SelectValue placeholder="All">
                {customerId === "all"
                  ? "All"
                  : optionLabelById(customerId, customers?.data, (c) => `${c.name} (${c.code})`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {!isCustomerUser && <SelectItem value="all">All</SelectItem>}
              {(customers?.data ?? [])
                .filter((customer) =>
                  !isCustomerUser || allowedCustomerIds.size === 0
                    ? true
                    : allowedCustomerIds.has(customer.id),
                )
                .map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name} ({c.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-medium">
            {data?.monthTitle ?? "Report"}
            {data != null ? (
              <span className="text-muted-foreground font-normal">
                {" "}
                · {data.rows.length} employee{data.rows.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </h2>
          <p className="text-xs text-muted-foreground">
            Preview updates when you change filters. Download uses the same filters.
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0"
          onClick={() => void handleDownload()}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download report
        </Button>
      </div>

      <div className="relative rounded-md border border-border">
        {showTableSkeleton ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading register…
          </div>
        ) : isError ? (
          <p className="py-12 text-center text-sm text-destructive">
            Could not load the register preview. You can still try downloading the Excel file.
          </p>
        ) : data && data.rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No active users match these filters for this month.
          </p>
        ) : data ? (
          <>
            {isFetching ? (
              <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating…
              </div>
            ) : null}
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="sticky left-0 z-20 min-w-[3rem] bg-card shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                    Sr
                  </TableHead>
                  <TableHead className="sticky left-[3rem] z-20 min-w-[9rem] bg-card shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                    Name
                  </TableHead>
                  <TableHead className="sticky left-[12rem] z-20 min-w-[7rem] bg-card shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                    Location
                  </TableHead>
                  <TableHead className="sticky left-[19rem] z-20 min-w-[7rem] bg-card shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                    Company
                  </TableHead>
                  {data.dayHeaders.map((h) => (
                    <TableHead key={h.day} className="px-1 text-center align-bottom">
                      <div className="flex flex-col items-center gap-0.5 leading-none">
                        <span className="text-[11px] font-semibold">{h.day}</span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {h.weekday}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                  {data.summaryColumnKeys.map((key) => (
                    <TableHead key={key} className="min-w-[3.25rem] text-center text-xs">
                      {key.trim()}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => (
                  <TableRow key={row.userId}>
                    <TableCell className="sticky left-0 z-10 bg-card font-mono text-xs shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                      {row.serial}
                    </TableCell>
                    <TableCell className="sticky left-[3rem] z-10 max-w-[10rem] bg-card text-xs shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                      <button
                        type="button"
                        className="max-w-full truncate text-left font-medium text-primary underline-offset-2 hover:underline"
                        title={`View ${row.name} attendance log`}
                        onClick={() =>
                          setLogDialog({ userId: row.userId, userName: row.name })
                        }
                      >
                        {row.name}
                      </button>
                    </TableCell>
                    <TableCell className="sticky left-[12rem] z-10 max-w-[8rem] truncate bg-card text-xs text-muted-foreground shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                      {row.location || "—"}
                    </TableCell>
                    <TableCell className="sticky left-[19rem] z-10 max-w-[8rem] truncate bg-card text-xs text-muted-foreground shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                      {row.company || "—"}
                    </TableCell>
                    {row.dayCodes.map((code, i) => (
                      <TableCell
                        key={i}
                        className="px-1 text-center font-mono text-[11px] tabular-nums"
                      >
                        {code}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-mono text-xs">{row.summary.p}</TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      {row.summary.halfDay}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">{row.summary.a}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{row.summary.h}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{row.summary.wo}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{row.summary.hp}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{row.summary.wop}</TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      {row.summary.leave}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      {row.summary.payDays}
                    </TableCell>
                    <TableCell
                      className="max-w-[10rem] truncate text-xs text-muted-foreground"
                      title={row.status || undefined}
                    >
                      {row.status || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : null}
      </div>

      <AttendanceUserMonthLogDialog
        open={logDialog != null}
        onOpenChange={(open) => {
          if (!open) setLogDialog(null);
        }}
        userId={logDialog?.userId ?? null}
        userName={logDialog?.userName ?? ""}
        year={year}
        month={month}
      />
    </div>
  );
}

export default function AttendanceRegisterPage() {
  return (
    <div className="mx-auto max-w-[min(100%,120rem)] space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/report/mis" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to reports
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Calendar className="h-5 w-5" />
          Attendance register
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          View the monthly matrix on this page, then download the same filtered report as Excel. Click
          an employee name to open their punch log for the selected month (photos, times, and GPS).
          One row per active user (with a profile), day columns with codes from mobile check-in data,
          and summary counts. <strong>P</strong> present, <strong>HD</strong> short shift (&lt; 4h
          worked), <strong>A</strong> absent, <strong>WO</strong> weekend with no punch,{" "}
          <strong>L</strong> late flag, <strong>LEAVE</strong> / <strong>LEFT</strong> from remarks.
          Requires <span className="font-mono">report.attendance.read</span>.
        </p>
      </div>

      <PermissionGuard
        permission="report.attendance.read"
        fallback={
          <p className="text-sm text-muted-foreground">
            You need the <span className="font-mono">report.attendance.read</span> permission
            (e.g. Human Resource or Super Admin) to view and download the register.
          </p>
        }
      >
        <AttendanceRegisterPanel />
      </PermissionGuard>
    </div>
  );
}
