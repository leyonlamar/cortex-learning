<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# commands

## Purpose
25 Tauri IPC command handlers that bridge frontend requests to engine computation and database operations. Each command is a `#[tauri::command]` async function.

## Key Files

| File | Description |
|------|-------------|
| `mod.rs` | Module exports for all command groups |
| `user.rs` | `create_user`, `get_user`, `set_theme` — user CRUD |
| `curriculum.rs` | `get_domains`, `get_topics_by_domain`, `get_all_topics` — curriculum queries |
| `calendar.rs` | `init_calendar`, `get_week`, `get_today`, `reschedule_session` — 43-week calendar |
| `session.rs` | `get_session`, `complete_phase`, `complete_session`, `get_session_history` — daily workflow |
| `intelligence.rs` | 7 commands: spaced rep, Bayesian, Monte Carlo, RL scheduler, review queue |
| `quiz.rs` | `generate_quiz`, `submit_quiz_answer`, `complete_quiz` — quiz lifecycle |
| `export.rs` | `export_json`, `import_json`, `export_to_file`, `import_from_file` — data sync |

## For AI Agents

### Working In This Directory
- Commands access DB via `State<Mutex<Connection>>` — always lock, operate, unlock
- Map engine errors to `AppError` using `?` operator
- Return types must be `Result<T, AppError>` where T is serde-serializable
- Register new commands in `lib.rs` invoke_handler
- Parameter names must match frontend `invoke()` call argument names exactly

### Known Issues
- `session.rs`: BehavioralState created fresh on every call (should persist)
- `session.rs`: RL reward computed but stored in `_reward` (discarded)
- `intelligence.rs`: `run_forecast` never writes to `forecasts` table

### Testing Requirements
- Commands that touch DB need in-memory SQLite setup
- Test error cases (missing user, invalid session ID, etc.)

## Dependencies

### Internal
- `../engine/` — All computation logic
- `../db/` — All database operations
- `../models/` — Shared types
- `../data/` — Question bank

<!-- MANUAL: -->
