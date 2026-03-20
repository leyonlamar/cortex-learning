<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# weekly

## Purpose
Weekly review view showing daily hour breakdown, mastery changes per domain, quiz results, and week-over-week navigation.

## Key Files

| File | Description |
|------|-------------|
| `WeeklyView.tsx` | Main view: week selector, daily bars, mastery changes, quiz card |
| `WeekSelector.tsx` | Navigation between 43 weeks (prev/next arrows, week label) |
| `DailyBars.tsx` | Stacked bar chart of hours per day (Mon-Fri) using Recharts |
| `MasteryChanges.tsx` | Per-domain mastery delta over the selected week |
| `QuizCard.tsx` | Friday quiz results: score breakdown by category (recall/applied/synthesis) |

## For AI Agents

### Working In This Directory
- Data comes from `WeeklyAggregate` records and `getSessionHistory`
- DailyBars uses Recharts BarChart with stacked series per domain
- MasteryChanges shows delta (positive/negative) with directional indicators
- QuizCard shows most recent Friday quiz for the selected week

### Known Issues
- `mastery_delta` in WeeklyAggregate is always None (not computed in backend)

<!-- MANUAL: -->
