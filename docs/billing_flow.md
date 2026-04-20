# Billing Flow

This project uses a snapshot-based billing flow.

The important idea is simple:

1. Rate masters define pricing rules.
2. Shipments read those rules at calculation time.
3. The computed freight and charge rows are stored on the shipment.
4. Later invoice or pricing screens read the stored snapshot, not the live rate tables.

## Main Tables And Their Roles

### `RateMaster`

The header record that decides which pricing configuration is active for a customer, service type, product, and date range.

Key fields:

- `customerId`
- `serviceType`
- `rateType`
- `fromDate`
- `toDate`
- `zeroContract`
- `flatRate`

### `DistanceSlab`

Used when the base rate is distance based.

Each slab has:

- `minKm`
- `maxKm`
- child `WeightSlab` rows

Rule:

- Slabs must not overlap.
- If one slab already covers `0-50`, the next slab should start after that range, for example `51-100`.

### `WeightSlab`

Child rows under a distance slab.

Each row maps a weight range to a rate.

Example:

- `0-100 kg -> 825`
- `101-200 kg -> 950`

Rule:

- Weight slabs inside one distance slab must not overlap.
- If one weight slab covers `0-10`, the next one should start after that range, for example `11-20`.

### `RateCharge`

Additional charge setup attached to a rate master.

Examples:

- Fuel
- Handling
- Reverse Pickup
- Appointment Delivery
- Floor Delivery

Fields:

- `name`
- `calculationBase`
- `value`
- `isPercentage`
- `minValue`
- `maxValue`
- `weightStep`
- `sequence`

### `ChargeSlab`

Optional slab override for a `RateCharge`.

If a charge has slabs, the matched slab rate can override the normal calculation.

### `RateCondition`

Conditional rule that decides whether an extra charge should be applied.

Examples:

- `REVERSE_PICKUP EQ 1`
- `APPOINTMENT_DELIVERY EQ 1`
- `FLOOR_DELIVERY EQ 1`
- `DIMENSION_MAX GT 200`

Fields:

- `field`
- `operator`
- `value`
- `chargeName`
- `chargeAmount`
- `isPercentage`

## Shipment Tables In Billing

### `Shipment`

Stores the booking and the billing snapshot.

Billing related fields:

- `rateMasterId`
- `baseFreight`
- `totalAmount`
- `chargeWeight`
- `reversePickup`
- `appointmentDelivery`
- `floorDelivery`
- `floorCount`

### `ShipmentCharge`

Stores the final charge rows for a shipment.

Each row is persisted with:

- `description`
- `amount`
- `total`
- `fuelApply`
- `fuelAmount`
- `chargeType`

This is the stored billing snapshot used later by invoice and pricing screens.

## How Billing Is Connected

The billing chain in this codebase is:

`RateMaster` -> `RateEngineService` -> `ShipmentService` -> `Shipment` and `ShipmentCharge`

The important files are:

- [Rate master service](/Users/ankitkumarpatel/workSpace/sbexpresscargo-backend/src/billing/rate/rate-master.service.ts)
- [Rate engine](/Users/ankitkumarpatel/workSpace/sbexpresscargo-backend/src/billing/pricing/rate-engine.service.ts)
- [Shipment service](/Users/ankitkumarpatel/workSpace/sbexpresscargo-backend/src/transaction/shipment/shipment.service.ts)

## Rate Master Setup Flow

When a user creates or updates rate master data:

1. The header record is saved in `rate_masters`.
2. Zone rates are saved in `zone_rates`.
3. Distance slabs are saved in `distance_slabs`.
4. Weight slabs are saved in `weight_slabs`.
5. Rate charges are saved in `rate_charges`.
6. Charge slabs are saved in `charge_slabs`.
7. Rate conditions are saved in `rate_conditions`.

### Distance Slab Validation

Distance slabs are validated so they do not overlap.

That means:

- `0-50` is valid
- `51-100` is valid
- `40-50` is not valid if `0-50` already exists

The backend enforces this when distance slabs are created or updated.

## Shipment Billing Flow

### 1. Shipment Create Or Preview

The shipment service calls the rate engine with:

- customer
- service type
- pickup pincode
- delivery pincode
- zones
- weight
- chargeable weight
- shipment value
- reverse pickup flag
- appointment delivery flag
- floor delivery flag
- floor count
- dimensions
- booking date

See:

- [Shipment service](/Users/ankitkumarpatel/workSpace/sbexpresscargo-backend/src/transaction/shipment/shipment.service.ts)
- [Rate engine](/Users/ankitkumarpatel/workSpace/sbexpresscargo-backend/src/billing/pricing/rate-engine.service.ts)

### 2. Base Freight Selection

`RateEngineService` selects the active `RateMaster` by:

- customer
- service type
- product, if present
- booking date range

Then it calculates base freight using the configured rate type:

- `ZONE_MATRIX`
- `DISTANCE_MATRIX`
- `FLAT`

### 3. Charge Calculation

After base freight, the engine applies `RateCharge` rows.

Supported calculation patterns:

- flat
- percentage
- per kg
- actual weight
- freight-based
- shipment value-based
- slab override

### 4. Condition Calculation

The engine then checks `RateCondition` rows.

If the condition matches, the linked charge is applied.

For the shipment flags:

- `REVERSE_PICKUP` applies when `reversePickup = true`
- `APPOINTMENT_DELIVERY` applies when `appointmentDelivery = true`
- `FLOOR_DELIVERY` applies when `floorDelivery = true`

### 5. Special Multipliers

These rules are important for the new billing behavior:

- `Reverse Pickup`
  - usually a flat add-on
  - the condition simply enables the charge

- `Appointment Delivery`
  - can be configured as per-kg
  - example: `1 rupee/kg * 100 kg = 100`

- `Floor Delivery`
  - can be configured as per-kg or per-floor-per-kg
  - example: `1 rupee/kg * 100 kg * 10 floors = 1000`

The shipment code multiplies floor delivery charges by `floorCount`.

## What Gets Stored On Shipment

When pricing is finalized:

1. Existing charge rows for the shipment are soft-deleted.
2. New `ShipmentCharge` rows are inserted.
3. `Shipment.rateMasterId` is updated.
4. `Shipment.baseFreight` is updated.
5. `Shipment.totalAmount` is updated.

This means the shipment keeps a frozen billing snapshot.

## Fuel Surcharge

Fuel is applied after the base charges are computed.

The project checks customer fuel surcharge setup and the charge master flag:

- if the customer has active fuel surcharge setup, fuel is applied
- if a charge is marked as fuel-applicable, fuel is added to that row

Fuel is also stored in the shipment charge breakdown.

## Condition And Charge Linkage

In this project, a condition row does not always calculate money by itself.

The flow is:

1. Rate condition matches shipment data.
2. The system looks for a rate charge with the same name.
3. If found, that charge configuration is used.
4. If not found, the condition falls back to the amount defined on the condition row.

This lets the system support both:

- legacy condition-only charges
- newer first-class rate-charge driven billing

## Example Scenarios

### Reverse Pickup

If:

- `reversePickup = true`
- rate condition exists for `REVERSE_PICKUP`
- linked rate charge is flat `75`

Then shipment gets an extra `75`.

### Appointment Delivery

If:

- `appointmentDelivery = true`
- linked charge is `1 rupee/kg`
- chargeable weight is `100`

Then shipment gets an extra `100`.

### Floor Delivery

If:

- `floorDelivery = true`
- linked charge is `1 rupee/kg`
- chargeable weight is `100`
- floor count is `10`

Then shipment gets an extra `1000`.

## Practical Data Flow

### Shipment Create

`ShipmentService.createShipment()`:

1. validates shipment input
2. resolves chargeable weight
3. resolves route and zones
4. calls `RateEngineService.calculateRate()`
5. stores shipment and charge snapshot

### Shipment Repricing

`ShipmentService.calculateShipmentPricing()`:

1. loads existing shipment
2. resolves route and weights
3. loads active rate master
4. recomputes billing
5. replaces stored shipment charge rows
6. updates shipment totals

## Why The Snapshot Matters

This design keeps billing stable.

Once a shipment is billed:

- invoice totals do not change because a rate master was edited later
- audit is easier
- finance sees the exact rows used at creation time

## Summary

Billing in this project is driven by rate masters, but shipments store the final computed output.

The order is:

`RateMaster setup` -> `RateEngine calculation` -> `ShipmentCharge snapshot` -> `Invoice/Pricing read`

That is the core billing architecture for this codebase.
