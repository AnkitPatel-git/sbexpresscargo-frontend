"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { permissionService } from "@/services/permission-service";
import { userService } from "@/services/user-service";

export default function AccessRightsPage() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>("");

  const { data: rolesResp } = useQuery({
    queryKey: ["roles-access-rights"],
    queryFn: () => userService.listRoles(),
  });

  const roleId = useMemo(() => {
    const parsed = Number(selectedRole);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [selectedRole]);

  const { data: groupedRoleResp, isLoading } = useQuery({
    queryKey: ["grouped-permissions-role", roleId],
    queryFn: () => permissionService.getPermissionsForRole(roleId as number),
    enabled: roleId !== null,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ granted, permissionId }: { granted: boolean; permissionId: number }) => {
      if (!roleId) throw new Error("Role is required");
      if (granted) return permissionService.removePermissionFromRole(roleId, permissionId);
      return permissionService.assignPermissionToRole(roleId, permissionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grouped-permissions-role", roleId] });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update access"),
  });

  const toggleGroup = async (group: any, enable: boolean) => {
    const actions = group.resources.flatMap((resource: any) => resource.actions);
    for (const action of actions) {
      if (enable && !action.granted) {
        await toggleMutation.mutateAsync({ granted: false, permissionId: action.id });
      } else if (!enable && action.granted) {
        await toggleMutation.mutateAsync({ granted: true, permissionId: action.id });
      }
    }
    toast.success(enable ? "Group checked" : "Group unchecked");
  };

  const groups = groupedRoleResp?.data ?? [];

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="w-full max-w-xs">
          <p className="mb-1 text-sm font-medium">Group</p>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select role/group" />
            </SelectTrigger>
            <SelectContent>
              {(rolesResp?.data ?? []).map((role: any) => (
                <SelectItem key={role.id} value={String(role.id)}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="outline" onClick={() => queryClient.refetchQueries({ queryKey: ["grouped-permissions-role", roleId], type: "active" })}>
          Search
        </Button>
      </div>

      {roleId === null ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Select a group to manage access rights.
        </div>
      ) : isLoading ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Loading access rights...
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group: any) => {
            const allGranted = group.resources.flatMap((r: any) => r.actions).every((a: any) => a.granted);
            return (
              <div key={group.underMenu} className="rounded-md border border-border">
                <div className="flex items-center justify-between bg-muted px-3 py-2">
                  <p className="text-sm font-semibold">{group.underMenu}</p>
                  <label className="flex items-center gap-2 text-xs">
                    Check All
                    <input
                      type="checkbox"
                      checked={allGranted}
                      onChange={(e) => toggleGroup(group, e.target.checked)}
                    />
                  </label>
                </div>
                <div className="overflow-x-auto p-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="px-2 py-1">Description</th>
                        <th className="px-2 py-1">UnderMenu</th>
                        <th className="px-2 py-1">AllAccess</th>
                        <th className="px-2 py-1">Add</th>
                        <th className="px-2 py-1">Modify</th>
                        <th className="px-2 py-1">Delete</th>
                        <th className="px-2 py-1">List</th>
                        <th className="px-2 py-1">Search</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.resources.map((resource: any) => (
                        <tr key={resource.resourceKey} className="border-t border-border">
                          <td className="px-2 py-1">{resource.resource}</td>
                          <td className="px-2 py-1">{group.underMenu}</td>
                          <td className="px-2 py-1">
                            <input
                              type="checkbox"
                              checked={resource.actions.every((a: any) => a.granted)}
                              onChange={(e) => {
                                resource.actions.forEach((a: any) => {
                                  if (e.target.checked && !a.granted) toggleMutation.mutate({ granted: false, permissionId: a.id });
                                  if (!e.target.checked && a.granted) toggleMutation.mutate({ granted: true, permissionId: a.id });
                                });
                              }}
                            />
                          </td>
                          {["create", "update", "delete", "read", "search"].map((token) => {
                            const action = resource.actions.find((a: any) => (a.identifier || "").toLowerCase().includes(`.${token}`) || a.name?.toLowerCase() === token);
                            return (
                              <td key={token} className="px-2 py-1">
                                <input
                                  type="checkbox"
                                  checked={!!action?.granted}
                                  disabled={!action}
                                  onChange={() => action && toggleMutation.mutate({ granted: action.granted, permissionId: action.id })}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          <div className="flex justify-end">
            <Button type="button" onClick={() => queryClient.refetchQueries({ queryKey: ["grouped-permissions-role", roleId], type: "active" })}>
              Update
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
