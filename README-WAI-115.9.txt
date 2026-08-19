Workshop AI WAI-115.9 — Mission Control Workshop Brief Expected Labour Fix

Built from WAI-115.8.

Fixed only the Workshop Brief inside Mission Control.

Expected Labour + MOT now uses:
- Jobs whose booking date is TODAY only
- Booked/allowed labour hours × the correct job labour rate
- Plus the configured MOT selling price for every MOT booked today

Carry-over jobs from previous days are no longer added to today's expected figure.

Example:
- 4.0 retail hours at £70 = £280
- 2 MOTs at £54.85 = £109.70
Expected Labour + MOT = £389.70

This makes the Mission Control Workshop Brief follow the same expected-revenue logic used by the Command Centre.

No invoice, VHC, CRM, timer, productivity, efficiency, parts or other workflow logic changed.
