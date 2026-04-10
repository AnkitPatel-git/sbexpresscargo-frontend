"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OutlinedFieldShell, FLOATING_INNER_CONTROL } from "@/components/ui/floating-form-item";
import { userService } from "@/services/user-service";
import { useAuth } from "@/context/auth-context";

export default function ChangePasswordPage() {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: () => userService.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      toast.success("Password changed successfully. Please login again.");
      logout();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to change password");
    },
  });

  const submit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    changePasswordMutation.mutate();
  };

  return (
    <div className="max-w-2xl rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Change Password</h1>
        <p className="text-sm text-muted-foreground">Use your current password to set a new one.</p>
      </div>

      <div className="space-y-4">
        <OutlinedFieldShell label="Current Password">
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={FLOATING_INNER_CONTROL} />
        </OutlinedFieldShell>
        <OutlinedFieldShell label="New Password">
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={FLOATING_INNER_CONTROL} />
        </OutlinedFieldShell>
        <OutlinedFieldShell label="Confirm New Password">
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={FLOATING_INNER_CONTROL} />
        </OutlinedFieldShell>
      </div>

      <div className="mt-5">
        <Button type="button" onClick={submit} disabled={changePasswordMutation.isPending}>
          {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Password
        </Button>
      </div>
    </div>
  );
}
