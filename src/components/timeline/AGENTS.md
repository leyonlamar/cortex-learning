<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# timeline

## Purpose
43-week visual overview showing the entire academic calendar as a heatmap grid with milestone markers at 25%, 50%, 75%, and 100% completion.

## Key Files

| File | Description |
|------|-------------|
| `TimelineView.tsx` | Main view: loads all weeks, renders month rows with week cells and milestones |
| `MonthRow.tsx` | Month header row containing 4-5 WeekCells |
| `WeekCell.tsx` | Single week cell, colored by attendance/completion status |
| `MilestoneMarker.tsx` | Visual marker at 25/50/75/100% progress milestones |

## For AI Agents

### Working In This Directory
- Calendar spans March 3 – December 19, 2026 (43 weeks)
- Week cells use color coding: completed (green), in-progress (blue), missed (red), future (gray)
- Milestones positioned at weeks 11, 22, 33, 43
- Cell colors must use theme custom properties

<!-- MANUAL: -->
