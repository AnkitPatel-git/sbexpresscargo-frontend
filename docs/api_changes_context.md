# API Changes Context

This document tracks changes in API response and payload structures and their impact on the frontend.

## Users Module

### Login API (`/users/login`)
- **Status**: Completed
- **Payload Changes**: Added `platform: "portal"` requirement.
- **Response Structure Changes**:
  - Response wrapped in `success`, `message`, and `data`.
  - `data.user.permissions` is now an **array of strings** (dot-notation identifiers like `master.product.read`).
  - Added `data.user.role` object with `identifier`.
- **Impact**:
  - `AuthContext` updated to support `SUPER_ADMIN` and `superuser` roles.
  - `PermissionGuard` and Sidebar menu filtering updated to use the string array instead of previous structures.
  - **IMPORTANT**: Existing logged-in users must log out and log in again to refresh their `localStorage` user object with the new permission array structure.

### Permission Mapping Reference

| Legacy Identifier | New dot-notation Identifier | Description |
|-------------------|-----------------------------|-------------|
| `product_master_add` | `master.product.create` | Create a new product |
| `product_master_modify` | `master.product.update` | Update existing product |
| `product_master_delete` | `master.product.delete` | Delete a product |
| `zone_master_list` | `master.area.read` | View zones (now areas) |
| `superuser` | `SUPER_ADMIN` | Root level access bypass |
| `..._list` | `master....read` | General view permission |
| `..._add` | `master....create` | General create permission |
| `..._modify` | `master....update` | General update permission |
| `..._delete` | `master....delete` | General delete permission |
| `NON-DOX` | `NDOX` | Updated shorthand for Non-Document |

## Masters Module

### Product Master API (`/product-master`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Enums**: Strict uppercase requirements for:
  - `productType`: `DOMESTIC`, `INTERNATIONAL`, `IMPORT`, `LOCAL`
  - `groupType`: `AIR`, `SURFACE`, `TRAIN`, `ALL`
  - `docType`: `DOX`, `NDOX`
- **Status**: Completed Refactor.

### Country Master API (`/country-master`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Enums**: Strict uppercase requirements for:
  - `weightUnit`: `KGS`, `LBS`
- **Status**: Completed Refactor.

### State Master API (`/state-master`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Enums**: Strict uppercase requirements for:
  - `productType`: `DOMESTIC`, `INTERNATIONAL`, `LOCAL`
- **Status**: Completed Refactor.

### Industry Master API (`/industry-master`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Status**: Completed Refactor.

### Flight Master API (`/flight-master`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Enums**: Strict uppercase requirements for:
  - `flightType`: `PRIME`, `GCR`
- **Status**: Completed Refactor.

### Content Master API (`/content-master`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Fields Expanded**: Added support for:
  - `additionalField`, `clearanceCethNo`
  - Notification Details: `notificationNo`, `srNo`, `notificationSubType`, `notificationSubType1`
  - IGST Details: `igstNotification`, `igstSrNo`, `igstcNotification`, `igstcSrNo`
- **Status**: Completed Refactor.

### Bank Master API (`/bank-master`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Status**: Completed Refactor.

### Service Center Master API (`/service-center-master`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Status**: Completed Refactor.

### Local Branch Master
| Feature | Old State | New State |
| :--- | :--- | :--- |
| Pagination | Root level (`total`, `page`, etc.) | Nested `meta` object `{ total, page, limit, totalPages }` |
| Fields | ~11 basic fields | ~42 comprehensive fields (Bank, Tax, Invoice, Contact) |
| UI Standard | Standard Select for Service Center | Searchable Combobox |
| Scroll Management | No explicit scroll area | Shadcn `ScrollArea` for large forms |
- **Status**: Completed Refactor.

### Area Master API (`/area-master`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **UI Standard**: Searchable Combobox for Service Center selection.
- **Fields Update**: Uses `serviceCenterId` (number) instead of `serviceCenter` (string).
- **Permissions**: Uses `master.area.read/create/update/delete`.
- **Status**: Completed Refactor.

### Consignee Master API (`/consignee-master`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Fields Expanded**: Added `industry`, `fax`, `eori`, `vat`.
- **UI Standard**: Searchable Combobox for Service Center and State.
- **Status**: Completed Refactor.

### Shipper Master API (`/shipper-master`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Fields Expanded**: Added ~20+ new fields including business identification (IEC, GST, PAN, Aadhaar) and bank details (Account, IFSC, LUT No, etc.).
- **UI Standard**: Form organized into logical sections; searchable Combobox for State and Service Center.
- **Status**: Completed Refactor.

### Exception Master API (`/exception-master`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Enums**: Strict uppercase requirements for:
  - `type`: `UNDELIVERED`, `IN_TRANSIT`, `DELAYED`, `DELIVERED`
- **Status**: Completed Refactor.

### Service Map Master API (`/service-map-master`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Payload Changes**:
  - `vendor` -> `vendorCode`
  - `billingVendor` -> `billingVendorCode`
- **Response Structure**:
  - `vendor` -> `vendorId`
  - `billingVendor` -> `billingVendorId`
- **Enums**: Strict uppercase requirements for:
  - `status`: `ACTIVE`, `INACTIVE`
  - `serviceType`: `AIR`, `SURFACE`, `EXPRESS`
- **Status**: Completed Refactor.

### Charge Master API (`/charge-master`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Enums**: Strict uppercase requirements for:
  - `calculationBase`: `CHARGE_WEIGHT`, `FLAT`
  - `chargeType`: `FREIGHT`, `AIRWAYBILL`, `FUEL_SURCHARGE`, `DOCUMENTATION`, `OTHER`
- **Status**: Completed Refactor.

### Serviceable Pincodes API (`/utilities/serviceable-pincodes`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Payload Changes**:
  - `serviceCenter` -> `serviceCenterId`, `serviceCenterCode`
- **Response Structure**:
  - `serviceCenter` -> Object `{ id, code, name }`
- **UI Standard**: Searchable Combobox for Service Center.
- **Status**: Completed Refactor.

### Fuel Setup API (`/tax-charges/fuel-setup`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Enums**: Strict uppercase requirements for:
  - `service`: `AIR`, `SURFACE`, `EXPRESS`, `STANDARD`
- **UI Standard**: Searchable Combobox for Customer, Vendor, and Product selection.
- **Status**: Completed Refactor.

### Permissions API (`/permissions`)
- **Pagination**: Metadata moved from root to nested `meta` object `{ total, page, limit, totalPages }`.
- **Payload Changes**:
  - `Create/Update Permission`: `{ name, underMenu, description }`.
- **Response Structure**:
  - Returns `module`, `subModule`, and auto-generated `identifier`.
  - `underMenu` from payload is stored as `subModule`.
- **Status**: Completed Refactor.
