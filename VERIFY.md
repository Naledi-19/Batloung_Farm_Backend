# Verification checklist — normalized schema

1. Make sure MySQL `batloung_farm` has 10 BASE TABLEs and these 3 VIEWs:
   `v_purchase_totals`, `v_sales_summary`, `v_vendor_balances`.
2. `npm install`, then `npm test`, then `npm run dev` in `BackEnd`.
3. GET `http://localhost:5000/api/health` -> `{"database":"Connected"}`.
4. GET `/api/fruits` -> array with `small_price`, `medium_price`, `large_price` for each fruit.
5. GET `/api/purchases` -> `total_amount` values calculated from the view.
6. GET `/api/sales` -> `total_amount`, `amount_paid`, `outstanding_balance`, `payment_status` from the view.
7. POST `/api/purchases` with two fruit/package lines; GET `/api/stock` should increase exactly those quantities.
8. POST `/api/sales` with two lines; GET `/api/stock` should decrease exactly those quantities.
9. POST a sale whose second line has insufficient stock (request 999999 boxes). Expect HTTP 409; compare GET `/api/stock` and `/api/sales` before/after: no changes.
10. POST `/api/sales/{id}/payments` with `{"amount":10,"payment_method":"ECOCASH"}` on a sale with at least M10 due. Expect updated outstanding balance.
11. GET `/api/reports/top-fruits`, `/api/reports/top-vendor`, `/api/reports/stock`, `/api/reports/outstanding`, and `/api/reports/revenue?start=2026-11-01&end=2026-11-30`.
12. Confirm React pages at `http://localhost:5173` after starting the existing frontend separately.

## Caution
Live MySQL integration wasn't available during packaging. Automated checks cover JS syntax and helpers, not all database requests. Only a local end-to-end test can confirm successful integration.

## Example sale POST body
```json
{
  "vendor_id": 1,
  "payment_method": "ECOCASH",
  "amount_paid": 10,
  "items": [
    {"fruit_id": 1, "packaging_size": "LARGE", "quantity": 1},
    {"fruit_id": 2, "packaging_size": "LARGE", "quantity": 1}
  ]
}
```

## Example purchase POST body
```json
{
  "supplier_id": 1,
  "items": [
    {"fruit_id": 1, "packaging_size": "LARGE", "quantity": 2, "unit_cost": 150},
    {"fruit_id": 2, "packaging_size": "SMALL", "quantity": 3, "unit_cost": 50}
  ]
}
```
