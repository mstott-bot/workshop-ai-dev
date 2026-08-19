Workshop AI WAI-115.13 — Technician Authorisation Notification

Built from WAI-115.12.

NEW WORKFLOW:
When a technician presses "Waiting for Authorisation":
- Their job status changes to Awaiting Customer Approval as before.
- A prominent unresolved action is created in Service Team / Service Manager.
- The Service Team navigation badge increases just like parts-order actions.
- The Service Team Action Queue gets a new "Awaiting Authorisation" section.
- The notification identifies the registration, customer, technician and available finding/advisory information.

SERVICE TEAM ACTIONS:
- Work Authorised -> resolves the notification and sends the existing approval notification back to the technician.
- Declined -> resolves the notification and sends the existing declined notification back to the technician.
- No Answer -> notification stays open and updates with the contact attempt.
- Call Back -> notification stays open and updates with the callback instruction.
- Open Job and View Details remain available.

The action remains in Service Team until it is genuinely resolved, matching the way outstanding parts actions remain visible.

No VHC, invoice, revenue, productivity, utilisation, CRM, parts ordering or timer calculation logic changed.
