# Shipment & Billing Notes

Living notes for the core shipment and billing flow in this logistics app.
Update this file whenever we confirm a new rule, endpoint, field relationship, or UI behavior related to shipment, charges, rate setup, invoicing, or customer payment.

## Current Understanding

- Shipment creation and shipment charge calculation use the same core payload shape.
- `POST /api/transaction/shipment/calculate-charges` is the non-persistent pricing step.
- `POST /api/transaction/shipment` is the actual create step and returns the persisted shipment with computed billing fields.
- `awbNo` is optional during booking; if it is blank, the backend auto-generates it.
- `ewaybillNumber` is an optional booking/client field and can be left blank.
- Shipment booking does not expose editable origin/destination fields; pincode is the source input for routing-related logic.
- Shipment booking uses a single `Address` field for both shipper and consignee, mapped from `address1` in the form.
- Shipment booking does not expose shipper or consignee code inputs; those are handled by the backend/master records.
- Shipment booking does not expose IEC or VAT fields for shipper/consignee.
- Shipment booking auto-fills `city`, `state`, and `country` from shipper/consignee master data when selected.
- Consignee master selection now prefers `stateMaster.stateName` from the API payload, then falls back to `state.stateName` and pincode state data.
- Shipment booking selection dropdowns now fetch only 10 records by default and switch to server search when the user types in the combobox search box.
- When no shipper or consignee master is selected, `pincode` becomes a selectable serviceable-pincode field and it drives auto-fill for `city`, `state`, and `country`.
- `fromZoneId` is shown in the shipper block and `toZoneId` is shown in the consignee block; each zone dropdown is filtered from the zones attached to the selected pincode.
- Zone selection stays enabled even when a shipper or consignee master is selected, because it is still a required booking field.
- `city`, `state`, and `country` are derived fields only and stay disabled in the shipment form.
- Shipment booking falls back to pincode lookup for `city`, `state`, and `country` when no shipper/consignee master is selected, and clears those fields if the pincode is incomplete or invalid.
- Shipment booking now auto-calculates `km` from the selected shipper/consignee pincodes using a free OpenStreetMap-based geocoding and routing lookup, with the field staying in the service details area.
- Service details in booking now map directly to the API payload fields: `shipmentTotalValue`, `reversePickup`, `appointmentDelivery`, `floorDelivery`, `floorCount`, `km`, `commercial`, `paymentType`, `instruction`, `serviceCenterId`, `isCod`, and `codAmount`.
- Selecting a shipper or consignee master locks the editable fields in that block until the refresh icon is used to clear the selection and return to manual entry.
- Refreshing a shipper or consignee block should clear that block without immediately showing validation errors; required-state styling should reappear on submit.
- When no shipper or consignee master is selected, the manual fields in that block are required and the form labels show a red `*`, but `city`, `state`, and `country` remain derived from pincode lookup and are not manual-entry requirements.
- Billing logic is driven by the rate master, charge master, and shipment-level flags like COD, reverse pickup, floor delivery, and shipment value.
- Invoice generation is handled separately under `document/invoice`.
- Customer payment entries reference an `invoiceNo`, so invoice numbering is part of the downstream billing flow.
- There are two different "rate" concepts in the UI:
  - `chargeRate` in charge master is the base definition of a charge rule.
  - `rateCharges[].value` in rate master is the customer/service-specific tariff that gets applied during shipment pricing.

## Confirmed API Surfaces

### Shipment

- `POST /api/transaction/shipment`
- `POST /api/transaction/shipment/calculate-charges`
- `GET /api/transaction/shipment`
- `GET /api/transaction/shipment/:id`
- `GET /api/transaction/shipment/export`
- `GET /api/transaction/shipment/pieces-template`
- `POST /api/transaction/shipment/:id/forwarding`
- `POST /api/transaction/shipment/:id/kyc`
- `POST /api/transaction/shipment/:id/status`
- `POST /api/transaction/shipment/:id/pod`

### Billing Setup

- `GET /api/charge-master`
- `GET /api/charge-master/by-product/:productId`
- `POST /api/charge-master`
- `PATCH /api/charge-master/:id`
- `DELETE /api/charge-master/:id`
- `GET /api/rate-master`
- `POST /api/rate-master`
- `PATCH /api/rate-master/:id`
- Rate master child APIs exist for zone rates, distance slabs, rate charges, and rate conditions.

### Invoice

- `GET /api/document/invoice`
- `POST /api/document/invoice/preview`
- `POST /api/document/invoice/generate`
- `GET /api/document/invoice/print`
- `GET /api/document/invoice/:id`
- `POST /api/document/invoice/:id/lock`
- `POST /api/document/invoice/:id/unlock`
- `GET /api/document/invoice/lock-log`
- `POST /api/document/invoice/send-email`
- `GET /api/document/invoice/export`

## Shipment Payload Notes

- `shipmentTotalValue` is present in shipment input and is used in billing calculation.
- `piecesRows` must contain at least one piece row.
- Each `piecesRows[].items` list must contain at least one item.
- `piecesRows[].items[]` can carry invoice-level details like `invoiceDate` and `invoiceNumber`.
- `chargeWeight` is a read-only derived field; it follows the greater of `actualWeight` and `volumetricWeight`.
- `piecesRows[].actualWeight` is the backend field name used for piece weight; the form now submits that name to match the calculate-charges payload.
- Shipment form data also includes direct billing fields such as:
  - `baseFreight`
  - `contractCharges`
  - `otherCharges`
  - `subTotal`
  - `totalFuel`
  - `igst`
  - `cgst`
  - `sgst`
  - `totalAmount`
  - `medicalCharges`
  - `codAmount`
  - `isCod`
- Shipment response includes billing outputs such as:
  - `rateMasterId`
  - `baseFreight`
  - `totalAmount`
  - `declaredWeight`
  - `chargeWeight`
  - `paymentType`

## Charge Master Notes

- Charge master supports these calculation bases:
  - `CHARGE_WEIGHT`
  - `FLAT`
  - `ACTUAL_WEIGHT`
  - `FREIGHT`
  - `SHIPMENT_VALUE`
- Charge types seen in the app:
  - `AIRWAYBILL`
  - `FREIGHT`
  - `FUEL`
  - `OBC`
  - `FLAT`
  - `OTHER`
- Charge fields that affect billing:
  - `applyFuel`
  - `applyTaxOnFuel`
  - `applyTax`
  - `sequence`
  - `multipleCharges`
- `chargeRate` is stored on the charge master itself and is used to define the charge rule, not the customer-specific shipment total by itself.
- In the shipment UI, charge rows are linked to master charges by `chargeId`, but the backend still decides the computed amount during pricing.

## Rate Master Notes

- Rate master is date-ranged with `fromDate` and `toDate`.
- Important rate-level fields:
  - `updateType`
  - `serviceType`
  - `rateType`
  - `customerId`
  - `productId`
  - `vendorId`
  - `serviceCenterId`
  - `paymentType`
  - `zeroContract`
  - `flatRate`
  - `weightUnitStep`
- Rate master can contain:
  - `zoneRates`
  - `distanceSlabs`
  - `rateCharges`
  - `rateConditions`
- We have already seen calculation outputs that include both `RATE_CHARGE` and `CONDITION` rows.
- The rate master is the main customer-specific pricing record. It is keyed by:
  - `customerId`
  - `productId`
  - optional `vendorId`
  - `serviceType`
  - `rateType`
  - `paymentType`
  - date window (`fromDate`/`toDate`)
- `zoneRates` defines base freight for origin/destination zone pairs.
- `rateCharges` defines additional tariff lines such as `FOV`, `HANDLING`, `ECC`, `RAS`, `ODA`, `OTHER`, and `FUEL`.
- `rateConditions` defines conditional surcharges such as floor delivery or high-value shipment add-ons.

## Customer-Specific Billing Setup

- Customer master has separate child endpoints for billing-related setup:
  - `fuel-surcharges`
  - `other-charges`
  - `volumetrics`
- These child records are keyed by customer and usually also by `vendorId` and `productId`.
- Fuel surcharge records include:
  - `fuelChargeType`
  - `fromDate`
  - `toDate`
  - `fuelSurcharge`
- Other charge records include:
  - `srNo`
  - `chargeType`
  - `fromDate`
  - `toDate`
  - `origin`
  - `destination`
  - `amount`
  - `minimumValue`
- Volumetric records include:
  - `cmDivide`
  - `inchDivide`
  - `cft`
- In the customer form, these are managed under the `Fuel Surcharges`, `Other Charges`, and `Customer Volumetric` tabs.

## Invoice and Payment Notes

- Invoice service supports preview, generate, print, lock/unlock, email, and CSV export.
- Invoice generation payload is date-range based and may include:
  - `year`
  - `fromDate`
  - `toDate`
  - `productType`
  - `serviceCenterId`
  - `billingType`
  - `registerType`
  - `customerId`
  - `showAwb`
- Invoice email sending supports invoice format, status, SMTP settings, CC, and fallback email handling.
- Customer payment creation requires an `invoiceNo`.

## Observed Shipment Billing Flow

1. Configure customer-level pricing with rate master and, where needed, customer child records.
2. Build the shipment input, including piece rows, shipment value, pincode, zones, payment type, and shipment flags.
3. Call `calculate-charges` to derive base freight, applied charges, and total amount.
4. Persist the shipment with `POST /api/transaction/shipment`.
5. Use the invoice module to generate or send invoices once billing is ready.
6. Customer payment records then reference the generated invoice number.

## How Shipment Uses Rates

- The shipment form does not calculate tariff logic on the client.
- It sends the full shipment payload to `POST /api/transaction/shipment/calculate-charges`.
- The payload includes the inputs the backend needs to select the correct pricing record:
  - `customerId`
  - `clientId`
  - `productId`
  - `fromZoneId`
  - `toZoneId`
  - `shipmentTotalValue`
  - `paymentType`
  - `reversePickup`
  - `appointmentDelivery`
  - `floorDelivery`
  - `floorCount`
  - `km`
  - `piecesRows`
  - `charges`
- From the Bruno examples, the backend responds with:
  - `baseFreight`
  - `totalCharges`
  - `totalAmount`
  - `rows`
  - `route`
  - `breakdown`
- The `rows` and `breakdown` data show how the backend grouped the applied pricing into:
  - `RATE_CHARGE` rows from the rate master tariff
  - `CONDITION` rows from conditional surcharges
- In the sample data, the backend matched a `ZONE_MATRIX` rate master and produced charges like `FOV`, `HANDLING`, `ECC`, `RAS`, `ODA`, `OTHER`, `FUEL`, plus conditional rows for `FLOOR_DELIVERY` and `SHIPMENT_VALUE`.
- The persisted shipment response stores the resulting billing fields such as `rateMasterId`, `baseFreight`, `totalAmount`, `declaredWeight`, and `chargeWeight`.

## Session Log

- 2026-04-18: Confirmed the shipment payload, charge calculation endpoint, charge master enums, rate master structure, invoice endpoints, and the dependency between invoice numbers and customer payment records.
- 2026-04-18: Aligned piece-row weight payload with Bruno examples by using `piecesRows[].actualWeight` for calculate-charges and keeping `chargeWeight` derived from actual vs volumetric weight.
