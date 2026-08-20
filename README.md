# Workshop AI — WAI-105.0 Desktop & Tablet Responsive Standardisation

Adds responsive form and modal rules for workshop computers and tablets, including a corrected Record Repeat Repair layout. Application logic is unchanged.

# Workshop AI WAI-101.2 — Finance Centre Workflow Completion

Changes:
- Recent Invoice and Invoice Register rows now open on click or keyboard Enter.
- Draft terminology replaced by Estimate throughout; existing Draft data migrates automatically.
- New Estimate button and Estimate count.
- Estimate can be deleted from the row or invoice editor, with reason and confirmation.
- Deleted job-linked estimates are not recreated automatically on refresh.
- Estimate is converted using the Issue Invoice action, producing Invoice Issued status.
- Issued/part-paid/paid invoices can be fully credited with a mandatory reason.
- Issued invoices cannot be deleted.
- Status is action-driven rather than manually changed in a drop-down.

Keep the previous stable ZIP as a backup while testing.

## WAI-105.5 — Smart Booking Move & Capacity Planner
Jobs can now be moved directly from the Service Manager diary or Future Bookings. The move retains the complete job record, checks workshop and technician capacity, and writes a permanent audit trail.

## WAI-115.37 — Shared Job Efficiency Rule
- Every stopped timer session is stored against the technician who performed it.
- Productive clocked time stays with that technician for productivity and utilisation.
- On completed shared/handover jobs, sold labour hours are split proportionally by each technician's productive time.
- Sold hours are counted once only; they are never duplicated across technicians.
- Open shared jobs do not award final sold-hour efficiency credit until completion.
- Single-technician jobs retain the existing calculation.
- The 200%+ efficiency display guard remains in place.
