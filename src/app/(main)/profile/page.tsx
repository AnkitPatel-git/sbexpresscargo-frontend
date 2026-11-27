"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OutlinedFieldShell, FLOATING_INNER_CONTROL } from "@/components/ui/floating-form-item";
import { EmployeeDocumentImage } from "@/components/hrms/employee-document-image";
import { hrmsService } from "@/services/hrms/hrms-service";
import { userService } from "@/services/user-service";
import type { EmployeeDetail } from "@/types/hrms/employee";

type EditableProfileForm = {
  username: string;
  email: string;
  mobile: string;
  userGroup: string;
  origin: string;
  groupName: string;
  birthDate: string;
};

function displayValue(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  return String(value);
}

function ReadOnlyField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <OutlinedFieldShell label={label}>
      <Input value={displayValue(value)} readOnly disabled className={FLOATING_INNER_CONTROL} />
    </OutlinedFieldShell>
  );
}

function EmployeeDetails({ employee }: { employee: EmployeeDetail }) {
  const address = [employee.addressLine1, employee.addressLine2].filter(Boolean).join(", ");
  return (
    <section className="mb-6 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">Employee details</h2>
        <p className="text-sm text-muted-foreground">
          {employee.employeeCode} · These details are maintained by HR and cannot be changed here.
        </p>
      </div>
      <EmployeeDocumentImage filePath={employee.photographPath} fileName="Profile image" own />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ReadOnlyField label="Employee code" value={employee.employeeCode} />
        <ReadOnlyField label="Name" value={employee.fullName} />
        <ReadOnlyField label="Status" value={employee.status} />
        <ReadOnlyField label="Organization" value={employee.organizationName} />
        <ReadOnlyField label="Department" value={employee.department} />
        <ReadOnlyField label="Designation" value={employee.designation} />
        <ReadOnlyField label="Reporting manager" value={employee.reportingManagerName} />
        <ReadOnlyField label="Joining date" value={employee.joiningDate} />
        <ReadOnlyField label="Confirmation date" value={employee.confirmationDate} />
        <ReadOnlyField label="Date of birth" value={employee.dateOfBirth} />
        <ReadOnlyField label="Gender" value={employee.gender} />
        <ReadOnlyField label="Mobile" value={employee.mobile} />
        <ReadOnlyField label="Alternate mobile" value={employee.alternateMobile} />
        <ReadOnlyField label="Work email" value={employee.workEmail} />
        <ReadOnlyField label="Personal email" value={employee.personalEmail} />
        <ReadOnlyField label="Address" value={address} />
        <ReadOnlyField label="City" value={employee.city} />
        <ReadOnlyField label="State" value={employee.state} />
        <ReadOnlyField label="Pincode" value={employee.pinCode} />
        <ReadOnlyField
          label="Emergency contact"
          value={[employee.emergencyName, employee.emergencyRelation, employee.emergencyPhone].filter(Boolean).join(" · ")}
        />
        <ReadOnlyField label="Aadhaar" value={employee.aadhaarNumber} />
        <ReadOnlyField label="PAN" value={employee.panNumber} />
        <ReadOnlyField
          label="Bank"
          value={[employee.bankAccountHolder, employee.bankName, employee.bankAccountNumber, employee.bankIfsc]
            .filter(Boolean)
            .join(" · ")}
        />
      </div>
      <ReadOnlyList
        title="Education"
        rows={employee.educations.map((row) =>
          [row.qualification, row.institution, row.yearOfPassing, row.grade].filter(Boolean).join(" · "),
        )}
      />
      <ReadOnlyList
        title="Previous employment"
        rows={employee.previousJobs.map((row) =>
          [row.companyName, row.designation, row.fromDate, row.toDate].filter(Boolean).join(" · "),
        )}
      />
      <ReadOnlyList
        title="Family"
        rows={employee.familyMembers.map((row) =>
          [row.name, row.relation, row.dateOfBirth, row.phone].filter(Boolean).join(" · "),
        )}
      />
      {employee.documents.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Documents</h3>
          <ul className="space-y-3">
            {employee.documents.map((row, index) => (
              <li key={`${row.filePath ?? row.documentType}-${index}`} className="text-sm text-muted-foreground">
                <p>{[row.documentType, row.documentNumber].filter(Boolean).join(" · ")}</p>
                <EmployeeDocumentImage filePath={row.filePath} fileName={row.fileName} own />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function ReadOnlyList({ title, rows }: { title: string; rows: string[] }) {
  const filled = rows.filter(Boolean);
  if (filled.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {filled.map((row, index) => (
          <li key={`${title}-${index}`}>{row}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ProfilePage() {
  const [form, setForm] = useState<EditableProfileForm>({
    username: "",
    email: "",
    mobile: "",
    userGroup: "",
    origin: "",
    groupName: "",
    birthDate: "",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["self-profile"],
    queryFn: () => userService.getProfile(),
  });
  const employeeQuery = useQuery({
    queryKey: ["self-employee"],
    queryFn: () => hrmsService.getMyEmployee(),
  });

  useEffect(() => {
    const p = data?.data;
    if (!p) return;
    setForm({
      username: p.username ?? "",
      email: p.email ?? "",
      mobile: p.mobile ?? "",
      userGroup: p.profile?.userGroup ?? "",
      origin: p.profile?.origin ?? "",
      groupName: p.profile?.groupName ?? "",
      birthDate: p.profile?.birthDate ? String(p.profile.birthDate).slice(0, 10) : "",
    });
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      userService.updateSelfProfile({
        username: form.username.trim() || undefined,
        email: form.email.trim() || undefined,
        mobile: form.mobile.trim() || undefined,
        profile: {
          userGroup: form.userGroup.trim() || undefined,
          origin: form.origin.trim() || undefined,
          groupName: form.groupName.trim() || undefined,
          birthDate: form.birthDate || undefined,
        },
      }),
    onSuccess: (response) => {
      const updated = response?.data;
      if (updated) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...parsed,
              username: updated.username ?? parsed.username,
              email: updated.email ?? parsed.email,
              mobile: updated.mobile ?? parsed.mobile,
            }),
          );
        }
      }
      toast.success("Profile updated successfully");
      refetch();
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[360px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  const profile = data?.data;

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Update your login details. Linked employee details stay read-only.</p>
      </div>

      {employeeQuery.isLoading ? (
        <p className="mb-5 text-sm text-muted-foreground">Loading employee details...</p>
      ) : employeeQuery.data ? (
        <EmployeeDetails employee={employeeQuery.data} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <OutlinedFieldShell label="Username">
          <Input
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            className={FLOATING_INNER_CONTROL}
          />
        </OutlinedFieldShell>
        <OutlinedFieldShell label="Email">
          <Input
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className={FLOATING_INNER_CONTROL}
          />
        </OutlinedFieldShell>
        <OutlinedFieldShell label="Role (read-only)">
          <Input value={profile?.role?.name ?? ""} disabled className={FLOATING_INNER_CONTROL} />
        </OutlinedFieldShell>
        <OutlinedFieldShell label="Mobile">
          <Input
            value={form.mobile}
            onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value }))}
            className={FLOATING_INNER_CONTROL}
          />
        </OutlinedFieldShell>
        <OutlinedFieldShell label="User Group">
          <Input
            value={form.userGroup}
            onChange={(e) => setForm((prev) => ({ ...prev, userGroup: e.target.value }))}
            className={FLOATING_INNER_CONTROL}
          />
        </OutlinedFieldShell>
        <OutlinedFieldShell label="Origin">
          <Input
            value={form.origin}
            onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))}
            className={FLOATING_INNER_CONTROL}
          />
        </OutlinedFieldShell>
        <OutlinedFieldShell label="Group Name">
          <Input
            value={form.groupName}
            onChange={(e) => setForm((prev) => ({ ...prev, groupName: e.target.value }))}
            className={FLOATING_INNER_CONTROL}
          />
        </OutlinedFieldShell>
        <OutlinedFieldShell label="Birth Date">
          <Input
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
            className={FLOATING_INNER_CONTROL}
          />
        </OutlinedFieldShell>
      </div>

      <div className="mt-5 flex gap-2">
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
        <Button type="button" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
}
