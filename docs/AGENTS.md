<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# docs

## Purpose
Technical documentation for Learning OS 2026. Contains the complete SOP spec, design system specification, and implementation plans.

## Key Files

| File | Description |
|------|-------------|
| `LEARNING-OS-2026.md` | Complete technical spec: architecture, engines, DB schema, views, success criteria |
| `DESIGN-SYSTEM.md` | 8-theme design spec: tokens, typography, colors, accessibility, do/don't guidelines |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `plans/` | Implementation plans and design documents |

## For AI Agents

### Working In This Directory
- `LEARNING-OS-2026.md` is the source of truth for app behavior and acceptance criteria
- `DESIGN-SYSTEM.md` defines all theme tokens — reference before adding new visual elements
- Keep docs in sync with code changes, especially when adding new engines or views

### Common Patterns
- Docs use markdown with tables for structured data
- Success criteria are numbered and categorized (build, functional, performance, quality)

## Dependencies

### Internal
- Documents describe `src/` and `src-tauri/` — update when those change

<!-- MANUAL: -->
