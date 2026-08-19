Workshop AI WAI-115.1 — Revenue Today MOT Pricing Fix

Built directly from WAI-115.0.

Change:
- Command Centre 'Revenue Today' now includes the configured MOT selling price for every job that has an MOT.
- Labour revenue continues to use the job's allowed hours × saved labour rate.
- MOT revenue is added once at the MOT selling price stored in Finance Settings (default £54.85 if no saved setting exists).
- A job with Service + MOT therefore contributes both its labour revenue and the MOT selling price.
- No technician timer, VHC, invoicing, CRM, parts, reports or other workflow logic was changed.
