# Learning OS 2026 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Tauri v2 desktop app for calendar-bound cognitive performance tracking with 4 switchable themes, spaced repetition, Bayesian knowledge tracking, Monte Carlo forecasting, and RL-based scheduling.

**Architecture:** Monolith-first Tauri v2 app. Rust backend handles all intelligence computation + SQLite persistence. React 18 + TypeScript frontend with CSS custom property theme system. ~30 Tauri IPC commands bridge the two layers. Per-user SQLite databases with file-based team sync.

**Tech Stack:** Tauri v2, Rust (rusqlite, chrono, rand, statrs, serde, thiserror), React 18, TypeScript 5, Vite 6, Tailwind CSS v4, Recharts, Lucide React, Vitest

**Design Doc:** `docs/plans/2026-02-28-learning-os-2026-design.md`

---

## Phase Overview

| Phase | Tasks | Description |
|-------|-------|-------------|
| **1** | 1-5 | Project scaffolding — Tauri v2 + React + TypeScript + Tailwind |
| **2** | 6-12 | Rust models, error types, SQLite schema + migrations |
| **3** | 13-25 | Rust engine modules (Calendar, Spaced Rep, Bayesian, Monte Carlo, RL, Quiz Gen, Behavioral) |
| **4** | 26-32 | Tauri commands + TypeScript bridge |
| **5** | 33-38 | Theme system — 4 CSS files + useTheme hook + textures |
| **6** | 39-44 | React layout shell — Sidebar, Header, StatusBar, routing |
| **7** | 45-55 | Today View — daily session flow with 4 sequential phases |
| **8** | 56-62 | Weekly View — daily bars, mastery changes, quiz card, micro-goals |
| **9** | 63-68 | Timeline View — month grid, heatmap, milestones |
| **10** | 69-76 | Analytics Dashboard — KPI cards, charts, success criteria |
| **11** | 77-82 | Forecast Panel — Monte Carlo viz, scenarios |
| **12** | 83-89 | Quiz Interface — question flow, results, error taxonomy |
| **13** | 90-95 | Settings — profile, themes, domains, export, sync |
| **14** | 96-100 | Integration testing, test data generator, build & distribution |

**Total: ~100 bite-sized tasks**

---

# PHASE 1: Project Scaffolding (Tasks 1-5)

---

### Task 1: Initialize Tauri v2 project with React + TypeScript

**Files:**
- Create: `learning-os-2026/` (entire project scaffold)

**Step 1: Verify prerequisites are installed**

Run:
```bash
rustc --version    # Expect: rustc 1.7x+
cargo --version    # Expect: cargo 1.7x+
node --version     # Expect: v20+
npm --version      # Expect: 10+
```

If `cargo-tauri` CLI is not installed:
```bash
cargo install tauri-cli --version "^2"
```

**Step 2: Create Tauri v2 project**

Run from the repo root (`C:\Users\leont\Desktop\Projects\Github`):
```bash
npm create tauri-app@latest learning-os-2026 -- --template react-ts
```

When prompted:
- Package manager: `npm`
- UI template: `React`
- UI flavor: `TypeScript`

**Step 3: Verify scaffold works**

```bash
cd learning-os-2026
npm install
npm run tauri dev
```

Expected: A Tauri window opens showing the default React template. Close it.

**Step 4: Commit**

```bash
git add learning-os-2026/
git commit -m "feat(learning-os): scaffold Tauri v2 + React + TypeScript project"
```

---

### Task 2: Configure Tailwind CSS v4

**Files:**
- Modify: `learning-os-2026/package.json`
- Modify: `learning-os-2026/src/index.css`
- Modify: `learning-os-2026/vite.config.ts`

**Step 1: Install Tailwind CSS v4 + Vite plugin**

```bash
cd learning-os-2026
npm install tailwindcss @tailwindcss/vite
```

**Step 2: Add Tailwind Vite plugin**

Edit `vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
}));
```

**Step 3: Replace `src/index.css` with Tailwind import**

```css
@import "tailwindcss";
```

**Step 4: Verify Tailwind works**

Edit `src/App.tsx` temporarily:
```tsx
function App() {
  return <h1 className="text-3xl font-bold text-blue-600">Learning OS 2026</h1>;
}
export default App;
```

Run: `npm run tauri dev`
Expected: Blue bold heading visible in the Tauri window. Close it.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(learning-os): configure Tailwind CSS v4 with Vite plugin"
```

---

### Task 3: Install frontend dependencies

**Files:**
- Modify: `learning-os-2026/package.json`

**Step 1: Install all frontend dependencies**

```bash
cd learning-os-2026
npm install lucide-react recharts
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Step 2: Configure Vitest**

Create `learning-os-2026/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

Create `learning-os-2026/src/test/setup.ts`:
```typescript
import "@testing-library/jest-dom/vitest";
```

**Step 3: Add test script to package.json**

Ensure these scripts exist in `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:rust": "cd src-tauri && cargo test",
    "test:all": "npm run test:rust && npm run test"
  }
}
```

**Step 4: Write a smoke test to verify Vitest works**

Create `learning-os-2026/src/__tests__/smoke.test.ts`:
```typescript
describe("smoke test", () => {
  it("vitest is configured correctly", () => {
    expect(1 + 1).toBe(2);
  });
});
```

**Step 5: Run it**

```bash
npm run test
```

Expected: 1 test passes.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(learning-os): install lucide-react, recharts, vitest with jsdom"
```

---

### Task 4: Add Rust dependencies to Cargo.toml

**Files:**
- Modify: `learning-os-2026/src-tauri/Cargo.toml`

**Step 1: Add all Rust dependencies**

Edit `src-tauri/Cargo.toml`, add under `[dependencies]`:
```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.31", features = ["bundled"] }
chrono = { version = "0.4", features = ["serde"] }
rand = "0.8"
statrs = "0.17"
thiserror = "1"
uuid = { version = "1", features = ["v4", "serde"] }
```

**Step 2: Verify Rust compiles**

```bash
cd src-tauri
cargo check
```

Expected: Compiles with no errors (warnings are OK on first build).

**Step 3: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/Cargo.lock
git commit -m "feat(learning-os): add Rust dependencies — rusqlite, chrono, rand, statrs, uuid"
```

---

### Task 5: Create directory structure (empty modules)

**Files:**
- Create: All directories and `mod.rs` files for the Rust backend
- Create: All directories for the React frontend

**Step 1: Create Rust module structure**

Create the following files (all initially containing just module declarations):

`src-tauri/src/commands/mod.rs`:
```rust
pub mod calendar;
pub mod export;
pub mod intelligence;
pub mod quiz;
pub mod session;
pub mod user;
```

`src-tauri/src/commands/calendar.rs`:
```rust
// Calendar engine Tauri commands
```

`src-tauri/src/commands/session.rs`:
```rust
// Session CRUD Tauri commands
```

`src-tauri/src/commands/quiz.rs`:
```rust
// Quiz generation & scoring Tauri commands
```

`src-tauri/src/commands/user.rs`:
```rust
// User profile management Tauri commands
```

`src-tauri/src/commands/intelligence.rs`:
```rust
// Intelligence engine Tauri commands (spaced rep, Bayesian, Monte Carlo, RL)
```

`src-tauri/src/commands/export.rs`:
```rust
// CSV/JSON export Tauri commands
```

`src-tauri/src/engine/mod.rs`:
```rust
pub mod behavioral;
pub mod bayesian;
pub mod calendar;
pub mod monte_carlo;
pub mod quiz_gen;
pub mod rl_scheduler;
pub mod spaced_rep;
```

`src-tauri/src/engine/calendar.rs`:
```rust
// Calendar engine — date generation, week segmentation, weekday locking
```

`src-tauri/src/engine/spaced_rep.rs`:
```rust
// Spaced repetition — memory strength, decay, review queue
```

`src-tauri/src/engine/bayesian.rs`:
```rust
// Bayesian knowledge tracker — Beta-Binomial conjugate updating
```

`src-tauri/src/engine/monte_carlo.rs`:
```rust
// Monte Carlo forecaster — completion probability simulations
```

`src-tauri/src/engine/rl_scheduler.rs`:
```rust
// RL scheduler — contextual bandit daily planner
```

`src-tauri/src/engine/quiz_gen.rs`:
```rust
// Quiz generator — auto-generate from session topics
```

`src-tauri/src/engine/behavioral.rs`:
```rust
// Behavioral engine — streak, burnout, plateau, recovery
```

`src-tauri/src/db/mod.rs`:
```rust
pub mod queries;
pub mod schema;
pub mod sync;
```

`src-tauri/src/db/schema.rs`:
```rust
// SQLite table definitions and migrations
```

`src-tauri/src/db/queries.rs`:
```rust
// Prepared SQL queries
```

`src-tauri/src/db/sync.rs`:
```rust
// File-based export/import for team sync
```

`src-tauri/src/models/mod.rs`:
```rust
pub mod forecast;
pub mod quiz;
pub mod session;
pub mod topic;
pub mod user;
```

`src-tauri/src/models/user.rs`:
```rust
// User model types
```

`src-tauri/src/models/session.rs`:
```rust
// Session and phase model types
```

`src-tauri/src/models/quiz.rs`:
```rust
// Quiz and question model types
```

`src-tauri/src/models/topic.rs`:
```rust
// Domain and topic model types
```

`src-tauri/src/models/forecast.rs`:
```rust
// Forecast and scenario model types
```

Update `src-tauri/src/main.rs` to declare modules:
```rust
mod commands;
mod db;
mod engine;
mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Verify: `cd src-tauri && cargo check` — should compile.

**Step 2: Create React directory structure**

Create empty directories (with `.gitkeep` if needed):
```
src/components/layout/
src/components/dashboard/
src/components/timeline/
src/components/weekly/
src/components/session/
src/components/quiz/
src/components/forecast/
src/components/settings/
src/components/shared/
src/hooks/
src/themes/
src/lib/
src/types/
src/__tests__/hooks/
src/__tests__/components/
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(learning-os): create Rust module structure and React directory layout"
```

---

# PHASE 2: Rust Models, Error Types & SQLite Schema (Tasks 6-12)

---

### Task 6: Define Rust error type

**Files:**
- Create: `src-tauri/src/error.rs`
- Modify: `src-tauri/src/main.rs` (add `mod error;`)

**Step 1: Write the error type**

Create `src-tauri/src/error.rs`:
```rust
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Engine error: {0}")]
    Engine(String),

    #[error("IO error: {0}")]
    Io(String),
}

// Tauri requires Serialize for command return errors
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

// Convenience conversions
impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        AppError::Database(e.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::Validation(e.to_string())
    }
}
```

**Step 2: Register in main.rs**

Add `mod error;` to `src-tauri/src/main.rs`.

**Step 3: Verify**

```bash
cd src-tauri && cargo check
```

**Step 4: Commit**

```bash
git add src-tauri/src/error.rs src-tauri/src/main.rs
git commit -m "feat(learning-os): define AppError type with Tauri serialization"
```

---

### Task 7: Define User model

**Files:**
- Modify: `src-tauri/src/models/user.rs`

**Step 1: Write the model**

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Theme {
    #[serde(rename = "luxury")]
    Luxury,
    #[serde(rename = "nasa")]
    Nasa,
    #[serde(rename = "cyberpunk")]
    Cyberpunk,
    #[serde(rename = "studyhall")]
    StudyHall,
}

impl Theme {
    pub fn as_str(&self) -> &'static str {
        match self {
            Theme::Luxury => "luxury",
            Theme::Nasa => "nasa",
            Theme::Cyberpunk => "cyberpunk",
            Theme::StudyHall => "studyhall",
        }
    }
}

impl Default for Theme {
    fn default() -> Self {
        Theme::Luxury
    }
}

impl std::str::FromStr for Theme {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "luxury" => Ok(Theme::Luxury),
            "nasa" => Ok(Theme::Nasa),
            "cyberpunk" => Ok(Theme::Cyberpunk),
            "studyhall" => Ok(Theme::StudyHall),
            _ => Err(format!("Unknown theme: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub avatar_seed: Option<String>,
    pub theme: Theme,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSummary {
    pub id: String,
    pub name: String,
    pub theme: Theme,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UserUpdate {
    pub name: Option<String>,
    pub email: Option<String>,
    pub avatar_seed: Option<String>,
}
```

**Step 2: Verify**

```bash
cd src-tauri && cargo check
```

**Step 3: Commit**

```bash
git add src-tauri/src/models/user.rs
git commit -m "feat(learning-os): define User, UserSummary, UserUpdate, Theme models"
```

---

### Task 8: Define Topic and Domain models

**Files:**
- Modify: `src-tauri/src/models/topic.rs`

**Step 1: Write the models**

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Domain {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub color: String,
    pub icon: Option<String>,
    pub sort_order: i32,
    pub is_custom: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Topic {
    pub id: String,
    pub domain_id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub slug: String,
    pub depth: i32,
    pub created_at: String,
}

/// Default domains to seed on first launch
pub fn default_domains() -> Vec<Domain> {
    vec![
        Domain {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Data Science".into(),
            slug: "data-science".into(),
            color: "#6366f1".into(),
            icon: Some("brain".into()),
            sort_order: 0,
            is_custom: false,
        },
        Domain {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Engineering".into(),
            slug: "engineering".into(),
            color: "#f59e0b".into(),
            icon: Some("code".into()),
            sort_order: 1,
            is_custom: false,
        },
        Domain {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Business Intelligence".into(),
            slug: "bi".into(),
            color: "#10b981".into(),
            icon: Some("bar-chart-3".into()),
            sort_order: 2,
            is_custom: false,
        },
        Domain {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Logistics".into(),
            slug: "logistics".into(),
            color: "#3b82f6".into(),
            icon: Some("truck".into()),
            sort_order: 3,
            is_custom: false,
        },
        Domain {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Operations".into(),
            slug: "operations".into(),
            color: "#8b5cf6".into(),
            icon: Some("settings".into()),
            sort_order: 4,
            is_custom: false,
        },
        Domain {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Finance / Accounting".into(),
            slug: "finance".into(),
            color: "#ef4444".into(),
            icon: Some("dollar-sign".into()),
            sort_order: 5,
            is_custom: false,
        },
    ]
}
```

**Step 2: Verify**

```bash
cd src-tauri && cargo check
```

**Step 3: Commit**

```bash
git add src-tauri/src/models/topic.rs
git commit -m "feat(learning-os): define Domain, Topic models with 6 default domains"
```

---

### Task 9: Define Session and Phase models

**Files:**
- Modify: `src-tauri/src/models/session.rs`

**Step 1: Write the models**

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SessionStatus {
    Scheduled,
    Completed,
    Missed,
    Rescheduled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PhaseType {
    Retrieval,
    Learning,
    MicroTask,
    Reflection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub week_id: String,
    pub date: String,
    pub day_of_week: u8,
    pub status: SessionStatus,
    pub rescheduled_to: Option<String>,
    pub topics_json: Option<String>,
    pub tags_json: Option<String>,
    pub time_spent_min: Option<i32>,
    pub retrieval_score: Option<f64>,
    pub confidence: Option<i32>,
    pub energy_level: Option<i32>,
    pub notes: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionPhase {
    pub id: String,
    pub session_id: String,
    pub phase: PhaseType,
    pub duration_min: Option<i32>,
    pub content: Option<String>,
    pub score: Option<f64>,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Week {
    pub id: String,
    pub week_num: u32,
    pub start_date: String,
    pub end_date: String,
    pub objective: Option<String>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeeklyAggregate {
    pub week_id: String,
    pub total_hours: Option<f64>,
    pub quiz_score: Option<f64>,
    pub mastery_delta: Option<f64>,
    pub trend_direction: Option<String>,
    pub variance_from_projection: Option<f64>,
    pub attendance_rate: Option<f64>,
    pub computed_at: String,
}

/// Reflection data submitted when completing a session
#[derive(Debug, Clone, Deserialize)]
pub struct ReflectionData {
    pub confidence: i32,
    pub energy_level: i32,
    pub notes: Option<String>,
    pub tags: Option<Vec<String>>,
}

/// Phase data submitted when completing a phase
#[derive(Debug, Clone, Deserialize)]
pub struct PhaseData {
    pub phase: PhaseType,
    pub duration_min: i32,
    pub content: Option<String>,
    pub score: Option<f64>,
}

/// Summary returned after session completion
#[derive(Debug, Clone, Serialize)]
pub struct SessionSummary {
    pub session: Session,
    pub phases: Vec<SessionPhase>,
    pub streak: u32,
    pub mastery_delta: f64,
    pub alerts: Vec<String>,
}

/// Context returned for the Today View
#[derive(Debug, Clone, Serialize)]
pub struct DayContext {
    pub session: Session,
    pub week: Week,
    pub daily_plan: Option<super::forecast::DailyPlan>,
    pub review_queue: Vec<ReviewItem>,
    pub streak: u32,
    pub week_progress: WeekProgress,
}

#[derive(Debug, Clone, Serialize)]
pub struct ReviewItem {
    pub topic_id: String,
    pub topic_name: String,
    pub domain_slug: String,
    pub recall_probability: f64,
    pub last_reviewed: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct WeekProgress {
    pub completed: u32,
    pub total: u32,
    pub mastery_delta: f64,
    pub energy_avg: f64,
}

/// Full calendar structure
#[derive(Debug, Clone, Serialize)]
pub struct Calendar {
    pub weeks: Vec<WeekWithSessions>,
    pub milestones: Vec<Milestone>,
    pub total_sessions: u32,
    pub completed_sessions: u32,
    pub attendance_rate: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct WeekWithSessions {
    pub week: Week,
    pub sessions: Vec<Session>,
    pub aggregate: Option<WeeklyAggregate>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Milestone {
    pub label: String,
    pub percent: u32,
    pub week_id: String,
    pub reached: bool,
}
```

**Step 2: Verify**

```bash
cd src-tauri && cargo check
```

**Step 3: Commit**

```bash
git add src-tauri/src/models/session.rs
git commit -m "feat(learning-os): define Session, Phase, Week, Calendar, DayContext models"
```

---

### Task 10: Define Quiz models

**Files:**
- Modify: `src-tauri/src/models/quiz.rs`

**Step 1: Write the models**

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum QuestionType {
    Recall,
    Applied,
    Synthesis,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ErrorCategory {
    RecallFailure,
    ApplicationError,
    SynthesisGap,
    Careless,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quiz {
    pub id: String,
    pub week_id: String,
    pub date: String,
    pub status: String,
    pub total_score: Option<f64>,
    pub difficulty_weighted_score: Option<f64>,
    pub time_spent_min: Option<i32>,
    pub completed_at: Option<String>,
    pub questions: Vec<QuizQuestion>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuizQuestion {
    pub id: String,
    pub quiz_id: String,
    pub topic_id: Option<String>,
    pub question_type: QuestionType,
    pub difficulty: f64,
    pub question_text: String,
    pub options_json: Option<String>,
    pub correct_answer: String,
    pub user_answer: Option<String>,
    pub is_correct: Option<bool>,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize)]
pub struct QuizResults {
    pub quiz_id: String,
    pub raw_score: f64,
    pub weighted_score: f64,
    pub total_questions: u32,
    pub correct_count: u32,
    pub category_breakdown: CategoryBreakdown,
    pub error_taxonomy: Vec<ErrorEntry>,
    pub rolling_4_week_avg: f64,
    pub topics_to_review: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CategoryBreakdown {
    pub recall: CategoryScore,
    pub applied: CategoryScore,
    pub synthesis: CategoryScore,
}

#[derive(Debug, Clone, Serialize)]
pub struct CategoryScore {
    pub total: u32,
    pub correct: u32,
    pub score: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct ErrorEntry {
    pub question_id: String,
    pub category: ErrorCategory,
    pub topic_name: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct QuizSummary {
    pub quiz_id: String,
    pub week_id: String,
    pub date: String,
    pub raw_score: f64,
    pub weighted_score: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AnswerResult {
    pub question_id: String,
    pub is_correct: bool,
    pub correct_answer: String,
}
```

**Step 2: Verify**

```bash
cd src-tauri && cargo check
```

**Step 3: Commit**

```bash
git add src-tauri/src/models/quiz.rs
git commit -m "feat(learning-os): define Quiz, QuizQuestion, QuizResults, ErrorTaxonomy models"
```

---

### Task 11: Define Forecast and Intelligence models

**Files:**
- Modify: `src-tauri/src/models/forecast.rs`

**Step 1: Write the models**

```rust
use serde::{Deserialize, Serialize};

/// Monte Carlo forecast result
#[derive(Debug, Clone, Serialize)]
pub struct Forecast {
    pub id: String,
    pub computed_at: String,
    pub sim_count: u32,
    pub attendance: PercentileResult,
    pub quiz_avg: PercentileResult,
    pub completion_confidence: f64,
    pub distribution_json: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PercentileResult {
    pub p10: f64,
    pub p25: f64,
    pub median: f64,
    pub p75: f64,
    pub p90: f64,
}

/// Scenario input for what-if analysis
#[derive(Debug, Clone, Deserialize)]
pub struct ScenarioInput {
    pub label: String,
    pub attendance_override: Option<f64>,
    pub study_time_override: Option<f64>,
    pub break_weeks: Option<Vec<u32>>,
}

/// Daily plan from RL scheduler
#[derive(Debug, Clone, Serialize)]
pub struct DailyPlan {
    pub time_allocation: TimeAllocation,
    pub topic_ids: Vec<String>,
    pub emphasis: Emphasis,
    pub rationale: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct TimeAllocation {
    pub retrieval_min: u32,
    pub new_learning_min: u32,
    pub micro_task_min: u32,
    pub reflection_min: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Emphasis {
    NewMaterial,
    ReviewHeavy,
    QuizPrep,
    Balanced,
}

/// Spaced repetition state for a topic
#[derive(Debug, Clone, Serialize)]
pub struct SpacedRepState {
    pub topic_id: String,
    pub memory_strength: f64,
    pub last_reviewed: Option<String>,
    pub next_review: Option<String>,
    pub recall_probability: f64,
    pub review_count: u32,
}

/// Bayesian mastery for a topic
#[derive(Debug, Clone, Serialize)]
pub struct TopicMastery {
    pub topic_id: String,
    pub topic_name: String,
    pub domain_slug: String,
    pub alpha: f64,
    pub beta_param: f64,
    pub mastery: f64,
    pub uncertainty: f64,
    pub ci_lower: f64,
    pub ci_upper: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct TopicUncertainty {
    pub topic_id: String,
    pub topic_name: String,
    pub uncertainty: f64,
    pub data_points: u32,
}

/// Retention heatmap data
#[derive(Debug, Clone, Serialize)]
pub struct RetentionMap {
    pub topics: Vec<RetentionEntry>,
    pub avg_recall: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct RetentionEntry {
    pub topic_id: String,
    pub topic_name: String,
    pub domain_slug: String,
    pub recall_probability: f64,
    pub memory_strength: f64,
}

/// Behavioral alert
#[derive(Debug, Clone, Serialize)]
pub struct BehavioralAlert {
    pub id: String,
    pub date: String,
    pub event_type: String,
    pub severity: String,
    pub message: String,
    pub acknowledged: bool,
}

/// RL performance comparison
#[derive(Debug, Clone, Serialize)]
pub struct PerformanceComparison {
    pub rl_avg_score: f64,
    pub baseline_avg_score: f64,
    pub improvement_pct: f64,
    pub weeks_compared: u32,
}
```

**Step 2: Verify**

```bash
cd src-tauri && cargo check
```

**Step 3: Commit**

```bash
git add src-tauri/src/models/forecast.rs
git commit -m "feat(learning-os): define Forecast, DailyPlan, SpacedRep, Mastery, Behavioral models"
```

---

### Task 12: Implement SQLite schema and migrations

**Files:**
- Modify: `src-tauri/src/db/schema.rs`

**Step 1: Write the failing test**

Add to `src-tauri/src/db/schema.rs`:
```rust
use rusqlite::Connection;
use crate::error::AppError;

/// Run all migrations on the given connection.
/// Migrations are idempotent — safe to call on every app startup.
pub fn run_migrations(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch(SCHEMA_SQL)?;
    Ok(())
}

const SCHEMA_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS user_profile (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT,
    avatar_seed TEXT,
    theme       TEXT NOT NULL DEFAULT 'luxury',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS domains (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    color       TEXT NOT NULL,
    icon        TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_custom   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS topics (
    id          TEXT PRIMARY KEY,
    domain_id   TEXT NOT NULL REFERENCES domains(id),
    parent_id   TEXT REFERENCES topics(id),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL,
    depth       INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    UNIQUE(domain_id, slug)
);

CREATE TABLE IF NOT EXISTS weeks (
    id          TEXT PRIMARY KEY,
    week_num    INTEGER NOT NULL,
    start_date  TEXT NOT NULL,
    end_date    TEXT NOT NULL,
    objective   TEXT,
    status      TEXT NOT NULL DEFAULT 'upcoming'
);

CREATE TABLE IF NOT EXISTS sessions (
    id              TEXT PRIMARY KEY,
    week_id         TEXT NOT NULL REFERENCES weeks(id),
    date            TEXT NOT NULL UNIQUE,
    day_of_week     INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'scheduled',
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

CREATE TABLE IF NOT EXISTS session_phases (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES sessions(id),
    phase       TEXT NOT NULL,
    duration_min INTEGER,
    content     TEXT,
    score       REAL,
    sort_order  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quizzes (
    id              TEXT PRIMARY KEY,
    week_id         TEXT NOT NULL REFERENCES weeks(id) UNIQUE,
    date            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    total_score     REAL,
    difficulty_weighted_score REAL,
    time_spent_min  INTEGER,
    completed_at    TEXT
);

CREATE TABLE IF NOT EXISTS quiz_questions (
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

CREATE TABLE IF NOT EXISTS spaced_rep (
    topic_id            TEXT PRIMARY KEY REFERENCES topics(id),
    memory_strength     REAL NOT NULL DEFAULT 1.0,
    last_reviewed       TEXT,
    next_review         TEXT,
    review_count        INTEGER NOT NULL DEFAULT 0,
    consecutive_correct INTEGER NOT NULL DEFAULT 0,
    consecutive_wrong   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bayesian_state (
    topic_id    TEXT PRIMARY KEY REFERENCES topics(id),
    alpha       REAL NOT NULL DEFAULT 1.0,
    beta_param  REAL NOT NULL DEFAULT 1.0,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS forecasts (
    id                    TEXT PRIMARY KEY,
    computed_at           TEXT NOT NULL,
    sim_count             INTEGER NOT NULL,
    attendance_p_median   REAL,
    attendance_p10        REAL,
    attendance_p90        REAL,
    quiz_avg_median       REAL,
    quiz_avg_p10          REAL,
    quiz_avg_p90          REAL,
    completion_confidence REAL,
    distribution_json     TEXT
);

CREATE TABLE IF NOT EXISTS behavioral_log (
    id          TEXT PRIMARY KEY,
    date        TEXT NOT NULL,
    event_type  TEXT NOT NULL,
    severity    TEXT NOT NULL,
    details_json TEXT,
    acknowledged INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rl_state (
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

CREATE TABLE IF NOT EXISTS weekly_aggregates (
    week_id                  TEXT PRIMARY KEY REFERENCES weeks(id),
    total_hours              REAL,
    quiz_score               REAL,
    mastery_delta            REAL,
    trend_direction          TEXT,
    variance_from_projection REAL,
    attendance_rate          REAL,
    computed_at              TEXT NOT NULL
);
"#;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_migrations_create_all_tables() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();

        // Verify all 13 tables exist
        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

        let expected = vec![
            "bayesian_state",
            "behavioral_log",
            "domains",
            "forecasts",
            "quiz_questions",
            "quizzes",
            "rl_state",
            "session_phases",
            "sessions",
            "spaced_rep",
            "topics",
            "user_profile",
            "weekly_aggregates",
            "weeks",
        ];

        for table in &expected {
            assert!(
                tables.contains(&table.to_string()),
                "Missing table: {}",
                table
            );
        }
    }

    #[test]
    fn test_migrations_are_idempotent() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        // Running again should not error
        run_migrations(&conn).unwrap();
    }

    #[test]
    fn test_foreign_keys_enforced() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&conn).unwrap();

        // Inserting a session with a non-existent week_id should fail
        let result = conn.execute(
            "INSERT INTO sessions (id, week_id, date, day_of_week, status) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params!["s1", "NONEXISTENT", "2026-03-02", 1, "scheduled"],
        );
        assert!(result.is_err(), "Foreign key constraint should reject invalid week_id");
    }
}
```

**Step 2: Run tests**

```bash
cd src-tauri && cargo test db::schema
```

Expected: 3 tests pass.

**Step 3: Commit**

```bash
git add src-tauri/src/db/schema.rs
git commit -m "feat(learning-os): implement SQLite schema with 13 tables + migration tests"
```

---

# PHASE 3: Rust Engine Modules (Tasks 13-25)

---

### Task 13: Calendar engine — generate weeks and sessions

**Files:**
- Modify: `src-tauri/src/engine/calendar.rs`

**Step 1: Write failing tests first**

```rust
use chrono::{Datelike, NaiveDate, Weekday};
use crate::models::session::{Week, Session, SessionStatus, Milestone};

/// Generate all 43 weeks with 215 session slots for the program.
pub fn generate_calendar(
    start: NaiveDate,
    end: NaiveDate,
) -> (Vec<Week>, Vec<Session>, Vec<Milestone>) {
    let mut weeks = Vec::new();
    let mut sessions = Vec::new();
    let mut current = start;
    let mut week_num: u32 = 1;
    let mut session_count: u32 = 0;

    while current <= end {
        // Find Monday of this week (start should already be Monday)
        let monday = if current.weekday() == Weekday::Mon {
            current
        } else {
            // Skip to next Monday
            current = current + chrono::Duration::days(
                (7 - current.weekday().num_days_from_monday() as i64) % 7,
            );
            if current > end {
                break;
            }
            current
        };

        let friday = monday + chrono::Duration::days(4);
        let week_id = format!("W{:02}", week_num);

        weeks.push(Week {
            id: week_id.clone(),
            week_num,
            start_date: monday.format("%Y-%m-%d").to_string(),
            end_date: friday.format("%Y-%m-%d").to_string(),
            objective: None,
            status: "upcoming".to_string(),
        });

        // Generate 5 daily sessions (Mon-Fri)
        for day_offset in 0..5 {
            let date = monday + chrono::Duration::days(day_offset);
            if date > end {
                break;
            }
            session_count += 1;
            let day_of_week = (day_offset + 1) as u8; // 1=Mon, 5=Fri

            sessions.push(Session {
                id: format!("S{:03}", session_count),
                week_id: week_id.clone(),
                date: date.format("%Y-%m-%d").to_string(),
                day_of_week,
                status: SessionStatus::Scheduled,
                rescheduled_to: None,
                topics_json: None,
                tags_json: None,
                time_spent_min: None,
                retrieval_score: None,
                confidence: None,
                energy_level: None,
                notes: None,
                completed_at: None,
            });
        }

        week_num += 1;
        current = monday + chrono::Duration::days(7);
    }

    let total_weeks = weeks.len() as u32;
    let milestones = vec![
        Milestone {
            label: "25%".to_string(),
            percent: 25,
            week_id: format!("W{:02}", (total_weeks as f64 * 0.25).ceil() as u32),
            reached: false,
        },
        Milestone {
            label: "50%".to_string(),
            percent: 50,
            week_id: format!("W{:02}", (total_weeks as f64 * 0.50).ceil() as u32),
            reached: false,
        },
        Milestone {
            label: "75%".to_string(),
            percent: 75,
            week_id: format!("W{:02}", (total_weeks as f64 * 0.75).ceil() as u32),
            reached: false,
        },
        Milestone {
            label: "100%".to_string(),
            percent: 100,
            week_id: format!("W{:02}", total_weeks),
            reached: false,
        },
    ];

    (weeks, sessions, milestones)
}

/// Reschedule a missed session to the next available weekday.
/// Returns the new date, or None if no weekday is available before end.
pub fn find_next_available_weekday(
    from_date: NaiveDate,
    booked_dates: &[NaiveDate],
    end: NaiveDate,
) -> Option<NaiveDate> {
    let mut candidate = from_date + chrono::Duration::days(1);
    while candidate <= end {
        let is_weekday = matches!(
            candidate.weekday(),
            Weekday::Mon | Weekday::Tue | Weekday::Wed | Weekday::Thu
        );
        // Don't reschedule to Fridays (quiz day)
        if is_weekday && !booked_dates.contains(&candidate) {
            return Some(candidate);
        }
        candidate = candidate + chrono::Duration::days(1);
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    fn program_start() -> NaiveDate {
        NaiveDate::from_ymd_opt(2026, 3, 2).unwrap()
    }

    fn program_end() -> NaiveDate {
        NaiveDate::from_ymd_opt(2026, 12, 25).unwrap()
    }

    #[test]
    fn test_generates_43_weeks() {
        let (weeks, _, _) = generate_calendar(program_start(), program_end());
        assert_eq!(weeks.len(), 43, "Expected 43 weeks");
    }

    #[test]
    fn test_generates_215_sessions() {
        let (_, sessions, _) = generate_calendar(program_start(), program_end());
        assert_eq!(sessions.len(), 215, "Expected 215 sessions");
    }

    #[test]
    fn test_first_week_starts_march_2() {
        let (weeks, _, _) = generate_calendar(program_start(), program_end());
        assert_eq!(weeks[0].id, "W01");
        assert_eq!(weeks[0].start_date, "2026-03-02");
    }

    #[test]
    fn test_all_sessions_are_weekdays() {
        let (_, sessions, _) = generate_calendar(program_start(), program_end());
        for session in &sessions {
            let date = NaiveDate::parse_from_str(&session.date, "%Y-%m-%d").unwrap();
            assert!(
                matches!(
                    date.weekday(),
                    Weekday::Mon | Weekday::Tue | Weekday::Wed | Weekday::Thu | Weekday::Fri
                ),
                "Session date {} is not a weekday",
                session.date
            );
        }
    }

    #[test]
    fn test_no_weekend_dates() {
        let (_, sessions, _) = generate_calendar(program_start(), program_end());
        for session in &sessions {
            let date = NaiveDate::parse_from_str(&session.date, "%Y-%m-%d").unwrap();
            assert_ne!(date.weekday(), Weekday::Sat, "Found Saturday: {}", session.date);
            assert_ne!(date.weekday(), Weekday::Sun, "Found Sunday: {}", session.date);
        }
    }

    #[test]
    fn test_milestones_at_correct_positions() {
        let (_, _, milestones) = generate_calendar(program_start(), program_end());
        assert_eq!(milestones.len(), 4);
        assert_eq!(milestones[0].percent, 25);
        assert_eq!(milestones[1].percent, 50);
        assert_eq!(milestones[2].percent, 75);
        assert_eq!(milestones[3].percent, 100);
        assert_eq!(milestones[3].week_id, "W43");
    }

    #[test]
    fn test_find_next_available_weekday_skips_booked() {
        let from = NaiveDate::from_ymd_opt(2026, 3, 2).unwrap(); // Monday
        let booked = vec![
            NaiveDate::from_ymd_opt(2026, 3, 3).unwrap(), // Tuesday booked
        ];
        let end = NaiveDate::from_ymd_opt(2026, 12, 25).unwrap();
        let result = find_next_available_weekday(from, &booked, end);
        assert_eq!(
            result,
            Some(NaiveDate::from_ymd_opt(2026, 3, 4).unwrap()) // Wednesday
        );
    }

    #[test]
    fn test_find_next_available_weekday_skips_friday() {
        // If only Friday is available, skip it (quiz day)
        let from = NaiveDate::from_ymd_opt(2026, 3, 4).unwrap(); // Wednesday
        let booked = vec![
            NaiveDate::from_ymd_opt(2026, 3, 5).unwrap(), // Thursday booked
        ];
        let end = NaiveDate::from_ymd_opt(2026, 3, 6).unwrap(); // End is Friday
        let result = find_next_available_weekday(from, &booked, end);
        // Friday is excluded, so no available date
        assert_eq!(result, None);
    }
}
```

**Step 2: Run tests**

```bash
cd src-tauri && cargo test engine::calendar
```

Expected: All 7 tests pass.

**Step 3: Commit**

```bash
git add src-tauri/src/engine/calendar.rs
git commit -m "feat(learning-os): implement calendar engine with 43 weeks, 215 sessions, rescheduling"
```

---

### Task 14: Spaced repetition engine

**Files:**
- Modify: `src-tauri/src/engine/spaced_rep.rs`

**Step 1: Write implementation with tests**

```rust
/// Compute recall probability using exponential decay.
///
/// P(recall) = exp(-dt_hours / memory_strength)
pub fn recall_probability(dt_hours: f64, memory_strength: f64) -> f64 {
    if memory_strength <= 0.0 {
        return 0.0;
    }
    (-dt_hours / memory_strength).exp().clamp(0.0, 1.0)
}

/// Update memory strength after a retrieval attempt.
///
/// - score >= 0.6 (success): S_new = S * (1.0 + 0.5 * score)
/// - score < 0.6 (failure):  S_new = S * 0.5
///
/// Returns (new_strength, next_review_hours)
pub fn update_strength(current_strength: f64, score: f64) -> (f64, f64) {
    let base_interval_hours = 24.0;

    if score >= 0.6 {
        let new_s = current_strength * (1.0 + 0.5 * score);
        let next_review = base_interval_hours * new_s;
        (new_s, next_review)
    } else {
        let new_s = current_strength * 0.5;
        let next_review = base_interval_hours; // Review tomorrow
        (new_s, next_review)
    }
}

/// Sort topics by recall probability (ascending = most urgent first).
/// Returns indices into the input slice, limited to `limit`.
pub fn priority_queue(recall_probs: &[f64], limit: usize) -> Vec<usize> {
    let mut indexed: Vec<(usize, f64)> = recall_probs.iter().copied().enumerate().collect();
    indexed.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));
    indexed.into_iter().take(limit).map(|(i, _)| i).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_recall_probability_at_zero_time() {
        let p = recall_probability(0.0, 1.0);
        assert!((p - 1.0).abs() < 1e-10, "P(recall) should be 1.0 at t=0");
    }

    #[test]
    fn test_recall_decays_over_time() {
        let p1 = recall_probability(12.0, 1.0);
        let p2 = recall_probability(24.0, 1.0);
        let p3 = recall_probability(48.0, 1.0);
        assert!(p1 > p2, "Recall should decrease over time");
        assert!(p2 > p3, "Recall should continue decreasing");
        assert!(p3 > 0.0, "Recall should remain positive");
    }

    #[test]
    fn test_higher_strength_decays_slower() {
        let p_weak = recall_probability(24.0, 1.0);
        let p_strong = recall_probability(24.0, 5.0);
        assert!(p_strong > p_weak, "Higher S should decay slower");
    }

    #[test]
    fn test_successful_retrieval_increases_strength() {
        let (new_s, _) = update_strength(1.0, 0.8);
        assert!(new_s > 1.0, "Strength should increase on success");
    }

    #[test]
    fn test_failed_retrieval_halves_strength() {
        let (new_s, _) = update_strength(2.0, 0.3);
        assert!((new_s - 1.0).abs() < 1e-10, "Strength should halve on failure");
    }

    #[test]
    fn test_failed_retrieval_reviews_tomorrow() {
        let (_, next_hours) = update_strength(5.0, 0.2);
        assert!((next_hours - 24.0).abs() < 1e-10, "Failed retrieval = review in 24h");
    }

    #[test]
    fn test_successful_retrieval_expands_interval() {
        let (_, next_hours) = update_strength(1.0, 0.8);
        assert!(next_hours > 24.0, "Successful retrieval should expand interval");
    }

    #[test]
    fn test_priority_queue_sorted_ascending() {
        let probs = vec![0.8, 0.3, 0.5, 0.1, 0.9];
        let queue = priority_queue(&probs, 3);
        assert_eq!(queue, vec![3, 1, 2], "Should return indices sorted by lowest P(recall)");
    }

    #[test]
    fn test_priority_queue_respects_limit() {
        let probs = vec![0.8, 0.3, 0.5, 0.1, 0.9];
        let queue = priority_queue(&probs, 2);
        assert_eq!(queue.len(), 2, "Queue should respect limit");
    }

    #[test]
    fn test_zero_strength_returns_zero_recall() {
        let p = recall_probability(10.0, 0.0);
        assert!((p - 0.0).abs() < 1e-10, "Zero strength = zero recall");
    }
}
```

**Step 2: Run tests**

```bash
cd src-tauri && cargo test engine::spaced_rep
```

Expected: All 10 tests pass.

**Step 3: Commit**

```bash
git add src-tauri/src/engine/spaced_rep.rs
git commit -m "feat(learning-os): implement spaced repetition engine with decay model + priority queue"
```

---

### Task 15: Bayesian knowledge tracker

**Files:**
- Modify: `src-tauri/src/engine/bayesian.rs`

**Step 1: Write implementation with tests**

```rust
use statrs::distribution::{Beta, ContinuousCDF};

/// Bayesian knowledge state for a single topic.
#[derive(Debug, Clone)]
pub struct BayesianState {
    pub alpha: f64,
    pub beta_param: f64,
}

impl BayesianState {
    /// Create a new state with uniform prior Beta(1,1).
    pub fn new() -> Self {
        Self {
            alpha: 1.0,
            beta_param: 1.0,
        }
    }

    /// Create from existing parameters.
    pub fn from_params(alpha: f64, beta_param: f64) -> Self {
        Self { alpha, beta_param }
    }

    /// Update state after a quiz/retrieval attempt.
    ///
    /// weight = difficulty * confidence_factor (typically 0.1 to 2.0)
    pub fn update(&mut self, correct: bool, weight: f64) {
        let w = weight.max(0.01); // Minimum weight to prevent zero updates
        if correct {
            self.alpha += w;
        } else {
            self.beta_param += w;
        }
    }

    /// Expected mastery: E[X] = α / (α + β)
    pub fn mastery_mean(&self) -> f64 {
        self.alpha / (self.alpha + self.beta_param)
    }

    /// Uncertainty metric: lower = more certain.
    /// 1 / (α + β + 1)
    pub fn uncertainty(&self) -> f64 {
        1.0 / (self.alpha + self.beta_param + 1.0)
    }

    /// 95% credible interval [lower, upper].
    pub fn credible_interval_95(&self) -> (f64, f64) {
        if let Ok(dist) = Beta::new(self.alpha, self.beta_param) {
            let lower = dist.inverse_cdf(0.025);
            let upper = dist.inverse_cdf(0.975);
            (lower, upper)
        } else {
            (0.0, 1.0) // Fallback for invalid params
        }
    }

    /// Total data points observed.
    pub fn data_points(&self) -> f64 {
        // Subtract 2 for the prior (starts at α=1, β=1)
        (self.alpha + self.beta_param - 2.0).max(0.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_state_is_uniform() {
        let s = BayesianState::new();
        assert!((s.mastery_mean() - 0.5).abs() < 1e-10, "Uniform prior = 0.5 mastery");
    }

    #[test]
    fn test_new_state_high_uncertainty() {
        let s = BayesianState::new();
        let well_known = BayesianState::from_params(10.0, 10.0);
        assert!(
            s.uncertainty() > well_known.uncertainty(),
            "New state should have higher uncertainty"
        );
    }

    #[test]
    fn test_correct_answer_increases_mastery() {
        let mut s = BayesianState::new();
        let before = s.mastery_mean();
        s.update(true, 1.0);
        assert!(s.mastery_mean() > before, "Correct answer should increase mastery");
    }

    #[test]
    fn test_incorrect_answer_decreases_mastery() {
        let mut s = BayesianState::new();
        let before = s.mastery_mean();
        s.update(false, 1.0);
        assert!(s.mastery_mean() < before, "Incorrect answer should decrease mastery");
    }

    #[test]
    fn test_uncertainty_decreases_with_data() {
        let mut s = BayesianState::new();
        let initial_uncertainty = s.uncertainty();
        for _ in 0..10 {
            s.update(true, 1.0);
        }
        assert!(
            s.uncertainty() < initial_uncertainty,
            "Uncertainty should decrease with more data"
        );
    }

    #[test]
    fn test_difficulty_weighting() {
        let mut easy = BayesianState::new();
        let mut hard = BayesianState::new();
        easy.update(true, 0.3); // Easy question, low weight
        hard.update(true, 0.9); // Hard question, high weight
        assert!(
            hard.mastery_mean() > easy.mastery_mean(),
            "Harder correct answers should boost mastery more"
        );
    }

    #[test]
    fn test_credible_interval_contains_mean() {
        let s = BayesianState::from_params(5.0, 3.0);
        let (lower, upper) = s.credible_interval_95();
        let mean = s.mastery_mean();
        assert!(lower < mean && mean < upper, "CI should contain the mean");
    }

    #[test]
    fn test_credible_interval_narrows_with_data() {
        let few = BayesianState::from_params(2.0, 2.0);
        let many = BayesianState::from_params(20.0, 20.0);
        let (l1, u1) = few.credible_interval_95();
        let (l2, u2) = many.credible_interval_95();
        assert!(
            (u2 - l2) < (u1 - l1),
            "More data should narrow the CI"
        );
    }

    #[test]
    fn test_data_points_tracking() {
        let mut s = BayesianState::new();
        assert!((s.data_points() - 0.0).abs() < 1e-10);
        s.update(true, 1.0);
        s.update(false, 1.0);
        assert!((s.data_points() - 2.0).abs() < 1e-10);
    }
}
```

**Step 2: Run tests**

```bash
cd src-tauri && cargo test engine::bayesian
```

Expected: All 9 tests pass.

**Step 3: Commit**

```bash
git add src-tauri/src/engine/bayesian.rs
git commit -m "feat(learning-os): implement Bayesian knowledge tracker with Beta-Binomial updating"
```

---

### Task 16-25: Remaining engine modules

> **Note to implementor:** Tasks 16-25 follow the same TDD pattern. Each is documented in the continuation file below. Due to the size of this plan, they are summarized here with full details in the design doc.

**Task 16:** Monte Carlo forecaster — `engine/monte_carlo.rs`
- Implement `simulate(params, sim_count) -> ForecastResult`
- Random sampling with `rand` + `statrs` distributions
- Tests: performance (<200ms for 50K), percentile ordering, scenario shifts, deterministic with seed

**Task 17:** RL scheduler — `engine/rl_scheduler.rs`
- Implement contextual bandit with epsilon-greedy (ε=0.1)
- State → Action scoring with reward function
- Tests: 60-min cap, phase minimums, emphasis selection, burnout/neglect handling

**Task 18:** Quiz generator — `engine/quiz_gen.rs`
- Implement `generate_questions(topics_this_week, session_data) -> Vec<Question>`
- 40/35/25 type split, difficulty by review frequency
- Tests: type distribution, difficulty assignment, correct topic scoping

**Task 19:** Quiz scorer — add scoring + error taxonomy to `engine/quiz_gen.rs`
- `score_quiz(questions) -> QuizResults` with raw + weighted scores
- Error classification: recall_failure, application_error, synthesis_gap, careless
- Tests: weighted ≠ raw when difficulty varies, error categories correct

**Task 20:** Behavioral engine — `engine/behavioral.rs`
- Streak tracking, burnout detection, plateau detection, review week trigger
- Tests: streak increment/reset, burnout trigger/clear, plateau threshold, review week

**Task 21:** DB queries — session CRUD — `db/queries.rs`
- Insert/update/get sessions, phases, weekly aggregates
- Tests: round-trip insert + read, status updates

**Task 22:** DB queries — quiz CRUD — add to `db/queries.rs`
- Insert/update/get quizzes, questions, results
- Tests: quiz lifecycle (create → answer → complete → read results)

**Task 23:** DB queries — intelligence state — add to `db/queries.rs`
- Read/write spaced_rep, bayesian_state, rl_state, forecasts
- Tests: state persistence round-trips

**Task 24:** DB queries — user + domain CRUD — add to `db/queries.rs`
- User create/read/update, domain seeding, topic CRUD
- Tests: default domain seeding, user CRUD

**Task 25:** DB sync — `db/sync.rs`
- Export user progress to JSON, import from JSON
- Tests: export → import round-trip preserves data

---

# PHASE 4: Tauri Commands + TypeScript Bridge (Tasks 26-32)

### Task 26: User commands
- Register `create_user`, `get_user`, `list_users`, `update_user`, `set_theme`, `switch_active_user`
- Wire to DB queries

### Task 27: Calendar commands
- Register `get_full_calendar`, `get_week`, `get_today`, `reschedule_session`
- Wire calendar engine + DB

### Task 28: Session commands
- Register `start_session`, `complete_phase`, `complete_session`, `get_session_history`
- Complete_session triggers all engine updates (spaced rep, Bayesian, behavioral, RL, aggregate)

### Task 29: Intelligence commands
- Register all spaced rep, Bayesian, Monte Carlo, RL, behavioral commands (~12 total)

### Task 30: Quiz commands
- Register `generate_quiz`, `get_quiz`, `submit_quiz_answer`, `complete_quiz`, `get_quiz_history`

### Task 31: Export commands
- Register `export_json`, `export_csv`, `import_data`, `generate_test_data`, `sync_to_folder`, `sync_from_folder`

### Task 32: TypeScript bridge
- Create `src/lib/tauri-bridge.ts` with typed wrappers for all ~30 commands
- Create `src/types/models.ts` mirroring Rust models
- Create `src/types/commands.ts` with command type signatures
- Test: mock invoke, verify command names/args match Rust

---

# PHASE 5: Theme System (Tasks 33-38)

### Task 33: Base CSS variable slots in `index.css`
### Task 34: Luxury Editorial theme — `themes/luxury.css`
### Task 35: NASA Mission Control theme — `themes/nasa.css`
### Task 36: Cyberpunk Neon theme — `themes/cyberpunk.css`
### Task 37: Warm Study Hall theme — `themes/studyhall.css`
### Task 38: `useTheme` hook + ThemePicker component + Google Fonts loading

Each theme file defines all CSS custom properties as specified in Design Section 5. The `useTheme` hook reads from user profile and sets `data-theme` on `<html>`.

---

# PHASE 6: Layout Shell (Tasks 39-44)

### Task 39: App router with React Router or simple state-based routing
### Task 40: Sidebar component with navigation + active indicator + progress ring
### Task 41: Header component with breadcrumb + streak + theme switcher + quick-add
### Task 42: StatusBar component with week/day/attendance/next-quiz
### Task 43: Shared components — Button, Card, Modal, Toast, Spinner
### Task 44: `useUser` hook — load active user, manage user switching

---

# PHASE 7: Today View (Tasks 45-55)

### Task 45: TodayView layout component
### Task 46: DailyPlanCard — display RL recommendation
### Task 47: PhaseCard — expandable card with lock/unlock logic
### Task 48: RetrievalPhase — flashcard prompts + scoring
### Task 49: LearningPhase — topic display + note capture
### Task 50: MicroTaskPhase — task prompt + response
### Task 51: ReflectionPhase — confidence/energy sliders + notes
### Task 52: ReviewQueue — urgency-sorted topic list
### Task 53: QuickStats — streak, week progress, mastery delta
### Task 54: SessionComplete — summary card + themed completion animation
### Task 55: `useSession` hook — session lifecycle, phase progression, Tauri calls

---

# PHASE 8: Weekly View (Tasks 56-62)

### Task 56: WeeklyView layout + WeekSelector
### Task 57: DailyBars — Mon-Fri completion bars with time
### Task 58: MasteryChanges — topic deltas with arrows
### Task 59: WeeklyReviewQueue — scoped to current week
### Task 60: QuizCard — status, topic preview, launch button
### Task 61: MicroGoals — 5 checkboxes per week
### Task 62: WeeklyReflection form

---

# PHASE 9: Timeline View (Tasks 63-68)

### Task 63: TimelineView layout
### Task 64: MonthRow — single month's week cells
### Task 65: WeekCell — attendance heatmap color + quiz dot overlay
### Task 66: MilestoneMarker — diamond indicators with achievement animation
### Task 67: Timeline interactions — click to drill down, hover tooltip, current week pulse
### Task 68: `useCalendar` hook — fetch calendar from Rust, cache, invalidate

---

# PHASE 10: Analytics Dashboard (Tasks 69-76)

### Task 69: AnalyticsView grid layout
### Task 70: KPICard — value + delta + sparkline (reusable)
### Task 71: CumulativeHoursChart (Recharts area)
### Task 72: QuizAverageChart (line chart with 80% target)
### Task 73: RetentionTrendChart + DomainMasteryBars
### Task 74: UncertaintyTrendChart + ErrorTaxonomyChart
### Task 75: BurnoutIndicator (5-dot severity)
### Task 76: SuccessCriteriaCard (7 criteria with status)

---

# PHASE 11: Forecast Panel (Tasks 77-82)

### Task 77: ForecastView layout
### Task 78: CompletionGauge — animated circular gauge
### Task 79: DistributionChart — bell curve with percentile markers
### Task 80: MasteryProjection — per-domain range display
### Task 81: ScenarioPanel — toggle scenarios, run comparison
### Task 82: ScenarioModal — custom parameter editor + `useIntelligence` hook

---

# PHASE 12: Quiz Interface (Tasks 83-89)

### Task 83: QuizView — flow orchestrator
### Task 84: QuizQuestion — renders MC and open-ended
### Task 85: QuizProgress — progress bar + question dot navigator
### Task 86: QuizTimer — elapsed time counter
### Task 87: QuizResults — post-quiz breakdown
### Task 88: ErrorTaxonomy display + QuizHistory list
### Task 89: `useQuiz` hook — quiz flow management, answer submission

---

# PHASE 13: Settings (Tasks 90-95)

### Task 90: SettingsView layout
### Task 91: ProfileEditor + UserSwitcher
### Task 92: ThemePicker (4 cards, live preview)
### Task 93: DomainManager (toggle, add custom)
### Task 94: DataExport (JSON/CSV) + Import
### Task 95: SyncSettings + TestDataGenerator

---

# PHASE 14: Integration & Distribution (Tasks 96-100)

### Task 96: End-to-end integration test — create user, run session, take quiz, check analytics
### Task 97: Test data generator — `generate_test_data` command creates N weeks of realistic data
### Task 98: Tauri window configuration — size, title, icon, CSP headers
### Task 99: Build scripts — `npm run build`, `npm run dist:win`
### Task 100: Final verification — all Rust tests pass, all Vitest tests pass, app launches, all 4 themes work, all 7 views render with test data

---

## Quick Reference: Run Commands

```bash
# Development
cd learning-os-2026
npm run tauri dev          # Full dev mode (Vite HMR + Rust recompile)

# Testing
npm run test               # Frontend tests (Vitest)
npm run test:rust          # Backend tests (cargo test)
npm run test:all           # Both

# Building
npm run build              # Production build
npm run dist:win           # Windows installer (.msi + portable)

# Linting
npm run lint               # ESLint
npm run typecheck          # TypeScript type checking
```

---

## End of Implementation Plan
