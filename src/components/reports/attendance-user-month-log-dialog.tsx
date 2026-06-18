"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, ImageIcon, Loader2, MapPin } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatReportDateTime } from "@/lib/format-date-only";
import {
  attendanceRegisterService,
  type AttendanceMonthLogDay,
  type AttendanceMonthLogRecord,
} from "@/services/reports/attendance-register-service";

function formatIstTime(iso: string | null): string {
  if (!iso) return "—";
  return formatReportDateTime(iso);
}

function dayCodeBadgeClass(code: string): string {
  switch (code) {
    case "P":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
    case "HD":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "A":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    case "WO":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    case "L":
      return "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200";
    case "LEAVE":
    case "LEFT":
      return "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function PhotoSlot({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function PhotoEmpty({ message }: { message: string }) {
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-muted/30 text-muted-foreground">
      <ImageIcon className="h-5 w-5 opacity-50" />
      <span className="text-[11px]">{message}</span>
    </div>
  );
}

function AttendancePhoto({
  attendanceId,
  type,
  label,
  hasPhoto,
}: {
  attendanceId: number;
  type: "checkin" | "checkout";
  label: string;
  hasPhoto: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!hasPhoto) {
      setSrc(null);
      setFailed(false);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    void attendanceRegisterService
      .fetchAttendancePhoto(attendanceId, type)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attendanceId, type, hasPhoto]);

  return (
    <PhotoSlot label={label}>
      {!hasPhoto ? (
        <PhotoEmpty message="No photo" />
      ) : loading ? (
        <div className="flex aspect-[4/3] items-center justify-center rounded-md border bg-muted/40">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : failed || !src ? (
        <PhotoEmpty message="Could not load" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${label} selfie`}
          className="aspect-[4/3] w-full rounded-md border object-cover"
        />
      )}
    </PhotoSlot>
  );
}

function PunchBlock({
  title,
  time,
  address,
  lat,
  lng,
  photo,
}: {
  title: string;
  time: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  photo: ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-md border bg-muted/20 p-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="flex items-center gap-1 text-xs">
        <Clock className="h-3 w-3" />
        {formatIstTime(time)}
      </p>
      {address ? (
        <p className="flex gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{address}</span>
        </p>
      ) : null}
      {lat != null && lng != null ? (
        <p className="font-mono text-[10px] text-muted-foreground">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      ) : null}
      {photo}
    </div>
  );
}

function DayLogCard({ day }: { day: AttendanceMonthLogDay }) {
  const att = day.attendance;
  const hasPunch = Boolean(att?.checkedIn || att?.checkedOut);

  return (
    <article
      className={cn(
        "rounded-lg border p-3",
        hasPunch ? "border-border bg-card" : "border-dashed bg-muted/20",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DayTitle day={day} />
        <Badge
          variant="secondary"
          className={cn("font-mono text-[11px]", dayCodeBadgeClass(day.dayCode))}
        >
          {day.dayCode}
        </Badge>
      </div>

      {att && hasPunch ? (
        <DayPunchDetails att={att} />
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">No punch recorded for this day.</p>
      )}
    </article>
  );
}

function DayTitle({ day }: { day: AttendanceMonthLogDay }) {
  return (
    <div>
      <p className="text-sm font-medium">
        {day.date} · {day.weekday}
      </p>
      {day.attendance?.status ? (
        <p className="text-xs text-muted-foreground">Status: {day.attendance.status}</p>
      ) : null}
    </div>
  );
}

function DayPunchDetails({ att }: { att: AttendanceMonthLogRecord }) {
  return (
    <div className="mt-3 grid gap-4 lg:grid-cols-2">
      <PunchBlock
        title="Check in"
        time={att.checkedInAt}
        address={att.checkInAddress}
        lat={att.checkInLat}
        lng={att.checkInLng}
        photo={
          <AttendancePhoto
            attendanceId={att.id}
            type="checkin"
            label="Check-in photo"
            hasPhoto={!!att.checkInPhotoPath}
          />
        }
      />
      <PunchBlock
        title="Check out"
        time={att.checkedOutAt}
        address={att.checkOutAddress}
        lat={att.checkOutLat}
        lng={att.checkOutLng}
        photo={
          <AttendancePhoto
            attendanceId={att.id}
            type="checkout"
            label="Check-out photo"
            hasPhoto={!!att.checkOutPhotoPath}
          />
        }
      />
      <div className="space-y-1 text-xs text-muted-foreground lg:col-span-2">
        {att.workingHours ? (
          <p>
            Working time:{" "}
            <span className="font-medium text-foreground">{att.workingHours}</span>
          </p>
        ) : null}
        {att.remarks ? <p>Remarks: {att.remarks}</p> : null}
        {att.autoCloseReason ? (
          <p className="text-amber-700 dark:text-amber-400">Auto-closed: {att.autoCloseReason}</p>
        ) : null}
      </div>
    </div>
  );
}

function isNotableDay(day: AttendanceMonthLogDay): boolean {
  return Boolean(
    day.attendance?.checkedIn ||
      day.attendance?.checkedOut ||
      day.dayCode === "LEAVE" ||
      day.dayCode === "LEFT",
  );
}

export type AttendanceUserMonthLogDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number | null;
  userName: string;
  year: number;
  month: number;
};

export function AttendanceUserMonthLogDialog({
  open,
  onOpenChange,
  userId,
  userName,
  year,
  month,
}: AttendanceUserMonthLogDialogProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["attendance-user-month-log", userId, year, month],
    queryFn: () =>
      attendanceRegisterService.fetchUserMonthLog(userId!, { year, month }),
    enabled: open && userId != null,
  });

  const notableDays = data?.days.filter(isNotableDay) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,52rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="pr-8">{userName}</DialogTitle>
          <DialogDescription>
            {data?.monthTitle ?? `${month}/${year}`} — daily punches with photos and GPS
          </DialogDescription>
          {data ? (
            <p className="text-xs text-muted-foreground">
              {data.location || "—"}
              {data.company ? ` · ${data.company}` : ""}
              {" · "}
              P {data.summary.p} · HD {data.summary.halfDay} · A {data.summary.a} · Pay days{" "}
              {data.summary.payDays}
            </p>
          ) : null}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading attendance log…
            </div>
          ) : isError ? (
            <p className="py-12 text-center text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to load log"}
            </p>
          ) : data ? (
            <div className="space-y-3">
              {notableDays.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No punches recorded this month.
                </p>
              ) : (
                notableDays.map((day) => <DayLogCard key={day.date} day={day} />)
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
