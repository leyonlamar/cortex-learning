<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# data

## Purpose
Static data files compiled into the binary. Contains the pre-populated quiz question bank.

## Key Files

| File | Description |
|------|-------------|
| `mod.rs` | Module exports |
| `question_bank.rs` | 80+ QuestionTemplate structs across 8 domains and 48 topics |

## For AI Agents

### Working In This Directory
- Questions organized by domain slug and topic slug
- Each question has: question_type (recall/applied/synthesis), difficulty (0.0-1.0), text, options_json, correct_answer
- Topic slugs must match those in `models/topic.rs::default_topics()`
- When adding questions, maintain the 40/35/25 split (recall/applied/synthesis)
- Options are JSON string arrays: `Some("[\"A\",\"B\",\"C\",\"D\"]".to_string())`

### Known Issue
- Some topics have only 1-2 questions — when quiz requests 10, fallback generates placeholder text with no options

<!-- MANUAL: -->
