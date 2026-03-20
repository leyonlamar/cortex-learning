<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# quiz

## Purpose
Quiz system: domain/topic selection, question flow with timer, answer submission, and results with score breakdown and error taxonomy.

## Key Files

| File | Description |
|------|-------------|
| `QuizView.tsx` | Main view: topic browser accordion + quiz flow (progress, timer, questions, results) |
| `QuizProgress.tsx` | Progress bar showing current question index out of total |
| `QuizTimer.tsx` | Countdown timer for timed quiz mode |
| `QuizQuestion.tsx` | Question display with radio/checkbox answer options |
| `QuizResultsCard.tsx` | Score breakdown by category (recall/applied/synthesis), error taxonomy, rolling 4-week average |

## For AI Agents

### Working In This Directory
- Quiz flow: select topics → generate quiz → answer questions → view results
- Questions come from real question bank + fallback generator
- 40/35/25 split: recall/applied/synthesis question types
- Scoring is difficulty-weighted

### Known Issues
- Fallback questions (from `quiz_gen.rs`) have no `options_json` — QuizQuestion.tsx must handle null options gracefully
- Some topics have only 1-2 bank questions — narrow topic selection triggers many fallback questions

<!-- MANUAL: -->
