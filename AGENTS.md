<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# Learning OS 2026

## Purpose
A Tauri v2 desktop application for tracking cognitive performance across a 43-week academic calendar (March 3 – December 19, 2026). Combines 7 intelligence engines (spaced repetition, Bayesian knowledge tracking, Monte Carlo forecasting, RL scheduling, quiz generation, behavioral monitoring, calendar generation) into a single-user learning management system with 8 switchable CSS themes.

## Key Files

| File | Description |
|------|-------------|
| `package.json` | Node dependencies: React 18, Vite 6, Tailwind v4, Recharts, Lucide |
| `tsconfig.json` | TypeScript strict mode config (ES2021, no `any`) |
| `vite.config.ts` | Vite + Tailwind v4 + React plugins, dev server on port 1420 |
| `index.html` | App shell, loads 11 Google Font families, `data-theme` root |
| `vitest.config.ts` | Frontend test config (jsdom) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | React 18 + TypeScript frontend: 40 components, 7 hooks, 8 themes (see `src/AGENTS.md`) |
| `src-tauri/` | Rust backend: 7 engines, 25 IPC commands, 14 SQLite tables (see `src-tauri/AGENTS.md`) |
| `docs/` | Technical documentation, design system spec, implementation plans (see `docs/AGENTS.md`) |
| `dist/` | Production build output (auto-generated, do not edit) |

## For AI Agents

### Working In This Directory
- This is a Tauri v2 app: frontend in `src/`, Rust backend in `src-tauri/`
- All intelligence computation happens in Rust; frontend calls via typed IPC bridge
- Single-user scope: one user per database instance, user ID in localStorage
- TypeScript strict mode: no `any` types allowed
- 8 CSS themes via `data-theme` attribute on `<html>`, CSS custom properties

### Testing Requirements
- Frontend: `npm test` (Vitest + React Testing Library)
- Backend: `npm run test:rust` (Cargo test, 68 tests)
- Both: `npm run test:all`
- Build: `npm run build` for TypeScript + Vite production build

### Common Patterns
- IPC commands defined in `src/lib/tauri-bridge.ts` with typed wrappers
- Hooks manage all state (`useSession`, `useCalendar`, `useIntelligence`, etc.)
- Components are organized by feature domain (session, quiz, weekly, forecast, etc.)
- CSS themes use custom properties (colors, typography, geometry, motion, chart palettes)

### Build Commands
- `npm run dev` — Vite dev server (port 1420)
- `npm run build` — Production build
- `npm run dist:win` — Windows MSI/NSIS installer
- `npx tauri dev` — Full Tauri dev mode (frontend + Rust)

## Dependencies

### External
- React 18.3.1, Vite 6.0.0, TypeScript 5.6.3
- Tailwind CSS 4.2.1, Recharts 3.7.0, Lucide React 0.575.0
- Tauri v2 (CLI + API + plugin-shell)
- Rust: rusqlite 0.31, statrs 0.17, chrono 0.4, rand 0.8, serde, uuid, thiserror

<!-- MANUAL: -->
