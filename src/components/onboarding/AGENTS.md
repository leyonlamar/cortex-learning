<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# onboarding

## Purpose
First-launch user creation flow. Shown when no user exists in localStorage.

## Key Files

| File | Description |
|------|-------------|
| `OnboardingView.tsx` | Name input + theme selection grid, creates user via Tauri bridge |

## For AI Agents

### Working In This Directory
- Shown only once on first launch (or when no user ID in localStorage)
- After user creation, app navigates to Today view
- Theme selection should preview each theme's visual identity

<!-- MANUAL: -->
