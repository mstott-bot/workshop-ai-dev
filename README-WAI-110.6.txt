Workshop AI WAI-110.6 — Media Centre

Added a working Media Centre to Workshop AI without changing existing workshop logic.
- New Media Centre navigation tab.
- Save vehicle videos/photos against registration and customer.
- Media files stored locally in IndexedDB; metadata stored in localStorage.
- Link customer phone/email from CRM.
- Search/filter saved media.
- Open/delete media.
- Send to Customer workflow: prepare SMS, prepare email, or use device file share where supported.
- Send/share history count retained per media item.
- Responsive Garage Gurus styling.

Prototype limitation: a static local app cannot create public cloud video links or automatically attach local files to SMS/email. Direct customer-link delivery requires cloud storage/backend integration. Device sharing can send the actual file on supported mobile/tablet browsers.
