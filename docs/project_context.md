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
- **Modern Modal (AlertDialog)**: Replaced native confirm dialogs with styled Radix-based alerts.
- **Toast Notifications (Sonner)**: Real-time, color-coded feedback for all CRUD operations.
- **Responsive Layout**: Designed to work across various screen sizes.

## 🛠️ Development Practices & Patterns

### Architectural Patterns
- **Service Layer Pattern**: API logic is encapsulated in `src/services/` (e.g., `permission-service.ts`), decoupling UI components from network logic.
- **Isolated Master Screens**: For systemic scalability, each master entity (Product, Country, etc.) has its own dedicated files for types and services within `src/types/masters/` and `src/services/masters/` respectively.
- **Query & Mutation Pattern**: Utilizes **TanStack Query** for all data fetching and state synchronization, ensuring reliable caching and optimistic updates.
- **Atomic UI Components**: Leverages **Shadcn/ui** for high-quality, accessible base components (Table, Sheet, Dialog, Button).

### Implementation Practices
- **Overlay-First UI**: Significant data creation/update operations use **Drawers (Sheets)** to maintain user context without full-page transitions.
- **Schema-Driven Validation**: All forms are backed by **Zod** schemas and handled via **React Hook Form** for consistent error reporting.
- **Centralized Authorization**: Uses a dedicated `PermissionGuard` component and pattern-based `identifier` strings (e.g., `permission_add`) for modular RBAC.
- **Dynamic Sidebar Navigation**: 
  - **Active State Detection**: Uses `usePathname` from `next/navigation` to highlight the current route.
  - **Collapsible Submenus**: Implements state-based toggling for nested menus (e.g., Settings) with persistence on page reloads/hard refreshes by checking the initial URL path.
  - **Visual Feedback**: Utilizes `Chevron` icons and consistent active styling (`bg-gray-100`) for clear navigation context.
- **Visual Navigation (Icons)**: 
  - Each master screen is assigned a unique, contextually relevant Lucide icon (e.g., `Landmark` for Banks, `MapPin` for Branches) to improve visual recognition in the sidebar.
- **Modern React**: Exclusively uses functional components and hooks (e.g., `useState`, `useQuery`, `useForm`, `useEffect`).

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

## 🚀 Future Roadmap
- Implementation of real-time tracking features.
- Development of dashboard widgets for metrics.
- Advanced cargo management modules.
