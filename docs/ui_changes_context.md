# UI Refactoring Context

This document tracks the migration of UI components from Drawer-based to Page-based (Route-based) creation and editing, focusing on improved deep linking, browser history support, and cleaner component architecture.

## 🏗️ UI Migration Pattern (Drawer to Page)

When migrating a master module from a Drawer (Sheet) to dedicated routes, follow these standardized steps:

> [!NOTE]
> **Active State Support**: The global `isActive` logic in `src/app/(main)/layout.tsx` has been updated to support sub-paths (`pathname.startsWith(path + '/')`). This ensures that parent menu items remain highlighted when navigating to create/edit routes.

### Phase 1: Form Extraction
1. **Extract Form Component**:
   - Create a new component in `src/components/masters/[module]-form.tsx`.
   - Move the Zod schema, `useForm` hook, and form logic from the original drawer file.
   - **Important**: The component should **only** contain the `Form` and `<form>` elements. Avoid adding `Card`, `max-width`, or `container` wrappers here to ensure maximum flexibility and consistency across different pages.
   - **Props**: The component should accept `initialData?: [Type] | null`.
   - **Logic**: Use `useMutation` for both Create (POST) and Update (PUT) operations.
     - **Cache Invalidation**: On `onSuccess`, ensure you invalidate both the list query (e.g., `['modules']`) AND the specific item query (e.g., `['module', id]`). This prevents stale data issues.
   - **Navigation**: Use `useRouter` to redirect back to the list page on success or when the "Cancel" button is clicked.

### Phase 2: Routing & Page Creation
2. **Create Routes**:
   - **Layout Standard**: Use a `space-y-6` container in the page component.
   - **Create Page**: `src/app/(main)/masters/[module]/create/page.tsx`
     - Render the `[Module]Form` inside a `Card` and `CardContent`.
   - **Edit Page**: `src/app/(main)/masters/[module]/[id]/edit/page.tsx`
     - Same layout as "Create Page" (Card + CardContent).
     - Use `useParams` to get the `id`.
     - **API Pattern**: Use the **"Get By Id"** API for the specific module. 
       - Always refer to the **Bruno collection** (located in `docs/bruno`) for the correct endpoint and response structure.
       - Use `useQuery` with the `getProductById` service (or equivalent) in the service layer.
     - Pass the fetched data to `[Module]Form` via the `initialData` prop.
     - Show a loading spinner during the fetch and handle error states gracefully.
   - **Header Layout**:
     - Define the header **above** the `Card`.
     - Use a `flex` container for the page title and back button.
     - Include a back button (`ArrowLeft` icon with `variant="ghost"` and `size="icon"` inside an `asChild` `Link`) linking back to the list page.
     - Use `text-3xl font-bold tracking-tight` for the `<h1>` and `text-muted-foreground` for the description.

### Phase 3: List Page Integration
3. **Update Navigation**:
   - Modify `src/app/(main)/masters/[module]/page.tsx`.
   - Remove the `[Module]Drawer` import and state.
   - Update `handleCreate` to `router.push("/masters/[module]/create")`.
   - Update `handleEdit` to `router.push("/masters/[module]/${id}/edit")`.
4. **Cleanup**:
   - Delete the original `[Module]Drawer.tsx` file once the migration is verified.

### Phase 4: Documentation
5. **Update Context**:
   - Add a new entry in `docs/ui_changes_context.md` (this file) under the relevant module.

---

## 📋 Module Migration Tracking

### Product Master
- **Status**: ✅ Completed Refactor
- **Example Implementation**:
  - **Shared Component**: `src/components/masters/product-form.tsx`
  - **Create Route**: `src/app/(main)/masters/products/create/page.tsx`
  - **Edit Route**: `src/app/(main)/masters/products/[id]/edit/page.tsx`
  - **Service**: Edit page uses `productService.getProductById(id)`.
- **Key Changes**:
  - Replaced `ProductDrawer` with full-page transitions.
  - Consistent "Cancel" behavior redirecting back to `/masters/products`.
  - Added navigation via `useRouter` in the list actions menu.

---

### Industry Master
- **Status**: ✅ Completed Refactor
- **Example Implementation**:
  - **Shared Component**: `src/components/masters/industry-form.tsx`
  - **Create Route**: `src/app/(main)/masters/industries/create/page.tsx`
  - **Edit Route**: `src/app/(main)/masters/industries/[id]/edit/page.tsx`
  - **Service**: Edit page uses `industryService.getIndustryById(id)`.
- **Key Changes**:
  - Replaced `IndustryDrawer` with full-page transitions.
  - Consistent "Cancel" behavior redirecting back to `/masters/industries`.
  - Added navigation via `useRouter` in the list actions menu.
  - Included Back Button in form header for consistent UX.
