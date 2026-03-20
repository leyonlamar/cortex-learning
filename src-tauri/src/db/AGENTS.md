<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# db

## Purpose
SQLite database layer with 14 tables in WAL mode. Handles schema creation, CRUD operations, and JSON export/import for data sync.

## Key Files

| File | Description |
|------|-------------|
| `mod.rs` | Module exports |
| `schema.rs` | 14 table definitions, CREATE TABLE statements, migrations |
| `queries.rs` | All CRUD operations: insert, get, update, upsert patterns |
| `sync.rs` | Full database JSON export/import for backup and transfer |

## Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles (id, name, email, avatar_seed, theme) |
| `domains` | 8 knowledge domains (Data Science, Engineering, BI, etc.) |
| `topics` | 48 topics (6 per domain), hierarchical via parent_id |
| `weeks` | 43 calendar weeks with objectives |
| `sessions` | 215 weekday sessions with status, scores, topics |
| `session_phases` | Individual phase records (retrieval, learning, micro_task, reflection) |
| `weekly_aggregates` | Computed weekly metrics (hours, quiz score, attendance) |
| `quizzes` | Quiz metadata (week, topic, question count) |
| `quiz_questions` | Individual questions with answers and scoring |
| `spaced_rep_states` | Per-topic memory strength and next review date |
| `bayesian_states` | Per-topic alpha/beta mastery parameters |
| `rl_states` | RL scheduler state (action counts, total reward) |
| `behavioral_log` | Behavioral alerts (attendance, burnout, plateau) |
| `sync_snapshots` | Export/import audit trail |

## For AI Agents

### Working In This Directory
- All queries use rusqlite parameterized statements (never string interpolation)
- WAL mode enabled for concurrent reads
- Foreign keys enabled
- Use `INSERT OR REPLACE` (upsert) pattern for state tables
- UUIDs stored as TEXT in SQLite

### Testing Requirements
- Use in-memory SQLite for tests: `Connection::open_in_memory()`
- Run schema creation before any test queries

## Dependencies

### External
- rusqlite 0.31 (bundled SQLite), serde_json, chrono, uuid

<!-- MANUAL: -->
