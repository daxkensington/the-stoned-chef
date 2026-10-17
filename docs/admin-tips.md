# Admin tips report

Open **Tips** from the admin dashboard (`/admin/tips`). Existing admin authorization protects both report and CSV procedures.

This read-only report sums positive recorded `tipCents` values for orders with `paymentStatus = paid` and `status != cancelled`. Unpaid, failed and refunded records are excluded. It covers this store's recorded CAD checkout tips, not all Square POS tips or payouts. External refunds not reflected in order payment status are not deducted.

Dates use order creation in `America/Toronto`, including both selected dates. The default is month to date. Valid custom ranges span at most 366 calendar days. The following local midnight is the exclusive endpoint, so DST days contain the correct 23 or 25 hours. PostgreSQL daily summaries use the same named time zone.

Totals and daily summaries cover every matching order. The order list uses 25 rows per page, ordered by creation time and ID descending. CSV exports independently read all matching orders, omit customer details, escape spreadsheet formulas and refuse exports exceeding 10,000 rows.

Admin order cards also display food, tip, combined order total and recorded payment status. `totalCents` remains the food amount; Square receives the separate `tipCents` through its existing `tip_money` field. Prepaid checkout and online ordering availability are unchanged.

Verification: `node --import tsx scripts/check-admin-tips.ts` checks dates, DST, cents, export and authorization. `node --import tsx scripts/check-admin-tips-native.ts` runs actual generated report queries in an owned PostgreSQL container with no network or published ports, checks eligibility/multi-page totals/export overflow and verifies ownership before cleanup. No migration or production writes are required.
