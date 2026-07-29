Workshop AI WAI-102.4 — Live Revenue, Operational GP & Exact Part Number Report Fix

- Restores the missing Operational GP engine script to the live application.
- Loads Finance Centre before Mission Control so the Live Revenue Counter reads the live calculation engine on first render.
- Refreshes Mission Control whenever finance or daily operational GP changes.
- Operational GP Today accumulates issued invoice GP for the day and credits reduce the day they are raised.
- Parts Differences uses only an exact normalised part number as the identifier.
- Generic descriptions such as Air Filter are never compared with one another.
- Adds a clear explanatory empty state when no exact part-number history exists in the last 240 days.
- Parts ordered with a part number continue to feed that same number to the linked estimate/invoice.
- MOT-only jobs remain a single MOT line with no extra labour line.
