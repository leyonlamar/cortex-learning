# Learning OS 2026 — Technical Documentation & SOP

## 1. What This Application Does

Learning OS 2026 tracks cognitive performance across a 43-week academic calendar (March–December 2026). It combines five intelligence engines — spaced repetition, Bayesian knowledge tracking, Monte Carlo forecasting, reinforcement learning scheduling, and behavioral monitoring — into a single Tauri v2 desktop application with four switchable visual themes.

The application serves one user at a time. Each weekday session follows four sequential phases: retrieval practice (5 min), new learning (25 min), micro-task (12 min), and reflection (5 min). Friday quizzes assess weekly progress. The system adapts daily plans based on accumulated performance data.

---

## 2. Architecture

```
┌─────────────────────────────────────────┐
│           React 18 + TypeScript 5       │
│  40 components · 6 hooks · 4 CSS themes │
├─────────────────────────────────────────┤
│         Tauri IPC Bridge (25 commands)  │
├─────────────────────────────────────────┤
│              Rust Backend               │
│  7 engines · 14 SQLite tables · 68 tests│
└─────────────────────────────────────────┘
```

**Frontend**: React 18, TypeScript 5, Vite 6, Tailwind CSS v4, Recharts, Lucide React.
**Backend**: Rust (2021 edition), rusqlite (bundled), chrono, rand, statrs, serde, thiserror, uuid.
**Bridge**: Tauri v2 with 25 typed IPC commands.
**Database**: SQLite in WAL mode, 14 tables, foreign keys enforced.

### Directory Structure

```
learning-os-2026/
├── src/                          # React frontend
│   ├── components/
│   │   ├── dashboard/            # KPICard, BurnoutIndicator, SuccessCriteriaCard, AnalyticsView
│   │   ├── forecast/             # CompletionGauge, DistributionChart, ScenarioPanel, ForecastView
│   │   ├── layout/               # AppShell, Sidebar, Header, StatusBar
│   │   ├── quiz/                 # QuizProgress, QuizTimer, QuizQuestion, QuizResults, QuizView
│   │   ├── session/              # DailyPlanCard, PhaseCard, ReviewQueue, QuickStats, SessionComplete, TodayView
│   │   ├── settings/             # ThemePicker, DataExport, SettingsView
│   │   ├── shared/               # Button, Card, Modal, Toast, Spinner
│   │   ├── timeline/             # WeekCell, MonthRow, MilestoneMarker, TimelineView
│   │   └── weekly/               # WeekSelector, DailyBars, MasteryChanges, QuizCard, WeeklyView
│   ├── hooks/                    # useTheme, useUser, useSession, useCalendar, useQuiz, useIntelligence
│   ├── lib/                      # tauri-bridge.ts (25 typed IPC wrappers)
│   ├── themes/                   # luxury.css, nasa.css, cyberpunk.css, studyhall.css
│   ├── types/                    # models.ts, routes.ts
│   ├── index.css                 # Base CSS variables + global styles
│   └── App.tsx                   # Root component with routing
├── src-tauri/src/                # Rust backend
│   ├── commands/                 # user, calendar, session, intelligence, quiz, export
│   ├── db/                       # schema (14 tables), queries (full CRUD), sync (JSON export/import)
│   ├── engine/                   # calendar, spaced_rep, bayesian, monte_carlo, rl_scheduler, quiz_gen, behavioral
│   ├── models/                   # user, session, topic, quiz, forecast
│   ├── error.rs                  # AppError enum
│   └── lib.rs                    # Tauri setup, migrations, state management
├── docs/plans/                   # Design spec + implementation plan
└── package.json                  # Scripts: dev, build, test, test:rust, test:all, typecheck, dist:win
```

---

## 3. Intelligence Engines

Each engine operates independently. The Rust backend exposes each through Tauri commands; the frontend calls them via typed async wrappers.

### 3.1 Spaced Repetition (`engine/spaced_rep.rs`)

Calculates memory decay using an exponential forgetting curve. `recall_probability(dt_hours, strength)` returns the probability of recall after `dt_hours`. `update_strength(score, current_strength)` adjusts strength based on quiz performance. `priority_queue(recall_probs, limit)` returns indices sorted by lowest recall probability — the topics most in need of review.

### 3.2 Bayesian Knowledge Tracker (`engine/bayesian.rs`)

Models topic mastery as a Beta distribution. Each correct or incorrect answer updates the alpha/beta parameters. `mastery_mean()` returns the expected mastery level. `uncertainty()` returns the standard deviation. `credible_interval_95()` returns the 95% confidence bounds.

### 3.3 Monte Carlo Forecaster (`engine/monte_carlo.rs`)

Runs 50,000 simulations to project course completion probability. Accepts attendance rate, quiz average, and weeks remaining as inputs. Returns p10, p50, and p90 percentiles. Debug mode allows 2 seconds; release mode requires under 200ms.

### 3.4 RL Scheduler (`engine/rl_scheduler.rs`)

A contextual bandit that selects daily time allocation across four actions: focus on retrieval, new learning, micro-tasks, or balanced study. Uses epsilon-greedy exploration (epsilon = 0.1). `generate_plan()` produces a 60-minute daily plan with rationale. `compute_reward()` scores outcomes for future action selection.

### 3.5 Quiz Generator (`engine/quiz_gen.rs`)

Generates questions from weekly topics using a 40/35/25 split across recall, applied, and synthesis categories. `score_quiz()` computes raw and difficulty-weighted scores. `classify_error()` assigns each wrong answer to one of four error categories: recall failure, application error, synthesis gap, or careless mistake.

### 3.6 Behavioral Monitor (`engine/behavioral.rs`)

Tracks attendance streaks, burnout risk, mastery plateaus, and recovery patterns. `should_trigger_review_week()` returns true when three or more alert conditions coincide, signaling the system to shift emphasis toward review-heavy study.

### 3.7 Calendar Generator (`engine/calendar.rs`)

Generates a 43-week calendar (March 3 – December 19, 2026) with 215 weekday sessions. Each session maps to a specific week. `find_next_available_weekday()` supports rescheduling missed sessions.

---

## 4. Database Schema

SQLite stores all application state in 14 tables:

| Table | Purpose |
|---|---|
| `users` | Profile, theme preference, timestamps |
| `domains` | Six knowledge domains (seeded on first launch) |
| `topics` | Hierarchical topics within domains |
| `weeks` | 43 calendar weeks with objectives |
| `sessions` | 215 weekday sessions with status tracking |
| `session_phases` | Four phases per session with scores |
| `weekly_aggregates` | Computed weekly metrics |
| `quizzes` | Friday quiz metadata |
| `quiz_questions` | Individual questions with answers |
| `spaced_rep_states` | Per-topic memory strength |
| `bayesian_states` | Per-topic alpha/beta parameters |
| `rl_states` | Action-value table for the scheduler |
| `behavioral_states` | Streak, burnout, and alert data |
| `sync_snapshots` | Export/import audit trail |

Migrations run automatically on startup. The schema enforces foreign keys and cascading deletes.

---

## 5. Theme System

Four themes switch instantly via CSS custom properties on the `data-theme` attribute. Each theme defines 30+ variables: backgrounds, text colors, accents, borders, fonts, shadows, chart palettes, and interactive states.

| Theme | Palette | Fonts | Details |
|---|---|---|---|
| **Luxury Editorial** | Cream, goldenrod, forest, rust | Playfair Display, Source Serif 4, DM Mono | Paper grain texture, gold hover underlines, 2px corners |
| **NASA Mission Control** | Void, amber, cyan, green, red | Orbitron, IBM Plex Mono | Star-field background, scan-lines, uppercase headings, dashed borders |
| **Cyberpunk Neon** | Purple-black, neon green, hot pink, amber | Rajdhani, Share Tech Mono | CRT scan-lines, glitch hover animation, gradient borders, data-flow progress bars |
| **Warm Study Hall** | Linen, sage, terracotta, warm gold | Fraunces, Nunito, JetBrains Mono | 12px border-radius, pill buttons, dotted dividers, backdrop blur |

Google Fonts loads 11 families (~250KB WOFF2) via `<link display=swap>` in `index.html`.

---

## 6. Tauri IPC Commands

The bridge exposes 25 commands across six modules:

**User (3):** `create_user`, `get_user`, `set_theme`
**Calendar (4):** `init_calendar`, `get_week`, `get_today`, `reschedule_session`
**Session (4):** `get_session`, `complete_phase`, `complete_session`, `get_session_history`
**Intelligence (7):** `get_recall_probability`, `update_spaced_rep`, `get_review_queue`, `update_bayesian`, `get_mastery`, `run_forecast`, `get_daily_plan`
**Quiz (3):** `generate_quiz`, `submit_quiz_answer`, `complete_quiz`
**Export (4):** `export_json`, `import_json`, `export_to_file`, `import_from_file`

Every command wraps in a typed async function in `src/lib/tauri-bridge.ts`. All return `Promise<T>`. Errors propagate as `AppError` strings.

---

## 7. Frontend Views

The application uses state-based routing through `App.tsx`. The `AppShell` provides a collapsible sidebar, header with breadcrumb and streak counter, and a persistent status bar.

| View | Components | Purpose |
|---|---|---|
| **Today** | DailyPlanCard, PhaseCard ×4, ReviewQueue, QuickStats, SessionComplete | Daily session workflow |
| **Weekly** | WeekSelector, DailyBars, MasteryChanges, QuizCard, weekly goals | Week-level review |
| **Timeline** | MonthRow ×10, WeekCell ×43, MilestoneMarker ×4 | 43-week overview with heatmap |
| **Analytics** | KPICard ×3, BurnoutIndicator, chart placeholders ×4, SuccessCriteriaCard | Performance dashboard |
| **Forecast** | CompletionGauge, DistributionChart, ScenarioPanel | Monte Carlo projections |
| **Quiz** | QuizProgress, QuizTimer, QuizQuestionCard, QuizResultsCard | Question-by-question flow |
| **Settings** | ThemePicker, DataExport, ProfileEditor | User preferences |

---

## 8. How to Use

### 8.1 Prerequisites

- **Node.js** 18+ and npm
- **Rust** toolchain (rustup with stable channel)
- **Tauri v2 CLI**: installed via `@tauri-apps/cli` in devDependencies

### 8.2 Development

```bash
cd learning-os-2026
npm install                    # Install frontend dependencies
npm run tauri dev              # Launch dev mode (Vite HMR + Rust recompile)
```

The app opens at 1280×800. Vite serves the frontend on port 1420. Rust recompiles on file changes.

### 8.3 Testing

```bash
npm run test                   # Frontend tests (Vitest)
npm run test:rust              # Backend tests (68 Rust tests)
npm run test:all               # Both
npm run typecheck              # TypeScript type checking
```

### 8.4 Building for Distribution

```bash
npm run build                  # Production frontend build
npm run dist:win               # Windows installer (MSI + NSIS)
```

The production build outputs to `dist/`. The Tauri bundler creates Windows installers in `src-tauri/target/release/bundle/`.

### 8.5 Daily Workflow

1. Launch the application. It opens to the **Today** view.
2. The RL scheduler recommends a daily plan with time allocation.
3. Complete four phases in order: retrieval, learning, micro-task, reflection. Each phase unlocks after the previous one finishes.
4. Rate confidence and energy at session end.
5. On Fridays, take the auto-generated quiz from the **Weekly** view.
6. Check **Analytics** for KPIs, trends, and burnout risk.
7. Run **Forecast** scenarios to project completion probability.
8. Switch themes from **Settings** or the header icon.

### 8.6 Data Management

Export all data as JSON from **Settings > Data Management**. The export copies to clipboard. Import reads JSON from clipboard and replaces the database contents. File-based export/import targets a specific path through the Tauri command.

---

## 9. Standard Operating Procedure (SOP) — Success Criteria

This SOP defines the acceptance criteria for a complete, working Learning OS 2026 build.

### 9.1 Build Verification

| # | Criterion | Command | Expected Result |
|---|---|---|---|
| 1 | TypeScript compiles without errors | `npm run typecheck` | Exit code 0, zero errors |
| 2 | Vite production build succeeds | `npm run build` | `dist/` contains `index.html`, CSS, and JS bundle |
| 3 | Rust compiles without warnings | `cd src-tauri && cargo check` | Exit code 0 |
| 4 | All Rust tests pass | `npm run test:rust` | 68/68 tests pass |
| 5 | All frontend tests pass | `npm run test` | All test suites pass |
| 6 | Combined test suite passes | `npm run test:all` | Both Rust and frontend pass |

### 9.2 Functional Verification

| # | Criterion | How to Verify |
|---|---|---|
| 7 | App launches | Run `npm run tauri dev`; window opens at 1280×800 |
| 8 | All 7 views render | Click each sidebar item; each view displays content |
| 9 | Theme switching works | Click the palette icon in the header four times; each theme applies instantly |
| 10 | User creation works | Navigate to Settings; enter a name; click Create |
| 11 | Session phases unlock sequentially | On Today view, only Phase 1 starts unlocked |
| 12 | Session completion flow works | Complete all four phases; the wrap-up form appears |
| 13 | Week selector navigates | On Weekly view, click arrows to move between weeks |
| 14 | Timeline renders 43 weeks | On Timeline view, all 10 months display with week cells |
| 15 | Forecast gauge animates | On Forecast view, select a scenario and click Run |
| 16 | Quiz interface loads | On Quiz view, progress bar and timer display |
| 17 | Data export produces JSON | On Settings, click Export JSON; paste into a text editor to verify valid JSON |

### 9.3 Performance Criteria

| # | Criterion | Threshold |
|---|---|---|
| 18 | Monte Carlo forecast (50K sims, release) | < 200ms |
| 19 | Frontend bundle size (gzipped) | < 100KB |
| 20 | Initial Vite build | < 15s |

### 9.4 Quality Criteria

| # | Criterion | Status |
|---|---|---|
| 21 | Zero TypeScript `any` types | All types explicit |
| 22 | All Tauri commands typed end-to-end | Rust → TypeScript bridge fully typed |
| 23 | SQLite foreign keys enforced | `PRAGMA foreign_keys=ON` at startup |
| 24 | WAL mode enabled | `PRAGMA journal_mode=WAL` at startup |
| 25 | Migrations run automatically | `run_migrations()` in `lib.rs` setup |

---

## 10. Next Steps

These items extend the current implementation. None block the SOP criteria above.

### 10.1 High Priority

1. **Wire Recharts into Analytics.** The dashboard currently renders chart placeholders. Connect `AnalyticsView` to real session/quiz data using `useCalendar` and `useIntelligence` hooks, then render Recharts `AreaChart`, `LineChart`, and `BarChart` components.

2. **Connect quiz flow end-to-end.** Wire `QuizView` to `useQuiz` hook so that starting a quiz from the Weekly view generates questions, presents them one by one, submits answers, and displays results.

3. **Populate Today view with live data.** Call `loadToday()` and `loadDailyPlan()` on mount. Feed real review queue items from `getReviewQueue()`. Display actual streak and mastery delta in `QuickStats`.

4. **Add test data generator.** Create a Tauri command `generate_test_data` that inserts N weeks of realistic sessions, quizzes, and intelligence state. This enables visual testing of charts and the timeline heatmap.

### 10.2 Medium Priority

5. **Component tests.** Add Vitest + React Testing Library tests for PhaseCard, QuizQuestionCard, KPICard, WeekCell, and ThemePicker.

6. **Hook tests.** Test useTheme, useSession, useCalendar, and useQuiz with mocked Tauri bridge.

7. **Domain manager.** Build the DomainManager component in Settings to toggle, add, and remove custom domains.

8. **User switcher.** Support multiple user profiles with a switcher in Settings.

### 10.3 Polish

9. **Completion animations.** Implement themed animations: gold leaf particles (luxury), spark trails (NASA), pixel rain (cyberpunk), floating leaves (study hall).

10. **Keyboard shortcuts.** Add global shortcuts for view navigation, theme switching, and phase completion.

11. **Window icon.** Generate `icons/icon.ico` from a designed logo and place it in `src-tauri/icons/`.

12. **Error toasts.** Wire the `Toast` component to display backend errors caught by the Tauri bridge.

---

## 11. File Inventory

| Category | Count | Location |
|---|---|---|
| React components | 40 | `src/components/` |
| Custom hooks | 6 | `src/hooks/` |
| Type definitions | 2 | `src/types/` |
| Theme stylesheets | 4 | `src/themes/` |
| Tauri bridge | 1 | `src/lib/tauri-bridge.ts` |
| Rust source files | 28 | `src-tauri/src/` |
| Rust test cases | 68 | Inline in engine/db modules |
| Frontend test files | 1 | `src/__tests__/` |
| SQLite tables | 14 | Defined in `db/schema.rs` |
| IPC commands | 25 | Registered in `lib.rs` |
| CSS custom properties | 30+ | Per theme file |
| Google Font families | 11 | Loaded in `index.html` |

---

*Document generated 2026-03-01. Covers all 14 implementation phases (100 tasks) of the Learning OS 2026 project.*
