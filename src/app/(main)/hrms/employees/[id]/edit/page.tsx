"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { EmployeeForm } from "@/components/hrms/employee-form";
import { employeeToForm, emptyEmployeeForm, hrmsService } from "@/services/hrms/hrms-service";
import type { EmployeeFormValues } from "@/types/hrms/employee";

export default function EditEmployeePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const [values, setValues] = useState<EmployeeFormValues>(emptyEmployeeForm());
  const [version, setVersion] = useState(1);
  const [saving, setSaving] = useState(false);
  const employee = useQuery({
    queryKey: ["hrms-employee", id],
    queryFn: () => hrmsService.getEmployee(id),
    enabled: Number.isFinite(id),
  });
  const managers = useQuery({
    queryKey: ["hrms-employee-options"],
    queryFn: () => hrmsService.employeeOptions(),
  });
  const mappedUserId = (employee.data as { userId?: number } | undefined)?.userId;
  const users = useQuery({
    queryKey: ["hrms-linkable-users", mappedUserId],
    queryFn: () => hrmsService.linkableUsers(mappedUserId),
    enabled: mappedUserId != null,
  });

  useEffect(() => {
    if (!employee.data) return;
    setValues(employeeToForm(employee.data as unknown as Record<string, unknown>));
    setVersion(employee.data.version);
  }, [employee.data]);

  if (employee.isLoading) return <p className="p-6 text-sm">Loading employee...</p>;
  if (employee.isError) {
    return <p className="p-6 text-sm text-destructive">{(employee.error as Error).message}</p>;
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit {employee.data?.employeeCode}</h1>
        <Link className="text-sm hover:underline" href={`/hrms/employees/${id}`}>Back to profile</Link>
      </div>
      <EmployeeForm
        values={values}
        managers={(managers.data ?? []).filter((manager) => manager.id !== id)}
        users={users.data ?? []}
        saving={saving}
        onChange={setValues}
        onSubmit={async () => {
          setSaving(true);
          try {
            await hrmsService.updateEmployee(id, values, version);
            toast.success("Employee updated");
            router.push(`/hrms/employees/${id}`);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update employee");
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
