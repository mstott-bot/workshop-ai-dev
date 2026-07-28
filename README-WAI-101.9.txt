Workshop AI WAI-101.9 — Unified Live Dashboard Engine

Built from WAI-101.8.

Changes:
- One shared operational queue engine for Work in Progress, Awaiting Authorisation, Waiting for Parts, Ready to Invoice and Ready for Collection.
- Ready for Collection recognises Repair Complete, Ready for Collection, completedAt and finishedAt, until Customer Collected.
- Revenue Watch values each queue from its job-linked Finance Centre estimate/invoice.
- Revenue Watch now separates Work in Progress, Awaiting Authorisation, Ready to Invoice, Invoices Issued Today and Revenue Being Held Up.
- Ready for Collection centre and Action Queue use the same unified queue source.
- Job-linked financial bridge added for consistent queue values.
