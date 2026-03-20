<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# components

## Purpose
40 React components organized by feature domain. Each subdirectory maps to a major app view or shared UI pattern.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `dashboard/` | Analytics view: KPI cards, burnout indicator, success criteria, Recharts |
| `forecast/` | Monte Carlo scenario runner: gauge, distribution chart, scenario inputs |
| `layout/` | App shell: sidebar navigation, header, status bar |
| `onboarding/` | User creation form with name input and theme selection |
| `quiz/` | Quiz flow: progress bar, timer, questions, results breakdown |
| `session/` | Daily workflow: today view, phase cards, review queue, session complete |
| `settings/` | User profile, theme picker, data export/import |
| `shared/` | Reusable primitives: Button, Card, Modal, Toast, Spinner, ErrorBoundary |
| `timeline/` | 43-week heatmap: month rows, week cells, milestone markers |
| `weekly/` | Weekly review: day bars, mastery changes, quiz card, week selector |

## For AI Agents

### Working In This Directory
- Each component gets its own `.tsx` file — one component per file
- Components receive data via props from parent views; views use hooks for data
- CSS uses theme custom properties — never hardcode colors or fonts
- Lucide React for all icons

### Common Patterns
- Props interface defined above component export
- Views (top-level per domain) manage data loading via hooks
- Sub-components are pure presentational
- Recharts for all charts (AreaChart, BarChart, LineChart, RadialBarChart)

## Dependencies

### Internal
- `../hooks/` — All data fetching and state management
- `../types/models.ts` — Domain type definitions
- `../lib/tauri-bridge.ts` — Indirect (via hooks)

### External
- Recharts 3.7.0, Lucide React 0.575.0

<!-- MANUAL: -->
