Workshop AI WAI-115.18 — Invoice Builder Live Stock Integration

Built from WAI-115.17.

INVOICE BUILDER
When + Part or + Oil is pressed:
- Workshop AI asks: Is this being taken from workshop stock?
- YES -> opens Parts Stock or Oil Stock.
- NO -> creates the normal manual invoice line.

STOCK SELECTION
- The invoice you came from is pre-selected in the stock screen.
- Select the exact stocked part/oil and quantity.
- Add & Deduct Stock adds it to that invoice and returns you to Invoice Builder.

LIVE STOCK MOVEMENT
- Stock quantity reduces IMMEDIATELY when the stocked item/oil is added to the estimate.
- It does not wait for invoice issue.
- Stock cannot go below zero.
- Removing the stock line from an estimate returns that quantity to stock.
- Deleting an estimate returns all stock allocated to it.
- Issuing the invoice does not deduct stock a second time.
- Reopening or crediting an issued invoice does not automatically put physically-used stock back into inventory.

EXAMPLE
Oil Stock: 40.0 litres
Invoice uses: 5.0 litres
New Oil Stock immediately: 35.0 litres

Parts Stock: 8 air filters
Invoice uses: 1
New Parts Stock immediately: 7

No VHC, CRM, timers, revenue, productivity, utilisation or other workshop workflow logic changed.
