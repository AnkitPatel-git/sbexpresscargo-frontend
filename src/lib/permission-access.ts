import type {
  GroupedPermission,
  PermissionAction,
  PermissionResource,
} from "@/types/permission";

/** Matches backend `PERMISSION_ACTION_ORDER` for stable columns. */
export const PERMISSION_ACTION_COLUMNS = [
  { key: "all", label: "All" },
  { key: "manage", label: "Manage" },
  { key: "create", label: "Create" },
  { key: "read", label: "Read" },
  { key: "calculate", label: "Calculate" },
  { key: "update", label: "Update" },
  { key: "delete", label: "Delete" },
  { key: "list", label: "List" },
  { key: "search", label: "Search" },
  { key: "add", label: "Add" },
  { key: "modify", label: "Modify" },
  { key: "logoff", label: "Log off" },
] as const;

export type PermissionActionKey = (typeof PERMISSION_ACTION_COLUMNS)[number]["key"];

/** Last segment of identifier (`master.product.read` → `read`). */
export function actionKeyFromIdentifier(identifier: string): string {
  const segment = identifier.split(".").pop()?.toLowerCase() ?? "";
  if (segment) return segment;
  return identifier.toLowerCase();
}

export function findActionByKey(
  actions: PermissionAction[],
  key: string,
): PermissionAction | undefined {
  return actions.find((a) => actionKeyFromIdentifier(a.identifier) === key);
}

export function findActionById(
  groups: GroupedPermission[],
  permissionId: number,
): PermissionAction | undefined {
  for (const group of groups) {
    for (const resource of group.resources) {
      const hit = resource.actions.find((a) => a.id === permissionId);
      if (hit) return hit;
    }
  }
  return undefined;
}

/** Row-level "grant all actions" uses its own column; omit `all` from action columns. */
const ROW_BULK_ACTION_KEY = "all";

export function columnsForGroup(group: GroupedPermission) {
  const keys = new Set<string>();
  for (const resource of group.resources) {
    for (const action of resource.actions) {
      keys.add(actionKeyFromIdentifier(action.identifier));
    }
  }
  keys.delete(ROW_BULK_ACTION_KEY);
  return PERMISSION_ACTION_COLUMNS.filter((col) => keys.has(col.key));
}

export function moduleKeyFromUnderMenu(underMenu: string): string {
  return underMenu.split(".")[0]?.toLowerCase() ?? underMenu.toLowerCase();
}

export function formatModuleLabel(moduleKey: string): string {
  return moduleKey.replace(/_/g, " ").toUpperCase();
}

export function formatMenuLabel(underMenu: string): string {
  const [module, subModule] = underMenu.split(".");
  const sub = (subModule ?? "").replace(/_/g, " ");
  if (!module) return underMenu;
  if (!sub) return module;
  return `${module} · ${sub}`;
}

export type PermissionModuleSection = {
  moduleKey: string;
  moduleLabel: string;
  groups: GroupedPermission[];
};

/** Collapse `master.product`, `master.local_branch`, … into one MASTER section. */
export function groupByModule(groups: GroupedPermission[]): PermissionModuleSection[] {
  const byModule = new Map<string, GroupedPermission[]>();
  for (const group of groups) {
    const key = moduleKeyFromUnderMenu(group.underMenu);
    const list = byModule.get(key) ?? [];
    list.push(group);
    byModule.set(key, list);
  }

  return [...byModule.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([moduleKey, moduleGroups]) => ({
      moduleKey,
      moduleLabel: formatModuleLabel(moduleKey),
      groups: [...moduleGroups].sort((a, b) => a.underMenu.localeCompare(b.underMenu)),
    }));
}

export function flattenModuleResources(section: PermissionModuleSection): PermissionResource[] {
  return section.groups.flatMap((group) => group.resources);
}

export function flattenModuleActions(section: PermissionModuleSection): PermissionAction[] {
  return section.groups.flatMap(flattenActions);
}

export function columnsForModule(section: PermissionModuleSection) {
  const keys = new Set<string>();
  for (const group of section.groups) {
    for (const resource of group.resources) {
      for (const action of resource.actions) {
        keys.add(actionKeyFromIdentifier(action.identifier));
      }
    }
  }
  keys.delete(ROW_BULK_ACTION_KEY);
  return PERMISSION_ACTION_COLUMNS.filter((col) => keys.has(col.key));
}

export function isModuleFullyGranted(section: PermissionModuleSection): boolean {
  const actions = flattenModuleActions(section);
  return actions.length > 0 && actions.every((a) => a.granted);
}

export function isModulePartiallyGranted(section: PermissionModuleSection): boolean {
  const actions = flattenModuleActions(section);
  const granted = actions.filter((a) => a.granted).length;
  return granted > 0 && granted < actions.length;
}

export function flattenActions(group: GroupedPermission): PermissionAction[] {
  return group.resources.flatMap((r) => r.actions);
}

export function isGroupFullyGranted(group: GroupedPermission): boolean {
  const actions = flattenActions(group);
  return actions.length > 0 && actions.every((a) => a.granted);
}

export function isGroupPartiallyGranted(group: GroupedPermission): boolean {
  const actions = flattenActions(group);
  const granted = actions.filter((a) => a.granted).length;
  return granted > 0 && granted < actions.length;
}

export function isResourceFullyGranted(resource: PermissionResource): boolean {
  return resource.actions.length > 0 && resource.actions.every((a) => a.granted);
}

export function isResourcePartiallyGranted(resource: PermissionResource): boolean {
  const granted = resource.actions.filter((a) => a.granted).length;
  return granted > 0 && granted < resource.actions.length;
}

export function countGranted(groups: GroupedPermission[]): {
  granted: number;
  total: number;
} {
  let granted = 0;
  let total = 0;
  for (const group of groups) {
    for (const resource of group.resources) {
      for (const action of resource.actions) {
        total += 1;
        if (action.granted) granted += 1;
      }
    }
  }
  return { granted, total };
}

export function filterGroups(
  groups: GroupedPermission[],
  query: string,
): GroupedPermission[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;

  return groups
    .map((group) => {
      const menuMatch =
        group.underMenu.toLowerCase().includes(q) ||
        formatMenuLabel(group.underMenu).toLowerCase().includes(q);
      const resources = group.resources.filter(
        (r) =>
          menuMatch ||
          r.resource.toLowerCase().includes(q) ||
          r.resourceKey.toLowerCase().includes(q),
      );
      if (resources.length === 0) return null;
      return { ...group, resources };
    })
    .filter((g): g is GroupedPermission => g != null);
}
