"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { hrmsService } from "@/services/hrms/hrms-service";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function HrmsDashboardPage() {
  const { hasPermission } = useAuth();
  const canDecideLeave = hasPermission("hrms.leave.update");
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<number | null>(null);
  const query = useQuery({
    queryKey: ["hrms-dashboard"],
    queryFn: () => hrmsService.dashboard(),
  });

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "APPROVED" | "REJECTED" }) =>
      hrmsService.decideLeave(id, status),
    onSuccess: () => {
      toast.success("Leave updated");
      queryClient.invalidateQueries({ queryKey: ["hrms-dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setBusyId(null),
  });

  if (query.isLoading) return <p className="p-6 text-sm">Loading HRMS dashboard...</p>;
  if (query.isError) {
    return <p className="p-6 text-sm text-destructive">{(query.error as Error).message}</p>;
  }
  const data = query.data;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">HRMS dashboard</h1>
          <p className="text-sm text-muted-foreground">As of {data.asOf}</p>
        </div>
        {hasPermission("hrms.employee.create") ? (
          <Button asChild>
            <Link href="/hrms/employees/create">Add employee</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total employees" value={data.totalEmployees} />
        <Stat label="Active employees" value={data.activeEmployees} />
        <Stat label="Inactive employees" value={data.inactiveEmployees} />
        <Stat label="New joinings this month" value={data.newJoinings} />
        <Stat label="Resignations this month" value={data.resignations} />
        <Stat label="Present today" value={data.attendance.present} />
        <Stat label="Absent today" value={data.attendance.absent} />
        <Stat label="On leave today" value={data.attendance.onLeave} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Upcoming birthdays</h2>
          {data.upcomingBirthdays.length === 0 ? (
            <p className="text-sm text-muted-foreground">None in the next 30 days.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.upcomingBirthdays.map((row) => (
                <li key={row.id}>
                  <Link className="font-medium hover:underline" href={`/hrms/employees/${row.id}`}>
                    {row.fullName}
                  </Link>
                  <span className="text-muted-foreground"> · {row.on}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Work anniversaries</h2>
          {data.upcomingAnniversaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">None in the next 30 days.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.upcomingAnniversaries.map((row) => (
                <li key={row.id}>
                  <Link className="font-medium hover:underline" href={`/hrms/employees/${row.id}`}>
                    {row.fullName}
                  </Link>
                  <span className="text-muted-foreground"> · {row.years} years on {row.on}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Pending leave approvals</h2>
        {data.pendingLeaveApprovals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending leave.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Employee</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">From</th>
                  <th className="py-2 pr-3">To</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingLeaveApprovals.map((leave) => (
                  <tr key={leave.id} className="border-b">
                    <td className="py-2 pr-3">{leave.employee.fullName}</td>
                    <td className="py-2 pr-3">{leave.leaveType}</td>
                    <td className="py-2 pr-3">{leave.fromDate}</td>
                    <td className="py-2 pr-3">{leave.toDate}</td>
                    <td className="py-2">
                      {canDecideLeave ? <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={busyId === leave.id}
                          onClick={() => {
                            setBusyId(leave.id);
                            decide.mutate({ id: leave.id, status: "APPROVED" });
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === leave.id}
                          onClick={() => {
                            setBusyId(leave.id);
                            decide.mutate({ id: leave.id, status: "REJECTED" });
                          }}
                        >
                          Reject
                        </Button>
                      </div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
