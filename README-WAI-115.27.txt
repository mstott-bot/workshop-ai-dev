Workshop AI WAI-115.27 - Review Centre decision workflow

Changes:
- Added a Don’t Send action beside each pending review customer.
- Choosing Don’t Send removes the customer immediately from the active Review Centre list.
- The decision is persisted in localStorage so the customer does not reappear after refresh.
- Awaiting request KPI excludes customers marked Don’t Send.
- Existing Send Request, Text, Email, sent-history and Mark Awaiting functions remain unchanged.
