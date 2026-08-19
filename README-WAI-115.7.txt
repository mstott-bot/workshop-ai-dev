Workshop AI WAI-115.7 — Actual Revenue Today

Built from WAI-115.6.

Revenue Today now means actual invoiced workshop revenue.

Calculation:
- Adds the ex-VAT sales value of invoices actually ISSUED today.
- Uses the invoice audit timestamp, not the booking date or invoice document date.
- Deducts any credit notes raised today.
- Estimates, authorised work and Invoice Ready documents do not count as actual revenue.
- Labour, MOT, parts, oil, consumables, sublet and other invoice lines are therefore included automatically at their actual invoice selling values.

Example:
Invoice issued today:
  Labour £140 ex VAT
  MOT £54.85 ex VAT
  Parts £80 ex VAT
Revenue Today contribution = £274.85 ex VAT

If a £100 ex-VAT credit is raised today:
Revenue Today is reduced by £100.

No timer, VHC, CRM, productivity, efficiency, stock, parts or other workflow logic changed.
