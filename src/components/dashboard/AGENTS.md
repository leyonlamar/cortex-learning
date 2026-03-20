<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# dashboard

## Purpose
Analytics dashboard view with KPI cards, burnout indicator, success criteria tracking, and 4 Recharts visualizations (cumulative hours, quiz scores, attendance trend, domain breakdown).

## Key Files

| File | Description |
|------|-------------|
| `AnalyticsView.tsx` | Main view: loads weekly aggregates, computes KPIs, renders 4 charts + burnout + success criteria |
| `KPICard.tsx` | Single metric display (hours, attendance, mastery average) |
| `BurnoutIndicator.tsx` | Burnout risk visualization (currently uses frontend heuristic, not engine data) |
| `SuccessCriteriaCard.tsx` | SOP acceptance criteria checklist |

## For AI Agents

### Working In This Directory
- Charts use Recharts (AreaChart, BarChart, LineChart, RadialBarChart)
- KPI data comes from `WeeklyAggregate` records via `useCalendar`
- BurnoutIndicator currently computes burnout from a frontend heuristic — should be wired to backend behavioral engine alerts
- Chart colors must use theme CSS custom properties (`--chart-1` through `--chart-6`)

### Known Issues
- BurnoutIndicator bypasses behavioral engine — uses local heuristic instead
- `mastery_delta`, `trend_direction`, `variance_from_projection` in weekly aggregates are always None

<!-- MANUAL: -->
