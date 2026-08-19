Workshop AI WAI-115.10 — True Running-Month Performance Dashboard

Built from WAI-115.9.

Workshop Performance Dashboard — Month to Date now uses running-month actuals:

LABOUR SOLD MTD
- Actual Labour line quantities on invoices issued during the current month
- Credit notes raised during the month deduct the credited labour hours
- MOT tests are not counted as labour hours sold

REVENUE MTD
- Actual ex-VAT invoice sales issued during the current month
- Includes labour, MOT, parts, oil, consumables, sublet and other invoice lines
- Credit notes raised during the month are deducted

LABOUR RECOVERY MTD
- Invoiced labour hours sold MTD ÷ productive job-clocked hours MTD × 100

PRODUCTIVITY MTD
- Productive job-clocked hours MTD ÷ available attendance hours MTD × 100

UTILISATION MTD
- Productive job-clocked hours MTD ÷ available attendance hours MTD × 100
- Existing Workshop AI utilisation definition retained

AVAILABLE HOURS MTD
- Sums Daily Planner / technician availability from the first working day of this month through today
- Falls back to the elapsed working-day proportion of the saved monthly available-hours target if detailed daily availability is unavailable

The dashboard refreshes automatically when Finance Centre invoices change.

No VHC, CRM, technician timer, parts, MOT pricing, job allocation or other workflow logic changed.
