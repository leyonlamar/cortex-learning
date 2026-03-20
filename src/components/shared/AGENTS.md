<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# shared

## Purpose
Reusable UI primitives used across all feature views. Theme-aware, minimal props interfaces.

## Key Files

| File | Description |
|------|-------------|
| `Button.tsx` | Button with variant support (primary, secondary, ghost, danger) |
| `Card.tsx` | Container card with optional header, padding, theme-aware borders/shadows |
| `Modal.tsx` | Dialog overlay with backdrop, close button, content slot |
| `Toast.tsx` | Notification toast with auto-dismiss, severity levels |
| `Spinner.tsx` | Loading spinner animation |
| `ErrorBoundary.tsx` | React error boundary wrapper with fallback UI |

## For AI Agents

### Working In This Directory
- All components must work across 8 themes — use CSS custom properties only
- Keep props interfaces minimal and well-typed
- Prefer composition over configuration (slots > boolean flags)
- Toast not yet wired to Tauri bridge error propagation

<!-- MANUAL: -->
