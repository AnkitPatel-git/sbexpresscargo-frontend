You are an expert senior frontend engineer working on a production-grade application.

## 🎯 Objective

Update the frontend codebase to fully align with the latest backend changes.

## 🧠 Source of Truth (STRICT)

1. **Bruno / OpenCollection export** — folder `docs/SBExpress Cargo API/` (YAML requests + `opencollection.yml` at the collection root). This is the canonical HTTP contract for the portal (plus `Mobile/**` for the native app only).
2. **API schema** — `docs/schema.prisma` defines structure, validation, and data contracts where applicable.

These are ABSOLUTE and must override any existing frontend assumptions.

---

## 📦 Tasks

### 1. API Audit & Mapping

- Go through all APIs in the frontend codebase
- Match each API with Bruno collection
- Validate against schema

Classify APIs into:

- ✅ Valid (no change needed)
- 🔄 Updated (request/response changed)
- ❌ Deprecated (no longer exists)
- 🆕 New APIs (exist in Bruno but not used in frontend)

---

### 2. Update API Layer

- Update API service files (axios/fetch wrappers)
- Ensure:
  - Correct endpoints
  - Correct HTTP methods
  - Headers (auth tokens, etc.)
  - Request payload structure
  - Response typing

- Remove deprecated APIs completely
- Add missing APIs from Bruno

---

### 3. Type Safety (IMPORTANT)

- Update TypeScript interfaces/types strictly based on schema
- Remove outdated types
- Ensure response types match actual API responses from Bruno examples

---

### 4. UI Integration

- Find all components using affected APIs
- Update:
  - Request payload usage
  - Response handling
  - Loading/error states if needed

- Ensure no UI breaks due to schema changes

---

### 5. Data Flow Validation

- Check forms, tables, dashboards, and flows:
  - Create / Update / Fetch / Delete flows must work correctly
- Fix mapping issues between UI and API fields

---

### 6. Cleanup

- Remove:
  - Dead API calls
  - Unused services
  - Obsolete types/interfaces

---

### 7. Testing (MANDATORY)

- Ensure:
  - No runtime errors
  - API calls succeed
  - UI reflects correct data

---

## ⚠️ Rules

- NEVER assume API structure — always refer to Bruno + Schema
- Prefer real Bruno examples over guessed responses
- Keep code clean, modular, and consistent with existing architecture
- Do NOT introduce unnecessary abstractions

---

## 🧾 Output Expectations

- Updated API service files
- Updated types/interfaces
- Updated components
- List of:
  - Added APIs
  - Updated APIs
  - Removed APIs

---

## 🧩 Context

The backend has undergone a major refactor. Frontend must be fully synced with latest APIs without breaking existing UX.

Work step-by-step and ensure correctness over speed.

---

## Bruno ↔ frontend API audit

**Review date:** 2026-04-10  
**Collection:** `docs/SBExpress Cargo API/` (OpenCollection/Bruno YAML; see `opencollection.yml` for variables and collection-wide notes).  
**Excluded from portal scope:** `docs/SBExpress Cargo API/Mobile/**` — `/mobile/*`; reserved for the native app. Do not wire these in the web client unless product explicitly requires it.

**Legend**

| Mark | Meaning |
|------|---------|
| ✅ | Endpoints used in `src/services` (or `api-client`) match Bruno paths & verbs for that feature. |
| 🔄 | Partially aligned: list/query/body may differ; confirm with backend or tighten to Bruno samples. |
| 🆕 | In Bruno (portal-relevant) but no dedicated UI or thin “JSON panel” only. |
| ❌ | Removed from backend per `opencollection.yml` or not in Bruno (legacy / dead). |

### App

| Bruno | Frontend |
|-------|----------|
| `GET {{baseUrl}}/` | ✅ `src/services/app-service.ts` → `/utilities/api-health` |

### Dashboard

| Bruno | Frontend |
|-------|----------|
| `GET /dashboard/operation` | ✅ `dashboard-service.getOperationSummary` |
| `GET /dashboard/sales` | ✅ `dashboard-service.getSalesSummary` (+ optional `serviceCenterId` as in Bruno params) |
| `GET /dashboard/sales/service-centers` | ✅ `dashboard-service.getSalesByServiceCenters` |

### Document → Invoice

| Bruno | Frontend |
|-------|----------|
| List, preview, generate, print, get by id, lock, unlock, lock-log, send-email, export CSV | ✅ `src/services/document/invoice-service.ts` |

### Transaction (portal)

| Submodule | Coverage |
|-----------|----------|
| Shipment | ✅ `shipment-service` (list aligned with Bruno `sortBy`/`sortOrder`/`search`; CRUD, export, KYC, pieces template, forwarding, POD via shipment where implemented) |
| Manifest | ✅ Core CRUD + 🆕 extended ops in `manifest-service` (inscan, view, AWBs, next-number, print, exports, progress, close, shipments) — full CRUD UIs vary by screen |
| DRS | ✅ `drs-service` (list matches Bruno `page`/`limit` only; scan create, start, complete, export) |
| Tracking | ✅ `tracking-service` (search with `search=`; metrics; manual; dead-letters; retry; webhooks; per-AWB summary/history) |
| POD | ✅ `pod-service` (POST `/view` with `{ awbNos }`, template, upload, export — matches Bruno) |
| Customer payment | ✅ `customer-payment-service` (list matches Bruno; other CRUD as implemented) |
| Credit note (receipt expenses) | ✅ `credit-note-service` → `/transaction/receipt-expenses/credit-note` (list without extra sort params; no Bruno “post” endpoint — post action removed) |
| Receipt | ✅ `receipt-service` (list sends `shipmentId`/`receiptNo` like Bruno) |
| Misrouted / Undelivered scan | ✅ dedicated services + list/export pages |
| Vendor status mappings | ✅ `vendor-status-mapping-service` |
| Vendor tracking logs | ✅ `vendor-tracking-log-service` |
| Tracking summary (resource) | ✅ `tracking-summary-service` → `/transaction/tracking-summary` (distinct from `/tracking/awb/.../summary`) |

### Masters (portal)

| Area | Service | Notes |
|------|---------|--------|
| Product, Country, State, Content, Bank, Local branch, Service center, Customer (+ KYC), Consignee, Shipper, Vendor, Courier, Area, Exception, Service map, Charge, Rate, Zone | ✅ under `src/services/masters/*` | Paths follow Bruno (`*-master` or `rate-master` / `rate` for preview & calculate). |
| Serviceable pincode | ✅ `serviceable-pincode-service` | List query aligned with Bruno: `sortBy=pinCode`, `sortOrder=asc`, `search=` default. Alias routes `GET/POST /pincode` exist in Bruno only; portal uses `/utilities/serviceable-pincodes` (documented as canonical). |
| **Vehicle Master** | 🆕 | Bruno has `vehicle-master` CRUD; **no** `vehicle-service` / UI yet. |
| **Vendor Config Master** | 🆕 | Bruno has `vendor-config-master` CRUD; **no** service/UI yet. |
| Client Rate Master | ❌ | Removed from API (`opencollection.yml`); UI redirects old client-rates routes to Rate Master. |

### Utilities

| Bruno | Frontend |
|-------|----------|
| Users (login, profile, onboard, update, change password, sessions, logoff, logout) | ✅ `user-service` + `api-fetch` login exception |
| Permissions CRUD + grouped + assign to role | ✅ `permission-service` |
| Roles CRUD | ✅ `role-service` + `/utilities/roles` page |
| Audit logs list / get by id | ✅ `audit-log-service` + page |

### Shipment helpers (referenced in docs, optional Bruno file)

| Method | Frontend | Bruno |
|--------|----------|--------|
| `PUT /transaction/shipment/:id/vendor-mapping` | ✅ `shipmentService.listVendorMappings` / `upsertVendorMapping` | Mentioned in `Tracking – Vendor Webhook (Single).yml` and `opencollection.yml`; **no** dedicated request file under `Transaction/Shipment/` — treat as **🔄** until a Bruno example exists. |

### Not in Bruno (cleanup candidates)

| Item | Action |
|------|--------|
| `src/services/utilities/country-pincode-service.ts` | No matching Bruno folder; **unused** by pages — candidate to **delete** after confirming backend deprecation. |

### Testing checklist (mandatory per §7)

- [ ] Smoke: login → dashboard sales/operation → one master list → one transaction list → invoice list.  
- [ ] Serviceable pincode list after query-string alignment.  
- [ ] Any screen that still sends **extra** query params (e.g. optional `search` on credit notes) — verify backend accepts them.  
- [ ] Add **Vehicle** and **Vendor config** services + UI when backend confirms stable contracts from Bruno examples.

### Recent alignment fixes (this repo)

- Receipt list, tracking search, shipment list, manifest aggregated view query strings matched to Bruno.  
- Credit note list stripped of non-Bruno sort params; non-Bruno `POST .../post` removed.  
- DRS list stripped to Bruno `page`/`limit`; UI search is client-side filter.  
- Customer payment list stripped to Bruno base query.  
- Typed receipt create body: `src/types/transactions/receipt-bruno.ts`.  
- Master **business codes** (`productCode`, `vendorCode`, `shipperCode`, etc.): optional in forms; empty values are omitted on submit so the backend can auto-generate (`src/lib/master-code-schema.ts`).
