"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/user-service";
import { useAuth } from "@/context/auth-context";

type EditableProfileForm = {
  username: string;
  mobile: string;
  origin: string;
  birthDate: string;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState<EditableProfileForm>({
    username: "",
    mobile: "",
    origin: "",
    birthDate: "",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["self-profile"],
    queryFn: () => userService.getProfile(),
  });

  const isAdmin = useMemo(() => {
    return user?.role?.identifier === "SUPER_ADMIN";
  }, [user]);

  useEffect(() => {
    const p = data?.data;
    if (!p) return;
    setForm({
      username: p.username ?? "",
      mobile: p.mobile ?? "",
      origin: p.profile?.origin ?? "",
      birthDate: p.profile?.birthDate ? String(p.profile.birthDate).slice(0, 10) : "",
    });
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      userService.updateSelfProfile({
        username: form.username.trim() || undefined,
        mobile: form.mobile.trim() || undefined,
        profile: {
          origin: form.origin.trim() || undefined,
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
        <p className="text-sm text-muted-foreground">Update your profile details.</p>
      </div>

      {!isAdmin && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Only admin can update profile details.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Username</Label>
          <Input
            value={form.username}
            disabled={!isAdmin}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Email (read-only)</Label>
          <Input value={profile?.email ?? ""} disabled />
        </div>
        <div className="space-y-1.5">
          <Label>Role (read-only)</Label>
          <Input value={profile?.role?.name ?? ""} disabled />
        </div>
        <div className="space-y-1.5">
          <Label>Mobile</Label>
          <Input
            value={form.mobile}
            disabled={!isAdmin}
            onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Origin</Label>
          <Input
            value={form.origin}
            disabled={!isAdmin}
            onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Birth Date</Label>
          <Input
            type="date"
            value={form.birthDate}
            disabled={!isAdmin}
            onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
        <Button type="button" onClick={() => updateMutation.mutate()} disabled={!isAdmin || updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
}
