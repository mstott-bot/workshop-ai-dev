WAI-115.28 — MESSAGE CENTRE

Added an internal Workshop Message Centre to the live Workshop AI application.

- Service Team can message individual technicians.
- Technicians can view/reply as themselves to Service Team.
- Conversations persist in localStorage on this installation.
- Unread counters, sent/read status and timestamps included.
- Optional link to an existing workshop job/registration.
- Quick-message buttons for common workshop communication.
- Messages remain separate from structured authorisation, parts and MOT workflow alerts.
- Storage-event handling allows tabs/windows sharing the same browser storage to refresh message counts.

Commercial multi-device live messaging will require the planned shared cloud backend/authentication layer; this build provides the complete front-end workflow ready for that later connection.
