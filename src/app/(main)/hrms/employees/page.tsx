"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hrmsService } from "@/services/hrms/hrms-service";
import type { HrmsEmployeeStatus } from "@/types/hrms/employee";

export default function HrmsEmployeesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<HrmsEmployeeStatus | "">("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["hrms-employees", page, search, status],
    queryFn: () => hrmsService.listEmployees({ page, search, status, limit: 20 }),
  });

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <Button asChild>
          <Link href="/hrms/employees/create">Add employee</Link>
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="Search name, code, department"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as HrmsEmployeeStatus | "");
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {["PROBATION", "ACTIVE", "INACTIVE", "RESIGNED", "SEPARATED"].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>
      {query.isLoading ? <p className="text-sm">Loading employees...</p> : null}
      {query.isError ? <p className="text-sm text-destructive">{(query.error as Error).message}</p> : null}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Designation</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Joining</th>
              <th className="px-3 py-2">Manager</th>
            </tr>
          </thead>
          <tbody>
            {(query.data?.data ?? []).map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2">
                  <Link className="font-medium hover:underline" href={`/hrms/employees/${row.id}`}>
                    {row.employeeCode}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.fullName}</td>
                <td className="px-3 py-2">{row.department || "—"}</td>
                <td className="px-3 py-2">{row.designation || "—"}</td>
                <td className="px-3 py-2">{row.status}</td>
                <td className="px-3 py-2">{row.joiningDate || "—"}</td>
                <td className="px-3 py-2">{row.reportingManagerName || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
          Previous
        </Button>
        <span>Page {page}</span>
        <Button
          variant="outline"
          disabled={(query.data?.data.length ?? 0) < 20}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
