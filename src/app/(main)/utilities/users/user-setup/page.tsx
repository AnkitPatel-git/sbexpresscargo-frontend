"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { userService } from "@/services/user-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OutlinedFieldShell, FLOATING_INNER_CONTROL, FLOATING_INNER_SELECT_TRIGGER } from "@/components/ui/floating-form-item";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function UserSetupPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
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

  const { data: usersResp, isLoading } = useQuery({
    queryKey: ["utility-users", page, search],
    queryFn: () => userService.listUsers({ page, limit: 10, search, status: "ACTIVE" }),
  });

  const { data: rolesResp } = useQuery({
    queryKey: ["user-roles"],
    queryFn: () => userService.listRoles(),
  });

  const users = usersResp?.data ?? [];
  const roles = rolesResp?.data ?? [];

  const userCounts = useMemo(() => {
    const portal = users.filter((u: any) => (u.profile?.applicationType || "").toLowerCase() === "portal").length;
    const mobile = users.filter((u: any) => (u.profile?.applicationType || "").toLowerCase() === "mobile").length;
    return { portal, mobile, total: users.length };
  }, [users]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        username: form.username,
        email: form.email,
        ...(editId ? {} : { password: form.password }),
        roleId: Number(form.roleId),
        mobile: form.mobile || undefined,
        status: form.status,
        profile: {
          origin: form.origin || undefined,
          applicationType: form.applicationType,
          weightType: form.weightType,
        },
      };
      if (editId) return userService.updateUser(editId, payload);
      return userService.onboardUser(payload);
    },
    onSuccess: () => {
      toast.success(editId ? "User updated successfully" : "User created successfully");
      queryClient.invalidateQueries({ queryKey: ["utility-users"] });
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
      toast.success("User status updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update status"),
  });

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

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <Tabs defaultValue="user">
        <div className="mb-3 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="group">Group</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Input className="h-8 w-44" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => queryClient.refetchQueries({ queryKey: ["utility-users"], type: "active" })}>
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
                    <Select value={form.roleId} onValueChange={(value) => setForm((p) => ({ ...p, roleId: value }))}>
                      <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                        <SelectValue placeholder="Select role" />
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
          <span className="rounded border px-2 py-1">Portal Users {userCounts.portal}</span>
          <span className="rounded border px-2 py-1">Mobile Users {userCounts.mobile}</span>
          <span className="rounded border px-2 py-1">Total {userCounts.total}</span>
          <span className="rounded border px-2 py-1">Group {roles.length}</span>
        </div>

        <TabsContent value="user">
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="text-primary-foreground">Name</TableHead>
                  <TableHead className="text-primary-foreground">Group</TableHead>
                  <TableHead className="text-primary-foreground">Company</TableHead>
                  <TableHead className="text-primary-foreground">Application Type</TableHead>
                  <TableHead className="text-primary-foreground">Status</TableHead>
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
                  <TableRow key={r.id}>
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

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{"<"}</Button>
        <span className="text-sm">{page}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>{">"}</Button>
      </div>
    </div>
  );
}
