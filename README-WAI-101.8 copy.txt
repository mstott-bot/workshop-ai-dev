Workshop AI WAI-101.8 — Live Revenue Counter Integration

Built from WAI-101.7.

Changes:
- Mission Control Live Revenue Counter now reads directly from the Finance Centre calculation engine.
- Shows Current Live Work Value for open estimates, ex VAT.
- Shows Invoices Issued Today, net of credit activity recorded today.
- Shows Expected Gross Profit Today and GP percentage.
- Adds live cost, live gross profit, VAT, customer total and category breakdowns.
- Refreshes immediately when invoice lines, rates, discounts, job type, technician, status or settings change.
- Uses the same line totals as invoices, preventing separate Revenue Watch maths from drifting.

Definitions:
- Current Live Work Value: all open Estimate / Authorised / Invoice Ready documents.
- Invoices Issued Today: Invoice Issued / Part Paid / Paid / Archived documents dated today, less credits created today.
- Expected Gross Profit Today: today’s open work plus today’s issued invoices.
