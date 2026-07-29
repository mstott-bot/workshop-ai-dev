Workshop AI — WAI-101.6 Finance Calculation Engine Fix

Changes:
- Rebuilt each invoice row calculation from quantity, unit cost, unit sell, discount and VAT.
- Net now always displays as quantity × selling price less discount.
- GP now always displays as Net less quantity × unit cost.
- Footer totals are re-summed and rounded from every current line.
- Customer total is forced to Sales ex VAT + VAT.
- Gross profit is forced to Sales ex VAT - Cost ex VAT.
- Every line and footer refreshes immediately when values are edited.
- Added visible high-contrast calculated Net and GP cells.
- Added reconciliation validation before an estimate can be issued.
- Existing data and interface are retained.
