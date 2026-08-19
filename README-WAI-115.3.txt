Workshop AI WAI-115.3 — Invoice Company Logo Print Fix

Built from WAI-115.2.

Fixes:
- Invoice print now reads the saved Company Settings logo reliably, even if Finance Centre loads before Company Settings.
- Invoice printing waits briefly for the saved logo image to finish loading before opening the print dialogue.
- Strengthened print CSS so the logo remains visible and correctly sized on invoice print/PDF output.
- The existing Company Settings 'Show company logo on estimates and invoices' switch is still respected.
- No invoice values, VAT calculations, MOT pricing, timers, VHC, CRM, reports or other logic changed.
