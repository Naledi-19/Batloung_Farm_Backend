# Batloung Farm backend for the normalized 10-table database

This replaces the previous 8-table backend. It uses `fruit_prices`, `payments`,
`v_purchase_totals`, `v_sales_summary`, and `v_vendor_balances`, while retaining
all seven existing API route prefixes and the JSON fields expected by React.

## Installation (Windows VS Code)
1. Back up your current `BackEnd` directory. Keep your existing `frontend` unchanged.
2. Extract this ZIP and put its `BackEnd` directory next to `frontend`.
3. In the backend terminal: `npm install`.
4. Copy `.env.example` to `.env` and enter your own local credentials. `DB_NAME=batloung_farm`.
5. Run `npm test`, then `npm run dev`.
6. Open `http://localhost:5000/api/health`, then `/api/fruits`, `/api/stock`, `/api/sales`.
7. Open React on `http://localhost:5173` and test the pages.

## API compatibility
- GET/POST/PUT/DELETE `/api/suppliers` (same as before)
- GET/POST/PUT/DELETE `/api/fruits`; outputs still have `small_price`, `medium_price`, `large_price`.
- GET/POST/PUT `/api/vendors`
- GET/POST `/api/purchases` with `supplier_id` and `items` (`fruit_id`, `packaging_size`, `quantity`, `unit_cost`).
- GET/POST `/api/sales`; POST body: `vendor_id`, `payment_method`, `amount_paid`, `items` (`fruit_id`, `packaging_size`, `quantity`).
- POST `/api/sales/:id/payments` with `amount` and `payment_method`.
- GET `/api/stock` and `/api/stock/low?threshold=5`.
- GET `/api/reports/top-fruits`, `/revenue?start=YYYY-MM-DD&end=YYYY-MM-DD`, `/top-vendor`, `/stock`, `/outstanding`.

## Critical differences
- Sales and purchase totals are computed by SQL views, never stored in headers.
- Actual payments become rows in `payments`. A zero-paid/credit sale has no payment row.
- `payment_status` and `outstanding_balance` are derived from the `v_sales_summary` view.
- The view's `payment_method` is the latest receipt method; it is `CREDIT` if no money has been received.
- The history of payment methods is preserved in `payments` (unlike the old schema).
- `fruit_prices` stores three package prices; GET `/api/fruits` still returns three price fields.
- Sales and purchases use transactions to avoid partial stock updates.
- Fruit deletion is blocked when purchase/sale history or stock exists.
- On fruit price updates, the database's UNIQUE(fruit_id,selling_price) may reject a price swap when the new values temporarily conflict with old ones; the request will roll back safely.

## Test case for rollback
Before the test, record `GET /api/stock` and number of sales in `GET /api/sales`.
Make a POST `/api/sales` with one valid line and another requesting 999999 boxes of a fruit/pack with insufficient stock.
Expected: HTTP 409, same stock, no new sale and no partial sale details.

## Known limits
- MySQL is not accessible in this development environment: integration tests must run on your laptop.
- Administrator authentication is not included; do NOT publicly expose write-enabled routes without access controls.
- Do not use the old 8-table SQL migration; normalized schema payments are in their own table.
