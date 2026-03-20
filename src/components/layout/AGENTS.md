<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# layout

## Purpose
App shell layout components: sidebar navigation, header with breadcrumb/streak/theme switcher, and status bar with current week/day info.

## Key Files

| File | Description |
|------|-------------|
| `AppShell.tsx` | Main layout container: sidebar + header + content area + status bar |
| `Sidebar.tsx` | Navigation with 7 views + attendance rate display |
| `Header.tsx` | Breadcrumb, streak counter, theme switcher dropdown |
| `StatusBar.tsx` | Current week number, day, attendance percentage, next quiz label |

## For AI Agents

### Working In This Directory
- AppShell manages view routing via `ViewId` from `types/routes.ts`
- Sidebar highlights active view and shows real-time attendance rate
- Header streak counter updates on session completion
- All layout components must work across all 8 themes

<!-- MANUAL: -->
