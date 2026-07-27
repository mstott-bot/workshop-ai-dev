# Workshop AI — WAI-096.5

## Unified Operational Queue Engine

This build corrects the false **1 Awaiting Approval** shown in Management Action, Workshop Performance Centre and Garage Health when Mission Control correctly shows zero.

### Authorisation counting rule
A job is counted only when it is:

- an unfinished Retail job; and
- currently in an Awaiting Customer Approval / Awaiting Authorisation workflow state, or explicitly flagged as awaiting authorisation.

A new Retail job is no longer counted merely because its authorisation dropdown contains the default “Awaiting Customer Approval” value.

### Shared screens
The unified authorisation queue now feeds:

- Command Centre
- Management Action
- Workshop Performance Centre
- Garage Health report
- Workshop Control Centre
- Mission Control and daily recommendations
- Customer Approval Performance report

The new `unified-queue-engine.js` is additive and does not change technician timer, parts, VHC, CRM or collection workflows.
