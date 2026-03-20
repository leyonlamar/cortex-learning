# Learning OS 2026 — Frontend Design Document

**Date:** 2026-02-28
**Status:** Approved
**Author:** Leon Torres + Claude

---

## Requirements Summary

| Decision | Choice |
|---|---|
| Platform | **Tauri v2** (Rust backend + WebView) |
| Users | **Multi-user**, each with independent intelligence engine |
| Data | **Local SQLite** per user + file sync (OneDrive/SharePoint) |
| Domains | Data Science, Engineering, BI, Logistics, Operations, Finance/Accounting |
| Themes | **4 switchable**: Luxury Editorial, NASA Mission Control, Cyberpunk Neon, Warm Study Hall |
| Intelligence | **Full Rust** — spaced repetition, Bayesian, Monte Carlo, RL scheduling |
| Quizzes | **Auto-generated** from session topics, difficulty-weighted scoring |
| Architecture | **Monolith-First** — single Tauri app, one Rust crate, refactor later if needed |
| Schedule | 215 sessions, 43 weeks, Mon–Fri, Mar 2 — Dec 25, 2026 |

---

## 1. Project Structure & Tech Stack

```
learning-os-2026/
├── src-tauri/                    # Rust backend (Tauri v2)
│   ├── Cargo.toml
│   ├── src/
│   │   ├── main.rs              # Tauri entry point
│   │   ├── commands/            # Tauri command handlers (IPC bridge)
│   │   │   ├── mod.rs
│   │   │   ├── calendar.rs      # Calendar engine commands
│   │   │   ├── session.rs       # Session CRUD commands
│   │   │   ├── quiz.rs          # Quiz generation & scoring
│   │   │   ├── user.rs          # User profile management
│   │   │   ├── intelligence.rs  # Spaced rep, Bayesian, Monte Carlo, RL
│   │   │   └── export.rs        # CSV/JSON export
│   │   ├── engine/              # Core intelligence (pure Rust, no Tauri deps)
│   │   │   ├── mod.rs
│   │   │   ├── calendar.rs      # Date generation, week segmentation, weekday locking
│   │   │   ├── spaced_rep.rs    # Memory strength S, decay P(recall) = exp(-Δt/S)
│   │   │   ├── bayesian.rs      # Beta(α,β) per topic, posterior mastery
│   │   │   ├── monte_carlo.rs   # 5K-50K sim completion probability
│   │   │   ├── rl_scheduler.rs  # State→Action reward-based daily planner
│   │   │   ├── quiz_gen.rs      # Auto-generate questions from session topics
│   │   │   └── behavioral.rs    # Streak, plateau, burnout, missed-day recovery
│   │   ├── db/                  # SQLite layer
│   │   │   ├── mod.rs
│   │   │   ├── schema.rs        # Table definitions, migrations
│   │   │   ├── queries.rs       # Prepared queries
│   │   │   └── sync.rs          # File-based export/import for team sync
│   │   └── models/              # Shared Rust types
│   │       ├── mod.rs
│   │       ├── user.rs
│   │       ├── session.rs
│   │       ├── quiz.rs
│   │       ├── topic.rs
│   │       └── forecast.rs
│   └── tauri.conf.json
│
├── src/                          # React frontend (TypeScript)
│   ├── main.tsx                  # App entry point
│   ├── App.tsx                   # Root router & layout
│   ├── components/
│   │   ├── layout/              # Shell, Sidebar, Header, StatusBar
│   │   ├── dashboard/           # Analytics cards, KPI widgets
│   │   ├── timeline/            # Mar-Dec calendar view, heatmap
│   │   ├── weekly/              # Weekly drilldown, daily bars, quiz breakdown
│   │   ├── session/             # Daily session flow (4 phases)
│   │   ├── quiz/                # Quiz interface, scoring, review
│   │   ├── forecast/            # Monte Carlo viz, scenario toggles
│   │   ├── settings/            # User profile, theme picker, domain config
│   │   └── shared/              # Buttons, cards, charts, modals, toasts
│   ├── hooks/
│   │   ├── useCalendar.ts       # Calendar state from Rust
│   │   ├── useSession.ts        # Daily session lifecycle
│   │   ├── useIntelligence.ts   # Spaced rep, Bayesian, forecasts from Rust
│   │   ├── useQuiz.ts           # Quiz flow management
│   │   ├── useTheme.ts          # Theme switching (4 themes)
│   │   └── useUser.ts           # Current user context
│   ├── themes/                  # CSS variable definitions
│   │   ├── luxury.css           # Cream, serif, editorial
│   │   ├── nasa.css             # Dark, monospace, amber/cyan
│   │   ├── cyberpunk.css        # Neon, glitch, scan-lines
│   │   └── studyhall.css        # Warm, rounded, paper texture
│   ├── lib/
│   │   ├── tauri-bridge.ts      # Typed wrappers around Tauri invoke()
│   │   ├── chart-config.ts      # Chart.js / D3 configuration per theme
│   │   └── date-utils.ts        # Frontend date formatting helpers
│   ├── types/
│   │   ├── models.ts            # TypeScript mirrors of Rust models
│   │   ├── theme.ts             # Theme type definitions
│   │   └── commands.ts          # Tauri command type signatures
│   └── index.css                # Base styles + theme variable slots
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── docs/
    └── plans/                   # Design & implementation docs
```

**Frontend Stack:**
- React 18 + TypeScript 5 via Vite 6
- Tailwind CSS v4 for utility styling
- Lucide React for icons
- Recharts for data visualizations (D3 for retention heatmap only)
- Vitest for frontend tests

**Backend Stack:**
- Tauri v2 (latest stable)
- Rust with `rusqlite` for SQLite
- `serde` / `serde_json` for serialization
- `chrono` for date math
- `rand` + `statrs` for Monte Carlo & statistics
- `cargo test` for backend tests

---

## 2. Data Model & SQLite Schema

Each user gets their own SQLite database file at `{app_data}/users/{user_id}/learning.db`.

### Core Tables

```sql
-- User profile
CREATE TABLE user_profile (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT,
    avatar_seed TEXT,
    theme       TEXT DEFAULT 'luxury',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

-- Learning domains (6 pre-configured + custom)
CREATE TABLE domains (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    color       TEXT NOT NULL,
    icon        TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_custom   INTEGER NOT NULL DEFAULT 0
);

-- Topics within domains (hierarchical)
CREATE TABLE topics (
    id          TEXT PRIMARY KEY,
    domain_id   TEXT NOT NULL REFERENCES domains(id),
    parent_id   TEXT REFERENCES topics(id),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL,
    depth       INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    UNIQUE(domain_id, slug)
);

-- Calendar weeks (pre-generated W01-W43)
CREATE TABLE weeks (
    id          TEXT PRIMARY KEY,
    week_num    INTEGER NOT NULL,
    start_date  TEXT NOT NULL,
    end_date    TEXT NOT NULL,
    objective   TEXT,
    status      TEXT DEFAULT 'upcoming'
);

-- Daily sessions (215 total, Mon-Fri)
CREATE TABLE sessions (
    id              TEXT PRIMARY KEY,
    week_id         TEXT NOT NULL REFERENCES weeks(id),
    date            TEXT NOT NULL UNIQUE,
    day_of_week     INTEGER NOT NULL,
    status          TEXT DEFAULT 'scheduled',
    rescheduled_to  TEXT,
    topics_json     TEXT,
    tags_json       TEXT,
    time_spent_min  INTEGER,
    retrieval_score REAL,
    confidence      INTEGER,
    energy_level    INTEGER,
    notes           TEXT,
    completed_at    TEXT
);

-- Session phases (4 per session)
CREATE TABLE session_phases (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES sessions(id),
    phase       TEXT NOT NULL,
    duration_min INTEGER,
    content     TEXT,
    score       REAL,
    sort_order  INTEGER NOT NULL
);

-- Weekly quizzes (43 total, every Friday)
CREATE TABLE quizzes (
    id              TEXT PRIMARY KEY,
    week_id         TEXT NOT NULL REFERENCES weeks(id) UNIQUE,
    date            TEXT NOT NULL,
    status          TEXT DEFAULT 'pending',
    total_score     REAL,
    difficulty_weighted_score REAL,
    time_spent_min  INTEGER,
    completed_at    TEXT
);

-- Quiz questions (auto-generated)
CREATE TABLE quiz_questions (
    id              TEXT PRIMARY KEY,
    quiz_id         TEXT NOT NULL REFERENCES quizzes(id),
    topic_id        TEXT REFERENCES topics(id),
    question_type   TEXT NOT NULL,
    difficulty      REAL NOT NULL DEFAULT 0.5,
    question_text   TEXT NOT NULL,
    options_json    TEXT,
    correct_answer  TEXT NOT NULL,
    user_answer     TEXT,
    is_correct      INTEGER,
    sort_order      INTEGER NOT NULL
);

-- Spaced repetition state (per topic)
CREATE TABLE spaced_rep (
    topic_id        TEXT PRIMARY KEY REFERENCES topics(id),
    memory_strength REAL NOT NULL DEFAULT 1.0,
    last_reviewed   TEXT,
    next_review     TEXT,
    review_count    INTEGER DEFAULT 0,
    consecutive_correct INTEGER DEFAULT 0,
    consecutive_wrong   INTEGER DEFAULT 0
);

-- Bayesian knowledge state (per topic)
CREATE TABLE bayesian_state (
    topic_id    TEXT PRIMARY KEY REFERENCES topics(id),
    alpha       REAL NOT NULL DEFAULT 1.0,
    beta_param  REAL NOT NULL DEFAULT 1.0,
    mastery     REAL GENERATED ALWAYS AS (alpha / (alpha + beta_param)) STORED,
    uncertainty REAL GENERATED ALWAYS AS (1.0 / (alpha + beta_param + 1.0)) STORED,
    updated_at  TEXT NOT NULL
);

-- Monte Carlo simulation snapshots
CREATE TABLE forecasts (
    id                  TEXT PRIMARY KEY,
    computed_at         TEXT NOT NULL,
    sim_count           INTEGER NOT NULL,
    attendance_p_median REAL,
    attendance_p10      REAL,
    attendance_p90      REAL,
    quiz_avg_median     REAL,
    quiz_avg_p10        REAL,
    quiz_avg_p90        REAL,
    completion_confidence REAL,
    distribution_json   TEXT
);

-- Behavioral tracking
CREATE TABLE behavioral_log (
    id              TEXT PRIMARY KEY,
    date            TEXT NOT NULL,
    event_type      TEXT NOT NULL,
    severity        TEXT NOT NULL,
    details_json    TEXT,
    acknowledged    INTEGER DEFAULT 0
);

-- RL scheduler state (singleton)
CREATE TABLE rl_state (
    id                  INTEGER PRIMARY KEY CHECK (id = 1),
    current_week        INTEGER NOT NULL,
    attendance_streak   INTEGER NOT NULL DEFAULT 0,
    fatigue_proxy       REAL NOT NULL DEFAULT 0.0,
    review_backlog_size INTEGER NOT NULL DEFAULT 0,
    quiz_trend          REAL NOT NULL DEFAULT 0.0,
    last_action_json    TEXT,
    reward_history_json TEXT,
    updated_at          TEXT NOT NULL
);

-- Weekly aggregates (cached)
CREATE TABLE weekly_aggregates (
    week_id         TEXT PRIMARY KEY REFERENCES weeks(id),
    total_hours     REAL,
    quiz_score      REAL,
    mastery_delta   REAL,
    trend_direction TEXT,
    variance_from_projection REAL,
    attendance_rate REAL,
    computed_at     TEXT NOT NULL
);
```

### Pre-seeded Domains

| Domain | Slug | Color | Example Sub-topics |
|---|---|---|---|
| Data Science | data-science | #6366f1 | Statistics, ML, Python, Pandas, Visualization |
| Engineering | engineering | #f59e0b | System Design, Algorithms, Data Structures, DevOps |
| Business Intelligence | bi | #10b981 | SQL, Dashboards, ETL, Data Warehousing, KPIs |
| Logistics | logistics | #3b82f6 | Supply Chain, Inventory, Routing, WMS, Forecasting |
| Operations | operations | #8b5cf6 | Process Improvement, Lean, Six Sigma, Project Mgmt |
| Finance / Accounting | finance | #ef4444 | Budgeting, P&L, Cost Analysis, Compliance, Audit |

---

## 3. Rust Intelligence Engine

All intelligence modules live in `src-tauri/src/engine/` as pure Rust (no Tauri deps).

### 3.1 Calendar Engine (`engine/calendar.rs`)

- Generates all 215 session dates and 43 week structures for Mar 2 - Dec 25, 2026
- Skips weekends, locks sessions to Mon-Fri
- Friday = always quiz day (never overwritten by reschedules)
- Missed sessions auto-reschedule to next available weekday
- Milestone markers: 25% = W11, 50% = W22, 75% = W33, 100% = W43

### 3.2 Spaced Repetition Engine (`engine/spaced_rep.rs`)

Core formula:
```
P(recall) = exp(-dt / S)
  dt = hours since last review
  S  = memory strength parameter (starts at 1.0)
```

Update rules:
- Successful retrieval (score >= 0.6): `S_new = S * (1.0 + 0.5 * score)`, expand interval
- Failed retrieval (score < 0.6): `S_new = S * 0.5`, review tomorrow

Outputs: review queue (sorted by lowest P(recall)), retention heatmap.

### 3.3 Bayesian Knowledge Tracker (`engine/bayesian.rs`)

Per-topic Beta-Binomial conjugate updating:
```
Prior: Beta(alpha, beta) — starts at Beta(1, 1)
Correct → alpha += weight (weight = difficulty * confidence_factor)
Incorrect → beta += weight
mastery_mean = alpha / (alpha + beta)
uncertainty = 1 / (alpha + beta + 1)
```

Outputs: mastery map, weak topics, uncertainty ranking.

### 3.4 Monte Carlo Forecaster (`engine/monte_carlo.rs`)

Simulates 5,000-50,000 futures from current date to Dec 25:
- Random variables: daily attendance (Bernoulli), session duration (Normal), quiz scores (Beta)
- Computes: P(>=85% attendance), P(>=80% quiz avg), completion confidence
- Stores percentile distributions (p10, p25, p50, p75, p90)
- Supports scenario comparison (what-if analysis)
- Performance: 50,000 sims in Rust ~10-50ms

### 3.5 RL Scheduler (`engine/rl_scheduler.rs`)

Contextual bandit with epsilon-greedy exploration (epsilon=0.1):

State: current_week, attendance_streak, fatigue_proxy, mastery_estimates, review_backlog, quiz_trend

Action: time allocation (retrieval/new/micro-task/reflection), topic selection, emphasis mode

Reward:
```
+ 2.0 * session_completed
+ 1.5 * retrieval_success_rate
+ 2.0 * quiz_improvement
- 1.0 * overload (time > 55 min)
- 3.0 * burnout_risk (fatigue > 0.7 AND streak > 10)
- 1.5 * neglect (domain untouched > 2 weeks)
```

Constraints: 60 min hard cap, P(recall) < 0.3 topics always included, Friday = quiz prep if trend declining.

### 3.6 Quiz Generator (`engine/quiz_gen.rs`)

Auto-generates from week's session topics:
- 40% recall, 35% applied, 25% synthesis
- Difficulty: 0.3 (reviewed 3+ times), 0.6 (1-2 times), 0.9 (new only)
- Scoring: raw and difficulty-weighted
- Error taxonomy: recall_failure, application_error, synthesis_gap, careless

### 3.7 Behavioral Engine (`engine/behavioral.rs`)

- Streak tracking with milestones (5, 10, 20, 30, 50, 100)
- Missed day recovery (auto-reschedule, backlog compression at 5+)
- Plateau detection (4-week mastery delta < 0.02)
- Burnout detection (energy < 4 avg over 5 sessions AND fatigue > 0.7)
- Review week enforcement (2 consecutive quiz scores < 0.6)

---

## 4. Visual Interface

### 5 Primary Views + Quiz + Settings

**App Shell:** Collapsible sidebar (Today, Week, Timeline, Analytics, Forecast, Settings), header with breadcrumb + streak + theme switcher, persistent status bar.

**Today View (default landing page):**
- RL-recommended daily plan card with rationale
- 4 sequential phases: Retrieval (5 min) → New Learning (20-30 min) → Micro-Task (10-15 min) → Reflection (5 min)
- Phases unlock sequentially (must complete Phase 1 before Phase 2)
- Review queue (top 10 by lowest P(recall))
- Quick stats (streak, week progress, mastery delta, energy avg)
- Themed completion animation on session finish

**Weekly View:**
- Mon-Fri daily completion bars with time spent
- Weekly mastery changes per topic with directional arrows
- Review queue scoped to this week
- Friday quiz card (status, preview, launch)
- 5 weekly micro-goals checkboxes
- Week selector (W01-W43)

**Timeline View (Mar-Dec 2026):**
- Month-grouped grid of 43 week cells
- Attendance heatmap coloring (intensity = rate)
- Quiz score dot overlays (size = score)
- Milestone markers at 25/50/75/100%
- Click week → navigate to Weekly View
- Current week pulses

**Analytics Dashboard:**
- KPI cards: Total Hours, Quiz Avg, Retention Index, Burnout Risk (each with WoW delta + sparkline)
- Charts: Cumulative Hours, Rolling Quiz Average (with 80% target line), Retention Trend, Domain Mastery Bars, Uncertainty Trend, Error Taxonomy
- Success Criteria tracker (7 criteria with current/target/status)

**Forecast Panel:**
- Completion confidence gauge (circular, animated)
- Attendance + Quiz distribution charts with p10/p50/p90 markers
- Per-domain mastery projection with confidence intervals
- Scenario analysis: toggle pre-built scenarios or create custom

**Quiz Interface:**
- Question-by-question flow with progress bar + timer
- Supports multiple choice and open-ended
- Post-quiz results: score breakdown, category analysis, error taxonomy, topic recommendations

**Settings:**
- User profile editor
- Theme picker (4 cards with live preview)
- Domain manager (toggle/add/remove)
- Data export (JSON/CSV) + import
- Sync folder configuration
- User switcher
- Test data generator

### Component Count: ~50 components across 8 directories

---

## 5. Theme System

4 themes implemented via CSS custom properties on `data-theme` attribute. Zero logic duplication.

### Luxury Editorial
- Palette: cream #faf8f5, goldenrod #b8860b, forest #2c5f2d, rust #8b2500
- Fonts: Playfair Display (display), Source Serif 4 (body), DM Mono (code)
- Details: thin horizontal rules, paper grain texture, gold hover underlines, sharp 2px corners
- Completion animation: floating gold leaf particles

### NASA Mission Control
- Palette: void #0a0a0f, amber #f59e0b, cyan #06b6d4, green #22c55e, red #ef4444
- Fonts: Orbitron (display), IBM Plex Mono (body + code)
- Details: uppercase headings, dashed borders, leading-zero numbers, glowing status dots, scan-line overlay, segmented progress bars, star-field background
- Completion animation: spark trails arcing outward

### Cyberpunk Neon
- Palette: deep purple-black #0d0d1a, neon green #00ff88, hot pink #ff006e, neon amber #ffaa00
- Fonts: Rajdhani (display), Share Tech Mono (body + code)
- Details: neon text-shadow glow, glitch animation on hover, gradient borders, animated data-flow progress bars, pulsing number updates, Matrix-style pixel rain, CRT scan-lines
- Completion animation: pixel rain (green/pink blocks falling)

### Warm Study Hall
- Palette: linen #f5f0e8, sage #7c956b, terracotta #c4785e, warm gold #d4a04a
- Fonts: Fraunces (display), Nunito (body), JetBrains Mono (code)
- Details: generous 12px border-radius, larger icons, pill-shaped buttons, dotted dividers, time-of-day greeting, backdrop-filter blur on modals
- Completion animation: floating leaves (sage, terracotta, gold)

### Font Loading
11 Google Font files loaded via `<link display=swap>`. ~250KB total (WOFF2).

### Theme-Aware Chart Colors (6 domains per theme)
Each theme defines a distinct 6-color palette ensuring chart readability across all visual identities.

---

## 6. Tauri IPC Bridge & Data Flow

### Command Registry (~30 commands)

**User:** create_user, get_user, list_users, update_user, set_theme, switch_active_user
**Calendar:** get_full_calendar, get_week, get_today, reschedule_session
**Session:** start_session, complete_phase, complete_session, get_session_history
**Intelligence:** get_review_queue, get_retention_heatmap, get_mastery_map, get_weak_topics, get_uncertainty_ranking, run_forecast, get_latest_forecast, compare_scenarios, get_daily_plan, get_performance_vs_baseline, get_behavioral_alerts, acknowledge_alert
**Quiz:** generate_quiz, get_quiz, submit_quiz_answer, complete_quiz, get_quiz_history
**Export:** export_json, export_csv, import_data, generate_test_data, sync_to_folder, sync_from_folder

### TypeScript Bridge (`lib/tauri-bridge.ts`)
Every command wrapped in a typed async function. All return `Promise<T>`, throw `AppError`.

### Critical Data Flows

**Flow 1 — Session Completion:** React → Rust complete_session → updates spaced rep, Bayesian, behavioral, RL, weekly aggregates → returns SessionSummary → React shows completion animation + refreshes stats.

**Flow 2 — Monte Carlo Forecast:** React → Rust run_forecast(50000) → samples futures (~20-50ms) → stores snapshot → React animates gauge + distribution charts.

**Flow 3 — App Startup:** Rust initializes SQLite, runs migrations, seeds defaults, generates calendar → React loads active user, today context, theme, alerts.

**Flow 4 — Quiz Flow:** React → Rust generate_quiz → questions from week's topics → user answers one-by-one → Rust scores, classifies errors, updates Bayesian, checks review-week trigger → React renders results.

### Error Handling
AppError enum: Database, NotFound, Validation, Engine, Io. Frontend catches via bridge, shows themed toast notifications.

### State Management
No global store. Each view uses dedicated hooks (useUser, useCalendar, useSession, useIntelligence, useQuiz, useTheme). Cache invalidation on known mutations.

---

## 7. Testing, Deployment & Team Sync

### Rust Tests (`cargo test`)
- calendar_tests: 215 dates, weekday locking, rescheduling, milestone placement
- spaced_rep_tests: decay formula, strength updates, queue ordering
- bayesian_tests: prior updates, mastery computation, uncertainty decrease
- monte_carlo_tests: performance (<200ms for 50K), percentile ordering, scenario shifts
- rl_scheduler_tests: time constraints, emphasis selection, burnout/neglect handling
- quiz_gen_tests: type distribution, difficulty assignment, error taxonomy
- behavioral_tests: streak logic, burnout/plateau triggers, review week enforcement
- db_tests: migrations, CRUD, foreign keys, export/import round-trip

### Frontend Tests (`vitest`)
- Hook tests: useTheme, useCalendar, useSession, useQuiz
- Component tests: PhaseCard, RetrievalPhase, QuizQuestion, KPICard, WeekCell, ThemePicker
- Bridge tests: mock invoke(), verify command names/args

### Build & Distribution
- Dev: `npm run dev` (Tauri dev mode — Vite hot reload + Rust incremental compile)
- Prod: `npm run build` (Vite build + cargo build --release)
- Dist: `npm run dist:win` (.msi + portable .exe, ~3-5 MB)

### Team Sync
- Auto-export `progress.json` after every session (~5KB)
- Sync folder: `LearningOS-Sync/{username}/` on OneDrive/SharePoint
- Each user owns their folder (no conflict resolution needed)
- `team-dashboard.json` auto-generated by merging all progress files

### Future Year Scalability
- Calendar engine parameterized: change start/end dates for any year
- No hardcoded 2026 in UI
- User data accumulates across years
- Domain/topic trees persist

---

## End of Design Document
