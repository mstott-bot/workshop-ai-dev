# Workshop AI WAI-090.1

Tyre delivery confirmation restored for both Service Manager and Technician, with the Technician MOT clock restored on the active-job screen.

# Workshop AI WAI-087

## Workshop Control Centre

This release transforms the Targets screen into a polished monthly planning dashboard while retaining all existing Workshop AI workflows.

### Included
- Premium Control Centre layout
- Live monthly KPI preview
- Automatic retail, warranty and internal labour revenue projections
- Capacity validation against available workshop hours
- Workshop AI review with achievable, warning and over-capacity guidance
- Copy Previous Month and Reset Draft controls
- One Save Workshop Settings action
- Existing Service Manager Action Queue, MOT workflow and Parts & Tyre Intelligence retained

Open `index.html` to run Workshop AI.


## WAI-090.2
Added MOT Testing as a Technician job status while retaining the separate MOT clock and main job timer.

## WAI-091
- Technician Today’s Jobs board with completed-job access and carry-over.
- Corrected Parts Delivered Today list and separate parts/tyres delivery counters.

## WAI-092 Technician League Intelligence
Adds league trends, rank movement, most improved/biggest drop, personal bests, consistency streaks and a permanent Hall of Fame to both Command Centre and Reports.


## WAI-092.1
Parts and tyres delivered today now remain visible for the entire delivery day, even after fitting. Technicians can mark delivered tyres as fitted, with technician and timestamp recorded.

## WAI-092.2 — Parts, Tyres, Returns & MOT Workflow
- Restores MOT Testing visibility on Command Centre and Reports live boards.
- Adds a Parts Ordering card beside Tyre Ordering with Need Ordering and Awaiting Delivery shortcuts.
- Allows parts and tyres to be marked delivered from inside or outside a technician job.
- Adds quantity-based partial deliveries for both parts and tyres.
- Keeps delivery-day history after items are fitted.
- Adds Return Part and Return Tyre workflows, including partial returns, supplier destination, reason, reference and value.
- Adds Returns Dashboard with Awaiting Collection, Returned to Supplier and Credit Received stages.
- Adds a monthly returns list to Reports.

## WAI-092.2a correction
- Combined technician parts and tyre arrivals into one Technician Delivery Alerts panel.
- Added All, Parts and Tyres filters.
- Removed duplicate fitted buttons from technician job cards.
- Added the missing Return Part action alongside Parts Fitted.

## WAI-092.2b correction
- Repairs Save Parts Order.
- Restores Partial Delivery, Wrong Order and Return actions in combined Technician Delivery Alerts.
- Aligns Parts Ordering beneath Parts and Tyre Ordering beneath Tyres.

## WAI-092.2c — Returns Queue Workflow
- Technician returns leave Technician Delivery Alerts immediately.
- Service Manager receives a live Returns alert and can open the Returns Queue.
- Return items can be marked Returned to Supplier and Credit Received.
- Reports tab remains unchanged.


## WAI-092.2e
- Fixed Save Parts Order failure caused by duplicate localStorage copies exhausting browser storage.
- Keeps one canonical job-data copy and safely removes obsolete duplicate keys.
- Preserves technician partial delivery, wrong order and return actions.
- Preserves the Service Manager Returns Queue.
- Reports tab remains unchanged.


## WAI-092.2f — Parts & Tyres Returns Report
The Reports Interface now includes a new read-only Parts & Tyres Returns report under Operations. It uses the existing date, technician, comparison, print and CSV export controls and does not alter the layout or the existing reports.
