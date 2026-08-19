Workshop AI WAI-115.14 — Technician Job-Time Warnings + Service Team Overrun Alert

Built from WAI-115.13.

TECHNICIAN WARNINGS
- Live job timer is compared with the job's allocated/allowed labour hours.
- At 15 minutes remaining, the technician gets an amber warning.
- When allocated time is reached/exceeded, the technician gets a red warning.
- The live job card shows clocked time and remaining/overrun time.
- The technician timer is NOT stopped automatically.

SERVICE TEAM NOTIFICATION
- As soon as a live job exceeds its allocated hours, a new unresolved Service Team action is created.
- Service Team badge/action count increases, matching Awaiting Authorisation and Parts actions.
- New "Job Over Allocated Time" section appears in the Service Team Action Queue.
- Notification shows registration, technician, allocated hours and current overrun.
- Service Team can Open Job, Add Hours, view Timeline, or Acknowledge.
- The same overrun does not create duplicate notifications.

ADD HOURS
- If Service Team adds enough labour hours to bring the job back within allowance, the overrun action resolves automatically.
- Technician receives an update showing the new labour allowance.
- A future overrun can trigger a new warning if the revised allowance is then exceeded.

No VHC, invoice, revenue, CRM, productivity, utilisation, MOT or parts-order logic changed.
