Workshop AI WAI-115.12 — Workshop Summary Live Productivity Fix

Built from WAI-115.11.

Fixed Workshop Summary Productivity showing 0% while technicians are actively working.

Workshop Summary Productivity now uses:
- Previously accumulated productive job-clocked hours today
- PLUS elapsed time from any job timer that is currently running
- Divided by today's available attendance hours

This means the Productivity tile moves live while a technician is clocked onto a job instead of waiting until the timer is stopped.

Example:
Available attendance today = 16 hrs
Accumulated completed/paused productive time = 4 hrs
One technician is currently 2 hrs into an active job
Productive clocked time = 6 hrs
Productivity = 6 ÷ 16 × 100 = 37.5%

No Performance Dashboard MTD calculations, utilisation, efficiency, invoices, VHC, CRM, MOT, parts or other workflow logic changed.
