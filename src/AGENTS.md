<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# src (Frontend)

## Purpose
React 18 + TypeScript 5 frontend for Learning OS 2026. Contains 40 components organized by feature domain, 7 custom hooks for state management, 8 CSS themes, and a typed Tauri IPC bridge.

## Key Files

| File | Description |
|------|-------------|
| `App.tsx` | Root component with view routing, user loading, onboarding gate |
| `main.tsx` | React entry point, renders App into `#root` |
| `useUser.ts` | User profile hook: creation, loading, localStorage persistence |
| `index.css` | CSS variable defaults (glass theme base), Tailwind imports |
| `vite-env.d.ts` | Vite type declarations |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `components/` | 40 React components organized by feature (see `components/AGENTS.md`) |
| `hooks/` | 6 custom hooks for session, calendar, intelligence, quiz, curriculum, theme (see `hooks/AGENTS.md`) |
| `lib/` | Tauri IPC bridge with 24 typed command wrappers (see `lib/AGENTS.md`) |
| `types/` | TypeScript type definitions: domain models and view routing (see `types/AGENTS.md`) |
| `themes/` | 8 CSS theme files with custom properties (see `themes/AGENTS.md`) |
| `styles/` | Global animation and motion CSS |
| `__tests__/` | Frontend smoke tests (Vitest) |

## For AI Agents

### Working In This Directory
- All state flows through custom hooks — never call Tauri bridge directly from components
- Components are pure presentational when possible; hooks handle data fetching
- TypeScript strict mode: no `any` types, all props interfaces explicit
- CSS uses custom properties from themes — never hardcode colors

### Testing Requirements
- `npm test` runs Vitest with jsdom
- Components should use React Testing Library patterns
- Mock Tauri bridge in tests (see `__tests__/smoke.test.ts`)

### Common Patterns
- Barrel exports via `index.ts` where present
- Props interfaces defined above component
- Hooks return `{ data, loading, error, actions }` pattern
- Views are routed via `ViewId` enum in `types/routes.ts`

## Dependencies

### Internal
- `src-tauri/` — All data comes from Rust backend via IPC bridge

### External
- React 18.3.1, Recharts 3.7.0, Lucide React 0.575.0
- Tailwind CSS 4.2.1

<!-- MANUAL: -->
