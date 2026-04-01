# Project Context: SB Express Cargo Frontend

## Overview
SB Express Cargo Frontend is a web application designed for a cargo and courier management system. It provides a platform for managing logistics operations, including user management, tracking, and dashboard visualizations.

## 🛠️ Technology Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix UI)
- **State Management/Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Cookies**: [js-cookie](https://github.com/js-cookie/js-cookie)

## 📂 Project Structure
- `src/app`: Contains Next.js routes and layouts.
  - `(main)`: Group for authenticated routes (dashboard, users).
  - `login`: Authentication page.
- `src/types/masters`: Isolated TypeScript interfaces for each master screen.
- `src/services/masters`: Isolated service layers for each master screen.
- `src/context`: Authentication and global state providers.
- `src/lib`: Utility functions and shared libraries (API client).
- `src/proxy.ts`: Next.js 16 proxy for route protection and middleware logic.
- `postman/`: API collection for backend integration.
- `docs/`: Project documentation.

## Important References
- [Project Overview](#project-overview)
- [API Changes Context](file:///Users/divesh/Documents/Projects/Doja/courier/sbexpresscargo-frontend/docs/api_changes_context.md)
- [Design Tokens](#design-tokens)

## 🗺️ Routes
- `/`: Redirects to `/login` (Protected if token exists).
- `/login`: User authentication interface (Redirects to `/dashboard` if authenticated).
- `/dashboard`: Main operational overview (Protected).
- `/users`: User management table (Protected & RBAC controlled).
- `/settings/permissions`: System permissions management (Protected & RBAC controlled).
- `/masters/products`: Product Master management (Protected & RBAC controlled).
- `/masters/countries`: Country Master management (Protected & RBAC controlled).
- `/masters/states`: State Master management (Protected & RBAC controlled).
- `/masters/industries`: Industry Master management (Protected & RBAC controlled).
- `/masters/flights`: Flight Master management (Protected & RBAC controlled).
- `/masters/zones`: Zone Master management (Protected & RBAC controlled).
- `/masters/contents`: Content Master management (Protected & RBAC controlled).
- `/masters/banks`: Bank Master management (Protected & RBAC controlled).
- `/masters/local-branches`: Local Branch Master management (Protected & RBAC controlled).
- `/masters/service-centers`: Service Center Master management (Protected & RBAC controlled).
- `/masters/customers`: Customer Master management (Protected & RBAC controlled).
- `/masters/client-rates`: Client Rate Master management (Protected & RBAC controlled).
- `/masters/consignee`: Consignee Master management (Protected & RBAC controlled).
- `/masters/shipper`: Shipper Master management (Protected & RBAC controlled).
- `/masters/vendor`: Vendor Master management (Protected & RBAC controlled).
- `/masters/courier`: Courier Master management (Protected & RBAC controlled).
- `/masters/area`: Area Master management (Protected & RBAC controlled).
- `/masters/exception`: Exception Master management (Protected & RBAC controlled).
- `/masters/service-map`: Service Map Master management (Protected & RBAC controlled).
- `/masters/charge`: Charge Master management (Protected & RBAC controlled).
- `/utilities/serviceable-pincodes`: Serviceable Pincodes management (Protected & RBAC controlled).
- `/tax-charges/fuel-setup`: Fuel Setup management under Tax & Charges (Protected & RBAC controlled).
- `/tax-charges/tax-setup`: Tax Setup management under Tax & Charges (Protected & RBAC controlled).

- **Authentication & Authorization**: JWT-based login with persistent sessions.
- **RBAC (Role-Based Access Control)**: UI elements and routes are protected based on user permissions.
- **Next.js 16 Proxy**: Secure route handling using the latest `proxy` convention.
- **Searchable User Table**: A data table for managing users with name and email filtering.
- **Permissions Management**: System-wide permission control with grouping and identifiers.
- **Masters Module**: Centralized management for core system entities:
  - **Product Master**: Full CRUD for shipping products with properties like fuel charges and doc types.
  - **Country Master**: Management of countries for logistics.
  - **State Master**: Management of states with zone integration.
  - **Industry Master**: Management of customer industries.
  - **Flight Master**: Management of flight details and carriers.
  - **Zone Master**: Management of shipping zones (Domestic/Vendor).
  - **Content Master**: Shipment contents, HSN codes, and vendor mappings.
  - **Bank Master**: Tracking banks for financial transactions.
  - **Local Branch Master**: Managing company branch offices and contact details.
  - **Service Center Master**: Regional service center management.
  - **Customer Master**: Comprehensive customer database with registration types.
  - **Client Rate Master**: Custom rate settings for clients based on destination and service.
  - **Consignee Master**: Management of consignee details, addresses, and contacts.
  - **Shipper Master**: Management of shipper details, addresses, and contacts.
  - **Vendor Master**: Management of external vendors and partners.
  - **Courier Master**: Tracking and management of courier partners.
  - **Area Master**: Regional area and destination mapping.
  - **Exception Master**: Tracking of delivery exceptions and un-delivery reasons.
  - **Service Map Master**: Mapping of vendors to service types and weight limits.
  - **Charge Master**: Configuration of billing charges, sequences, and tax applications.
- **Utilities Module**: Centralized management for utility tools and features:
  - **Serviceable Pincodes**: CRUD operations for managing serviceable areas, service centers, destinations, and ODA statuses.
- **Tax & Charges Setup Module**: Configuration for dynamic rules around billing:
  - **Fuel Setup**: Management of fuel surcharge percentages based on customer, vendor, product, and timeline.
  - **Tax Setup**: Management of IGST, CGST, and SGST percentages.
- **Modern Modal (AlertDialog)**: Replaced native confirm dialogs with styled Radix-based alerts.
- **Toast Notifications (Sonner)**: Real-time, color-coded feedback for all CRUD operations.
- **Responsive Layout**: Designed to work across various screen sizes.

## 🛠️ Development Practices & Patterns

### Architectural Patterns
- **Service Layer Pattern**: API logic is encapsulated in `src/services/` (e.g., `permission-service.ts`), decoupling UI components from network logic.
- **Isolated Master Screens**: For systemic scalability, each master entity (Product, Country, etc.) has its own dedicated files for types and services within `src/types/masters/` and `src/services/masters/` respectively.
- **Global API Interception**: All frontend API calls are wrapped using an custom `apiFetch` utility (`src/lib/api-fetch.ts`). This interceptor handles global 401 Unauthorized responses by automatically clearing auth tokens and redirecting the user to the login page (bypassing the login endpoint itself to prevent loops).
- **Query & Mutation Pattern**: Utilizes **TanStack Query** for all data fetching and state synchronization, ensuring reliable caching and optimistic updates.
- **Atomic UI Components**: Leverages **Shadcn/ui** for high-quality, accessible base components (Table, Sheet, Dialog, Button).

### Implementation Practices
- **Overlay-First UI**: Significant data creation/update operations use **Drawers (Sheets)** to maintain user context without full-page transitions.
- **Schema-Driven Validation**: All forms are backed by **Zod** schemas and handled via **React Hook Form** for consistent error reporting.
- **Centralized Authorization**: Uses a dedicated `PermissionGuard` component and pattern-based `identifier` strings (e.g., `permission_add`) for modular RBAC.
- **Layout & Navigation Redesign**: 
  - **Expandable/Collapsible Sidebar**: On desktop screens, the sidebar toggles between an expanded state (full text, nested menus) and a contracted state (icons only, tooltips on hover).
  - **Mobile Drawer (Sheet)**: On mobile viewports, the sidebar is replaced with a responsive off-canvas menu triggered via the header's hamburger icon.
  - **Navy Theme & Active States**: Features a deep navy background (`#0c1e35`) with bold white/blue active states matching modern dashboard aesthetics.
  - **Robust Header**: Features an integrated tracking search input and a unified utility/user profile widget section.
  - **Active State Detection**: Uses `usePathname` from `next/navigation` to highlight the current route and map nested structures.
- **Visual Navigation (Icons)**: 
  - Each master screen is assigned a unique, contextually relevant Lucide icon (e.g., `Landmark` for Banks, `MapPin` for Branches) to improve visual recognition in the sidebar.
- **Modern React**: Exclusively uses functional components and hooks (e.g., `useState`, `useQuery`, `useForm`, `useEffect`).
- **Login Page Redesign**:
  - Implemented a responsive split-layout (Left: Graphic/Slider, Right: Form).
  - Left side features an automated image slider (rotating every 5 seconds) with a specific background color (`#a5b2ef`).
  - Right side features a centered logo and a clean, minimalist login form (replacing external labels with placeholders) and a password visibility toggle.
  - "Powered by" footer section simplified to text only for a cleaner look.

### UI/UX Design Practices
- **Drawer Horizontal Padding**: Always include `px-6` in `SheetHeader` and the form container `div` to maintain a professional margin from the edges.
- **Table Cell Wrapping**: Long text in table cells should wrap (`break-words`) to maintain readable columns and avoid unnecessary horizontal scrolling.
- **Modern Feedbacks**: Utilize `sonner` for all success/error toasts and `AlertDialog` for all destructive actions (like Delete) to provide a premium feel.
- **Page Title Management**: 
  - Uses the Next.js `metadata` API with a title template in the root `layout.tsx`.
  - Individual pages/routes provide their specific title (e.g., "Login", "Dashboard") which is then formatted as `[Title] | SB Express Cargo`.
  - **Master Screen Convention**: All master listing pages must use the "Master" suffix in their page title and heading (e.g., "Consignee Master", "State Master").
  - For `use client` pages, meta-data is defined in a sibling `layout.tsx` file.
- **Search Debouncing**:
  - All search fields implement a 500ms debounce using the `useDebounce` hook.
  - This prevents excessive API calls during typing and improves overall application performance.

- **Searchable Dropdowns (Combobox)**:
  - **Requirement**: Use the **Searchable Combobox** pattern (`Popover` + `Command` from Shadcn) for all dropdowns containing more than 10 items or those referencing other Master entities (e.g., Country, Vendor, Branch).
  - **Searchability**: Users must be able to filter options by typing within the dropdown.
  - **Long Text Handling**: The `PopoverTrigger` (Button) must utilize the `truncate` utility class on the label `<span>` to prevent UI overlapping in multi-column layouts (e.g., `grid-cols-2`).
  - **Loading States**: Always implement `disabled` states and "Loading..." placeholders while the back-end data is being fetched via TanStack Query.
  - **Defensive Rendering**: Always use `Array.isArray()` checks before mapping over data and provide a "No items found" fallback using `CommandEmpty`.

- **Master Screen Consistency**: 
  - All master listing pages follow a unified pattern for UI and behavior.
  - **Naming Convention**:
    - **Sidebar Label**: Must include the "Master" suffix (e.g., "Local Branch Master", "Courier Master").
    - **Page Title (Metadata)**: Must include the "Master" suffix.
    - **Page Heading (H1)**: Must include the "Master" suffix.
    - **Action Button**: Primary button follows the "Create [Entity]" format (e.g., "Create Consignee") for clarity and conciseness.
  - **Page Header**: Large 3xl title with a descriptive 1-2 line subtitle.
  - **Action Button**: A primary "Create [Entity]" button in the top right, guarded by the appropriate `_add` permission.
  - **Data Fetching**: Use `TanStack Query` (`useQuery`) for efficient server-state management, pagination, and searching.
  - **Search Bar**: Debounced 500ms search input within a `Card` component, positioned at the top of the table.
  - **Table Layout**: Standardized `Table` with `TableHeader` (gray-50 background) and `TableBody` (hover effects).
  - **Row Actions**: All edit/delete actions for table rows are housed within a `DropdownMenu` (3-dots icon) at the end of each row.
  - **Permissions**: Each action (List, Add, Modify, Delete) is wrapped in a `PermissionGuard` with the corresponding permission string.
  - **Modals/Drawers**: Use `Sheet` (Drawers) for data entry/edit to maintain context, and `AlertDialog` for all destructive deletions.


---

## 🏛️ Core Architecture

### Root Layout & Providers
The application's entry point is the `src/app/layout.tsx`. It handles:
- **Global Fonts**: Uses `Geist` and `Geist_Mono` from `next/font/google`.
- **Global Providers**: All state management and context providers are wrapped in a single `Providers` component in `src/context/providers.tsx`.
- **Global UI**: Includes the `sonner` Toaster for top-right notifications.
- **CSR Convention**: Most application routes are marked as `"use client"`. This is intentional to support heavy interactivity via React Hook Form, TanStack Query, and Auth Context.

### Theming & Dark Mode
- **Status**: The project uses Tailwind 4 with `oklch` color variables.
- **Dark Mode**: `.dark` class support is ready in `globals.css` with a full secondary set of color tokens.
- > [!NOTE]
  > While the CSS is dark-mode ready, a global `ThemeProvider` and user-facing toggle are currently missing (see Technical Debt).

---

## 🔄 State Management (TanStack Query)

The project uses `@tanstack/react-query` to manage server state.

### Configuration (`src/context/providers.tsx`):
- **Stale Time**: Currently set to **60 seconds** (1 minute).
  - > [!WARNING]
    > **Technical Debt**: The `staleTime` is set globally. This should be reviewed and potentially moved to a more granular approach.
- **Retries**: Set to **1** for failed queries.

### Patterns:
- **`useQuery`**: Used for all data fetching (List pages, Edit pages).
- **`useMutation`**: Used for all data modifications (Create, Edit, Delete).
- **Invalidation**: After successful mutations, `queryClient.invalidateQueries` is called to keep the UI in sync with the backend.

---

## 🔒 Authentication & Security

### flow:
- **`useAuth` Context**: A centralized hook and context for managing the authenticated user's state.
- **Route Protection**: Handled via a combination of the `proxy.ts` logic and client-side checks.
- **Permissions**: The `PermissionGuard` component is used to conditionally render UI elements based on the user's assigned permissions.

### Token Storage:
- Currently, the `accessToken` and user data are stored in **`localStorage`** and **`js-cookie`**.
  - **`js-cookie`**: Used primarily to make the token visible to the Next.js Middleware/Proxy for request interception.
  - **`localStorage`**: Used for persistent client-side state across sessions.
  - > [!CAUTION]
    - **Technical Debt**: Storing sensitive tokens in `localStorage` is vulnerable to XSS. This should be migrated to **HTTP-only cookies** for enhanced security.

### Permission Wildcards:
- The `hasPermission` logic in `src/context/auth-context.tsx` includes an override for system administrators.
- **Wildcard Roles**: If the user's role identifier is `SUPER_ADMIN` or `superuser`, all permission checks automatically return `true`, granting full system access regardless of individual permission assignments.
- All API calls utilize the `apiFetch` wrapper.
- If a `401 Unauthorized` response is received, the wrapper automatically clears local tokens and redirects the user to the `/login` page.

---

## 🛠️ Detailed Development Guide

### 1. How you build a module
A module (e.g., `masters/countries`) is typically built within the `src/app/(main)` directory.
- `page.tsx`: The primary list view with search, pagination, and row-level actions.
- `create/page.tsx`: Page for creating new records, usually containing a shared form.
- `[id]/edit/page.tsx`: Dynamic route for editing existing records.
- `src/services/<module>-service.ts`: Dedicated service layer for API calls.
- `src/types/<module>.ts`: TypeScript interfaces and Zod schemas for the module.

### 2. How do you build the list page
The list page follows a standard pattern:
- **Client Component**: Marked with `"use client"`.
- **Search & Debounce**: Implements a debounced (500ms) search input using the `useDebounce` hook.
- **Data Hook**: Uses `useQuery` from React Query to fetch and cache server data.
- **Table Components**: Uses shadcn `Table` components (`TableHeader`, `TableBody`, etc.) for consistent UI.
- **Pagination**: Manages `page` and `limit` state to support large datasets.
- **Actions**: Uses `DropdownMenu` for row-level actions like Edit or Delete, guarded by permissions.

### 3. How do you build the create/edit page
Create and Edit pages are simplified by sharing a common Form component:
- **Shared Form component**: Located in `src/components/masters/country-form.tsx`: A shared form used by both Create and Edit pages.

### Visual Conventions:
- **Module Icons**: Each Master module is assigned a unique, contextually relevant `Lucide` icon for visual identification in the sidebar (e.g., `Globe` for Country, `MapPin` for Area).
- **Consitency**: Always use standard shadcn variants (e.g., `<Button variant="ghost">` or `<Badge variant="outline">`) to maintain a premium, unified look.
- **React Hook Form & Zod**: Manages form state, validation, and error reporting.
- **`useMutation`**: Handles the actual API submission (POST for create, PUT for update).
- **State Synchronization**: Upon successful submission, the component MUST call `queryClient.invalidateQueries` for the relevant module key. This ensures that the user sees the updated information immediately when redirected back to the list page.
- **Success Feedback**: Shows a success toast using `sonner` and redirects back to the list page via `router.push()`.

### 4. How do you write the business logic
Business logic is decoupled into specific layers:
- **Validation Logic**: Encapsulated in Zod schemas in the module's type file.
- **API Logic**: Defined as methods in service objects (e.g., `countryService.createCountry()`).
- **Data models**: Standardized on `ListResponse` (with a `meta` object for pagination) and `SingleResponse` types.
- **Authorization logic**: Controlled via the `PermissionGuard` component and pattern-based permission identifiers.

### 5. How do you integrate the apis
API integration follows a consistent pattern across the project:
- **Standard response structures**: All APIs return a `success: boolean` flag.
- **Listings**: Always include a `meta` object containing `total`, `page`, `limit`, and `totalPages`.
- **`apiFetch` Wrapper**: All calls use the custom `apiFetch` wrapper to handle global concerns like token management and 401 redirects.
- **Service Layer**: Each module has a dedicated service file that encapsulates URL construction, query parameters, and headers.
- **Environment Variables**: Always uses `NEXT_PUBLIC_API_URL` for the base endpoint.

### 6. How do you created the menus and submenus with active state
The application's navigation is managed in `src/app/(main)/layout.tsx`:
- **Role-Based Menus**: Uses `PermissionGuard` to show/hide items based on user permissions.
- **Submenus**: Uses local state (`isMastersOpen`, etc.) to handle collapsible groups.
- **Active State Detection**: Uses `usePathname` to compare the current path with menu item URLs, highlighting the active item and automatically expanding its parent group.

### 7. Advanced UI Patterns
- **Standard Select**: Used for fixed-option enums like `weightUnit`.
- **Searchable Combobox**: 
  - **Pattern**: `Popover` + `Command` from Shadcn UI.
  - **Usage**: Mandatory for all dropdowns with >10 items or those referencing other entities (e.g., Select Country).
  - **Implementation**: Always include "No items found" fallbacks and implement `truncate` on the trigger button to handle long labels.
- **User Feedback**:
  - **Loading States**: Currently uses inline "Loading..." text in table cells or `Loader2` icons in buttons.
  - **Toasts**: Uses `sonner` for rich-color, status-based (success, error) notifications at the top-right.

### Responsive Form Layouts:
- **Grid Pattern**: To maintain consistency and responsiveness, create/edit forms should use a standard grid:
  - Container class: `grid grid-cols-1 md:grid-cols-2 gap-4`.
  - This ensures a single column on mobile and two columns on desktop viewports.

---

## 🛡️ Known Technical Debt

To maintain codebase health, the following items have been identified for future refactoring:

1.  **Token Storage**: Migration from `localStorage` to **HTTP-only Cookies**.
2.  **State Management**: Review of global `staleTime` and transition to more granular cache-control.
3.  **Global Theme Toggle**: Implementation of `next-themes` and a header-based theme switch.
4.  **Loading Skeletons**: Replacing base "Loading..." text with high-quality skeleton loaders.
5.  **Route Protection**: Centralizing middleware logic and ensuring `proxy.ts` is fully integrated with Next.js protocols.
6.  **Error Handling**: Implementing a more robust global error boundary for better crash reporting.

---

## 🚀 Future Roadmap
- Implementation of real-time tracking features.
- Development of dashboard widgets for metrics.
- Advanced cargo management modules.
