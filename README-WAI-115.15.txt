Workshop AI WAI-115.15 — Automatic CRM Lifetime Spend

Built from WAI-115.14.

CRM customer financials now self-calculate from linked Finance Centre invoices.

AUTOMATIC CRM FIGURES
- Lifetime Invoiced: total customer invoice value including VAT for currently issued / paid invoices
- Lifetime Spend: total value including VAT of invoices marked Paid
- Outstanding Balance: issued invoice total still unpaid
- Paid Invoices: number of paid invoices
- Average Paid Invoice: average value of paid invoices
- Last Spend Date: recorded internally from the latest 'Invoice marked paid' audit event

WORKFLOW
- Invoice issued -> Lifetime Invoiced increases automatically
- Invoice marked Paid -> Lifetime Spend increases automatically and Outstanding Balance reduces
- Credit note -> credited invoice is removed from the calculated customer totals
- Reopened estimate -> no longer counts as issued revenue in CRM totals
- Finance changes refresh the CRM immediately

LINKING
- Job-created invoices now retain the CRM Customer ID and Vehicle ID.
- Existing linked workshop-job invoices can resolve the customer through the job record.
- This prevents matching spend by customer name alone.

DATA SAFETY
- The old manual Lifetime Spend field has been removed from CRM editing.
- Any historic lifetime spend already entered before this release is preserved once as legacy spend and added to future paid invoice spend.

No VHC, technician timer, revenue dashboards, productivity, utilisation, parts, MOT or other workflow logic changed.
