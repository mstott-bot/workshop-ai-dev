Workshop AI WAI-115.6 — Efficiency & Productivity Calculation Fix

Built from WAI-115.5.

Master definitions now used across the active Workshop AI modules:

PRODUCTIVITY
Actual productive job-clocked hours ÷ available attendance hours × 100

EFFICIENCY
Sold / allowed labour hours ÷ actual productive job-clocked hours × 100

Example:
- Available attendance: 8.0 hrs
- Productive job-clocked time: 6.0 hrs
- Sold / allowed labour: 7.0 hrs

Productivity = 6 ÷ 8 × 100 = 75%
Efficiency   = 7 ÷ 6 × 100 = 116.7%

Updated:
- Unified Productivity Engine
- Command Centre live productivity
- Garage Health productivity input
- Technician setup / workload / live league
- Workshop Performance Dashboard
- Reports Intelligence
- Technician League Intelligence WAI-092
- Workshop Control Centre WAI-094

Efficiency remains based on sold/allowed versus actual clocked time.

Important:
The existing Utilisation definition has deliberately not been redesigned in this release. Where utilisation already uses clocked hours ÷ available hours, it may display the same percentage as Productivity. This release only corrects the user-requested Productivity and Efficiency definitions and avoids changing unrelated KPI logic.
