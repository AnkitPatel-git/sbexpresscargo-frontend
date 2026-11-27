"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { hrmsService } from "@/services/hrms/hrms-service";
import type { HrmsEmployeeStatus } from "@/types/hrms/employee";

const STATUSES: HrmsEmployeeStatus[] = [
  "PROBATION",
  "ACTIVE",
  "INACTIVE",
  "RESIGNED",
  "SEPARATED",
];

export function EmployeeStatusButton({
  employeeId,
  employeeName,
  version,
  currentStatus,
  onChanged,
}: {
  employeeId: number;
  employeeName: string;
  version: number;
  currentStatus: HrmsEmployeeStatus;
  onChanged: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<HrmsEmployeeStatus>(currentStatus);
  const [exitDate, setExitDate] = useState("");
  const [exitReason, setExitReason] = useState("");
  const [saving, setSaving] = useState(false);
  const needsExit = status === "RESIGNED" || status === "SEPARATED";

  const openDialog = () => {
    setStatus(currentStatus);
    setExitDate("");
    setExitReason("");
    setOpen(true);
  };

  const save = async () => {
    if (status === currentStatus) {
      toast.error("Choose a different status");
      return;
    }
    if (needsExit && !exitDate) {
      toast.error("Exit date is required");
      return;
    }
    setSaving(true);
    try {
      if (needsExit) {
        await hrmsService.exitEmployee(employeeId, {
          version,
          status,
          exitDate,
          exitReason: exitReason.trim() || undefined,
        });
      } else {
        await hrmsService.changeEmployeeStatus(employeeId, version, status);
      }
      toast.success("Status updated");
      setOpen(false);
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={openDialog}>
        Change status
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change status — {employeeName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Status
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value as HrmsEmployeeStatus)}
              >
                {STATUSES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            {needsExit ? (
              <>
                <label className="flex flex-col gap-1 text-sm">
                  Exit date
                  <Input type="date" value={exitDate} onChange={(event) => setExitDate(event.target.value)} />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Reason
                  <Input value={exitReason} onChange={(event) => setExitReason(event.target.value)} placeholder="Optional" />
                </label>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving..." : "Update status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
