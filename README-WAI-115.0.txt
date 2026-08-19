Workshop AI WAI-115.0 — Safe VHC + Technician Timer Update

Built from the user-supplied 'latest workshop logo' baseline.

VHC changes only:
- Measurement
- Finding
- Recommendation
- Hours to Complete
- Removed Parts Value from VHC opportunity calculation
- Follow-up Potential = Hours to Complete × applied Retail Labour Rate
- Existing old VHC notes migrate into Finding
- VHC follow-up opportunities are de-duplicated
- Printed VHC uses the new four-field structure
- VHC modal now scrolls fully on laptops/tablets without the bottom action panel covering the final rows

Technician timer change:
- 'Finish Job Timer' renamed to 'Stop Job Timer'
- Stopping a timer no longer automatically marks the vehicle Ready for Collection
- Technician is asked: Is the car ready for collection?
- Yes -> Ready for Collection and job completed
- No -> job remains open as Waiting to Start and can be clocked on to again later
- Clocked time is retained and additional future sessions add to the same job's Actual Hours

No other Workshop AI modules or workflows were intentionally changed.
