# Billing Architecture

This document describes the billing structure after the Charge Master cleanup and Rate Master refactor.

The billing flow is now:

`Charge Master -> Rate Master -> Shipment Pricing -> ShipmentCharge snapshot`

The core idea is:

- `Charge` defines the reusable billing catalog.
- `RateMaster` defines customer-specific pricing rules.
- `Shipment` calculates final billing from the active rate master.
- `ShipmentCharge` stores the final frozen billing rows.

## 1. Charge Master

`Charge` is the main billing master above rate master.

Typical charges:

- AWB CHARGES
- DOCKET CHARGES
- ECC CHARGES
- EDL / ODA
- FOV
- RAS
- HANDLING CHARGES
- REVERSE PICK UP
- APPOINTMENT DELIVERY
- FLOOR DELIVERY

### Active Charge Master Fields

Charge master now keeps only these business fields:

- `id`
- `code`
- `name`
- `calculationBase`
- `applyFuel`
- `sequence`

### Removed From Charge Master

These fields were removed from charge master and should not be shown in frontend:

- `chargeType`
- `multipleCharges`
- `chargeRate`
- `applyTaxOnFuel`
- `applyTax`

### Meaning Of Remaining Fields

- `code`
  Stable billing identifier. Use for matching and frontend mapping.

- `name`
  Human-readable label for dropdowns, preview rows, and invoice labels.

- `calculationBase`
  Default billing basis for this charge when linked in rate master. Must be one of the `CalculationBase` enum values (see **Reference: Prisma enums (billing)** below).

- `applyFuel`
  If true, and customer has active fuel surcharge setup, this charge amount becomes part of the fuel calculation base.

- `sequence`
  Billing execution order. Charges are applied in ascending sequence during shipment pricing.

## Reference: Prisma enums (billing)

Authoritative definitions live in [`schema.prisma`]. APIs accept these as **string literals** matching the enum name exactly (JSON / query).

### `CalculationBase`

Used on `Charge.calculationBase`, `RateCharge.calculationBase`, and `RateCondition.calculationBase` (plus engine breakdown fields).

| Value | Typical use |
| --- | --- |
| `CHARGE_WEIGHT` | Amount scales with **chargeable weight** (often with slabs). |
| `CHARGE_WEIGHT_PER_FLOOR` | Weight basis multiplied by **floor** when floor delivery applies. |
| `FLAT` | **Fixed** rupee amount (not %-of-freight / %-of-value unless combined with `isPercentage` on the rate row). |
| `ACTUAL_WEIGHT` | Basis uses **declared / actual weight** path in the engine. |
| `DISTANCE_KM` | Basis uses **distance** (km). |
| `FREIGHT` | **Percent or amount** relative to **base freight** (e.g. ECC % of freight). |
| `SHIPMENT_VALUE` | Basis is **shipment / declared value** (e.g. FOV). |

### `RateUpdateType` (`RateMaster.updateType`)

- `AWB_ENTRY_RATE`
- `VENDOR_RATE`
- `TAX_FUEL`
- `VENDOR_OBC_RATE`

### `ServiceType` (`ServiceMap.serviceType`, optional)

Used on service map / vendor routing masters, **not** on `RateMaster`.

- `AIR`
- `SURFACE`
- `EXPRESS`

### `RateType` (`RateMaster.rateType`, optional)

Drives which child data supplies base freight.

- `ZONE_MATRIX`
- `DISTANCE_MATRIX`
- `FLAT`

### `PaymentType` (`Shipment.paymentType`)

- `CASH`
- `CREDIT`
- `TO_PAY`

### `ConditionField` (`RateCondition.field`)

What the rule compares (shipment / booking context).

- `DIMENSION_LENGTH`, `DIMENSION_WIDTH`, `DIMENSION_HEIGHT`, `DIMENSION_MAX`
- `WEIGHT`, `CHARGEABLE_WEIGHT`, `SHIPMENT_VALUE`
- `REVERSE_PICKUP`, `APPOINTMENT_DELIVERY`, `FLOOR_DELIVERY`, `FLOOR_COUNT`

### `ConditionOperator` (`RateCondition.operator`)

- `GT`, `GTE`, `LT`, `LTE`, `EQ`

### `ChargeType` (shipment charge rows, not charge master)

Used on persisted `ShipmentCharge`-style payloads / responses where a row type is stored: `AIRWAYBILL`, `FREIGHT`, `FUEL`, `OBC`, `FLAT`, `OTHER`.

## 2. Charge Sequence Rules

`sequence` is now important operationally, not only for display.

### How Sequence Works

- Shipment billing applies `rateCharges` in ascending `sequence`
- lower sequence runs first
- higher sequence runs later

### Validation Rule

Among active charge master rows:

- a sequence cannot be reused

If frontend sends a sequence that already exists:

- backend returns a conflict error
- the error message includes the next usable sequence

Example error shape in plain language:

- `Charge sequence "4" is already in use. Next usable sequence is 7.`

### Default Behavior

If frontend does not send sequence:

- backend automatically assigns the next usable sequence

Frontend recommendation:

- show sequence as editable
- if create API fails with sequence conflict, show returned message directly

## 3. Fuel Behavior

Fuel is controlled by both customer setup and charge master.

### Fuel Rule

Fuel surcharge is applied only when both are true:

1. customer has active fuel surcharge configuration for the shipment date
2. the applied charge has `applyFuel = true` in charge master

### Important Business Meaning

Fuel is not limited to one single billing row.

Fuel can be applied on multiple shipment charges together.

That means:

- AWB can contribute to fuel
- Handling can contribute to fuel
- FOV can contribute to fuel
- any other applied charge can contribute to fuel

if those charges are marked with `applyFuel = true`.

### Fuel Calculation Source

Fuel calculation reads:

- customer fuel setup
- final shipment charge rows that were actually applied
- charge master `applyFuel` flag

So the charge master controls which charge rows are fuel-applicable.

## 4. Rate Master

`RateMaster` is the contract for a customer, **product**, and billing window. **`productId` is required** on create and in the rate engine when calculating freight.

Typical header filters:

- customer
- product (required; identifies which product master contract applies)
- from date
- to date

`updateType` uses `RateUpdateType`; optional `rateType` uses `RateType`. See **Reference: Prisma enums (billing)**.

Route setup should now be treated as:

- `From Zone`
- `To Zone`

not:

- origin
- destination

**Same zone is allowed on base rate:** for **main freight** (`routeRateSlabs` / “base rate” rows), `fromZoneId` and `toZoneId` **may be equal**. That models pickup and delivery **inside the same zone** (e.g. local or intra-zone shipments). The matrix key is still the pair `(fromZoneId, toZoneId)`—a same-zone row such as `(3, 3)` is distinct from cross-zone rows like `(3, 4)`.

Legacy **`zoneRates`** (zone matrix on older contracts) may still enforce `fromZoneId !== toZoneId` in the API; base rate slabs are the normal place to configure same-zone freight.

## 5. Main Freight Setup

Main freight is driven by `routeRateSlabs`.

Each slab can match by:

- `fromZoneId`
- `toZoneId`
- `minKm`
- `maxKm`

Each slab contains weight slabs:

- `minWeight`
- `maxWeight`
- `rate`

This supports:

- zone to zone with weight slab (including **same zone → same zone** when both zone ids match)
- km to km with weight slab
- zone to zone + km with weight slab

## 6. ODA / EDL Setup

ODA surcharge is handled separately using `odaRateSlabs`.

This is different from normal freight on purpose.

ODA can be configured by:

- zone pair
- km range
- zone pair + km range

and must still use weight slabs for the final rate.

Business meaning:

- base freight comes from `routeRateSlabs`
- ODA / EDL surcharge comes from `odaRateSlabs`

## 7. Rate Charges

`RateCharge` is customer-contract-specific charge setup.

It now links to charge master using:

- `chargeId`

Meaning:

- `Charge` says what the charge is
- `RateCharge` says how this customer contract applies that charge

### `RateCharge` Fields Used In Billing

- `chargeId`
- `name`
- `calculationBase`
- `value`
- `isPercentage`
- `minValue`
- `maxValue`
- `sequence`
- `chargeSlabs`

Frontend rule:

- always select charge from charge master
- store `chargeId`
- use `name` only as fallback display text

## 8. Rate Conditions

`RateCondition` is used for conditional billing.

It now also links to charge master using:

- `chargeId`

`field` must be a `ConditionField` enum value and `operator` a `ConditionOperator` enum value (see **Reference: Prisma enums (billing)**).

Examples:

- reverse pickup
- appointment delivery
- floor delivery
- dimension-based rules

When a condition matches:

1. backend first prefers the linked charge
2. then tries matching a configured `RateCharge`
3. then falls back to condition amount/config

This keeps legacy contracts working while moving billing to charge-master-first logic.

## 9. Supported Calculation Bases

The full list and semantics are documented under **Reference: Prisma enums (billing) → `CalculationBase`**. The same enum applies to charge master defaults, `RateCharge`, and `RateCondition` rows (where applicable).

### Shipment Extra Charges

These shipment flags are used in pricing:

- `reversePickup`
- `appointmentDelivery`
- `floorDelivery`
- `floorCount`

Supported behaviors:

#### Reverse Pickup

- `FLAT`
- `CHARGE_WEIGHT`
- `DISTANCE_KM`

#### Appointment Delivery

- `FLAT`
- `CHARGE_WEIGHT`
- `DISTANCE_KM`

#### Floor Delivery

- `FLAT`
- `CHARGE_WEIGHT`
- `DISTANCE_KM`
- `CHARGE_WEIGHT_PER_FLOOR`

Special rule:

- `CHARGE_WEIGHT_PER_FLOOR` multiplies by chargeable weight and `floorCount`
- plain `CHARGE_WEIGHT` does not multiply by floor count

## 10. Shipment Billing Flow

Main pricing logic lives in:

- [rate-engine.service.ts](/Users/ankitkumarpatel/workSpace/sbexpresscargo-backend/src/billing/pricing/rate-engine.service.ts)
- [shipment.service.ts](/Users/ankitkumarpatel/workSpace/sbexpresscargo-backend/src/transaction/shipment/shipment.service.ts)

### Step 1. Resolve Route

Shipment pricing resolves:

- pickup pincode
- delivery pincode
- from zone
- to zone
- distance in km

### Step 2. Pick Active Rate Master

The active contract is selected by:

- customer
- **product** (required)
- shipment booking date inside contract date range

Overlapping contracts for the same customer and product are rejected when saving a rate master.

### Step 3. Calculate Base Freight

Base freight uses:

1. `routeRateSlabs` if present (matching the resolved pickup/delivery zone pair, **including** when `fromZoneId === toZoneId` for same-zone movement)
2. legacy `zoneRates` / `distanceSlabs` as fallback
3. `flatRate` for flat contracts

### Step 4. Calculate ODA

If shipment is ODA and `odaRateSlabs` exist:

- backend matches ODA route slab
- backend matches ODA weight slab
- backend adds ODA charge row

### Step 5. Apply Rate Charges

All applicable `RateCharge` rows are processed in `sequence` order.

This is why charge master sequence uniqueness now matters.

### Step 6. Apply Conditions

The engine evaluates conditions such as:

- reverse pickup
- appointment delivery
- floor delivery

and applies linked or fallback charges.

### Step 7. Apply Fuel

After charge rows are known:

- backend checks customer fuel setup
- backend checks which applied charges have `applyFuel = true`
- fuel is calculated over all eligible applied charges

## 11. Shipment Snapshot

Final billing is stored on shipment tables.

Important shipment fields:

- `rateMasterId`
- `baseFreight`
- `totalAmount`

Important shipment charge fields:

- `chargeId`
- `description`
- `amount`
- `fuelApply`
- `fuelAmount`
- `total`

Frontend and invoice screens should use stored shipment charges, not live rate master rows.

Reason:

- old shipments should not change if rate master changes later
- billing remains auditable
- invoice data stays stable

## 12. Frontend Guidance

### Charge Master Screen

Frontend should expose only:

- code
- name
- calculation base
- apply fuel
- sequence

Frontend should not show removed fields.

### Rate Master Screen

Frontend should build rate master in these sections:

1. Header
   - customer
   - date range
   - **product** (mandatory dropdown from product master)

2. Main freight
   - `routeRateSlabs`
   - `fromZone`
   - `toZone`
   - `fromKm`
   - `toKm`
   - weight slabs

3. ODA
   - `odaRateSlabs`
   - same structure as route slabs

4. Charges
   - select charge from charge master
   - store `chargeId`
   - configure value and slab overrides

5. Conditions
   - field
   - operator
   - comparison value
   - linked charge
   - fallback billing config

### Naming Guidance

For route setup labels use:

- `From Zone`
- `To Zone`

Do not use:

- `Origin`
- `Destination`

for the rate master route matrix UI.

## 13. Example Rate Master Payload

```json
{
  "updateType": "AWB_ENTRY_RATE",
  "fromDate": "2025-02-01",
  "toDate": "2027-03-31",
  "customerId": 12,
  "productId": 3,
  "rateType": "DISTANCE_MATRIX",
  "routeRateSlabs": [
    {
      "fromZoneId": 1,
      "toZoneId": 4,
      "minKm": 0,
      "maxKm": 100,
      "weightSlabs": [
        { "minWeight": 0, "maxWeight": 20, "rate": 180 },
        { "minWeight": 20.001, "maxWeight": 50, "rate": 260 }
      ]
    },
    {
      "fromZoneId": 2,
      "toZoneId": 2,
      "minKm": 0,
      "maxKm": 50,
      "weightSlabs": [
        { "minWeight": 0, "maxWeight": 30, "rate": 90 }
      ]
    }
  ],
  "odaRateSlabs": [
    {
      "minKm": 0,
      "maxKm": 100,
      "weightSlabs": [
        { "minWeight": 0, "maxWeight": 20, "rate": 35 },
        { "minWeight": 20.001, "maxWeight": 50, "rate": 60 }
      ]
    }
  ],
  "rateCharges": [
    {
      "chargeId": 7,
      "value": 75,
      "calculationBase": "FLAT",
      "sequence": 1
    },
    {
      "chargeId": 15,
      "value": 2,
      "calculationBase": "CHARGE_WEIGHT",
      "sequence": 2
    }
  ],
  "rateConditions": [
    {
      "field": "REVERSE_PICKUP",
      "operator": "EQ",
      "value": 1,
      "chargeId": 21,
      "chargeAmount": 40,
      "calculationBase": "DISTANCE_KM"
    },
    {
      "field": "FLOOR_DELIVERY",
      "operator": "EQ",
      "value": 1,
      "chargeId": 22,
      "chargeAmount": 2,
      "calculationBase": "CHARGE_WEIGHT_PER_FLOOR"
    }
  ]
}
```

## 14. Main Files

- [schema.prisma](/Users/ankitkumarpatel/workSpace/sbexpresscargo-backend/prisma/schema.prisma)
- [charge.service.ts](/Users/ankitkumarpatel/workSpace/sbexpresscargo-backend/src/billing/charge/charge.service.ts)
- [create-charge.dto.ts](/Users/ankitkumarpatel/workSpace/sbexpresscargo-backend/src/billing/charge/dto/create-charge.dto.ts)
- [rate-master.service.ts](/Users/ankitkumarpatel/workSpace/sbexpresscargo-backend/src/billing/rate/rate-master.service.ts)
- [create-rate-master.dto.ts](/Users/ankitkumarpatel/workSpace/sbexpresscargo-backend/src/billing/rate/dto/create-rate-master.dto.ts)
- [rate-engine.service.ts](/Users/ankitkumarpatel/workSpace/sbexpresscargo-backend/src/billing/pricing/rate-engine.service.ts)
- [shipment.service.ts](/Users/ankitkumarpatel/workSpace/sbexpresscargo-backend/src/transaction/shipment/shipment.service.ts)

## 15. Migrations Added In This Billing Refactor

- `20260421110000_extend_rate_condition_calculation_base`
- `20260421133000_add_route_and_oda_rate_slabs`
- `20260421151500_link_rate_config_to_charge_master`
- `20260421173000_trim_charge_master_fields`

## 16. Final Mental Model

Use this model in frontend:

- `Charge Master`
  what charge exists and in what order it should run

- `Rate Master`
  how a customer is billed for route, ODA, charges, and conditions

- `Shipment Pricing`
  applies the active contract on real shipment inputs

- `ShipmentCharge`
  the final stored billing rows used by invoice and history screens
