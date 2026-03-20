<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# models

## Purpose
Shared Rust type definitions used across commands, engines, and database layers. All types derive Serialize for Tauri IPC.

## Key Files

| File | Description |
|------|-------------|
| `mod.rs` | Module exports and re-exports |
| `session.rs` | Session, SessionPhase, SessionStatus, PhaseType, DailyPlan |
| `quiz.rs` | Quiz, QuizQuestion, QuizResults — quiz lifecycle types |
| `topic.rs` | Domain, Topic, default_domains(), default_topics() — curriculum types |
| `forecast.rs` | ForecastResult — Monte Carlo output type |

## For AI Agents

### Working In This Directory
- All types must derive `Serialize` (for IPC responses) and often `Deserialize`
- Field names serialize to `snake_case` JSON — must match TypeScript `models.ts`
- `default_domains()` and `default_topics()` define seeded curriculum data
- When adding fields, update both Rust model and TypeScript `models.ts`

<!-- MANUAL: -->
