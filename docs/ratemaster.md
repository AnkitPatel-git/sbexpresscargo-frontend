# Rate Master — Frontend implementation guide

This document is aligned with the **live NestJS API**, the **Prisma schema**, and the **Bruno / OpenCollection** requests under:

`documents/postman/SBExpress Cargo API (Backend Structure)/billing/rate/`

Use it as the contract for screens, forms, and API clients. If Bruno or this file disagree with `src/billing/rate/` or `prisma/schema.prisma`, **the code wins**—refresh Bruno from `documents/BRUNO_UPDATE_INSTRUCTIONS.md`.

---

## 1. Conventions

### 1.1 Base URL and auth

- **Prefix:** `/api/rate-master`
- **Auth:** `Authorization: Bearer <accessToken>` (JWT). Collection variables: `baseUrl`, `accessToken`.
- **RBAC:** Routes use `JwtAuthGuard`, `RbacGuard`, and `PermissionsGuard`. Required permissions:
  - `master.rate.create` — create rate master
  - `master.rate.read` — list, get, export, sub-resource reads
  - `master.rate.update` — patch/put, sub-resource mutations
  - `master.rate.delete` — delete rate master

### 1.2 Response envelope

JSON APIs return:

```ts
// Single entity
{ success: true, data: T }

// List (paginated)
{ success: true, data: T[], meta: { page, limit, total, totalPages } }
```

`data` is passed through a normalizer: **Prisma `Decimal` values are serialized as JSON numbers** where possible.

### 1.3 HTTP methods

- **Main resource update:** `PATCH` and `PUT` are both routed to the **same** handler (`PATCH /api/rate-master/:id`). Prefer **PATCH** in new UI code unless you standardize on PUT.
- **Sub-resources:** create `POST`, update **`PUT`** (not PATCH), delete `DELETE`.

### 1.4 Naming: request vs response (critical)

| Request body (create/update DTO) | Response (`GET` detail) |
|-----------------------------------|-------------------------|
| `rateSlabs` | `routeRateSlabs` (each item includes `weightSlabs`) |
| `odaRateSlabs` | `odaRateSlabs` (each item includes `weightSlabs`) |

Always map `rateSlabs` ↔ `routeRateSlabs` when loading a record for edit and when typing TypeScript models.

---

## 2. Enums (from `prisma/schema.prisma`)

Use **exact** string values in JSON (UPPER_SNAKE_CASE).

### 2.1 `RateUpdateType`

- `AWB_ENTRY_RATE`
- `VENDOR_RATE`
- `TAX_FUEL`
- `VENDOR_OBC_RATE`

### 2.2 `RateType` (optional on header)

- `ZONE_MATRIX`
- `DISTANCE_MATRIX`
- `FLAT`

### 2.3 `CalculationBase`

Used on rate charges and rate conditions (when provided).

- `CHARGE_WEIGHT`
- `CHARGE_WEIGHT_PER_FLOOR`
- `FLAT`
- `ACTUAL_WEIGHT`
- `DISTANCE_KM`
- `FREIGHT`
- `SHIPMENT_VALUE`

### 2.4 `ConditionOperator`

- `GT`, `GTE`, `LT`, `LTE`, `EQ`

### 2.5 `ConditionField`

- `DIMENSION_LENGTH`, `DIMENSION_WIDTH`, `DIMENSION_HEIGHT`, `DIMENSION_MAX`
- `WEIGHT`, `CHARGEABLE_WEIGHT`, `SHIPMENT_VALUE`
- `REVERSE_PICKUP`, `APPOINTMENT_DELIVERY`, `FLOOR_DELIVERY`, `FLOOR_COUNT`

---

## 3. Bruno request map (billing/rate)

Each row matches one file in the Bruno folder (same method and path).

| Bruno file (suffix) | Method | Path |
|---------------------|--------|------|
| `POST -api-rate-master.yml` | POST | `/api/rate-master` |
| `GET -api-rate-master.yml` | GET | `/api/rate-master` |
| `GET -api-rate-master-export.yml` | GET | `/api/rate-master/export` |
| `GET -api-rate-master--id.yml` | GET | `/api/rate-master/:id` |
| `PATCH -api-rate-master--id.yml` | PATCH | `/api/rate-master/:id` |
| `DELETE -api-rate-master--id.yml` | DELETE | `/api/rate-master/:id` |
| `GET -api-rate-master-rateMasterId-zone-rates.yml` | GET | `/api/rate-master/:rateMasterId/zone-rates` |
| `GET -api-rate-master-rateMasterId-zone-rates-id.yml` | GET | `/api/rate-master/:rateMasterId/zone-rates/:id` |
| `POST -api-rate-master-rateMasterId-zone-rates.yml` | POST | `/api/rate-master/:rateMasterId/zone-rates` |
| `PUT -api-rate-master-rateMasterId-zone-rates-id.yml` | PUT | `/api/rate-master/:rateMasterId/zone-rates/:id` |
| `DELETE -api-rate-master-rateMasterId-zone-rates-id.yml` | DELETE | `/api/rate-master/:rateMasterId/zone-rates/:id` |
| `GET -api-rate-master-rateMasterId-distance-slabs.yml` | GET | `/api/rate-master/:rateMasterId/distance-slabs` |
| `GET -api-rate-master-rateMasterId-distance-slabs-id.yml` | GET | `/api/rate-master/:rateMasterId/distance-slabs/:id` |
| `POST -api-rate-master-rateMasterId-distance-slabs.yml` | POST | `/api/rate-master/:rateMasterId/distance-slabs` |
| `PUT -api-rate-master-rateMasterId-distance-slabs-id.yml` | PUT | `/api/rate-master/:rateMasterId/distance-slabs/:id` |
| `DELETE -api-rate-master-rateMasterId-distance-slabs-id.yml` | DELETE | `/api/rate-master/:rateMasterId/distance-slabs/:id` |
| `GET -api-rate-master-rateMasterId-rate-charges.yml` | GET | `/api/rate-master/:rateMasterId/rate-charges` |
| `GET -api-rate-master-rateMasterId-rate-charges-id.yml` | GET | `/api/rate-master/:rateMasterId/rate-charges/:id` |
| `POST -api-rate-master-rateMasterId-rate-charges.yml` | POST | `/api/rate-master/:rateMasterId/rate-charges` |
| `PUT -api-rate-master-rateMasterId-rate-charges-id.yml` | PUT | `/api/rate-master/:rateMasterId/rate-charges/:id` |
| `DELETE -api-rate-master-rateMasterId-rate-charges-id.yml` | DELETE | `/api/rate-master/:rateMasterId/rate-charges/:id` |
| `GET -api-rate-master-rateMasterId-rate-conditions.yml` | GET | `/api/rate-master/:rateMasterId/rate-conditions` |
| `GET -api-rate-master-rateMasterId-rate-conditions-id.yml` | GET | `/api/rate-master/:rateMasterId/rate-conditions/:id` |
| `POST -api-rate-master-rateMasterId-rate-conditions.yml` | POST | `/api/rate-master/:rateMasterId/rate-conditions` |
| `PUT -api-rate-master-rateMasterId-rate-conditions-id.yml` | PUT | `/api/rate-master/:rateMasterId/rate-conditions/:id` |
| `DELETE -api-rate-master-rateMasterId-rate-conditions-id.yml` | DELETE | `/api/rate-master/:rateMasterId/rate-conditions/:id` |

**Note:** `GET /api/rate-master/export` must be registered **before** `GET /api/rate-master/:id` on the server (already true). Call export with the **same query model** as the list API.

---

## 4. List and export

### 4.1 `GET /api/rate-master`

**Query** (all optional unless noted; types from `QueryRateMasterDto` + `PaginationQueryDto`):

| Query key | Type | Rules |
|-----------|------|--------|
| `page` | int | ≥ 1 |
| `limit` | int | 1–100 |
| `sortBy` | string | Allowed: **`fromDate`**, **`id`**, **`updateType`** only |
| `sortOrder` | `asc` \| `desc` | |
| `search` | string | Max 255; entity-specific |
| `updateType` | `RateUpdateType` | |
| `fromDate` | date string | Filters `fromDate >=` (inclusive lower bound on header) |
| `toDate` | date string | Filters `toDate <=` (inclusive upper bound on header) |

**Response `data`:** array of **header-only** `RateMaster` rows (no `customer`, `product`, `zoneRates`, etc.). Use `GET :id` for the full graph.

**`meta`:** `{ page, limit, total, totalPages }`.

### 4.2 `GET /api/rate-master/export`

- Same **query parameters** as the list endpoint (filters apply).
- **Response:** `Content-Type: text/csv`, attachment name `rate-masters.csv`.
- **Columns (fixed order):** `updateType`, `fromDate`, `toDate`, `flatRate`
- Rows are capped server-side (stream export with a max row policy). Do not assume export equals full DB dump.

---

## 5. Detail: `GET /api/rate-master/:id`

Returns **one** rate master with:

- Header scalars: `id`, `updateType`, `rateType`, `fromDate`, `toDate`, `version`, `customerId`, `productId`, `flatRate`, `weightUnitStep`, audit fields, etc.
- `customer`: `{ id, code, name }`
- `product`: `{ id, productCode, productName }`
- `zoneRates[]`
- `distanceSlabs[]` with nested `weightSlabs[]`
- **`routeRateSlabs[]`** (not `rateSlabs`) with nested `weightSlabs[]`
- `odaRateSlabs[]` with nested `weightSlabs[]`
- `rateCharges[]` with `charge` and `chargeSlabs[]`
- `rateConditions[]` with optional linked `charge`

Use this response to populate an editor. When building a **PATCH** body, map `routeRateSlabs` → `rateSlabs` for the payload.

---

## 6. Create: `POST /api/rate-master`

### 6.1 Header fields (`CreateRateMasterDto`)

| Field | Required | Notes |
|-------|----------|--------|
| `updateType` | yes | `RateUpdateType` |
| `fromDate` | yes | ISO date string |
| `toDate` | yes | ISO date string |
| `productId` | yes | Must reference an active product |
| `customerId` | no | If omitted, server resolves **first active customer** or creates a placeholder customer. **Product UIs should always send the real `customerId`** to avoid wrong contract scope. |
| `rateType` | no | `RateType` |
| `flatRate` | no | number |
| `zoneRates` | no | See §7 |
| `distanceSlabs` | no | See §8 |
| `rateSlabs` | no | Route slabs; see §9. Response key `routeRateSlabs`. |
| `odaRateSlabs` | no | ODA route slabs; same shape as `rateSlabs` |
| `rateCharges` | no | See §10 |
| `rateConditions` | no | See §11 |

### 6.2 Business rules (server-enforced)

- **`fromDate` < `toDate`**.
- **Contract window length:** inclusive span must not exceed **31 days** (`Date range must not exceed 31 days`).
- **Overlap:** no two active rate masters for the same **`customerId` + `productId`** with overlapping `[fromDate, toDate]`.
- **Zone matrix:** each zone rate must have **`fromZoneId !== toZoneId`**, no duplicate pairs.
- **Distance slabs:** `maxKm > minKm`; slabs must not overlap; nested weight slabs non-overlapping, `maxWeight > minWeight`.
- **Route / ODA slabs:** each slab must define a **zone pair and/or km range**; if km range is used, both `minKm` and `maxKm` required; **`weightSlabs` must be non-empty**; km ranges must not overlap per zone group.

---

## 7. Update: `PATCH /api/rate-master/:id`

Body: **`UpdateRateMasterDto`** = all fields from `CreateRateMasterDto` as **optional**, plus:

| Field | Required on every update |
|-------|---------------------------|
| `version` | **yes** (optimistic lock) |

Server updates with `WHERE id = ? AND version = ?`. If no row updated → **409** `Rate master changed by another user. Refresh and retry.`

### 7.1 Partial vs replace semantics for nested arrays

If the body **includes** any of these keys, the server **soft-deletes existing active children** in that section and **replaces** them with the array you sent:

- `zoneRates`
- `distanceSlabs`
- `rateSlabs`
- `odaRateSlabs`
- `rateCharges`
- `rateConditions`

Rules:

- **Omit** the key → that section is **unchanged**.
- **Send `[]`** → that section is **cleared** (all current rows soft-deleted).

**UI guidance:** For a “save entire contract” form, load detail, map `routeRateSlabs` → `rateSlabs`, edit, then PATCH with **full arrays** for sections the user can change. For single-row edits (e.g. one zone cell), prefer **sub-resource** APIs to avoid wiping other rows.

---

## 8. Delete: `DELETE /api/rate-master/:id`

- Soft delete with version check (same conflict pattern as update if version changed).
- Response: `{ success: true, data: {} }`.

---

## 9. Nested payload shapes (aligned with Bruno examples)

### 9.1 `zoneRates[]` — `CreateZoneRateDto`

```json
{
  "fromZoneId": 1,
  "toZoneId": 2,
  "rate": 50
}
```

Bruno: `POST -api-rate-master-rateMasterId-zone-rates.yml`.

### 9.2 `distanceSlabs[]` — `CreateDistanceSlabDto`

```json
{
  "minKm": 0,
  "maxKm": 50,
  "weightSlabs": [
    { "minWeight": 0, "maxWeight": 10, "rate": 120 },
    { "minWeight": 10, "maxWeight": 100, "rate": 200 }
  ]
}
```

`weightSlabs` optional in DTO but typical for distance pricing. Bruno: `POST -api-rate-master-rateMasterId-distance-slabs.yml`.

### 9.3 `rateSlabs[]` / `odaRateSlabs[]` — `CreateRouteRateSlabDto`

- Optional: `fromZoneId`, `toZoneId`, `minKm`, `maxKm` (must satisfy validation: at least one of zone pair or km range; see §6.2).
- Required: `weightSlabs[]` (non-empty array of `minWeight`, `maxWeight`, `rate`).

Example (zone-only slab):

```json
{
  "fromZoneId": 1,
  "toZoneId": 2,
  "weightSlabs": [{ "minWeight": 0, "maxWeight": 999, "rate": 75 }]
}
```

### 9.4 `rateCharges[]` — `CreateRateChargeDto`

| Field | Notes |
|-------|--------|
| `chargeId` | Optional; link to **charge master** when using catalog charges |
| `name` | Optional string |
| `calculationBase` | Optional `CalculationBase` |
| `value` | **Required** number ≥ 0 |
| `isPercentage`, `minValue`, `maxValue`, `sequence` | Optional |
| `chargeSlabs` | Optional `{ minValue, maxValue, rate }[]` |

Bruno: `POST -api-rate-master-rateMasterId-rate-charges.yml`.

### 9.5 `rateConditions[]` — `CreateRateConditionDto`

| Field | Notes |
|-------|--------|
| `chargeId` | Optional |
| `field` | **Required** `ConditionField` |
| `operator` | **Required** `ConditionOperator` |
| `value` | **Required** number |
| `chargeName` | Optional (max 100) |
| `chargeAmount` | **Required** number ≥ 0 |
| `calculationBase` | Optional |
| `isPercentage` | Optional |

Bruno: `POST -api-rate-master-rateMasterId-rate-conditions.yml`.

---

## 10. Sub-resource APIs (granular CRUD)

Use these when the UI edits **one** zone row, slab, charge, or condition without sending the full contract.

**Path prefix:** `/api/rate-master/:rateMasterId/...`

| Resource | List | Get | Create | Update | Delete |
|----------|------|-----|--------|--------|--------|
| Zone rates | GET `.../zone-rates` | GET `.../zone-rates/:id` | POST | PUT | DELETE |
| Distance slabs | GET `.../distance-slabs` | GET `.../distance-slabs/:id` | POST | PUT | DELETE |
| Rate charges | GET `.../rate-charges` | GET `.../rate-charges/:id` | POST | PUT | DELETE |
| Rate conditions | GET `.../rate-conditions` | GET `.../rate-conditions/:id` | POST | PUT | DELETE |

**Bodies** for create/update match the same DTOs as nested arrays on the main resource (`CreateZoneRateDto`, `CreateDistanceSlabDto`, etc.).

**List endpoints** may include helpful joins (e.g. zone rates with `fromZone` / `toZone` name and code) for grid display—inspect actual JSON when building tables.

**Permissions:** sub-resource **mutations** require `master.rate.update` (not only create/delete on header).

---

## 11. Suggested frontend module layout

1. **List page** — `GET /api/rate-master` with filters; `export` button → `GET /api/rate-master/export` (blob download).
2. **Detail / edit** — `GET /api/rate-master/:id`; keep `version` in component state for PATCH.
3. **Tabs or steps** (all driven from one detail load):
   - Header: customer, product, `updateType`, `rateType`, dates, `flatRate`
   - Zone matrix → `zoneRates` or zone-rate sub-APIs
   - Distance + weight → `distanceSlabs`
   - Route slabs → map `routeRateSlabs` ↔ `rateSlabs`
   - ODA slabs → `odaRateSlabs`
   - Charges → `rateCharges` (+ optional charge master picker for `chargeId`)
   - Conditions → `rateConditions` (enum-driven field/operator dropdowns)
4. **Charge master** — separate billing module; when picking a charge, set `chargeId` on `CreateRateChargeDto` for traceability.

---

## 12. Error handling (typical)

| HTTP | When |
|------|------|
| 400 | Invalid dates, overlapping slabs, zone pair equals, missing `productId`, invalid enum |
| 404 | Rate master, customer, product, or zone not found |
| 409 | Overlapping contract for same customer+product dates; or version conflict on update/delete |

Surface **409** on save as: “Someone else updated this rate. Reload and try again.”

---

## 13. Quick reference: fields **not** on rate master API

Do **not** send legacy or guessed fields on these endpoints, for example:

- No `vendorId` on rate master
- No `zeroContract`
- No `paymentType` / `serviceType` on rate master (product is scoped via **`productId`**)

---

## 14. Source files (for drift checks)

| Concern | Path |
|---------|------|
| Routes & permissions | `src/billing/rate/rate-master.controller.ts` |
| DTOs | `src/billing/rate/dto/create-rate-master.dto.ts`, `update-rate-master.dto.ts`, `query-rate-master.dto.ts` |
| Rules & replace semantics | `src/billing/rate/rate-master.service.ts` |
| Enums & DB shape | `prisma/schema.prisma` |
| Bruno requests | `documents/postman/SBExpress Cargo API (Backend Structure)/billing/rate/*.yml` |

When you attach an updated Bruno export or schema diff, reconcile §2 and §3 first, then nested shapes in §9.
