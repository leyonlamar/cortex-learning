<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# engine

## Purpose
7 intelligence engines implementing the core learning algorithms. Pure computation — no Tauri or database dependencies. Engines are called by commands and return results.

## Key Files

| File | Description |
|------|-------------|
| `mod.rs` | Module exports |
| `spaced_rep.rs` | Exponential forgetting curve: P = exp(-dt/S), memory strength updates |
| `bayesian.rs` | Beta distribution mastery tracker: alpha/beta updates, mean, 95% CI |
| `monte_carlo.rs` | 50K-simulation forecaster: random walk, p10/p50/p90 percentiles |
| `rl_scheduler.rs` | Epsilon-greedy contextual bandit: daily time allocation across 4 phases |
| `quiz_gen.rs` | Question generator: 40/35/25 type split, difficulty-weighted scoring, error taxonomy |
| `behavioral.rs` | Attendance tracker: streaks, burnout detection, plateau alerts, recovery |
| `calendar.rs` | 43-week generator: weekday sessions, milestones, rescheduling |

## For AI Agents

### Working In This Directory
- Engines are PURE — no DB, no Tauri, no side effects
- Input data, output results — commands handle persistence
- Use `statrs` for statistical distributions (Beta, Normal)
- Use `rand` for Monte Carlo sampling
- Use `chrono` for date calculations

### Testing Requirements
- Engine tests are self-contained (no external deps)
- Test edge cases: zero inputs, boundary conditions, extreme values
- Monte Carlo tests should use seeded RNG for determinism
- `cargo test` in `src-tauri/` directory

### Algorithm Reference
- **Spaced Rep**: S_new = S_old × (1 + score × 0.5), P(t) = e^(-t/S)
- **Bayesian**: alpha += correct × weight, beta += (1-correct) × weight
- **Monte Carlo**: random walk with attendance/quiz/mastery factors
- **RL**: epsilon-greedy with 0.1 exploration, 4 actions (balanced/new/review/deep)
- **Quiz**: weighted scoring = difficulty × type_weight × correctness

### Known Issues
- `quiz_gen.rs`: Fallback questions (lines 72-88) have no options_json — unanswerable in UI
- `behavioral.rs`: State struct not persisted between calls from commands

## Dependencies

### External
- statrs 0.17, rand 0.8, chrono 0.4, serde

<!-- MANUAL: -->
