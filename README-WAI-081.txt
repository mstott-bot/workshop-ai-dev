WORKSHOP AI OS — WAI-081 TYRE ORDERING SPRINT 1.1

UPDATED WORKFLOW

Technician
- Opens an active job.
- Selects Request Tyres.
- Enters tyre size and quantity only.
- The request immediately appears for the Service Manager.

Service Manager
- Sees a Tyres Requested Action Centre panel beneath the existing Parts alert.
- Customer name and telephone number are visible.
- Selects Order Tyres.
- Completes brand, tyre size, quantity, supplier and total cost.
- Suppliers include Bond and ETB.
- Confirming changes the request from Requested to Ordered.

Protected
- Existing Parts workflow is unchanged.
- Technician timers and job status are unchanged.
- Arrived, Fitted and Completed tyre stages are not included in WAI-081.

INSTALLATION
1. Keep your current WAI-080 folder as a rollback copy or use a Git branch.
2. Copy tyres.js into the existing project folder, replacing the earlier WAI-081 tyres.js if present.
3. Ensure index.html contains this line after script.js and the other modules:
   <script src="tyres.js"></script>
4. Open through your normal local server and test before committing.
