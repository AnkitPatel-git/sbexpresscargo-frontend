"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Edit, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { userService } from "@/services/user-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { optionLabelById } from "@/lib/select-closed-label";
import { OutlinedFieldShell, FLOATING_INNER_CONTROL, FLOATING_INNER_SELECT_TRIGGER } from "@/components/ui/floating-form-item";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { SortableColumnHeader, type SortOrder } from "@/components/ui/sortable-column-header";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

type UserFilter = "all" | "portal" | "mobile";

const LIMIT = 10;

export default function UserSetupPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("user");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("username");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [resetUser, setResetUser] = useState<{ id: number; username: string } | null>(null);
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    roleId: "",
    mobile: "",
    status: "ACTIVE",
    origin: "",
    applicationType: "portal",
    weightType: "Kgs",
  });

  const listBaseParams = {
    limit: LIMIT,
    search: debouncedSearch,
    status: "ACTIVE" as const,
    sortBy,
    sortOrder,
  };

  const { data: usersResp, isLoading } = useQuery({
    queryKey: ["utility-users", page, debouncedSearch, userFilter, selectedRoleId, sortBy, sortOrder],
    queryFn: () =>
      userService.listUsers({
        page,
        ...listBaseParams,
        ...(userFilter === "portal" && { applicationType: "portal" }),
        ...(userFilter === "mobile" && { applicationType: "mobile" }),
        ...(selectedRoleId != null && { roleId: selectedRoleId }),
      }),
  });

  const { data: totalCountResp } = useQuery({
    queryKey: ["utility-users-count", "all", debouncedSearch],
    queryFn: () => userService.listUsers({ page: 1, limit: 1, search: debouncedSearch, status: "ACTIVE" }),
  });

  const { data: portalCountResp } = useQuery({
    queryKey: ["utility-users-count", "portal", debouncedSearch],
    queryFn: () =>
      userService.listUsers({ page: 1, limit: 1, search: debouncedSearch, status: "ACTIVE", applicationType: "portal" }),
  });

  const { data: mobileCountResp } = useQuery({
    queryKey: ["utility-users-count", "mobile", debouncedSearch],
    queryFn: () =>
      userService.listUsers({ page: 1, limit: 1, search: debouncedSearch, status: "ACTIVE", applicationType: "mobile" }),
  });

  const { data: rolesResp } = useQuery({
    queryKey: ["user-roles"],
    queryFn: () => userService.listRoles(),
  });

  const users = usersResp?.data ?? [];
  const roles = rolesResp?.data ?? [];
  const selectedRole = roles.find((r: { id: number }) => r.id === selectedRoleId) ?? null;
  const totalPages = usersResp?.meta?.totalPages ?? 1;
  const userCounts = {
    portal: portalCountResp?.meta?.total ?? 0,
    mobile: mobileCountResp?.meta?.total ?? 0,
    total: totalCountResp?.meta?.total ?? 0,
  };

  const resolveApplicationType = (roleId: string) => {
    const role = roles.find((r: { id: number; identifier?: string }) => String(r.id) === roleId);
    if (role?.identifier === "FIELD_EXECUTIVE") return "mobile";
    if (role?.identifier === "OPERATIONS") return "both";
    return form.applicationType;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        username: form.username,
        email: form.email,
        ...(editId ? {} : { password: form.password, status: form.status }),
        roleId: Number(form.roleId),
        mobile: form.mobile || undefined,
        profile: {
          origin: form.origin || undefined,
          applicationType: resolveApplicationType(form.roleId),
          weightType: form.weightType,
        },
      };
      if (editId) return userService.updateUser(editId, payload);
      return userService.onboardUser(payload);
    },
    onSuccess: () => {
      toast.success(editId ? "User updated successfully" : "User created successfully");
      queryClient.invalidateQueries({ queryKey: ["utility-users"] });
      queryClient.invalidateQueries({ queryKey: ["utility-users-count"] });
      setIsOpen(false);
      setEditId(null);
      setForm({
        username: "",
        email: "",
        password: "",
        roleId: "",
        mobile: "",
        status: "ACTIVE",
        origin: "",
        applicationType: "portal",
        weightType: "Kgs",
      });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to save user"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "ACTIVE" | "INACTIVE" }) => userService.changeUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utility-users"] });
      queryClient.invalidateQueries({ queryKey: ["utility-users-count"] });
      toast.success("User status updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update status"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => {
      if (!resetUser) {
        throw new Error("No user selected");
      }
      return userService.adminResetPassword(resetUser.id, {
        newPassword: resetPasswordForm.newPassword,
      });
    },
    onSuccess: () => {
      toast.success(`Password reset for ${resetUser?.username ?? "user"}`);
      setResetUser(null);
      setResetPasswordForm({ newPassword: "", confirmPassword: "" });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to reset password"),
  });

  const openResetPassword = (user: { id: number; username: string }) => {
    setResetUser({ id: user.id, username: user.username });
    setResetPasswordForm({ newPassword: "", confirmPassword: "" });
  };

  const submitResetPassword = () => {
    if (!resetPasswordForm.newPassword || !resetPasswordForm.confirmPassword) {
      toast.error("Please fill both password fields");
      return;
    }
    if (resetPasswordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    resetPasswordMutation.mutate();
  };

  const openEdit = (user: any) => {
    setEditId(user.id);
    setForm({
      username: user.username ?? "",
      email: user.email ?? "",
      password: "",
      roleId: user.roleId ? String(user.roleId) : "",
      mobile: user.mobile ?? "",
      status: user.status ?? "ACTIVE",
      origin: user.profile?.origin ?? "",
      applicationType: user.profile?.applicationType ?? "portal",
      weightType: user.profile?.weightType ?? "Kgs",
    });
    setIsOpen(true);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const applyUserFilter = (filter: UserFilter) => {
    setUserFilter(filter);
    setSelectedRoleId(null);
    setActiveTab("user");
    setPage(1);
  };

  const applyRoleFilter = (roleId: number) => {
    setSelectedRoleId(roleId);
    setUserFilter("all");
    setActiveTab("user");
    setPage(1);
  };

  const clearRoleFilter = () => {
    setSelectedRoleId(null);
    setPage(1);
  };

  const filterChipClass = (active: boolean) =>
    cn(
      "cursor-pointer rounded border px-2 py-1 transition-colors hover:bg-muted",
      active && "border-primary bg-primary/10 font-medium text-primary",
    );

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="mb-3 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="group">Group</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Input
              className="h-8 w-44"
              placeholder="Search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => {
                queryClient.refetchQueries({ queryKey: ["utility-users"], type: "active" });
                queryClient.refetchQueries({ queryKey: ["utility-users-count"], type: "active" });
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button type="button" size="icon" className="h-8 w-8" onClick={() => setEditId(null)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editId ? "Edit User" : "Add User"}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <OutlinedFieldShell label="Username">
                    <Input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} className={FLOATING_INNER_CONTROL} />
                  </OutlinedFieldShell>
                  <OutlinedFieldShell label="Email">
                    <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className={FLOATING_INNER_CONTROL} />
                  </OutlinedFieldShell>
                  {!editId && (
                    <OutlinedFieldShell label="Password">
                      <Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className={FLOATING_INNER_CONTROL} />
                    </OutlinedFieldShell>
                  )}
                  <OutlinedFieldShell label="Role">
                    <Select key={`role-${form.roleId}`} value={form.roleId} onValueChange={(value) => setForm((p) => ({ ...p, roleId: value }))}>
                      <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                        <SelectValue placeholder="Select role">
                          {optionLabelById(form.roleId, roles, (r: { id: number; name: string }) => r.name)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r: any) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </OutlinedFieldShell>
                  <OutlinedFieldShell label="Mobile">
                    <Input value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))} className={FLOATING_INNER_CONTROL} />
                  </OutlinedFieldShell>
                  <OutlinedFieldShell label="Origin">
                    <Input value={form.origin} onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))} className={FLOATING_INNER_CONTROL} />
                  </OutlinedFieldShell>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <button type="button" className={filterChipClass(activeTab === "user" && userFilter === "portal")} onClick={() => applyUserFilter("portal")}>
            Portal Users {userCounts.portal}
          </button>
          <button type="button" className={filterChipClass(activeTab === "user" && userFilter === "mobile")} onClick={() => applyUserFilter("mobile")}>
            Mobile Users {userCounts.mobile}
          </button>
          <button type="button" className={filterChipClass(activeTab === "user" && userFilter === "all" && selectedRoleId == null)} onClick={() => applyUserFilter("all")}>
            Total {userCounts.total}
          </button>
          <button
            type="button"
            className={filterChipClass(activeTab === "group" && selectedRoleId == null)}
            onClick={() => {
              setActiveTab("group");
              setPage(1);
            }}
          >
            Group {roles.length}
          </button>
        </div>

        {activeTab === "user" && selectedRole && (
          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Showing users in group:</span>
            <span className="rounded border border-primary bg-primary/10 px-2 py-1 font-medium text-primary">
              {selectedRole.name}
            </span>
            <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={clearRoleFilter}>
              Clear
            </button>
          </div>
        )}

        <TabsContent value="user">
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="font-semibold text-primary-foreground">
                    <SortableColumnHeader label="Name" field="username" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  </TableHead>
                  <TableHead className="font-semibold text-primary-foreground">
                    <SortableColumnHeader label="Group" field="roleId" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  </TableHead>
                  <TableHead className="text-primary-foreground">Company</TableHead>
                  <TableHead className="text-primary-foreground">Application Type</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">
                    <SortableColumnHeader label="Status" field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  </TableHead>
                  <TableHead className="text-primary-foreground text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No users found.</TableCell></TableRow>
                ) : users.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.role?.name || "-"}</TableCell>
                    <TableCell>SBEX</TableCell>
                    <TableCell>{u.profile?.applicationType || "ALL"}</TableCell>
                    <TableCell>{u.status}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}><Edit className="h-4 w-4" /></Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Reset password"
                          onClick={() => openResetPassword(u)}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => statusMutation.mutate({ id: u.id, status: u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="group">
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="text-primary-foreground">Name</TableHead>
                  <TableHead className="text-primary-foreground">Group</TableHead>
                  <TableHead className="text-primary-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No groups found.</TableCell></TableRow>
                ) : roles.map((r: any) => (
                  <TableRow
                    key={r.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      selectedRoleId === r.id && "bg-primary/5",
                    )}
                    onClick={() => applyRoleFilter(r.id)}
                  >
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.identifier}</TableCell>
                    <TableCell>Active</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {activeTab === "user" && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{"<"}</Button>
          <span className="text-sm">{page} / {totalPages}</span>
          <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{">"}</Button>
        </div>
      )}

      <Dialog
        open={resetUser != null}
        onOpenChange={(open) => {
          if (!open) {
            setResetUser(null);
            setResetPasswordForm({ newPassword: "", confirmPassword: "" });
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Set a new password for <span className="font-medium text-foreground">{resetUser?.username}</span>.
          </p>
          <div className="grid gap-3">
            <OutlinedFieldShell label="New Password">
              <Input
                type="password"
                value={resetPasswordForm.newPassword}
                onChange={(e) =>
                  setResetPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                }
                className={FLOATING_INNER_CONTROL}
                autoComplete="new-password"
              />
            </OutlinedFieldShell>
            <OutlinedFieldShell label="Confirm Password">
              <Input
                type="password"
                value={resetPasswordForm.confirmPassword}
                onChange={(e) =>
                  setResetPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                }
                className={FLOATING_INNER_CONTROL}
                autoComplete="new-password"
              />
            </OutlinedFieldShell>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setResetUser(null);
                setResetPasswordForm({ newPassword: "", confirmPassword: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitResetPassword}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
