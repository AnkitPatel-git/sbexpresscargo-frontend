"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OutlinedFieldShell, FLOATING_INNER_CONTROL } from "@/components/ui/floating-form-item";
import { userService } from "@/services/user-service";

type EditableProfileForm = {
  username: string;
  email: string;
  mobile: string;
  userGroup: string;
  origin: string;
  groupName: string;
  birthDate: string;
};

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
        <p className="text-sm text-muted-foreground">Update the self-editable profile fields exposed by the Utilities API.</p>
      </div>

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
