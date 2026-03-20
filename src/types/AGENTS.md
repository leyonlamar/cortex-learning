<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# types

## Purpose
TypeScript type definitions shared across the frontend. Contains all domain models and view routing.

## Key Files

| File | Description |
|------|-------------|
| `models.ts` | All domain types: User, Session, SessionPhase, Topic, Domain, Week, WeeklyAggregate, Quiz, QuizQuestion, QuizResults, DailyPlan, SpacedRepState, TopicMastery |
| `routes.ts` | ViewId enum, navigation items, view metadata |

## For AI Agents

### Working In This Directory
- Types must match Rust serde serialization output exactly
- `models.ts` types mirror `src-tauri/src/models/` Rust structs
- Use `snake_case` field names to match Rust JSON serialization
- Add new types here when adding new backend commands

<!-- MANUAL: -->
