"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hrmsService } from "@/services/hrms/hrms-service";
import type { HrmsLeaveType } from "@/types/hrms/employee";

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const employee = useQuery({
    queryKey: ["hrms-employee", id],
    queryFn: () => hrmsService.getEmployee(id),
    enabled: Number.isFinite(id),
  });
  const managers = useQuery({
    queryKey: ["hrms-employee-options"],
    queryFn: () => hrmsService.employeeOptions(),
  });
  const [confirmDate, setConfirmDate] = useState("");
  const [exitDate, setExitDate] = useState("");
  const [exitStatus, setExitStatus] = useState<"RESIGNED" | "SEPARATED">("RESIGNED");
  const [exitReason, setExitReason] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [managerId, setManagerId] = useState("");
  const [leaveType, setLeaveType] = useState<HrmsLeaveType>("CASUAL");
  const [leaveFrom, setLeaveFrom] = useState("");
  const [leaveTo, setLeaveTo] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const reload = async () => {
    await queryClient.invalidateQueries({ queryKey: ["hrms-employee", id] });
    await queryClient.invalidateQueries({ queryKey: ["hrms-dashboard"] });
  };

  if (employee.isLoading) return <p className="p-6 text-sm">Loading employee...</p>;
  if (employee.isError || !employee.data) {
    return <p className="p-6 text-sm text-destructive">{(employee.error as Error)?.message || "Employee not found"}</p>;
  }
  const row = employee.data as unknown as Record<string, any>;

  const run = async (action: () => Promise<void>) => {
    try {
      await action();
      toast.success("Saved");
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{row.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            {row.employeeCode} · {row.status} · {row.department || "No department"} · {row.designation || "No designation"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/hrms/employees/${id}/edit`}>Edit profile</Link>
        </Button>
      </div>

      <section className="grid gap-2 rounded-lg border p-4 text-sm md:grid-cols-2">
        <p>Login: {row.user ? `${row.user.username} (${row.user.email})` : "—"}</p>
        <p>Joining: {row.joiningDate || "—"}</p>
        <p>Confirmation: {row.confirmationDate || "—"}</p>
        <p>Manager: {row.reportingManagerName || "—"}</p>
        <p>Mobile: {row.mobile || "—"}</p>
        <p>Work email: {row.workEmail || "—"}</p>
        <p>Personal email: {row.personalEmail || "—"}</p>
        <p>Emergency: {[row.emergencyName, row.emergencyRelation, row.emergencyPhone].filter(Boolean).join(" · ") || "—"}</p>
        <p>Bank: {[row.bankName, row.bankAccountNumber, row.bankIfsc].filter(Boolean).join(" · ") || "—"}</p>
        <p>Aadhaar: {row.aadhaarNumber || "—"}</p>
        <p>PAN: {row.panNumber || "—"}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <h2 className="font-semibold">Confirmation</h2>
          <Input type="date" value={confirmDate} onChange={(event) => setConfirmDate(event.target.value)} />
          <Button
            disabled={row.status !== "PROBATION" || !confirmDate}
            onClick={() => run(() => hrmsService.confirmEmployee(id, row.version, confirmDate))}
          >
            Confirm employee
          </Button>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <h2 className="font-semibold">Transfer</h2>
          <Input placeholder="Department" value={department} onChange={(event) => setDepartment(event.target.value)} />
          <Input placeholder="Designation" value={designation} onChange={(event) => setDesignation(event.target.value)} />
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={managerId} onChange={(event) => setManagerId(event.target.value)}>
            <option value="">Keep current manager</option>
            <option value="clear">Clear manager</option>
            {(managers.data ?? []).filter((manager) => manager.id !== id).map((manager) => (
              <option key={manager.id} value={manager.id}>{manager.fullName}</option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={() => run(() => hrmsService.transferEmployee(id, {
              version: row.version,
              department: department || undefined,
              designation: designation || undefined,
              ...(managerId === "clear"
                ? { reportingManagerId: null }
                : managerId
                  ? { reportingManagerId: Number(managerId) }
                  : {}),
            }))}
          >
            Transfer
          </Button>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <h2 className="font-semibold">Exit and separation</h2>
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={exitStatus} onChange={(event) => setExitStatus(event.target.value as "RESIGNED" | "SEPARATED")}>
            <option value="RESIGNED">Resigned</option>
            <option value="SEPARATED">Separated</option>
          </select>
          <Input type="date" value={exitDate} onChange={(event) => setExitDate(event.target.value)} />
          <Input placeholder="Reason" value={exitReason} onChange={(event) => setExitReason(event.target.value)} />
          <Button
            variant="outline"
            disabled={!exitDate}
            onClick={() => run(() => hrmsService.exitEmployee(id, {
              version: row.version,
              status: exitStatus,
              exitDate,
              exitReason: exitReason || undefined,
            }))}
          >
            Record exit
          </Button>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <h2 className="font-semibold">Record leave</h2>
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={leaveType} onChange={(event) => setLeaveType(event.target.value as HrmsLeaveType)}>
            {["CASUAL", "SICK", "EARNED", "UNPAID", "OTHER"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <Input type="date" value={leaveFrom} onChange={(event) => setLeaveFrom(event.target.value)} />
          <Input type="date" value={leaveTo} onChange={(event) => setLeaveTo(event.target.value)} />
          <Input placeholder="Reason" value={leaveReason} onChange={(event) => setLeaveReason(event.target.value)} />
          <Button
            variant="outline"
            disabled={!leaveFrom || !leaveTo}
            onClick={() => run(() => hrmsService.createLeave({
              employeeId: id,
              leaveType,
              fromDate: leaveFrom,
              toDate: leaveTo,
              reason: leaveReason || undefined,
            }))}
          >
            Submit leave
          </Button>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">History</h2>
        <ul className="space-y-2 text-sm">
          {(row.history ?? []).map((event: { id: number; event: string; summary: string; createdAt: string }) => (
            <li key={event.id}>
              <span className="font-medium">{event.event}</span>
              <span className="text-muted-foreground"> · {event.summary} · {String(event.createdAt).slice(0, 10)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
