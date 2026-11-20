"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { EmployeeForm } from "@/components/hrms/employee-form";
import { emptyEmployeeForm, hrmsService } from "@/services/hrms/hrms-service";
import type { EmployeeFormValues } from "@/types/hrms/employee";

export default function CreateEmployeePage() {
  const router = useRouter();
  const [values, setValues] = useState<EmployeeFormValues>(emptyEmployeeForm());
  const [saving, setSaving] = useState(false);
  const managers = useQuery({
    queryKey: ["hrms-employee-options"],
    queryFn: () => hrmsService.employeeOptions(),
  });

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Add employee</h1>
        <Link className="text-sm hover:underline" href="/hrms/employees">Back to employees</Link>
      </div>
      <EmployeeForm
        values={values}
        managers={managers.data ?? []}
        saving={saving}
        onChange={setValues}
        onSubmit={async () => {
          setSaving(true);
          try {
            const created = await hrmsService.createEmployee(values);
            toast.success(`Employee ${created.employeeCode} added`);
            router.push(`/hrms/employees/${created.id}`);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to add employee");
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
