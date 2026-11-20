"use client";

import { FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmployeeFormValues, HrmsEmployeeStatus, HrmsGender, LinkableUser } from "@/types/hrms/employee";
import { HRMS_ORGANIZATIONS } from "@/types/hrms/employee";

const STATUSES: HrmsEmployeeStatus[] = [
  "PROBATION",
  "ACTIVE",
  "INACTIVE",
  "RESIGNED",
  "SEPARATED",
];

const GENDERS: HrmsGender[] = ["MALE", "FEMALE", "OTHER"];

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

export function EmployeeForm({
  values,
  managers,
  users,
  saving,
  onChange,
  onSubmit,
}: {
  values: EmployeeFormValues;
  managers: Array<{ id: number; employeeCode: string; fullName: string }>;
  users: LinkableUser[];
  saving: boolean;
  onChange: (next: EmployeeFormValues) => void;
  onSubmit: () => void;
}) {
  const set = (patch: Partial<EmployeeFormValues>) => onChange({ ...values, ...patch });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <section className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
        <h2 className="md:col-span-3 text-base font-semibold">Personal information</h2>
        <Field label="First name">
          <Input required value={values.firstName} onChange={(e) => set({ firstName: e.target.value })} />
        </Field>
        <Field label="Last name">
          <Input required value={values.lastName} onChange={(e) => set({ lastName: e.target.value })} />
        </Field>
        <Field label="Status">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={values.status}
            onChange={(e) => set({ status: e.target.value as HrmsEmployeeStatus })}
          >
            {STATUSES.filter(
              (status) =>
                status === values.status ||
                (status !== "RESIGNED" && status !== "SEPARATED"),
            ).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </Field>
        <Field label="Date of birth">
          <Input type="date" value={values.dateOfBirth} onChange={(e) => set({ dateOfBirth: e.target.value })} />
        </Field>
        <Field label="Gender">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={values.gender}
            onChange={(e) => set({ gender: e.target.value as HrmsGender | "" })}
          >
            <option value="">Select</option>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>{gender}</option>
            ))}
          </select>
        </Field>
        <Field label="Photograph path">
          <Input value={values.photographPath} onChange={(e) => set({ photographPath: e.target.value })} placeholder="File path or URL" />
        </Field>
      </section>

      <section className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
        <h2 className="md:col-span-3 text-base font-semibold">Contact</h2>
        <Field label="Mobile">
          <Input value={values.mobile} onChange={(e) => set({ mobile: e.target.value })} />
        </Field>
        <Field label="Alternate mobile">
          <Input value={values.alternateMobile} onChange={(e) => set({ alternateMobile: e.target.value })} />
        </Field>
        <Field label="Work email">
          <Input type="email" value={values.workEmail} onChange={(e) => set({ workEmail: e.target.value })} />
        </Field>
        <Field label="Personal email">
          <Input type="email" value={values.personalEmail} onChange={(e) => set({ personalEmail: e.target.value })} />
        </Field>
        <Field label="Address line 1">
          <Input value={values.addressLine1} onChange={(e) => set({ addressLine1: e.target.value })} />
        </Field>
        <Field label="Address line 2">
          <Input value={values.addressLine2} onChange={(e) => set({ addressLine2: e.target.value })} />
        </Field>
        <Field label="City">
          <Input value={values.city} onChange={(e) => set({ city: e.target.value })} />
        </Field>
        <Field label="State">
          <Input value={values.state} onChange={(e) => set({ state: e.target.value })} />
        </Field>
        <Field label="Pincode">
          <Input maxLength={8} value={values.pinCode} onChange={(e) => set({ pinCode: e.target.value.replace(/\D/g, "").slice(0, 8) })} />
        </Field>
      </section>

      <section className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
        <h2 className="md:col-span-3 text-base font-semibold">Emergency contact</h2>
        <Field label="Name">
          <Input value={values.emergencyName} onChange={(e) => set({ emergencyName: e.target.value })} />
        </Field>
        <Field label="Phone">
          <Input value={values.emergencyPhone} onChange={(e) => set({ emergencyPhone: e.target.value })} />
        </Field>
        <Field label="Relation">
          <Input value={values.emergencyRelation} onChange={(e) => set({ emergencyRelation: e.target.value })} />
        </Field>
      </section>

      <section className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
        <h2 className="md:col-span-3 text-base font-semibold">Organisation</h2>
        <Field label="Organization name">
          <select
            required
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={values.organizationName}
            onChange={(event) =>
              set({ organizationName: event.target.value as EmployeeFormValues["organizationName"] })
            }
          >
            <option value="">Select organization</option>
            {HRMS_ORGANIZATIONS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </Field>
        <Field label="Joining date">
          <Input required type="date" value={values.joiningDate} onChange={(e) => set({ joiningDate: e.target.value })} />
        </Field>
        <Field label="Department">
          <Input value={values.department} onChange={(e) => set({ department: e.target.value })} />
        </Field>
        <Field label="Designation">
          <Input value={values.designation} onChange={(e) => set({ designation: e.target.value })} />
        </Field>
        <Field label="Reporting manager">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={values.reportingManagerId}
            onChange={(e) => set({ reportingManagerId: e.target.value })}
          >
            <option value="">None</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.fullName} ({manager.employeeCode})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Login user">
          <select
            required
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={values.userId}
            onChange={(event) => {
              const userId = event.target.value;
              const user = users.find((item) => String(item.id) === userId);
              const next: Partial<EmployeeFormValues> = { userId };
              if (user && !values.firstName && !values.lastName) {
                const parts = user.username.trim().split(/\s+/);
                next.firstName = parts[0] ?? "";
                next.lastName = parts.slice(1).join(" ");
              }
              if (user && !values.workEmail) next.workEmail = user.email;
              if (user && !values.mobile && user.mobile) next.mobile = user.mobile;
              if (user && !values.dateOfBirth && user.birthDate) next.dateOfBirth = user.birthDate;
              if (user && !values.joiningDate && user.joiningDate) next.joiningDate = user.joiningDate;
              set(next);
            }}
          >
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.email})
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-base font-semibold">Identity and bank</h2>
        <Field label="Aadhaar number">
          <Input maxLength={12} value={values.aadhaarNumber} onChange={(e) => set({ aadhaarNumber: e.target.value.replace(/\D/g, "").slice(0, 12) })} />
        </Field>
        <Field label="PAN">
          <Input maxLength={10} value={values.panNumber} onChange={(e) => set({ panNumber: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Account holder">
          <Input value={values.bankAccountHolder} onChange={(e) => set({ bankAccountHolder: e.target.value })} />
        </Field>
        <Field label="Bank name">
          <Input value={values.bankName} onChange={(e) => set({ bankName: e.target.value })} />
        </Field>
        <Field label="Account number">
          <Input value={values.bankAccountNumber} onChange={(e) => set({ bankAccountNumber: e.target.value })} />
        </Field>
        <Field label="IFSC">
          <Input value={values.bankIfsc} onChange={(e) => set({ bankIfsc: e.target.value.toUpperCase() })} />
        </Field>
      </section>

      <Repeat
        title="Education"
        addLabel="Add qualification"
        onAdd={() => set({ educations: [...values.educations, { qualification: "" }] })}
      >
        {values.educations.map((row, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-4">
            <Input placeholder="Qualification" value={row.qualification} onChange={(e) => {
              const educations = [...values.educations];
              educations[index] = { ...row, qualification: e.target.value };
              set({ educations });
            }} />
            <Input placeholder="Institution" value={row.institution ?? ""} onChange={(e) => {
              const educations = [...values.educations];
              educations[index] = { ...row, institution: e.target.value };
              set({ educations });
            }} />
            <Input placeholder="Year" value={row.yearOfPassing ?? ""} onChange={(e) => {
              const educations = [...values.educations];
              educations[index] = { ...row, yearOfPassing: e.target.value ? Number(e.target.value) : undefined };
              set({ educations });
            }} />
            <Input placeholder="Grade" value={row.grade ?? ""} onChange={(e) => {
              const educations = [...values.educations];
              educations[index] = { ...row, grade: e.target.value };
              set({ educations });
            }} />
          </div>
        ))}
      </Repeat>

      <Repeat
        title="Previous employment"
        addLabel="Add employer"
        onAdd={() => set({ previousJobs: [...values.previousJobs, { companyName: "" }] })}
      >
        {values.previousJobs.map((row, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-4">
            <Input placeholder="Company" value={row.companyName} onChange={(e) => {
              const previousJobs = [...values.previousJobs];
              previousJobs[index] = { ...row, companyName: e.target.value };
              set({ previousJobs });
            }} />
            <Input placeholder="Designation" value={row.designation ?? ""} onChange={(e) => {
              const previousJobs = [...values.previousJobs];
              previousJobs[index] = { ...row, designation: e.target.value };
              set({ previousJobs });
            }} />
            <Input type="date" value={row.fromDate ?? ""} onChange={(e) => {
              const previousJobs = [...values.previousJobs];
              previousJobs[index] = { ...row, fromDate: e.target.value };
              set({ previousJobs });
            }} />
            <Input type="date" value={row.toDate ?? ""} onChange={(e) => {
              const previousJobs = [...values.previousJobs];
              previousJobs[index] = { ...row, toDate: e.target.value };
              set({ previousJobs });
            }} />
          </div>
        ))}
      </Repeat>

      <Repeat
        title="Family"
        addLabel="Add family member"
        onAdd={() => set({ familyMembers: [...values.familyMembers, { name: "", relation: "" }] })}
      >
        {values.familyMembers.map((row, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-4">
            <Input placeholder="Name" value={row.name} onChange={(e) => {
              const familyMembers = [...values.familyMembers];
              familyMembers[index] = { ...row, name: e.target.value };
              set({ familyMembers });
            }} />
            <Input placeholder="Relation" value={row.relation} onChange={(e) => {
              const familyMembers = [...values.familyMembers];
              familyMembers[index] = { ...row, relation: e.target.value };
              set({ familyMembers });
            }} />
            <Input type="date" value={row.dateOfBirth ?? ""} onChange={(e) => {
              const familyMembers = [...values.familyMembers];
              familyMembers[index] = { ...row, dateOfBirth: e.target.value };
              set({ familyMembers });
            }} />
            <Input placeholder="Phone" value={row.phone ?? ""} onChange={(e) => {
              const familyMembers = [...values.familyMembers];
              familyMembers[index] = { ...row, phone: e.target.value };
              set({ familyMembers });
            }} />
          </div>
        ))}
      </Repeat>

      <Repeat
        title="Documents"
        addLabel="Add document"
        onAdd={() => set({ documents: [...values.documents, { documentType: "" }] })}
      >
        {values.documents.map((row, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-4">
            <Input placeholder="Type" value={row.documentType} onChange={(e) => {
              const documents = [...values.documents];
              documents[index] = { ...row, documentType: e.target.value };
              set({ documents });
            }} />
            <Input placeholder="Number" value={row.documentNumber ?? ""} onChange={(e) => {
              const documents = [...values.documents];
              documents[index] = { ...row, documentNumber: e.target.value };
              set({ documents });
            }} />
            <Input placeholder="File name" value={row.fileName ?? ""} onChange={(e) => {
              const documents = [...values.documents];
              documents[index] = { ...row, fileName: e.target.value };
              set({ documents });
            }} />
            <Input placeholder="File path" value={row.filePath ?? ""} onChange={(e) => {
              const documents = [...values.documents];
              documents[index] = { ...row, filePath: e.target.value };
              set({ documents });
            }} />
          </div>
        ))}
      </Repeat>

      <div>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save employee"}</Button>
      </div>
    </form>
  );
}

function Repeat({
  title,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        <Button type="button" variant="outline" onClick={onAdd}>{addLabel}</Button>
      </div>
      {children}
    </section>
  );
}
