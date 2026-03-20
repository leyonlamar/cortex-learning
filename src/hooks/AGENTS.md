<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# hooks

## Purpose
6 custom React hooks that manage all data fetching and state for the frontend. Every hook calls Tauri bridge functions — no mock data.

## Key Files

| File | Description |
|------|-------------|
| `useSession.ts` | Daily session lifecycle: load today's session, phase progression, completion, daily plan |
| `useCalendar.ts` | 43-week calendar data, week navigation, session history, attendance rate |
| `useIntelligence.ts` | Spaced rep state, Bayesian mastery, daily plan, Monte Carlo forecasts |
| `useQuiz.ts` | Quiz generation, answer submission, scoring, results display |
| `useCurriculum.ts` | Domain and topic loading by domain |
| `useTheme.ts` | Theme state, DOM sync (`data-theme` on html), Tauri persistence |

## For AI Agents

### Working In This Directory
- Hooks are the ONLY layer that calls `tauri-bridge.ts` — components never call bridge directly
- Each hook returns `{ data, loading, error, actions }` pattern
- Hooks use `useState` + `useEffect` for async data loading
- Error handling should propagate to component-level error boundaries

### Testing Requirements
- Mock `@tauri-apps/api/core::invoke` in tests
- Test loading, success, and error states
- Test action functions trigger correct bridge calls

### Known Issues
- `useIntelligence` does not expose behavioral alerts (no backend command exists yet)
- `useSession` daily plan uses zeroed RL defaults until first session completion

## Dependencies

### Internal
- `../lib/tauri-bridge.ts` — All IPC calls
- `../types/models.ts` — Return type definitions

<!-- MANUAL: -->
