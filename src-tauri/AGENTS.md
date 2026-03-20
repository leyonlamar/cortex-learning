<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# src-tauri (Rust Backend)

## Purpose
Tauri v2 Rust backend containing 7 intelligence engines, 25 IPC command handlers, SQLite database with 14 tables (WAL mode), and all domain models. This is where all computation and data persistence happens.

## Key Files

| File | Description |
|------|-------------|
| `Cargo.toml` | Rust dependencies: tauri v2, rusqlite, statrs, chrono, rand, serde, uuid |
| `tauri.conf.json` | Tauri config: window 1280x800, CSP, MSI/NSIS bundlers, app identity |
| `src/lib.rs` | App setup: DB init, migrations, domain/topic seeding, command registration |
| `src/main.rs` | Tauri app entry point |
| `src/error.rs` | `AppError` enum with Tauri-compatible error handling |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/commands/` | 25 Tauri IPC command handlers (see `src/commands/AGENTS.md`) |
| `src/engine/` | 7 intelligence engines — pure computation, no Tauri deps (see `src/engine/AGENTS.md`) |
| `src/db/` | SQLite schema, CRUD queries, JSON sync (see `src/db/AGENTS.md`) |
| `src/models/` | Shared Rust types: Session, Quiz, Topic, Forecast (see `src/models/AGENTS.md`) |
| `src/data/` | Static data: question bank with 80+ questions (see `src/data/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Engines are pure functions — no Tauri or DB dependencies inside `engine/`
- Commands are the glue: they read DB, call engines, write results, return to frontend
- All commands registered in `lib.rs:47-84` — add new commands there
- Database migrations run on startup in `lib.rs`
- Error handling uses `thiserror` via `AppError` enum

### Testing Requirements
- `cargo test` runs 68+ unit tests
- `npm run test:rust` from project root
- Engine tests are self-contained (no DB needed)
- Command tests may need SQLite in-memory DB

### Common Patterns
- Commands access DB via `State<Mutex<Connection>>`
- Engines return Result types, commands map to AppError
- Serde serialization for all IPC return types
- UUID v4 for all entity IDs

### Known Issues
- `rl_state` table not seeded on first launch — daily plan uses zeroed defaults
- `BehavioralState` recreated fresh on every `complete_session` — burnout/plateau detection resets
- RL reward computed but discarded (`_reward` at session.rs:87)
- Forecasts computed on-demand but never persisted to `forecasts` table

## Dependencies

### External
- tauri v2, rusqlite 0.31 (bundled SQLite), statrs 0.17, chrono 0.4
- rand 0.8, serde/serde_json, uuid v1 (v4 feature), thiserror

<!-- MANUAL: -->
