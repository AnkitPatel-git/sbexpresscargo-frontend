"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  columnsForModule,
  countGranted,
  filterGroups,
  findActionById,
  findActionByKey,
  flattenModuleActions,
  flattenModuleResources,
  groupByModule,
  isModuleFullyGranted,
  isModulePartiallyGranted,
  isResourceFullyGranted,
  isResourcePartiallyGranted,
  type PermissionModuleSection,
} from "@/lib/permission-access";
import { optionLabelForSelect } from "@/lib/select-closed-label";
import { cn } from "@/lib/utils";
import { permissionService } from "@/services/permission-service";
import { userService } from "@/services/user-service";
import type {
  ApiResponse,
  GroupedPermission,
  PermissionAction,
} from "@/types/permission";
import type { UserRole } from "@/types/utilities/user";

type RolePermissionsCache = ApiResponse<GroupedPermission[]>;

function groupedQueryKey(roleId: number) {
  return ["grouped-permissions-role", roleId] as const;
}

function patchGranted(
  data: RolePermissionsCache | undefined,
  permissionId: number,
  granted: boolean,
): RolePermissionsCache | undefined {
  if (!data?.data) return data;
  return {
    ...data,
    data: data.data.map((group) => ({
      ...group,
      resources: group.resources.map((resource) => ({
        ...resource,
        actions: resource.actions.map((action) =>
          action.id === permissionId ? { ...action, granted } : action,
        ),
      })),
    })),
  };
}

function patchManyGranted(
  data: RolePermissionsCache | undefined,
  updates: Array<{ permissionId: number; granted: boolean }>,
): RolePermissionsCache | undefined {
  let next = data;
  for (const { permissionId, granted } of updates) {
    next = patchGranted(next, permissionId, granted);
  }
  return next;
}

function AccessCheckbox({
  checked,
  disabled,
  indeterminate,
  pending,
  onCheckedChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  pending?: boolean;
  onCheckedChange: (checked: boolean) => void;
  "aria-label": string;
}) {
  return (
    <CheckboxWrap pending={pending}>
      <Checkbox
        checked={indeterminate ? "indeterminate" : checked}
        disabled={disabled || pending}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        aria-label={ariaLabel}
      />
    </CheckboxWrap>
  );
}

function CheckboxWrap({
  pending,
  children,
}: {
  pending?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative inline-flex items-center justify-center">
      {children}
      {pending ? (
        <Loader2 className="pointer-events-none absolute h-3 w-3 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}

function ModuleTitle({ section }: { section: PermissionModuleSection }) {
  const { granted, total } = countGranted(section.groups);
  const resources = flattenModuleResources(section);
  return (
    <div>
      <p className="text-sm font-semibold tracking-wide">{section.moduleLabel}</p>
      <p className="text-xs text-muted-foreground">
        {granted} of {total} granted · {resources.length} resource
        {resources.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function PermissionModuleCard({
  section,
  pendingIds,
  onToggleAction,
  onToggleResource,
  onToggleModule,
}: {
  section: PermissionModuleSection;
  pendingIds: Set<number>;
  onToggleAction: (permissionId: number, nextGranted: boolean) => void;
  onToggleResource: (resource: GroupedPermission["resources"][number], grant: boolean) => void;
  onToggleModule: (grant: boolean) => void;
}) {
  const columns = columnsForModule(section);
  const resources = flattenModuleResources(section);
  const modulePending = flattenModuleActions(section).some((a) => pendingIds.has(a.id));

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/50 px-3 py-2.5">
        <ModuleTitle section={section} />
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
          <AccessCheckbox
            checked={isModuleFullyGranted(section)}
            indeterminate={isModulePartiallyGranted(section)}
            pending={modulePending}
            disabled={flattenModuleActions(section).length === 0}
            onCheckedChange={onToggleModule}
            aria-label={`Toggle all permissions in ${section.moduleLabel}`}
          />
          Select all in section
        </label>
      </header>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[12rem]">Resource</TableHead>
              <TableHead className="w-[4.5rem] text-center text-xs">All actions</TableHead>
              {columns.map((col) => (
                <TableHead key={col.key} className="w-16 text-center text-xs">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => (
              <TableRow key={resource.resourceKey}>
                <TableCell className="font-medium">{resource.resource}</TableCell>
                <TableCell className="text-center">
                  <AccessCheckbox
                    checked={isResourceFullyGranted(resource)}
                    indeterminate={isResourcePartiallyGranted(resource)}
                    pending={resource.actions.some((a) => pendingIds.has(a.id))}
                    disabled={resource.actions.length === 0}
                    onCheckedChange={(grant) => onToggleResource(resource, grant)}
                    aria-label={`Toggle all actions for ${resource.resource}`}
                  />
                </TableCell>
                {columns.map((col) => {
                  const action = findActionByKey(resource.actions, col.key);
                  return (
                    <TableCell key={col.key} className="text-center">
                      {action ? (
                        <AccessCheckbox
                          checked={!!action.granted}
                          pending={pendingIds.has(action.id)}
                          onCheckedChange={(grant) => onToggleAction(action.id, grant)}
                          aria-label={`${resource.resource} — ${col.label}`}
                        />
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function StateMessage({
  message,
  loading,
  variant = "default",
  onRetry,
}: {
  message: string;
  loading?: boolean;
  variant?: "default" | "error";
  onRetry?: () => void;
}) {
  if (variant === "error") {
    return <ErrorState message={message} onRetry={onRetry} />;
  }
  return (
    <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {message}
        </span>
      ) : (
        message
      )}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm">
      <p className="text-destructive">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function AccessRightsPanel() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [filter, setFilter] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  const roleId = useMemo(() => {
    const parsed = Number(selectedRoleId);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [selectedRoleId]);

  const {
    data: rolesResp,
    isLoading: rolesLoading,
    isError: rolesError,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ["user-roles"],
    queryFn: () => userService.listRoles(),
    staleTime: 60_000,
  });

  const roles: UserRole[] = rolesResp?.data ?? [];

  const {
    data: groupedResp,
    isLoading: permissionsLoading,
    isFetching,
    isError: permissionsError,
    error: permissionsQueryError,
    refetch: refetchPermissions,
  } = useQuery({
    queryKey: roleId != null ? groupedQueryKey(roleId) : ["grouped-permissions-role", "none"],
    queryFn: () => permissionService.getPermissionsForRole(roleId!),
    enabled: roleId != null,
  });

  const groups = groupedResp?.data ?? [];
  const filteredGroups = useMemo(() => filterGroups(groups, filter), [groups, filter]);
  const moduleSections = useMemo(
    () => groupByModule(filteredGroups),
    [filteredGroups],
  );
  const totals = useMemo(() => countGranted(groups), [groups]);

  const setPending = useCallback((id: number, pending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const applyPermissionChange = useMutation({
    mutationFn: async ({
      permissionId,
      grant,
    }: {
      permissionId: number;
      grant: boolean;
    }) => {
      if (roleId == null) throw new Error("Select a role first");
      if (grant) {
        await permissionService.assignPermissionToRole(roleId, permissionId);
      } else {
        await permissionService.removePermissionFromRole(roleId, permissionId);
      }
    },
  });

  const runToggle = useCallback(
    async (permissionId: number, grant: boolean, rollbackGrant: boolean) => {
      if (roleId == null) return;
      const key = groupedQueryKey(roleId);
      setPending(permissionId, true);
      queryClient.setQueryData<RolePermissionsCache>(key, (old) =>
        patchGranted(old, permissionId, grant),
      );
      try {
        await applyPermissionChange.mutateAsync({ permissionId, grant });
      } catch (err) {
        queryClient.setQueryData<RolePermissionsCache>(key, (old) =>
          patchGranted(old, permissionId, rollbackGrant),
        );
        throw err;
      } finally {
        setPending(permissionId, false);
      }
    },
    [applyPermissionChange, queryClient, roleId, setPending],
  );

  const runBatch = useCallback(
    async (changes: Array<{ permissionId: number; grant: boolean }>) => {
      if (roleId == null || changes.length === 0) return;
      const key = groupedQueryKey(roleId);
      const rollbacks = changes.map((c) => ({
        permissionId: c.permissionId,
        granted: !c.grant,
      }));

      for (const { permissionId } of changes) setPending(permissionId, true);
      queryClient.setQueryData<RolePermissionsCache>(key, (old) =>
        patchManyGranted(
          old,
          changes.map((c) => ({ permissionId: c.permissionId, granted: c.grant })),
        ),
      );

      try {
        for (const { permissionId, grant } of changes) {
          await applyPermissionChange.mutateAsync({ permissionId, grant });
        }
      } catch (err) {
        queryClient.setQueryData<RolePermissionsCache>(key, (old) =>
          patchManyGranted(old, rollbacks),
        );
        throw err;
      } finally {
        for (const { permissionId } of changes) setPending(permissionId, false);
        await queryClient.invalidateQueries({ queryKey: key });
      }
    },
    [applyPermissionChange, queryClient, roleId, setPending],
  );

  const handleToggleAction = useCallback(
    async (permissionId: number, nextGranted: boolean) => {
      if (roleId == null || pendingIds.has(permissionId)) return;

      const key = groupedQueryKey(roleId);
      const cached = queryClient.getQueryData<RolePermissionsCache>(key);
      const current = findActionById(cached?.data ?? groups, permissionId);
      const currentGranted = !!current?.granted;
      if (currentGranted === nextGranted) return;

      try {
        await runToggle(permissionId, nextGranted, currentGranted);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update permission");
      }
    },
    [groups, pendingIds, queryClient, roleId, runToggle],
  );

  const handleToggleResource = useCallback(
    async (resource: GroupedPermission["resources"][number], grant: boolean) => {
      const changes = resource.actions
        .filter((a) => !!a.granted !== grant)
        .map((a) => ({ permissionId: a.id, grant }));
      if (changes.length === 0) return;
      try {
        await runBatch(changes);
        toast.success(grant ? "Resource permissions enabled" : "Resource permissions removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update resource");
      }
    },
    [runBatch],
  );

  const handleToggleModule = useCallback(
    async (section: PermissionModuleSection, grant: boolean) => {
      const changes = flattenModuleActions(section)
        .filter((a) => !!a.granted !== grant)
        .map((a) => ({ permissionId: a.id, grant }));
      if (changes.length === 0) return;
      try {
        await runBatch(changes);
        toast.success(grant ? "Section permissions enabled" : "Section permissions removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update section");
      }
    },
    [runBatch],
  );

  const roleOptions = useMemo(
    () =>
      roles.map((r) => ({
        value: String(r.id),
        label: r.identifier ? `${r.name} (${r.identifier})` : r.name,
      })),
    [roles],
  );

  const roleSelectLabel = optionLabelForSelect(selectedRoleId, roleOptions);
  const roleName = roleSelectLabel || "Selected role";

  return (
    <PermissionGuard
      permission="settings.permissions.read"
      fallback={
        <p className="text-sm text-muted-foreground">
          You need permission to manage role access rights (typically Super Admin).
        </p>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-end">
          <div className="w-full min-w-[14rem] flex-1 space-y-1.5">
            <Label htmlFor="access-role">Role</Label>
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
              disabled={rolesLoading || rolesError}
            >
              <SelectTrigger id="access-role" className="w-full">
                {roleSelectLabel ? (
                  <span className="min-w-0 flex-1 truncate text-left">{roleSelectLabel}</span>
                ) : null}
                <SelectValue
                  placeholder={rolesLoading ? "Loading roles…" : "Select role"}
                  className={cn(roleSelectLabel && "sr-only")}
                />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                    {role.identifier ? (
                      <span className="ml-1 text-muted-foreground">({role.identifier})</span>
                    ) : null}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full min-w-[14rem] flex-1 space-y-1.5">
            <Label htmlFor="access-filter">Filter</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="access-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Menu or resource name…"
                className="pl-9"
                disabled={roleId == null}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            disabled={roleId == null}
            onClick={() => {
              void refetchRoles();
              if (roleId != null) void refetchPermissions();
            }}
          >
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {rolesError ? (
          <StateMessage
            variant="error"
            message="Could not load roles."
            onRetry={() => void refetchRoles()}
          />
        ) : null}

        {roleId == null ? (
          <StateMessage message="Select a role to view and edit its permissions." />
        ) : permissionsLoading ? (
          <StateMessage message="Loading permissions for this role…" loading />
        ) : permissionsError ? (
          <StateMessage
            variant="error"
            message={
              permissionsQueryError instanceof Error
                ? permissionsQueryError.message
                : "Could not load permissions."
            }
            onRetry={() => void refetchPermissions()}
          />
        ) : groups.length === 0 ? (
          <StateMessage message="No permissions are defined in the system." />
        ) : (
          <>
            <SummaryBar
              roleName={roleName}
              totals={totals}
              filteredCount={moduleSections.length}
              totalSections={groupByModule(groups).length}
            />

            {moduleSections.length === 0 ? (
              <StateMessage message="No permissions match your search." />
            ) : (
              <div className="space-y-4">
                {moduleSections.map((section) => (
                  <PermissionModuleCard
                    key={section.moduleKey}
                    section={section}
                    pendingIds={pendingIds}
                    onToggleAction={(permissionId, grant) =>
                      void handleToggleAction(permissionId, grant)
                    }
                    onToggleResource={(resource, grant) =>
                      void handleToggleResource(resource, grant)
                    }
                    onToggleModule={(grant) => void handleToggleModule(section, grant)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PermissionGuard>
  );
}

function SummaryBar({
  roleName,
  totals,
  filteredCount,
  totalSections,
}: {
  roleName: string;
  totals: { granted: number; total: number };
  filteredCount: number;
  totalSections: number;
}) {
  const pct =
    totals.total > 0 ? Math.round((totals.granted / totals.total) * 100) : 0;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
      <span>
        <span className="font-medium">{roleName}</span>
        <span className="text-muted-foreground">
          {" "}
          — {totals.granted} of {totals.total} permissions ({pct}%)
        </span>
      </span>
      {filteredCount < totalSections ? (
        <span className="text-xs text-muted-foreground">
          Showing {filteredCount} of {totalSections} sections
        </span>
      ) : null}
    </div>
  );
}
