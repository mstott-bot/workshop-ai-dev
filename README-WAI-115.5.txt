Workshop AI WAI-115.5 — CRM to Workshop Job Integration

Built from WAI-115.4.

Changes:
- Added a prominent '+ Create Workshop Job' button to the selected CRM customer.
- If the customer has one vehicle, it loads directly into the existing Service Manager job card.
- If the customer has multiple vehicles, Workshop AI asks which vehicle to use.
- Existing job-card fields are populated from CRM:
  registration, customer name, telephone, make, model/variant, mileage and booking date.
- CRM company, email, full address, preferred contact, preferences and important notes are carried into Service Manager Special Instructions so the information is not lost.
- The normal Service Manager job form remains in control of job type, technician, allowed hours, priority, MOT, authorisation and work required.
- When Assign Job is pressed, the job is linked back to the CRM customer and vehicle and a CRM/vehicle timeline entry is created.
- Existing 'Load New Job' button on each CRM vehicle remains available.
- No technician timer, VHC, invoice, MOT revenue, parts, reports or other workflow logic changed.
